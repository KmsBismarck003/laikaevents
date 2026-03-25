from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import sqlite3
from dotenv import load_dotenv

load_dotenv()

DB_PATH = "microservices/stats/stats.db"

# ============================================
# PROTOCOLO DE AUTORECUPERACIÓN (FALLBACK)
# ============================================
def init_stats_db():
    """Verifica si la base de datos existe, si no, la crea (Fallback Protocol)"""
    if not os.path.exists(DB_PATH):
        print("[FALLBACK] Stats DB no encontrada. Recreando...")
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()

        cur.execute("""
            CREATE TABLE IF NOT EXISTS system_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cpu_percent REAL,
                memory_percent REAL,
                disk_free_gb REAL,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS alert_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                level TEXT DEFAULT 'info',
                message TEXT,
                service TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()
        conn.close()
        print("[FALLBACK] Stats DB inicializada con éxito.")
    else:
        # MIGRACIÓN: Verificar tabla alert_log
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS system_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cpu_percent REAL,
                memory_percent REAL,
                disk_free_gb REAL,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS alert_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                level TEXT DEFAULT 'info',
                message TEXT,
                service TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()
        conn.close()

# Ejecutar protocolo al cargar el módulo
init_stats_db()

# ============================================
# CONEXIÓN CON FALLBACK MySQL → SQLite
# ============================================
MYSQL_URL = (
    f"mysql+pymysql://{os.getenv('MYSQL_USER','root')}:{os.getenv('MYSQL_PASSWORD','')}"
    f"@{os.getenv('MYSQL_HOST','localhost')}:3306/{os.getenv('MYSQL_DATABASE','laika_club')}"
)

try:
    engine = create_engine(MYSQL_URL, pool_pre_ping=True, connect_args={'connect_timeout': 2})
    engine.connect()
    print("[STATS SERVICE] Conexión MySQL establecida.")
except Exception:
    print("[STATS SERVICE] MySQL no disponible. Usando SQLite de respaldo...")
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
