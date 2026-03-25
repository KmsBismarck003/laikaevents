from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import sqlite3
from dotenv import load_dotenv

load_dotenv()

DB_PATH = "microservices/events/events.db"

# ============================================
# PROTOCOLO DE AUTORECUPERACIÓN (FALLBACK)
# ============================================
def init_events_db():
    """Verifica si la base de datos existe, si no, la crea (Fallback Protocol)"""
    if not os.path.exists(DB_PATH):
        print("[FALLBACK] Events DB no encontrada. Recreando...")
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()

        cur.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                event_date TEXT,
                event_time TEXT,
                location TEXT,
                venue TEXT,
                category TEXT,
                price REAL,
                total_tickets INTEGER,
                available_tickets INTEGER,
                image_url TEXT,
                status TEXT DEFAULT 'draft',
                created_by INTEGER,
                grid_position_x INTEGER DEFAULT 0,
                grid_position_y INTEGER DEFAULT 0,
                grid_span_x INTEGER DEFAULT 1,
                grid_span_y INTEGER DEFAULT 1,
                grid_page INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS event_ticket_sections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                capacity INTEGER NOT NULL,
                available INTEGER NOT NULL,
                badge_text TEXT,
                color_hex TEXT,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS event_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                icon TEXT NOT NULL,
                description TEXT NOT NULL,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS ads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                image_url TEXT NOT NULL,
                link_url TEXT,
                position TEXT DEFAULT 'main',
                active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS system_config (
                `key` TEXT PRIMARY KEY,
                `value` TEXT
            )
        """)

        # Configuración por defecto al recrear
        configs = [
            ("maintenanceMode", "false"),
            ("registrationEnabled", "true"),
            ("sessionTimeout", "30"),
            ("maxTicketsPerUser", "5"),
            ("news_ticker_config", '{"text": "PROXIMOS EVENTOS - OFERTAS EXCLUSIVAS - CLUB LAIKA", "backgroundColor": "#000000", "textColor": "#ffffff", "speed": 20}')
        ]
        for k, v in configs:
            cur.execute("INSERT OR IGNORE INTO system_config (`key`, `value`) VALUES (?, ?)", (k, v))

        conn.commit()
        conn.close()
        print("[FALLBACK] Events DB inicializada con éxito.")
    else:
        # MIGRACIÓN: Verificar columnas de grid_span y grid_page si faltan
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(events)")
        existing_columns = [col[1] for col in cursor.fetchall()]

        needed_columns = {
            "grid_span_x": "INTEGER DEFAULT 1",
            "grid_span_y": "INTEGER DEFAULT 1",
            "grid_page": "INTEGER DEFAULT 0",
        }

        migration_done = False
        for col_name, col_type in needed_columns.items():
            if col_name not in existing_columns:
                print(f"[PROTOCOL] Events DB: Añadiendo columna {col_name}...")
                cursor.execute(f"ALTER TABLE events ADD COLUMN {col_name} {col_type}")
                migration_done = True

        # Asegurar tablas secundarias
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS event_ticket_sections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                capacity INTEGER NOT NULL,
                available INTEGER NOT NULL,
                badge_text TEXT,
                color_hex TEXT,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS event_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                icon TEXT NOT NULL,
                description TEXT NOT NULL,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                image_url TEXT NOT NULL,
                link_url TEXT,
                position TEXT DEFAULT 'main',
                active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS system_config (
                `key` TEXT PRIMARY KEY,
                `value` TEXT
            )
        """)

        if migration_done:
            conn.commit()
            print("[PROTOCOL] Events DB migración completada.")
        else:
            conn.commit()
        conn.close()

# Ejecutar protocolo al cargar el módulo
init_events_db()

# ============================================
# CONEXIÓN CON FALLBACK MySQL → SQLite
# ============================================
MYSQL_URL = f"mysql+pymysql://{os.getenv('MYSQL_USER', 'root')}:{os.getenv('MYSQL_PASSWORD', '')}@{os.getenv('MYSQL_HOST', 'localhost')}:3306/{os.getenv('MYSQL_DATABASE', 'laika_club')}"

try:
    engine = create_engine(MYSQL_URL, pool_pre_ping=True, connect_args={'connect_timeout': 2})
    engine.connect()
    print("[EVENT SERVICE] Conexión MySQL establecida.")
except Exception:
    print("[EVENT SERVICE] MySQL no disponible. Usando SQLite de respaldo...")
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
