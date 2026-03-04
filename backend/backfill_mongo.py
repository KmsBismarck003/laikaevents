import sys
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Agregar la ruta base
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text, create_engine
from sqlalchemy.orm import sessionmaker
from core.mongodb import MongoAnalytics, db

def migrate_users(sql_db):
    print("\n--- Migrando Usuarios ---")
    users = sql_db.execute(text("SELECT id, first_name, last_name, email, role, phone FROM users")).fetchall()
    count = 0
    for u in users:
        try:
            MongoAnalytics.log_user_registered(
                user_id=u.id,
                role=u.role,
                email=u.email,
                metadata={"name": f"{u.first_name} {u.last_name}", "phone": u.phone, "migrated": True}
            )
            count += 1
        except Exception as e:
            print(f"Error migrando usuario {u.id}: {e}")
    print(f"[OK] {count} usuarios migrados a MongoDB (users_analytics).")

def migrate_events(sql_db):
    print("\n--- Migrando Eventos ---")
    events = sql_db.execute(text("SELECT id, name, category, location, venue, total_tickets, price, created_by FROM events")).fetchall()
    count = 0
    for e in events:
        try:
            loc = e.venue if e.venue else e.location
            MongoAnalytics.log_event_created(
                event_id=e.id,
                name=e.name,
                category=e.category,
                location=loc,
                total_tickets=e.total_tickets,
                price=float(e.price) if e.price else 0,
                created_by=e.created_by
            )
            count += 1
        except Exception as err:
            print(f"Error migrando evento {e.id}: {err}")
    print(f"[OK] {count} eventos migrados a MongoDB (events_analytics).")

def migrate_tickets(sql_db):
    print("\n--- Migrando Boletos y Finanzas ---")
    tickets = sql_db.execute(text("SELECT id, ticket_code, event_id, user_id, ticket_type, price FROM tickets")).fetchall()
    count = 0
    for t in tickets:
        try:
            MongoAnalytics.log_ticket_purchased(
                ticket_code=t.ticket_code,
                event_id=t.event_id,
                user_id=t.user_id,
                ticket_type=t.ticket_type,
                price=float(t.price) if t.price else 0
            )
            count += 1
        except Exception as err:
            print(f"Error migrando boleto {t.ticket_code}: {err}")
    print(f"[OK] {count} boletos migrados a MongoDB (tickets/financial_analytics).")

def run_migration():
    if db is None:
        print("[ERROR] MongoDB no esta conectado. Revisa que el servicio de MongoDB este ejecutandose localmente.")
        return

    print("[RUNNING] INICIANDO MIGRACION HISTORICA DE MYSQL A MONGODB")

    # 1. Limpiar colecciones analiticas existentes para evitar duplicados en la migracion
    print("Limpiando colecciones de destino...")
    db.users_analytics.delete_many({"metadata.migrated": True})

    MYSQL_URL = f"mysql+pymysql://{os.getenv('MYSQL_USER', 'root')}:{os.getenv('MYSQL_PASSWORD', '')}@{os.getenv('MYSQL_HOST', 'localhost')}:3306/{os.getenv('MYSQL_DATABASE', 'laika_club')}"
    engine = create_engine(MYSQL_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    sql_db = SessionLocal()
    try:
        migrate_users(sql_db)
        migrate_events(sql_db)
        migrate_tickets(sql_db)
        print("\n[OK] MIGRACION COMPLETADA CON EXITO")
    except Exception as e:
        print(f"\n[ERROR] Error fatal durante migracion: {e}")
    finally:
        sql_db.close()

if __name__ == "__main__":
    run_migration()
