import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

MYSQL_URL = f"mysql+pymysql://{os.getenv('MYSQL_USER', 'root')}:{os.getenv('MYSQL_PASSWORD', '')}@{os.getenv('MYSQL_HOST', 'localhost')}:3306/{os.getenv('MYSQL_DATABASE', 'laika_club')}"

try:
    engine = create_engine(MYSQL_URL)
    with engine.connect() as conn:
        print("Eliminando tabla request_logs corrupta...")
        conn.execute(text("DROP TABLE IF EXISTS request_logs"))

        # Opcional: Audit logs también por si acaso
        # conn.execute(text("DROP TABLE IF EXISTS audit_logs"))

        print("Recreando tabla request_logs...")
        conn.execute(text("""
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
        """))
        conn.commit()
        print("Tabla request_logs recreada correctamente.")

except Exception as e:
    print(f"Error: {e}")
