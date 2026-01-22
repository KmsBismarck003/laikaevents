# routers/auth.py - VERSIÓN MEJORADA CON MEJOR MANEJO DE ERRORES

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
import os
import traceback

# ============================================
# CREAR ROUTER CON CONFIGURACIÓN EXPLÍCITA
# ============================================

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

print("\n" + "="*70)
print("🔐 AUTH ROUTER INICIALIZADO")
print("="*70)
print(f"   Router object: {router}")
print(f"   Router type: {type(router)}")
print("="*70 + "\n")

# ============================================
# DEPENDENCIA PARA BD
# ============================================

def get_db():
    """Dependencia para obtener sesión de base de datos"""
    from main import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================================
# MODELOS PYDANTIC
# ============================================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    phone: str = None
    password: str

class TokenResponse(BaseModel):
    token: str
    user: dict

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    newPassword: str

# ============================================
# ENDPOINTS DE AUTENTICACIÓN
# ============================================

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Endpoint de inicio de sesión con manejo mejorado de errores

    POST /api/auth/login
    Body: { "email": "user@example.com", "password": "password123" }
    """
    try:
        print(f"\n{'='*60}")
        print(f"🔐 LOGIN ATTEMPT")
        print(f"{'='*60}")
        print(f"Email: {request.email}")
        print(f"Password length: {len(request.password)} chars")
        print(f"Timestamp: {datetime.now().isoformat()}")

        # Buscar usuario por email
        query = text("SELECT * FROM users WHERE email = :email")
        result = db.execute(query, {"email": request.email})
        user = result.fetchone()

        if not user:
            print(f"❌ Usuario no encontrado: {request.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas"
            )

        print(f"✅ Usuario encontrado:")
        print(f"   ID: {user.id}")
        print(f"   Role: {user.role}")
        print(f"   Status: {user.status}")
        print(f"   Hash length: {len(user.password_hash)} chars")
        print(f"   Hash starts with: {user.password_hash[:10]}...")

        # Verificar contraseña con manejo mejorado de errores
        try:
            print(f"\n🔑 Verificando contraseña...")

            # Bcrypt tiene un límite de 72 bytes
            password_to_verify = request.password
            password_bytes = password_to_verify.encode('utf-8')

            if len(password_bytes) > 72:
                print(f"⚠️  Password excede 72 bytes ({len(password_bytes)} bytes)")
                print(f"⚠️  Truncando a 72 bytes para bcrypt")
                password_to_verify = password_bytes[:72].decode('utf-8', errors='ignore')

            # Verificar que el hash tenga el formato correcto de bcrypt
            if not user.password_hash.startswith('$2b$') and not user.password_hash.startswith('$2a$'):
                print(f"❌ Hash no tiene formato bcrypt válido")
                print(f"   Hash starts with: {user.password_hash[:20]}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error de configuración del sistema. Contacta al administrador."
                )

            # Intentar verificación
            is_valid = pwd_context.verify(password_to_verify, user.password_hash)

            if not is_valid:
                print(f"❌ Contraseña incorrecta para: {request.email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Credenciales inválidas"
                )

            print(f"✅ Contraseña verificada correctamente!")

        except HTTPException:
            raise
        except ValueError as ve:
            print(f"\n❌ ERROR DE BCRYPT - ValueError")
            print(f"   Error: {str(ve)}")
            print(f"   Hash en BD: {user.password_hash[:50]}...")
            print(f"   ⚠️  El hash puede estar corrupto o no ser bcrypt válido")

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error de autenticación. El hash de contraseña puede estar corrupto. Contacta al administrador."
            )
        except Exception as ve_error:
            print(f"\n❌ ERROR INESPERADO EN VERIFICACIÓN")
            print(f"   Error type: {type(ve_error).__name__}")
            print(f"   Error: {str(ve_error)}")
            traceback.print_exc()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al verificar credenciales"
            )

        print(f"✅ Login exitoso!")
        print(f"   User ID: {user.id}")
        print(f"   Role: {user.role}")

        # Crear token JWT
        token_data = {
            "user_id": user.id,
            "role": user.role,
            "exp": datetime.utcnow() + timedelta(days=7)
        }

        secret_key = os.getenv('JWT_SECRET', 'tu_clave_secreta_aqui')
        token = jwt.encode(token_data, secret_key, algorithm="HS256")

        # Actualizar último login
        try:
            update_query = text("UPDATE users SET last_login = NOW() WHERE id = :user_id")
            db.execute(update_query, {"user_id": user.id})
            db.commit()
            print(f"✅ last_login actualizado")
        except Exception as e:
            print(f"⚠️  No se pudo actualizar last_login: {e}")
            db.rollback()

        print(f"{'='*60}\n")

        # Preparar respuesta
        return {
            "token": token,
            "user": {
                "id": user.id,
                "firstName": user.first_name,
                "lastName": user.last_name,
                "email": user.email,
                "role": user.role
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"\n{'='*60}")
        print(f"❌ ERROR GENERAL EN LOGIN")
        print(f"{'='*60}")
        print(f"Error type: {type(e).__name__}")
        print(f"Error: {str(e)}")
        traceback.print_exc()
        print(f"{'='*60}\n")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al iniciar sesión"
        )


@router.post("/register", response_model=TokenResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Endpoint de registro de usuario con validaciones mejoradas

    POST /api/auth/register
    Body: {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "1234567890",
        "password": "password123"
    }
    """
    try:
        print(f"\n{'='*60}")
        print(f"📝 REGISTER ATTEMPT")
        print(f"{'='*60}")
        print(f"Email: {request.email}")
        print(f"Name: {request.firstName} {request.lastName}")
        print(f"Password length: {len(request.password)} chars")

        # Validar longitud de contraseña
        if len(request.password) < 6:
            print(f"❌ Contraseña demasiado corta")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contraseña debe tener al menos 6 caracteres"
            )

        # Verificar si email existe
        check_query = text("SELECT id FROM users WHERE email = :email")
        result = db.execute(check_query, {"email": request.email})
        existing = result.fetchone()

        if existing:
            print(f"❌ Email ya registrado: {request.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado"
            )

        # Hash de contraseña con manejo de errores
        try:
            # Truncar si excede 72 bytes para bcrypt
            password_to_hash = request.password
            password_bytes = password_to_hash.encode('utf-8')

            if len(password_bytes) > 72:
                print(f"⚠️  Password truncado de {len(password_bytes)} a 72 bytes")
                password_to_hash = password_bytes[:72].decode('utf-8', errors='ignore')

            password_hash = pwd_context.hash(password_to_hash)
            print(f"✅ Password hash generado: {password_hash[:20]}...")

        except Exception as hash_error:
            print(f"❌ Error al generar hash: {hash_error}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al procesar contraseña"
            )

        # Insertar usuario
        insert_query = text("""
            INSERT INTO users (first_name, last_name, email, phone, password_hash, role, status, created_at)
            VALUES (:first_name, :last_name, :email, :phone, :password_hash, 'usuario', 'active', NOW())
        """)

        user_data = {
            "first_name": request.firstName,
            "last_name": request.lastName,
            "email": request.email,
            "phone": request.phone,
            "password_hash": password_hash
        }

        db.execute(insert_query, user_data)
        db.commit()

        # Obtener usuario creado
        verify_query = text("SELECT * FROM users WHERE email = :email")
        verify_result = db.execute(verify_query, {"email": request.email})
        user = verify_result.fetchone()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear usuario"
            )

        print(f"✅ Usuario registrado exitosamente!")
        print(f"   User ID: {user.id}")
        print(f"   Hash stored: {user.password_hash[:20]}...")

        # Crear token
        token_data = {
            "user_id": user.id,
            "role": user.role,
            "exp": datetime.utcnow() + timedelta(days=7)
        }

        secret_key = os.getenv('JWT_SECRET', 'tu_clave_secreta_aqui')
        token = jwt.encode(token_data, secret_key, algorithm="HS256")

        print(f"{'='*60}\n")

        return {
            "token": token,
            "user": {
                "id": user.id,
                "firstName": user.first_name,
                "lastName": user.last_name,
                "email": user.email,
                "role": user.role
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"\n{'='*60}")
        print(f"❌ ERROR EN REGISTER")
        print(f"{'='*60}")
        print(f"Error type: {type(e).__name__}")
        print(f"Error: {str(e)}")
        traceback.print_exc()
        print(f"{'='*60}\n")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al registrar usuario: {str(e)}"
        )


@router.post("/logout")
def logout():
    """Cerrar sesión (principalmente lado cliente)"""
    return {"success": True, "message": "Sesión cerrada exitosamente"}


@router.get("/verify")
def verify_token():
    """Verificar validez del token (implementar JWT verification)"""
    # TODO: Implementar verificación de JWT
    return {"valid": True}


@router.post("/refresh")
def refresh_token():
    """Refrescar token JWT"""
    # TODO: Implementar refresh de token
    return {"token": "new_token"}


@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Solicitar recuperación de contraseña"""
    try:
        print(f"📧 Password recovery requested for: {request.email}")

        # Verificar que el usuario existe
        query = text("SELECT id FROM users WHERE email = :email")
        result = db.execute(query, {"email": request.email})
        user = result.fetchone()

        if not user:
            # Por seguridad, no revelar si el email existe o no
            return {
                "success": True,
                "message": "Si el email existe, recibirás instrucciones de recuperación"
            }

        # TODO: Generar token de recuperación y enviar email
        print(f"✅ Recovery email would be sent to: {request.email}")

        return {
            "success": True,
            "message": "Si el email existe, recibirás instrucciones de recuperación"
        }

    except Exception as e:
        print(f"❌ Error en forgot-password: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar solicitud"
        )


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Restablecer contraseña con token"""
    try:
        # TODO: Verificar token de recuperación
        # TODO: Actualizar contraseña

        return {
            "success": True,
            "message": "Contraseña actualizada exitosamente"
        }

    except Exception as e:
        print(f"❌ Error en reset-password: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al restablecer contraseña"
        )


# ============================================
# ENDPOINT DE DIAGNÓSTICO
# ============================================

@router.get("/test")
def test_auth_router():
    """Endpoint de prueba para verificar que el router funciona"""
    return {
        "status": "ok",
        "message": "Auth router funcionando correctamente",
        "timestamp": datetime.now().isoformat(),
        "bcrypt_info": {
            "schemes": pwd_context.schemes(),
            "default_scheme": pwd_context.default_scheme()
        },
        "endpoints": [
            "POST /api/auth/login",
            "POST /api/auth/register",
            "POST /api/auth/logout",
            "GET /api/auth/verify",
            "POST /api/auth/refresh",
            "POST /api/auth/forgot-password",
            "POST /api/auth/reset-password"
        ]
    }


@router.get("/debug-hash/{email}")
def debug_hash(email: str, db: Session = Depends(get_db)):
    """
    Endpoint de DEBUG para inspeccionar hashes (SOLO DESARROLLO)
    ⚠️ ELIMINAR EN PRODUCCIÓN
    """
    try:
        query = text("SELECT id, email, password_hash, created_at FROM users WHERE email = :email")
        result = db.execute(query, {"email": email})
        user = result.fetchone()

        if not user:
            return {"error": "Usuario no encontrado"}

        hash_info = {
            "user_id": user.id,
            "email": user.email,
            "hash_length": len(user.password_hash),
            "hash_prefix": user.password_hash[:30],
            "hash_valid_bcrypt": user.password_hash.startswith('$2b$') or user.password_hash.startswith('$2a$'),
            "created_at": str(user.created_at)
        }

        return hash_info

    except Exception as e:
        return {"error": str(e)}


# ============================================
# VERIFICACIÓN AL CARGAR EL MÓDULO
# ============================================

print("\n" + "="*70)
print("✅ AUTH ROUTER CARGADO EXITOSAMENTE (VERSIÓN MEJORADA)")
print("="*70)
print("   Endpoints registrados:")
for route in router.routes:
    if hasattr(route, 'methods') and hasattr(route, 'path'):
        methods = ','.join(sorted(route.methods))
        print(f"      {methods:12} {route.path}")
print("="*70 + "\n")
