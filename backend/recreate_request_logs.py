import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import time

load_dotenv()

# Config
MYSQL_URL = f"mysql+pymysql://{os.getenv('MYSQL_USER', 'root')}:{os.getenv('MYSQL_PASSWORD', '')}@{os.getenv('MYSQL_HOST', 'localhost')}:3306/{os.getenv('MYSQL_DATABASE', 'laika_club')}"

def recreate_table():
    try:
        engine = create_engine(MYSQL_URL)
        with engine.connect() as conn:
            print("Conectado a la base de datos.")

            # 1. Check if table exists
            result = conn.execute(text("SHOW TABLES LIKE 'request_logs'"))
            if result.fetchone():
                timestamp = int(time.time())
                backup_name = f"request_logs_backup_{timestamp}"
                print(f"La tabla 'request_logs' existe. Renombrando a '{backup_name}'...")
                conn.execute(text(f"RENAME TABLE request_logs TO {backup_name}"))
                print("Tabla renombrada exitosamente.")

            # 2. Create proper table
            print("Creando tabla 'request_logs' con esquema correcto...")
            create_query = """
            CREATE TABLE request_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                method VARCHAR(10) NOT NULL,
                path VARCHAR(255) NOT NULL,
                status_code INT NOT NULL,
                duration_ms FLOAT NULL,
                user_id INT NULL,
                ip_address VARCHAR(45) NULL,
                user_agent TEXT NULL,
                error_details TEXT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

                INDEX idx_req_timestamp (timestamp),
                INDEX idx_req_path (path),
                INDEX idx_req_status (status_code),
                INDEX idx_req_user (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """
            conn.execute(text(create_query))
            print("Tabla 'request_logs' creada exitosamente.")
            conn.commit()

            # Optional: Verify columns
            print("Verificando columnas...")
            cols = conn.execute(text("DESCRIBE request_logs")).fetchall()
            for col in cols:
                print(f" - {col[0]} ({col[1]})")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    recreate_table()
