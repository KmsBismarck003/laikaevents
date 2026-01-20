from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
import os
import traceback

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Dependencia para obtener la sesión de BD
def get_db():
    from main import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Modelos
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

# ============================================
# ENDPOINTS
# ============================================

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Iniciar sesión"""
    try:
        print(f"🔵 Login attempt: {request.email}")

        # Buscar usuario
        query = text("SELECT * FROM users WHERE email = :email")
        result = db.execute(query, {"email": request.email})
        user = result.fetchone()

        if not user:
            print(f"❌ User not found: {request.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas"
            )

        # Verificar contraseña
        if not pwd_context.verify(request.password, user.password_hash):
            print(f"❌ Invalid password for: {request.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas"
            )

        print(f"✅ Login successful: {request.email} (role: {user.role})")

        # Crear token JWT
        token_data = {
            "user_id": user.id,
            "role": user.role,
            "exp": datetime.utcnow() + timedelta(days=7)
        }
        token = jwt.encode(
            token_data,
            os.getenv('JWT_SECRET', 'tu_clave_secreta_aqui'),
            algorithm="HS256"
        )

        # Actualizar último login
        try:
            update_query = text("UPDATE users SET last_login = NOW() WHERE id = :user_id")
            db.execute(update_query, {"user_id": user.id})
            db.commit()
            print(f"✅ Last login updated for user {user.id}")
        except Exception as e:
            print(f"⚠️ Warning: Could not update last_login: {e}")
            db.rollback()
            # No lanzar error, el login fue exitoso

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
        print(f"❌ Error en login: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al iniciar sesión"
        )

@router.post("/register", response_model=TokenResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Registrar nuevo usuario - VERSIÓN MEJORADA CON DIAGNÓSTICO"""
    try:
        print(f"\n{'='*60}")
        print(f"📝 REGISTER ATTEMPT")
        print(f"{'='*60}")
        print(f"Email: {request.email}")
        print(f"Name: {request.firstName} {request.lastName}")
        print(f"Phone: {request.phone}")

        # ============================================
        # PASO 1: Verificar si email existe
        # ============================================
        print("\n[PASO 1] Verificando email existente...")
        check_query = text("SELECT id FROM users WHERE email = :email")
        result = db.execute(check_query, {"email": request.email})
        existing = result.fetchone()

        if existing:
            print(f"❌ Email already exists: {request.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado"
            )

        print("✅ Email disponible")

        # ============================================
        # PASO 2: Hash de contraseña
        # ============================================
        print("\n[PASO 2] Generando hash de contraseña...")
        password_hash = pwd_context.hash(request.password)
        print(f"✅ Password hashed: {password_hash[:30]}...")

        # ============================================
        # PASO 3: Insertar usuario CON MANEJO EXPLÍCITO
        # ============================================
        print("\n[PASO 3] Insertando usuario...")

        # Preparar datos
        user_data = {
            "first_name": request.firstName,
            "last_name": request.lastName,
            "email": request.email,
            "phone": request.phone,
            "password_hash": password_hash
        }
        print(f"📦 Datos a insertar: {user_data}")

        # Ejecutar INSERT
        insert_query = text("""
            INSERT INTO users (first_name, last_name, email, phone, password_hash, role, status, created_at)
            VALUES (:first_name, :last_name, :email, :phone, :password_hash, 'usuario', 'active', NOW())
        """)

        print("🔄 Ejecutando INSERT query...")
        result = db.execute(insert_query, user_data)

        print(f"✅ INSERT ejecutado")
        print(f"   Rows affected: {result.rowcount}")
        print(f"   Last inserted ID: {result.lastrowid if hasattr(result, 'lastrowid') else 'N/A'}")

        # ============================================
        # PASO 4: COMMIT EXPLÍCITO CON VERIFICACIÓN
        # ============================================
        print("\n[PASO 4] Realizando COMMIT...")
        try:
            db.commit()
            print("✅ COMMIT exitoso")
        except Exception as commit_error:
            print(f"❌ ERROR EN COMMIT: {commit_error}")
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al guardar usuario: {str(commit_error)}"
            )

        # ============================================
        # PASO 5: Verificar que se guardó
        # ============================================
        print("\n[PASO 5] Verificando que el usuario se guardó...")

        # Usar nueva consulta para asegurar que leemos de la BD
        verify_query = text("SELECT * FROM users WHERE email = :email")
        verify_result = db.execute(verify_query, {"email": request.email})
        user = verify_result.fetchone()

        if not user:
            print("❌ CRÍTICO: Usuario no encontrado después de INSERT y COMMIT")
            print("   Esto indica un problema de permisos o configuración de MySQL")

            # Intentar diagnóstico adicional
            count_query = text("SELECT COUNT(*) as total FROM users WHERE email = :email")
            count_result = db.execute(count_query, {"email": request.email})
            count = count_result.fetchone()
            print(f"   Count en BD: {count.total if count else 0}")

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear usuario: no se pudo verificar el registro"
            )

        print(f"✅ Usuario verificado en BD!")
        print(f"   ID: {user.id}")
        print(f"   Email: {user.email}")
        print(f"   Role: {user.role}")
        print(f"   Status: {user.status}")
        print(f"   Created at: {user.created_at}")

        # ============================================
        # PASO 6: Crear token JWT
        # ============================================
        print("\n[PASO 6] Creando token JWT...")
        token_data = {
            "user_id": user.id,
            "role": user.role,
            "exp": datetime.utcnow() + timedelta(days=7)
        }
        token = jwt.encode(
            token_data,
            os.getenv('JWT_SECRET', 'tu_clave_secreta_aqui'),
            algorithm="HS256"
        )

        print(f"✅ Token creado: {token[:50]}...")
        print(f"{'='*60}\n")

        # ============================================
        # RESPUESTA
        # ============================================
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
        print(f"❌ REGISTRATION ERROR")
        print(f"{'='*60}")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print(f"Full traceback:")
        traceback.print_exc()
        print(f"{'='*60}\n")

        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al registrar usuario: {str(e)}"
        )


# ============================================
# ENDPOINT DE DIAGNÓSTICO (TEMPORAL)
# ============================================
@router.get("/test-db")
def test_database_connection(db: Session = Depends(get_db)):
    """
    Endpoint para probar conexión y escritura a la base de datos
    ELIMINAR EN PRODUCCIÓN
    """
    try:
        # Test 1: SELECT
        result = db.execute(text("SELECT COUNT(*) as total FROM users"))
        count = result.fetchone()

        # Test 2: INSERT de prueba
        test_email = f"test_{datetime.now().timestamp()}@test.com"
        insert_query = text("""
            INSERT INTO users (first_name, last_name, email, password_hash, role, status, created_at)
            VALUES ('Test', 'User', :email, 'hash123', 'usuario', 'active', NOW())
        """)

        insert_result = db.execute(insert_query, {"email": test_email})
        db.commit()

        # Test 3: Verificar INSERT
        verify_query = text("SELECT * FROM users WHERE email = :email")
        verify_result = db.execute(verify_query, {"email": test_email})
        test_user = verify_result.fetchone()

        # Test 4: DELETE de prueba
        if test_user:
            delete_query = text("DELETE FROM users WHERE email = :email")
            db.execute(delete_query, {"email": test_email})
            db.commit()

        return {
            "status": "success",
            "total_users": count.total,
            "insert_test": "passed" if test_user else "failed",
            "test_user_id": test_user.id if test_user else None,
            "message": "Base de datos funcionando correctamente"
        }

    except Exception as e:
        db.rollback()
        return {
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc()
        }
