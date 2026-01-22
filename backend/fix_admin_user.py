# fix_admin_user.py
from passlib.context import CryptContext
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()

# Configurar bcrypt con configuración explícita
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12
)

# Conectar a la base de datos
MYSQL_URL = f"mysql+pymysql://{os.getenv('MYSQL_USER', 'root')}:{os.getenv('MYSQL_PASSWORD', '')}@{os.getenv('MYSQL_HOST', 'localhost')}:3306/{os.getenv('MYSQL_DATABASE', 'laika_club')}"

engine = create_engine(MYSQL_URL)

# Datos del admin
admin_email = "admin@laikaclub.com"
admin_password = "Admin123"

print(f"\n{'='*60}")
print("🔧 REPARANDO USUARIO ADMINISTRADOR")
print(f"{'='*60}\n")

try:
    # Generar hash nuevo
    print("🔑 Generando nuevo hash...")
    admin_hash = pwd_context.hash(admin_password)
    print(f"✅ Hash generado: {admin_hash[:50]}...")

    # Verificar que el hash funciona
    print("\n🔍 Verificando hash...")
    if pwd_context.verify(admin_password, admin_hash):
        print("✅ Hash verificado correctamente!")
    else:
        print("❌ ERROR: Hash no válido!")
        exit(1)

    with engine.connect() as conn:
        # Eliminar usuario existente si hay problemas
        print(f"\n🗑️  Eliminando usuario existente (si existe)...")
        delete_query = text("DELETE FROM users WHERE email = :email")
        conn.execute(delete_query, {"email": admin_email})
        conn.commit()
        print("✅ Usuario anterior eliminado")

        # Crear usuario nuevo
        print(f"\n➕ Creando nuevo usuario admin...")
        insert_query = text("""
            INSERT INTO users (
                first_name,
                last_name,
                email,
                password_hash,
                role,
                status,
                created_at
            )
            VALUES (
                'Admin',
                'Sistema',
                :email,
                :hash,
                'admin',
                'active',
                NOW()
            )
        """)

        conn.execute(insert_query, {
            "email": admin_email,
            "hash": admin_hash
        })
        conn.commit()
        print("✅ Usuario admin creado!")

        # Verificar en BD
        print(f"\n🔍 Verificando en base de datos...")
        verify_query = text("SELECT id, email, role, status FROM users WHERE email = :email")
        result = conn.execute(verify_query, {"email": admin_email})
        user = result.fetchone()

        if user:
            print(f"✅ Usuario encontrado en BD:")
            print(f"   ID: {user[0]}")
            print(f"   Email: {user[1]}")
            print(f"   Role: {user[2]}")
            print(f"   Status: {user[3]}")
        else:
            print("❌ ERROR: Usuario no encontrado en BD!")
            exit(1)

    print(f"\n{'='*60}")
    print("✅ REPARACIÓN COMPLETADA")
    print(f"{'='*60}")
    print(f"\n📧 Email: {admin_email}")
    print(f"🔑 Password: {admin_password}")
    print(f"\n{'='*60}\n")

except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
