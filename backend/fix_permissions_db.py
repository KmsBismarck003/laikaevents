
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("db_fix")

# Cargar variables de entorno
load_dotenv()

def add_permissions_column():
    print("Iniciando reparacion de esquema de base de datos...")

    MYSQL_URL = f"mysql+pymysql://{os.getenv('MYSQL_USER', 'root')}:{os.getenv('MYSQL_PASSWORD', '')}@{os.getenv('MYSQL_HOST', 'localhost')}:3306/{os.getenv('MYSQL_DATABASE', 'laika_club')}"

    try:
        engine = create_engine(MYSQL_URL)
        with engine.connect() as conn:
            # Verificar si la columna ya existe
            check_query = text("""
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = :schema
                AND TABLE_NAME = 'users'
                AND COLUMN_NAME = 'permissions'
            """)

            result = conn.execute(check_query, {"schema": os.getenv('MYSQL_DATABASE', 'laika_club')})
            if result.fetchone():
                print("La columna 'permissions' ya existe. No se requieren cambios.")
                return

            print("La columna 'permissions' no existe. Creandola...")

            # Agregar columna
            alter_query = text("ALTER TABLE users ADD COLUMN permissions TEXT NULL AFTER role")
            conn.execute(alter_query)
            conn.commit()

            print("Columna 'permissions' agregada exitosamente.")

    except Exception as e:
        print(f"Error al modificar la base de datos: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    add_permissions_column()
