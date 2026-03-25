from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import HTTPException, status, BackgroundTasks
from .notifier import EmailNotifier
from datetime import datetime, timedelta
import traceback
import uuid
from .security import verify_password, get_password_hash, create_access_token, decode_access_token
from google.oauth2 import id_token
from google.auth.transport import requests
import httpx

GOOGLE_CLIENT_ID = "894713662394-kj60pghcudhpc8oh3i2mnqqjptsppp7b.apps.googleusercontent.com"

# ── Función auxiliar: registrar eventos de autenticación ──
def log_auth_event(
    db: Session,
    event_type: str,
    user_id=None,
    user_name="",
    email="",
    role="",
    ip_address="",
    user_agent="",
    summary=""
):
    """Inserta un registro real en la tabla auth_logs. Nunca rompe el flujo principal."""
    try:
        db.execute(text("""
            INSERT INTO auth_logs (user_id, user_name, email, role, event_type, ip_address, user_agent, summary, created_at)
            VALUES (:user_id, :user_name, :email, :role, :event_type, :ip, :ua, :summary, datetime('now', 'localtime'))
        """), {
            "user_id": user_id,
            "user_name": user_name,
            "email": email,
            "role": role,
            "event_type": event_type,
            "ip": ip_address or "N/A",
            "ua": user_agent or "N/A",
            "summary": summary
        })
        db.commit()
        print(f"[AUDIT] {event_type} — {email} ({role})")
    except Exception as e:
        print(f"[AUDIT] No se pudo registrar evento: {e}")
        try:
            db.rollback()
        except:
            pass

def login_user(db: Session, email: str, password: str, background_tasks: BackgroundTasks, ip_address: str = "", user_agent: str = ""):
    try:
        email = email.lower().strip()
        query = text("SELECT * FROM users WHERE LOWER(email) = :email")
        # Usar mappings() para obtener acceso por nombre de columna siempre
        result = db.execute(query, {"email": email}).mappings()
        user_dict = result.fetchone()

        if not user_dict:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")

        print(f"? [AUTH DEBUG] User '{email}' found. Role: {user_dict.get('role')}")

        # EL REY NUNCA SE BLOQUEA
        if user_dict.get('role') == 'admin':
            print(f"[AUTH] Bypass lockout for Admin: {email}")
        else:
            # Verificación de bloqueo (compatible con SQLite y MySQL)
            lockout_val = user_dict.get('lockout_until')
            if lockout_val:
                 try:
                     lockout_until = lockout_val
                     if isinstance(lockout_until, str):
                         lockout_until = datetime.fromisoformat(lockout_until.split(".")[0])
                     
                     now = datetime.now()
                     if lockout_until.tzinfo:
                         lockout_until = lockout_until.replace(tzinfo=None)
                     
                     if now < lockout_until:
                         remaining = int((lockout_until - now).total_seconds())
                         log_auth_event(
                             db,
                             event_type="CUENTA_BLOQUEADA",
                             email=email,
                             role=user_dict.get('role', ''),
                             user_name=f"{user_dict.get('first_name','')} {user_dict.get('last_name','')}".strip(),
                             summary=f"Intento de acceso con cuenta bloqueada ({remaining}s restantes)"
                         )
                         raise HTTPException(status_code=423, detail={"message": "Cuenta bloqueada temporalmente", "retry_after": remaining})
                 except HTTPException: raise
                 except Exception as e:
                     print(f"[WARNING] [AUTH] Error check lockout: {e}")
                     pass

        p_hash = user_dict.get('password_hash')
        if not p_hash:
             print(f"[ERROR] [AUTH] User '{email}' has NO password_hash in DB")
             raise HTTPException(status_code=401, detail="Credenciales inválidas")
        
        is_correct = verify_password(password, p_hash)
        print(f"[AUTH DEBUG] Password check for '{email}': {is_correct}")
        
        if not is_correct:
            # EL REY NUNCA SE BLOQUEA — admin solo recibe 401 sin tracking
            if user_dict.get('role') == 'admin':
                log_auth_event(db, event_type="INTENTO_FALLIDO",
                    email=email, role='admin',
                    user_name=f"{user_dict.get('first_name', '')}".strip(),
                    ip_address=ip_address, user_agent=user_agent,
                    summary="Contraseña incorrecta (administrador)")
                raise HTTPException(status_code=401, detail="Credenciales inválidas")

            # Incrementar intentos fallidos en la BD (solo usuarios no-admin)
            try:
                db.execute(text("""
                    UPDATE users SET failed_attempts = COALESCE(failed_attempts, 0) + 1 WHERE id = :id
                """), {"id": user_dict.get('id')})
                db.commit()
            except Exception as e:
                print(f"[AUTH] Error incrementing failed_attempts: {e}")
                try: db.rollback()
                except: pass

            # Releer para obtener el conteo actualizado
            try:
                updated = db.execute(text("SELECT failed_attempts FROM users WHERE id = :id"), {"id": user_dict.get('id')}).mappings().fetchone()
                attempts_count = updated.get('failed_attempts', 0) if updated else 0
            except:
                attempts_count = 1

            MAX_FAILED = 3
            LOCKOUT_MINUTES = 10

            if attempts_count >= MAX_FAILED:
                # Bloquear la cuenta
                lockout_time = datetime.now() + timedelta(minutes=LOCKOUT_MINUTES)
                try:
                    db.execute(text("UPDATE users SET lockout_until = :lu WHERE id = :id"),
                               {"lu": lockout_time.isoformat(), "id": user_dict.get('id')})
                    db.commit()
                except Exception as e:
                    print(f"[AUTH] Error setting lockout_until: {e}")
                    try: db.rollback()
                    except: pass

                log_auth_event(db, event_type="CUENTA_BLOQUEADA",
                    email=email, role=user_dict.get('role', ''),
                    user_name=f"{user_dict.get('first_name', '')}".strip(),
                    ip_address=ip_address, user_agent=user_agent,
                    summary=f"Cuenta bloqueada tras {MAX_FAILED} intentos fallidos")

                remaining = LOCKOUT_MINUTES * 60
                raise HTTPException(status_code=423, detail={"message": "Cuenta bloqueada temporalmente", "retry_after": remaining})

            # Registrar intento fallido
            log_auth_event(db, event_type="INTENTO_FALLIDO",
                email=email, role=user_dict.get('role', ''),
                user_name=f"{user_dict.get('first_name', '')}".strip(),
                ip_address=ip_address, user_agent=user_agent,
                summary=f"Contraseña incorrecta (intento {attempts_count}/{MAX_FAILED})")
            raise HTTPException(status_code=401, detail={"message": "Credenciales inválidas", "attempts": attempts_count, "max_attempts": MAX_FAILED})


        user_id = user_dict.get('id')
        user_role = user_dict.get('role', 'usuario')
        user_name = f"{user_dict.get('first_name','')} {user_dict.get('last_name','')}".strip()

        token = create_access_token({"user_id": user_id, "role": user_role})
        
        try:
            db.execute(text("UPDATE users SET last_login = :now, failed_attempts = 0 WHERE id = :id"), 
                       {"now": datetime.now().isoformat(), "id": user_id})
            db.commit()
        except Exception as e:
            print(f"[AUTH] Error update last_login: {e}")
            db.rollback()

        # Registrar LOGIN EXITOSO
        log_auth_event(
            db,
            event_type="LOGIN_EXITOSO",
            user_id=user_id,
            user_name=user_name,
            email=email,
            role=user_role,
            ip_address=ip_address,
            user_agent=user_agent,
            summary="Acceso exitoso al sistema"
        )

        return {
            "token": token,
            "user": {
                "id": user_id,
                "firstName": user_dict.get('first_name', ''),
                "lastName": user_dict.get('last_name', ''),
                "email": user_dict.get('email', ''),
                "role": user_role,
                "avatarUrl": user_dict.get('avatar_url'),
                "permissions": ["admin.view", "venues.view", "cms.view", "stats.view", "users.view", "events.view"]
            }
        }
    except HTTPException: raise
    except Exception as e:
        print(f"!!! [AUTH FATAL ERROR]: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

def register_user(db: Session, data: dict):
    try:
        existing = db.execute(text("SELECT id FROM users WHERE email = :email"), {"email": data['email']}).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="El email ya está registrado")

        password_hash = get_password_hash(data['password'])
        
        insert_query = text("""
            INSERT INTO users (first_name, last_name, email, phone, password_hash, role, status, created_at)
            VALUES (:first_name, :last_name, :email, :phone, :password_hash, 'usuario', 'active', :now)
        """)
        
        db.execute(insert_query, {
            "first_name": data['firstName'],
            "last_name": data['lastName'],
            "email": data['email'],
            "phone": data.get('phone'),
            "password_hash": password_hash,
            "now": datetime.now().isoformat()
        })
        db.commit()

        user = db.execute(text("SELECT * FROM users WHERE email = :email"), {"email": data['email']}).fetchone()
        token = create_access_token({"user_id": user.id, "role": user.role})

        # Registrar nuevo registro
        log_auth_event(
            db,
            event_type="REGISTRO_NUEVO",
            user_id=user.id,
            user_name=f"{user.first_name} {user.last_name}".strip(),
            email=user.email,
            role=user.role,
            summary="Nuevo usuario registrado en el sistema"
        )

        return {
            "token": token,
            "user": {
                "id": user.id,
                "firstName": user.first_name,
                "lastName": user.last_name,
                "email": user.email,
                "role": user.role,
                "avatarUrl": getattr(user, 'avatar_url', None)
            }
        }
    except HTTPException: raise
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error en registro: {str(e)}")

def create_permission_request(db: Session, user_id: int, permission_type: str):
    db.execute(text("""
        INSERT INTO permission_requests (user_id, permission_type)
        VALUES (:uid, :ptype)
    """), {"uid": user_id, "ptype": permission_type})
    db.commit()
    return {"status": "success", "message": "Solicitud enviada"}

def get_all_permission_requests(db: Session):
    result = db.execute(text("""
        SELECT pr.*, u.email as user_email 
        FROM permission_requests pr
        JOIN users u ON pr.user_id = u.id
        WHERE pr.status = 'pending'
    """))
    return [dict(row._mapping) for row in result.fetchall()]

def get_auth_logs(db: Session, limit: int = 100, role: str = None, event_type: str = None):
    """Devuelve los registros reales de auditoría de autenticación."""
    query_str = "SELECT * FROM auth_logs WHERE 1=1"
    params = {}
    if role:
        query_str += " AND role = :role"
        params["role"] = role
    if event_type:
        query_str += " AND event_type = :event_type"
        params["event_type"] = event_type
    query_str += " ORDER BY created_at DESC LIMIT :limit"
    params["limit"] = limit
    result = db.execute(text(query_str), params)
    return [dict(row._mapping) for row in result.fetchall()]

# ── FUNCIONES DE ADMINISTRACIÓN ──

def get_users(db: Session, search: str = None, role: str = None, status: str = None):
    query_str = "SELECT id, first_name, last_name, email, phone, role, status, lockout_until, last_login, created_at FROM users WHERE 1=1"
    params = {}
    
    if search:
        query_str += " AND (first_name LIKE :search OR last_name LIKE :search OR email LIKE :search)"
        params["search"] = f"%{search}%"
    
    if role:
        query_str += " AND role = :role"
        params["role"] = role
        
    if status:
        query_str += " AND status = :status"
        params["status"] = status

    query_str += " ORDER BY id DESC"
    
    result = db.execute(text(query_str), params).mappings()
    users = [dict(row) for row in result.fetchall()]
    return {"users": users, "total": len(users)}

def update_user_status(db: Session, user_id: int, new_status: str):
    # PROTECCIÓN DEL REY: No permitir deshabilitar al admin
    user = db.execute(text("SELECT role FROM users WHERE id = :uid"), {"uid": user_id}).mappings().fetchone()
    if user and user.get('role') == 'admin' and new_status != 'active':
        raise HTTPException(status_code=403, detail="No se puede deshabilitar la cuenta raíz")

    db.execute(text("UPDATE users SET status = :status WHERE id = :uid"), {"status": new_status, "uid": user_id})
    db.commit()
    return {"status": "success", "message": f"Estado actualizado a {new_status}"}

def reset_user_password(db: Session, user_id: int, new_password: str):
    # Nota: Aquí podríamos añadir protección para que un User no resetee al Admin si no es Admin
    # Pero el Guard de FastAPI debería manejar esto. Por si acaso:
    password_hash = get_password_hash(new_password)
    db.execute(text("UPDATE users SET password_hash = :hash, failed_attempts = 0, lockout_until = NULL WHERE id = :uid"), 
               {"hash": password_hash, "uid": user_id})
    db.commit()
    return {"status": "success", "message": "Contraseña reseteada"}

def unlock_user(db: Session, user_id: int):
    db.execute(text("UPDATE users SET status = 'active', failed_attempts = 0, lockout_until = NULL WHERE id = :uid"), 
               {"uid": user_id})
    db.commit()
    return {"status": "success", "message": "Usuario desbloqueado"}

def update_user_avatar(db: Session, user_id: int, avatar_url: str):
    db.execute(text("UPDATE users SET avatar_url = :avatar WHERE id = :uid"), 
               {"avatar": avatar_url, "uid": user_id})
    db.commit()
    return {"status": "success", "avatarUrl": avatar_url}

async def social_login_user(db: Session, token: str, provider: str, background_tasks: BackgroundTasks):
    try:
        email = ""
        first_name = ""
        last_name = ""

        if provider == "google":
            # Verificar token real de Google
            try:
                # 1. Intentar como ID Token (JWT)
                try:
                    idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
                    email = idinfo['email']
                    first_name = idinfo.get('given_name', 'User')
                    last_name = idinfo.get('family_name', 'Google')
                except Exception:
                    # 2. Intentar como Access Token (usando endpoint userinfo)
                    print("? [AUTH Google] Not a JWT, trying userinfo endpoint...")
                    async with httpx.AsyncClient() as client:
                        resp = await client.get(
                            "https://www.googleapis.com/oauth2/v3/userinfo",
                            headers={"Authorization": f"Bearer {token}"}
                        )
                        if resp.status_code != 200:
                            raise Exception(f"Google API Error: {resp.text}")
                        idinfo = resp.json()
                        email = idinfo['email']
                        first_name = idinfo.get('given_name', 'User')
                        last_name = idinfo.get('family_name', 'Google')
                
                print(f"? [AUTH Google] Verified user: {email}")
            except Exception as e:
                print(f"!!! [AUTH Google] Verification total fail: {e}")
                raise HTTPException(status_code=401, detail="Token de Google inválido o expirado")
        else:
            # Fallback para apple (simulado por ahora si no hay credenciales)
            email = token # En modo simulación pasamos el email directamente
            first_name = "User"
            last_name = provider.capitalize()

        email = email.lower().strip()
        existing = db.execute(text("SELECT * FROM users WHERE LOWER(email) = :email"), {"email": email}).mappings().fetchone()
        
        if existing:
            user_id = existing['id']
            user_role = existing['role']
        else:
            # Crear usuario nuevo si no existe
            print(f"? [AUTH Social] Creating new user for {email} via {provider}")
            insert_query = text("""
                INSERT INTO users (first_name, last_name, email, role, status, created_at, social_provider)
                VALUES (:first_name, :last_name, :email, 'usuario', 'active', :now, :provider)
            """)
            db.execute(insert_query, {
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
                "now": datetime.now().isoformat(),
                "provider": provider
            })
            db.commit()
            
            new_user = db.execute(text("SELECT id, role FROM users WHERE email = :email"), {"email": email}).mappings().fetchone()
            user_id = new_user['id']
            user_role = new_user['role']

        access_token = create_access_token({"user_id": user_id, "role": user_role})
        
        # Enviar notificación en segundo plano (Social)
        background_tasks.add_task(
            EmailNotifier.send_login_alert, 
            first_name, 
            email,
            provider.capitalize()
        )
        
        return {
            "token": access_token,
            "user": {
                "id": user_id,
                "firstName": first_name,
                "lastName": last_name,
                "email": email,
                "role": user_role,
                "avatarUrl": existing.get('avatar_url') if existing else None,
                "provider": provider
            }
        }
    except HTTPException: raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error en Social Login: {str(e)}")
def get_all_emails(db: Session):
    try:
        results = db.execute(text("SELECT email FROM users WHERE status = 'active'")).fetchall()
        return [row[0] for row in results]
    except Exception as e:
        print(f"!!! [AUTH] Error al obtener correos: {e}")
        return []

def get_user_by_id(db: Session, user_id: int):
    query = text("SELECT id, first_name, last_name, email, phone, role, status, avatar_url, created_at FROM users WHERE id = :uid")
    result = db.execute(query, {"uid": user_id}).mappings().fetchone()
    if not result:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user_dict = dict(result)
    return {
        "id": user_dict['id'],
        "firstName": user_dict['first_name'],
        "lastName": user_dict['last_name'],
        "email": user_dict['email'],
        "phone": user_dict.get('phone'),
        "role": user_dict['role'],
        "status": user_dict['status'],
        "avatarUrl": user_dict.get('avatar_url'),
        "createdAt": user_dict['created_at'],
        "permissions": ["admin.view", "venues.view", "cms.view", "stats.view", "users.view", "events.view"]
    }

def verify_token(db: Session, user_payload: dict):
    """Verifica el token y retorna los datos del usuario."""
    user = get_user_by_id(db, user_payload['user_id'])
    return {"valid": True, "user": user}

def logout_user(db: Session, user_payload: dict, ip_address: str = "", user_agent: str = ""):
    """Registra el evento de logout y retorna éxito."""
    try:
        user = get_user_by_id(db, user_payload['user_id'])
        log_auth_event(
            db,
            event_type="LOGOUT",
            user_id=user['id'],
            user_name=f"{user['firstName']} {user['lastName']}".strip(),
            email=user['email'],
            role=user['role'],
            ip_address=ip_address,
            user_agent=user_agent,
            summary="Sesión cerrada por el usuario"
        )
        return {"status": "success", "message": "Sesión cerrada correctamente"}
    except Exception as e:
        print(f"[AUTH] Error logging logout: {e}")
        return {"status": "success", "message": "Sesión cerrada localmente"}

def refresh_token(user_payload: dict):
    """Refresca el token de acceso."""
    token = create_access_token({"user_id": user_payload['user_id'], "role": user_payload['role']})
    return {"token": token}

def get_user_permissions(db: Session, user_id: int):
    query = text("SELECT role, permissions FROM users WHERE id = :uid")
    result = db.execute(query, {"uid": user_id}).mappings().fetchone()
    if not result:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    import json
    permissions = result.get('permissions')
    if permissions:
        try:
            permissions = json.loads(permissions)
        except:
            permissions = {}
    else:
        permissions = {}
        
    return {
        "role": result.get('role', 'usuario'),
        "permissions": permissions
    }

def update_user_permissions(db: Session, user_id: int, role: str, permissions: dict):
    import json
    perms_json = json.dumps(permissions)
    
    db.execute(text("UPDATE users SET role = :role, permissions = :perms WHERE id = :uid"), 
               {"role": role, "perms": perms_json, "uid": user_id})
    db.commit()
    return {"status": "success", "message": "Permisos actualizados"}

async def forgot_password(db: Session, email: str):
    """Stub para recuperación de contraseña."""
    # En un sistema real, aquí se generaría un token y se enviaría un correo
    return {"status": "success", "message": "Si el correo existe, se enviarán instrucciones"}
