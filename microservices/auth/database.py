from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import sqlite3

# Ruta de la base de datos SQLite
DB_PATH = "microservices/auth/auth.db"

# ============================================
# PROTOCOLO DE AUTORECUPERACIÓN (FALLBACK)
# ============================================
def init_auth_db():
    """Verifica si la base de datos existe, si no, la crea (Fallback Protocol)"""
    if not os.path.exists(DB_PATH):
        print("[FALLBACK] Auth DB no encontrada. Recreando...")
        conn = sqlite3.connect(DB_PATH)
        scur = conn.cursor()
        scur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                first_name TEXT, last_name TEXT, email TEXT UNIQUE,
                phone TEXT, password_hash TEXT, role TEXT, status TEXT,
                last_login TEXT, failed_attempts INTEGER DEFAULT 0,
                lockout_until TEXT, created_at TEXT, social_provider TEXT,
                reset_token TEXT, reset_token_expires TEXT, avatar_url TEXT
            )
        """)
        scur.execute("""
            CREATE TABLE IF NOT EXISTS permission_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                permission_type TEXT,
                status TEXT DEFAULT 'pending',
                request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        scur.execute("""
            CREATE TABLE IF NOT EXISTS auth_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                user_name TEXT,
                email TEXT,
                role TEXT,
                event_type TEXT,
                ip_address TEXT,
                user_agent TEXT,
                summary TEXT,
                created_at TEXT DEFAULT (datetime('now', 'localtime'))
            )
        """)
        conn.commit()
        conn.close()
        print("[FALLBACK] Auth DB inicializada con éxito.")
    else:
        # MIGRACIÓN: Verificar si existen las columnas necesarias en DB existente
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(users)")
        existing_columns = [col[1] for col in cursor.fetchall()]
        
        needed_columns = {
            "social_provider": "TEXT",
            "reset_token": "TEXT",
            "reset_token_expires": "TEXT",
            "permissions": "TEXT",
            "avatar_url": "TEXT"
        }
        
        migration_done = False
        for col_name, col_type in needed_columns.items():
            if col_name not in existing_columns:
                print(f"[PROTOCOL] Migrando DB: Añadiendo columna {col_name}...")
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
                migration_done = True
        
        # Crear tabla auth_logs si no existe (migración no destructiva)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS auth_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                user_name TEXT,
                email TEXT,
                role TEXT,
                event_type TEXT,
                ip_address TEXT,
                user_agent TEXT,
                summary TEXT,
                created_at TEXT DEFAULT (datetime('now', 'localtime'))
            )
        """)
        
        if migration_done:
            conn.commit()
            print("[PROTOCOL] Migración completada.")
        else:
            conn.commit()
        conn.close()

# Ejecutar protocolo al cargar el módulo
init_auth_db()

# ============================================
# PROTOCOLO ADMIN SEED
# ============================================
def seed_admin_user():
    """
    Verifica que exista al menos un usuario administrador.
    Si no hay ninguno, crea un admin por defecto con credenciales temporales.
    IMPORTANTE: Cambiar la contraseña inmediatamente después del primer login.
    """
    import hashlib, secrets
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users WHERE role='admin'")
        admin_count = cursor.fetchone()[0]

        if admin_count == 0:
            print("[ADMIN SEED] No se encontró ningún administrador. Creando admin por defecto...")
            # Hash simple para contraseña temporal (sin passlib para independencia)
            import hashlib
            temp_password = "admin123"
            # Se usa bcrypt si passlib está disponible, sino sha256 como fallback
            try:
                from passlib.context import CryptContext
                pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
                password_hash = pwd_context.hash(temp_password)
            except ImportError:
                import hashlib
                password_hash = hashlib.sha256(temp_password.encode()).hexdigest()

            from datetime import datetime
            cursor.execute("""
                INSERT INTO users (
                    first_name, last_name, email, phone,
                    password_hash, role, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "Admin", "LAIKA",
                "admin@laikaclub.com",
                "0000000000",
                password_hash,
                "admin",
                "active",
                datetime.now().isoformat()
            ))
            conn.commit()
            print("[ADMIN SEED] Admin creado: admin@laikaclub.com / admin123")
            print("[ADMIN SEED] CAMBIA LA CONTRASEÑA INMEDIATAMENTE DESPUÉS DEL PRIMER LOGIN!")
        else:
            print(f"[ADMIN SEED] {admin_count} administrador(es) verificado(s). Sin acción necesaria.")

        conn.close()
    except Exception as e:
        print(f"[ADMIN SEED ERROR] No se pudo verificar/crear el admin: {e}")

seed_admin_user()

# Configuración de SQLAlchemy para SQLite
SQLALCHEMY_DATABASE_URL = f"sqlite:///./{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}, # Necesario para SQLite en FastAPI
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
