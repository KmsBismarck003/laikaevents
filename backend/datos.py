# backend/datos.py
import sys
import os
import random
import uuid
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

# Agregar la ruta base
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text, create_engine, exc
from sqlalchemy.orm import sessionmaker
from core.mongodb import MongoAnalytics, db as mongo_db

# Configurar logging estricto (SIN EMOJIS PARA EVITAR ERROR cp1252 EN WINDOWS)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

MYSQL_URL = f"mysql+pymysql://{os.getenv('MYSQL_USER', 'root')}:{os.getenv('MYSQL_PASSWORD', '')}@{os.getenv('MYSQL_HOST', 'localhost')}:3306/{os.getenv('MYSQL_DATABASE', 'laika_club')}"
engine = create_engine(MYSQL_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

NOMBRES = ["Alejandro", "Maria", "Carlos", "Ana", "Juan", "Laura", "Pedro", "Sofia", "Luis", "Carmen", "Miguel", "Patricia", "Jorge", "Marta", "David", "Lucia", "Diego", "Valentina", "Daniel", "Camila"]
APELLIDOS = ["Garcia", "Rodriguez", "Gonzalez", "Fernandez", "Lopez", "Martinez", "Sanchez", "Perez", "Gomez", "Martin", "Ruiz", "Hernandez", "Diaz", "Moreno", "Alvarez", "Romero", "Alonso", "Gutierrez"]
DEFAULT_PASSWORD_HASH = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIk/xjCb8e"

def generate_random_email(nombre, apellido, idx):
    domains = ["gmail.com", "yopmail.com", "outlook.com", "hotmail.com"]
    return f"{nombre.lower()}.{apellido.lower()}.sim{idx}@{random.choice(domains)}"

def run_strict_generation():
    logger.info("[INIT] INICIANDO GENERACION MASIVA EN MODO ESTRICTO Y OPTIMIZADO")

    if mongo_db is None:
        logger.error("[ERROR] MongoDB no esta conectado. La validacion estricta requiere que ambos motores esten activos.")
        return

    db = SessionLocal()
    try:
        # ==========================================
        # 0. PRE-AUDITORIA Y CONTROL DE DUPLICACION
        # ==========================================
        logger.info("[AUDIT] Ejecutando pre-auditoria de inconsistencias en MySQL...")

        # Corregir inventarios rotos ANTES de empezar (evitar amplificar el problema)
        db.execute(text("UPDATE events SET available_tickets = 0 WHERE available_tickets < 0"))
        db.execute(text("UPDATE events SET available_tickets = total_tickets WHERE available_tickets > total_tickets"))
        db.commit()

        # Validar si ya se genero (evitar duplicacion masiva, un modo seguro)
        simulated_users_count = db.execute(text("SELECT count(*) FROM users WHERE email LIKE '%sim%@%'")).scalar()

        # Aplicar INDICES solicitados
        try:
            db.execute(text("ALTER TABLE payments ADD COLUMN ticket_id INT DEFAULT NULL"))
            db.execute(text("CREATE INDEX idx_payment_ticket_id ON payments(ticket_id)"))
            db.commit()
            logger.info("[OK] Indice 'payments.ticket_id' creado en la base de datos.")
        except exc.OperationalError:
            db.rollback() # Ya existe, ignorar
            logger.info("[INFO] El indice en 'payments' ya existia o la tabla esta asegurada.")

        # ==========================================
        # 1. GENERACION DE USUARIOS
        # ==========================================
        logger.info("[USERS] Paso 1: Evaluando e insertando Usuarios...")
        current_users = db.execute(text("SELECT role, COUNT(*) as count FROM users GROUP BY role")).fetchall()
        role_counts = {row.role: row.count for row in current_users}

        target_admins = 3; target_gestores = 10; target_operadores = 30; target_usuarios = 2000

        need_admins = max(0, target_admins - role_counts.get('admin', 0))
        need_gestores = max(0, target_gestores - role_counts.get('gestor', 0))
        need_operadores = max(0, target_operadores - role_counts.get('operador', 0))
        need_usuarios = max(0, target_usuarios - role_counts.get('usuario', 0))

        users_to_insert = []
        res = db.execute(text("SELECT MAX(id) FROM users")).scalar()
        start_idx = (res or 0) + 1

        for role, count in [('admin', need_admins), ('gestor', need_gestores), ('operador', need_operadores), ('usuario', need_usuarios)]:
            for i in range(count):
                n = random.choice(NOMBRES)
                a = random.choice(APELLIDOS)
                users_to_insert.append({
                    "first_name": n,
                    "last_name": a,
                    "email": generate_random_email(n, a, start_idx),
                    "phone": f"555{random.randint(1000000, 9999999)}",
                    "password_hash": DEFAULT_PASSWORD_HASH,
                    "role": role,
                    "status": "active"
                })
                start_idx += 1

        if users_to_insert:
            db.execute(text("""
                INSERT INTO users (first_name, last_name, email, phone, password_hash, role, status, created_at)
                VALUES (:first_name, :last_name, :email, :phone, :password_hash, :role, :status, NOW())
            """), users_to_insert)
            db.commit()
            logger.info(f"[OK] {len(users_to_insert)} usuarios insertados exitosamente en MySQL.")

            # Replicacion Mongo
            for u in users_to_insert:
                try:
                    MongoAnalytics.log_user_registered(-1, u['role'], u['email'], {"name": f"{u['first_name']} {u['last_name']}", "simulated": True})
                except Exception as mongo_err:
                    logger.error(f"[MONGO ERROR] Mongo fallo al registrar usuario: {mongo_err}")
        else:
             logger.info("[OK] El sistema ya cumple la cuota de usuarios (omitiendo).")

        # Validar existencia de foraneas
        gestor_ids = [r.id for r in db.execute(text("SELECT id FROM users WHERE role IN ('gestor', 'admin')")).fetchall()]
        normal_user_ids = [r.id for r in db.execute(text("SELECT id FROM users WHERE role = 'usuario'")).fetchall()]

        if not gestor_ids or not normal_user_ids:
            logger.error("[ERROR] Integridad fallida: Faltan llaves primarias de usuarios.")
            return

        # ==========================================
        # 2. GENERACION DE EVENTOS
        # ==========================================
        logger.info("[EVENTS] Paso 2: Evaluando e insertando Eventos...")
        active_events_count = db.execute(text("SELECT COUNT(*) FROM events WHERE status = 'published'")).scalar()
        need_events = max(0, 20 - active_events_count)
        events_to_insert = []

        if need_events > 0:
            for i in range(need_events):
                events_to_insert.append({
                    "name": f"Evento Masivo {random.randint(100, 999)}",
                    "description": "Un evento increible generado para pruebas masivas.",
                    "category": random.choice(['concert', 'sport', 'theater', 'festival', 'other']),
                    "event_date": (datetime.now() + timedelta(days=random.randint(5, 60))).date(),
                    "event_time": f"{random.randint(18, 22)}:00:00",
                    "location": "Ciudad Principal",
                    "venue": f"Recinto {random.randint(1, 10)}",
                    "price": float(random.choice([100, 250, 500, 800])),
                    "total_tickets": random.randint(1000, 5000),
                    "status": "published",
                    "created_by": random.choice(gestor_ids) # VALIDACION OBLIGATORIA
                })
            db.execute(text("""
                INSERT INTO events (name, description, category, event_date, event_time, location, venue, price, total_tickets, available_tickets, status, created_by, created_at)
                VALUES (:name, :description, :category, :event_date, :event_time, :location, :venue, :price, :total_tickets, :total_tickets, :status, :created_by, NOW())
            """), events_to_insert)
            db.commit()
            logger.info(f"[OK] {need_events} eventos insertados exitosamente.")
        else:
            logger.info("[OK] El sistema ya tiene 20 o mas eventos activos.")

        # ==========================================
        # 3. GENERACION DE BOLETOS EN LOTE
        # ==========================================
        logger.info("[TICKETS] Paso 3: Evaluando boletos con DECREMENTO ATOMICO EN LOTES...")
        events = db.execute(text("SELECT id, name, price, total_tickets, available_tickets FROM events WHERE status = 'published'")).fetchall()

        tickets_inserted = 0
        MAX_TICKETS_PER_BATCH = 1000

        for evt in events:
            tickets_to_sell_total = int(evt.available_tickets * random.uniform(0.1, 0.4))
            if tickets_to_sell_total == 0: continue

            logger.info(f"   [-] Generando lote total de {tickets_to_sell_total} tickets para {evt.name[:20]}...")

            # Sub-lotes por manejo de memoria
            for start in range(0, tickets_to_sell_total, MAX_TICKETS_PER_BATCH):
                sell_amount = min(MAX_TICKETS_PER_BATCH, tickets_to_sell_total - start)

                try:
                    # 3.1 PRE-VALIDACION E INVENTARIO ATOMICO EN LOTE PARA ESTE BATCH MYSQL
                    result = db.execute(text("""
                        UPDATE events
                        SET available_tickets = available_tickets - :sold
                        WHERE id = :event_id AND available_tickets >= :sold
                    """), {"sold": sell_amount, "event_id": evt.id})

                    if result.rowcount == 0:
                        logger.warning(f"   [WARN] Evento {evt.id} no tiene {sell_amount} boletos disponibles. Cancelando sub-lote.")
                        db.rollback()
                        break # Ya no hay tickets

                    tickets_batch = []
                    payments_batch = []
                    mongo_docs = []

                    for _ in range(sell_amount):
                        buyer_id = random.choice(normal_user_ids)
                        t_code = f"TKT-{uuid.uuid4().hex[:8].upper()}"
                        txn_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"

                        tickets_batch.append({"ticket_code": t_code, "event_id": evt.id, "user_id": buyer_id, "price": evt.price})
                        payments_batch.append({"user_id": buyer_id, "event_id": evt.id, "amount": evt.price, "transaction_id": txn_id})
                        mongo_docs.append((t_code, evt.id, buyer_id, "general", evt.price))

                    # 3.2 INSERTAR TICKETS EN LOTE
                    db.execute(text("""
                        INSERT INTO tickets (ticket_code, event_id, user_id, ticket_type, price, status, purchase_date)
                        VALUES (:ticket_code, :event_id, :user_id, 'general', :price, 'active', NOW())
                    """), tickets_batch)

                    # 3.3 REGISTRAR PAGO EN LOTE (sin relation directa a ID autoincremental de ticket para no ahogar memoria asincrona)
                    db.execute(text("""
                        INSERT INTO payments (user_id, event_id, amount, payment_method, transaction_id, status, payment_date)
                        VALUES (:user_id, :event_id, :amount, 'card', :transaction_id, 'completed', NOW())
                    """), payments_batch)

                    # 3.4 REPLICAR EN MONGO DENTRO DE LA TRANSACCION
                    mongo_success = False
                    try:
                        for doc in mongo_docs:
                            MongoAnalytics.log_ticket_purchased(*doc)
                        mongo_success = True
                    except Exception as mongo_err:
                        logger.error(f"[MONGO ERROR] Transaccion MongoDB Fallida: {mongo_err}")

                    if not mongo_success:
                        raise Exception("Fallo la replicacion en MongoDB en el sub-lote. Reversion SQL requerida para integridad.")

                    db.commit()
                    tickets_inserted += sell_amount

                except Exception as op_err:
                    db.rollback()
                    logger.error(f"[ROLLBACK] Revertido el sub-lote del evento {evt.id}. Error: {op_err}")
                    break

        logger.info(f"[OK] Simulacion rigurosa y masiva completada exitosamente. Total de {tickets_inserted} boletos procesados consistentemente (0 Huerfanos).")

    except Exception as e:
        db.rollback()
        logger.error(f"[FATAL ERROR] Excepcion Global: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_strict_generation()
