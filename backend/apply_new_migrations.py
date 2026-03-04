from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

def run_migrations():
    print("Iniciando migracion de Venues y Funciones...")

    # Connection logic copied/adapted from run_manager_migration.py
    url = f"mysql+pymysql://{os.getenv('MYSQL_USER','root')}:{os.getenv('MYSQL_PASSWORD','')}@{os.getenv('MYSQL_HOST','localhost')}:3306/{os.getenv('MYSQL_DATABASE','laika_club')}"
    engine = create_engine(url)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        # Read SQL files
        base_path = os.path.dirname(os.path.abspath(__file__))
        migrations_dir = os.path.join(base_path, "database", "migrations")

        files = [
            # "create_venues_table.sql",
            # "create_event_functions_table.sql",
            # "add_function_id_to_tickets.sql",
            "add_venue_id_to_events.sql"
        ]

        for file_name in files:
            file_path = os.path.join(migrations_dir, file_name)
            print(f"Ejecutando {file_name}...")

            with open(file_path, "r", encoding="utf-8") as f:
                sql_content = f.read()
                # Simple split by ';' usually works for simple schema scripts
                statements = [s.strip() for s in sql_content.split(';') if s.strip()]

                for statement in statements:
                    db.execute(text(statement))

            db.commit()
            print(f"{file_name} aplicado correctamente.")

        print("Migracion completada exitosamente.")

    except Exception as e:
        print(f"Error durante la migracion: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_migrations()
