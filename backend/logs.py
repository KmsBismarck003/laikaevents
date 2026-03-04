import traceback
from datetime import datetime
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# ============================================
# CONFIGURACIÓN AISLADA
# ============================================

# Usamos una conexión dedicada o reutilizamos la URL pero con manejo de errores estricto
MYSQL_URL = f"mysql+pymysql://{os.getenv('MYSQL_USER', 'root')}:{os.getenv('MYSQL_PASSWORD', '')}@{os.getenv('MYSQL_HOST', 'localhost')}:3306/{os.getenv('MYSQL_DATABASE', 'laika_club')}"

# Engine dedicado para logs (opcional, pero recomendado para aislamiento)
try:
    log_engine = create_engine(
        MYSQL_URL,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False
    )
except Exception as e:
    print(f"❌ [LOGS] Error crítico iniciando engine de logs: {e}")
    log_engine = None

# ============================================
# FUNCIONES DE LOGGING (FAIL-SAFE)
# ============================================

def log_audit(action: str, user_id: int = None, details: str = None, status: str = 'success', ip_address: str = None):
    """
    Registra un evento crítico de auditoría.
    FAIL-SAFE: Si falla, solo imprime error en consola y NO rompe el flujo.
    """
    if not log_engine:
        return

    try:
        query = text("""
            INSERT INTO audit_logs (action, user_id, details, status, ip_address, timestamp)
            VALUES (:action, :user_id, :details, :status, :ip_address, :timestamp)
        """)

        with log_engine.connect() as conn:
            conn.execute(query, {
                "action": action,
                "user_id": user_id,
                "details": details,
                "status": status,
                "ip_address": ip_address,
                "timestamp": datetime.now()
            })
            conn.commit()

    except Exception as e:
        # Fallback silencioso (solo consola) para no afectar al usuario
        print(f"⚠️ [LOGS] Fallo al escribir Audit Log: {e}")
        # traceback.print_exc() # Descomentar para debug

def log_request(method: str, path: str, status_code: int, duration_ms: float, user_id: int = None, ip_address: str = None, user_agent: str = None, error_details: str = None):
    """
    Registra una petición HTTP.
    FAIL-SAFE: Absolutamente crítico que esto no falle.
    """
    if not log_engine:
        return

    try:
        # Optimización: No loguear endpoints de health check o estáticos masivos si se desea
        if "/health" in path or "/static" in path:
            return

        query = text("""
            INSERT INTO request_logs
            (method, path, status_code, duration_ms, user_id, ip_address, user_agent, error_details, timestamp)
            VALUES
            (:method, :path, :status_code, :duration_ms, :user_id, :ip_address, :user_agent, :error_details, :timestamp)
        """)

        with log_engine.connect() as conn:
            conn.execute(query, {
                "method": method,
                "path": path,
                "status_code": status_code,
                "duration_ms": duration_ms,
                "user_id": user_id,
                "ip_address": ip_address,
                "user_agent": user_agent[:255] if user_agent else None, # Truncar por si acaso
                "error_details": str(error_details)[:500] if error_details else None,
                "timestamp": datetime.now()
            })
            conn.commit()

    except Exception as e:
        # Silenciar errores de "Tabla no existe" o "Base de datos no existe" durante Winter Contingency
        error_str = str(e)
        if "1146" in error_str or "1049" in error_str:
            return # Fallo silencioso durante restauración

        print(f"⚠️ [LOGS] Fallo al escribir Request Log: {e}")

# ============================================
# ENDPOINTS DE LECTURA (PARA ROUTER)
# ============================================
# Estas funciones se usarán en el router para leer los logs

def get_audit_logs(limit=100, offset=0, user_id=None, action=None):
    if not log_engine: return []
    try:
        query_str = "SELECT * FROM audit_logs WHERE 1=1"
        params = {"limit": limit, "offset": offset}

        if user_id:
            query_str += " AND user_id = :user_id"
            params["user_id"] = user_id

        if action:
            query_str += " AND action LIKE :action"
            params["action"] = f"%{action}%"

        query_str += " ORDER BY timestamp DESC LIMIT :limit OFFSET :offset"

        with log_engine.connect() as conn:
            result = conn.execute(text(query_str), params)
            return [dict(row._mapping) for row in result]
    except Exception as e:
        print(f"❌ Error leyendo audit logs: {e}")
        return []

def get_request_logs(limit=100, offset=0, status_code=None, method=None):
    if not log_engine: return []
    try:
        query_str = "SELECT * FROM request_logs WHERE 1=1"
        params = {"limit": limit, "offset": offset}

        if status_code:
            query_str += " AND status_code = :status_code"
            params["status_code"] = status_code

        if method:
            query_str += " AND method = :method"
            params["method"] = method

        query_str += " ORDER BY timestamp DESC LIMIT :limit OFFSET :offset"

        with log_engine.connect() as conn:
            result = conn.execute(text(query_str), params)
            return [dict(row._mapping) for row in result]
    except Exception as e:
        print(f"❌ Error leyendo request logs: {e}")
        return []
