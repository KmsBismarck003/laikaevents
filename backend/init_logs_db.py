import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de conexión (reutilizando lógica de main.py)
MYSQL_URL = f"mysql+pymysql://{os.getenv('MYSQL_USER', 'root')}:{os.getenv('MYSQL_PASSWORD', '')}@{os.getenv('MYSQL_HOST', 'localhost')}:3306/{os.getenv('MYSQL_DATABASE', 'laika_club')}"

print(f"Conectando a BD: {os.getenv('MYSQL_DATABASE', 'laika_club')}...")

try:
    engine = create_engine(MYSQL_URL)

    # Leer el archivo SQL
    with open("create_logs_tables.sql", "r", encoding="utf-8") as f:
        sql_content = f.read()

    # Separar sentencias (simple split por ';')
    # Nota: Esto es básico, funciona para este script específico.
    statements = [s.strip() for s in sql_content.split(';') if s.strip()]

    with engine.connect() as conn:
        for statement in statements:
            if statement:
                print(f"Ejecutando: {statement[:50]}...")
                conn.execute(text(statement))
        conn.commit()

    print("\nTablas de logs creadas exitosamente (audit_logs, request_logs).")
    print("Sistema listo para operar de forma aislada.")

except Exception as e:
    print(f"\nError critico al crear tablas de logs: {e}")
    exit(1)
