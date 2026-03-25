from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import sqlite3
from dotenv import load_dotenv

load_dotenv()

DB_PATH = "microservices/tickets/tickets.db"

# ============================================
# PROTOCOLO DE AUTORECUPERACIÓN (FALLBACK)
# ============================================
def init_tickets_db():
    """Verifica si la base de datos existe, si no, la crea (Fallback Protocol)"""
    if not os.path.exists(DB_PATH):
        print("[FALLBACK] Tickets DB no encontrada. Recreando...")
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()

        cur.execute("""
            CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                event_id INTEGER NOT NULL,
                ticket_code TEXT UNIQUE NOT NULL,
                qr_data TEXT,
                section_name TEXT,
                seat_id TEXT,
                price REAL DEFAULT 0,
                status TEXT DEFAULT 'active',
                payment_method TEXT,
                redeemed_at TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                event_id INTEGER,
                amount REAL NOT NULL,
                payment_method TEXT,
                status TEXT DEFAULT 'completed',
                reference TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()
        conn.close()
        print("[FALLBACK] Tickets DB inicializada con éxito.")
    else:
        # MIGRACIÓN: Verificar columnas nuevas
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(tickets)")
        existing_columns = [col[1] for col in cursor.fetchall()]

        needed_columns = {
            "section_name": "TEXT",
            "seat_id": "TEXT",
            "price": "REAL DEFAULT 0",
            "payment_method": "TEXT",
            "qr_data": "TEXT",
            "redeemed_at": "TEXT",
        }

        migration_done = False
        for col_name, col_type in needed_columns.items():
            if col_name not in existing_columns:
                print(f"[PROTOCOL] Tickets DB: Añadiendo columna {col_name}...")
                cursor.execute(f"ALTER TABLE tickets ADD COLUMN {col_name} {col_type}")
                migration_done = True

        # Asegurar tabla payments
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                event_id INTEGER,
                amount REAL NOT NULL,
                payment_method TEXT,
                status TEXT DEFAULT 'completed',
                reference TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        if migration_done:
            conn.commit()
            print("[PROTOCOL] Tickets DB migración completada.")
        else:
            conn.commit()
        conn.close()

# Ejecutar protocolo al cargar el módulo
init_tickets_db()

# ============================================
# CONEXIÓN CON FALLBACK MySQL → SQLite
# ============================================
MYSQL_URL = f"mysql+pymysql://{os.getenv('MYSQL_USER', 'root')}:{os.getenv('MYSQL_PASSWORD', '')}@{os.getenv('MYSQL_HOST', 'localhost')}:3306/{os.getenv('MYSQL_DATABASE', 'laika_club')}"

try:
    engine = create_engine(MYSQL_URL, pool_pre_ping=True, connect_args={'connect_timeout': 2})
    engine.connect()
    print("[TICKET SERVICE] Conexión MySQL establecida.")
except Exception:
    print("[TICKET SERVICE] MySQL no disponible. Usando SQLite de respaldo...")
    SQLALCHEMY_DATABASE_URL = f"sqlite:///./{DB_PATH}"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
