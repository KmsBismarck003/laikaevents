from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict, Any
import asyncio
import json
import psutil
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Configuración MySQL
MYSQL_URL = f"mysql+pymysql://{os.getenv('MYSQL_USER', 'root')}:{os.getenv('MYSQL_PASSWORD', '')}@{os.getenv('MYSQL_HOST', 'localhost')}:3306/{os.getenv('MYSQL_DATABASE', 'laika_club')}"
mysql_engine = create_engine(MYSQL_URL)

# ============================================
# CONEXIONES WEBSOCKET ACTIVAS
# ============================================
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

# ============================================
# FUNCIONES DE MONITOREO
# ============================================

def get_database_status() -> Dict[str, Any]:
    """Obtiene el estado general de la base de datos"""
    try:
        with mysql_engine.connect() as conn:
            # Variables de estado de MySQL
            status_query = text("""
                SHOW STATUS WHERE Variable_name IN (
                    'Threads_connected',
                    'Threads_running',
                    'Questions',
                    'Slow_queries',
                    'Uptime',
                    'Aborted_connects',
                    'Connections'
                )
            """)
            status_result = conn.execute(status_query).fetchall()

            # Variables globales
            variables_query = text("""
                SHOW VARIABLES WHERE Variable_name IN (
                    'max_connections',
                    'thread_cache_size',
                    'table_open_cache'
                )
            """)
            variables_result = conn.execute(variables_query).fetchall()

            # Procesar resultados
            status_dict = {row[0]: row[1] for row in status_result}
            variables_dict = {row[0]: row[1] for row in variables_result}

            # Calcular métricas
            threads_connected = int(status_dict.get('Threads_connected', 0))
            max_connections = int(variables_dict.get('max_connections', 151))
            connection_usage = (threads_connected / max_connections) * 100

            return {
                "status": "healthy",
                "connections": {
                    "active": threads_connected,
                    "running": int(status_dict.get('Threads_running', 0)),
                    "max": max_connections,
                    "usage_percent": round(connection_usage, 2),
                    "total_connections": int(status_dict.get('Connections', 0)),
                    "aborted": int(status_dict.get('Aborted_connects', 0))
                },
                "queries": {
                    "total": int(status_dict.get('Questions', 0)),
                    "slow": int(status_dict.get('Slow_queries', 0))
                },
                "uptime": int(status_dict.get('Uptime', 0)),
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

def get_table_stats() -> List[Dict[str, Any]]:
    """Obtiene estadísticas de todas las tablas"""
    try:
        with mysql_engine.connect() as conn:
            query = text("""
                SELECT
                    TABLE_NAME,
                    TABLE_ROWS,
                    DATA_LENGTH,
                    INDEX_LENGTH,
                    DATA_FREE,
                    AUTO_INCREMENT,
                    CREATE_TIME,
                    UPDATE_TIME,
                    CHECK_TIME,
                    TABLE_COLLATION
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = :db_name
                ORDER BY DATA_LENGTH DESC
            """)

            db_name = os.getenv('MYSQL_DATABASE', 'laika_club')
            result = conn.execute(query, {"db_name": db_name}).fetchall()

            tables = []
            for row in result:
                data_size_mb = (row[2] or 0) / (1024 * 1024)
                index_size_mb = (row[3] or 0) / (1024 * 1024)
                free_size_mb = (row[4] or 0) / (1024 * 1024)

                tables.append({
                    "name": row[0],
                    "rows": row[1] or 0,
                    "data_size_mb": round(data_size_mb, 2),
                    "index_size_mb": round(index_size_mb, 2),
                    "free_size_mb": round(free_size_mb, 2),
                    "total_size_mb": round(data_size_mb + index_size_mb, 2),
                    "auto_increment": row[5],
                    "created_at": row[6].isoformat() if row[6] else None,
                    "updated_at": row[7].isoformat() if row[7] else None,
                    "checked_at": row[8].isoformat() if row[8] else None,
                    "collation": row[9]
                })

            return tables
    except Exception as e:
        print(f"❌ Error obteniendo estadísticas de tablas: {e}")
        return []

def get_performance_metrics() -> Dict[str, Any]:
    """Obtiene métricas de rendimiento"""
    try:
        with mysql_engine.connect() as conn:
            # InnoDB Buffer Pool
            innodb_query = text("""
                SHOW STATUS WHERE Variable_name LIKE 'Innodb_buffer_pool%'
            """)
            innodb_result = conn.execute(innodb_query).fetchall()
            innodb_dict = {row[0]: row[1] for row in innodb_result}

            # Query Cache (si está disponible)
            cache_query = text("""
                SHOW STATUS WHERE Variable_name LIKE 'Qcache%'
            """)
            cache_result = conn.execute(cache_query).fetchall()
            cache_dict = {row[0]: row[1] for row in cache_result}

            # Calcular hit ratio del buffer pool
            reads = int(innodb_dict.get('Innodb_buffer_pool_reads', 0))
            read_requests = int(innodb_dict.get('Innodb_buffer_pool_read_requests', 0))

            if read_requests > 0:
                buffer_pool_hit_ratio = ((read_requests - reads) / read_requests) * 100
            else:
                buffer_pool_hit_ratio = 100

            return {
                "buffer_pool": {
                    "size_bytes": int(innodb_dict.get('Innodb_buffer_pool_bytes_data', 0)),
                    "size_mb": round(int(innodb_dict.get('Innodb_buffer_pool_bytes_data', 0)) / (1024 * 1024), 2),
                    "hit_ratio": round(buffer_pool_hit_ratio, 2),
                    "reads": reads,
                    "read_requests": read_requests
                },
                "query_cache": {
                    "hits": int(cache_dict.get('Qcache_hits', 0)),
                    "inserts": int(cache_dict.get('Qcache_inserts', 0)),
                    "not_cached": int(cache_dict.get('Qcache_not_cached', 0))
                },
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

def check_database_integrity() -> Dict[str, Any]:
    """Verifica la integridad de las tablas"""
    try:
        with mysql_engine.connect() as conn:
            db_name = os.getenv('MYSQL_DATABASE', 'laika_club')

            # Obtener lista de tablas
            tables_query = text("""
                SELECT TABLE_NAME
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = :db_name
            """)
            tables = conn.execute(tables_query, {"db_name": db_name}).fetchall()

            issues = []
            checked_tables = []

            for table in tables:
                table_name = table[0]

                # CHECK TABLE
                try:
                    check_query = text(f"CHECK TABLE `{table_name}`")
                    check_result = conn.execute(check_query).fetchall()

                    for row in check_result:
                        status = row[3]  # Msg_text
                        checked_tables.append({
                            "table": table_name,
                            "status": status,
                            "is_ok": status.lower() == "ok"
                        })

                        if status.lower() != "ok":
                            issues.append({
                                "table": table_name,
                                "issue": status,
                                "severity": "high"
                            })
                except Exception as e:
                    issues.append({
                        "table": table_name,
                        "issue": f"Error al verificar: {str(e)}",
                        "severity": "critical"
                    })

            return {
                "total_tables": len(tables),
                "checked": len(checked_tables),
                "issues_found": len(issues),
                "issues": issues,
                "all_tables": checked_tables,
                "is_healthy": len(issues) == 0,
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        return {
            "error": str(e),
            "is_healthy": False,
            "timestamp": datetime.now().isoformat()
        }

def get_active_sessions() -> Dict[str, Any]:
    """Obtiene información sobre sesiones activas"""
    try:
        with mysql_engine.connect() as conn:
            # Procesos activos
            query = text("""
                SELECT
                    ID,
                    USER,
                    HOST,
                    DB,
                    COMMAND,
                    TIME,
                    STATE,
                    INFO
                FROM information_schema.PROCESSLIST
                WHERE COMMAND != 'Sleep'
                ORDER BY TIME DESC
            """)

            result = conn.execute(query).fetchall()

            sessions = []
            for row in result:
                sessions.append({
                    "id": row[0],
                    "user": row[1],
                    "host": row[2],
                    "database": row[3],
                    "command": row[4],
                    "time": row[5],
                    "state": row[6],
                    "query": row[7][:100] if row[7] else None  # Primeros 100 caracteres
                })

            return {
                "active_sessions": len(sessions),
                "sessions": sessions,
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

def get_system_resources() -> Dict[str, Any]:
    """Obtiene métricas del sistema operativo"""
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        return {
            "cpu": {
                "percent": round(cpu_percent, 2),
                "cores": psutil.cpu_count()
            },
            "memory": {
                "total_mb": round(memory.total / (1024 * 1024), 2),
                "used_mb": round(memory.used / (1024 * 1024), 2),
                "available_mb": round(memory.available / (1024 * 1024), 2),
                "percent": round(memory.percent, 2)
            },
            "disk": {
                "total_gb": round(disk.total / (1024 * 1024 * 1024), 2),
                "used_gb": round(disk.used / (1024 * 1024 * 1024), 2),
                "free_gb": round(disk.free / (1024 * 1024 * 1024), 2),
                "percent": round(disk.percent, 2)
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# ============================================
# ENDPOINTS REST
# ============================================

@router.get("/status")
async def get_monitoring_status():
    """Obtiene el estado completo del sistema"""
    return {
        "database": get_database_status(),
        "performance": get_performance_metrics(),
        "integrity": check_database_integrity(),
        "sessions": get_active_sessions(),
        "system": get_system_resources(),
        "tables": get_table_stats()
    }

@router.get("/database/status")
async def get_db_status():
    """Estado de la base de datos"""
    return get_database_status()

@router.get("/database/tables")
async def get_tables():
    """Estadísticas de tablas"""
    return {"tables": get_table_stats()}

@router.get("/database/integrity")
async def check_integrity():
    """Verificar integridad"""
    return check_database_integrity()

@router.get("/database/sessions")
async def get_sessions():
    """Sesiones activas"""
    return get_active_sessions()

@router.get("/system/resources")
async def get_resources():
    """Recursos del sistema"""
    return get_system_resources()

# ============================================
# WEBSOCKET PARA ACTUALIZACIONES EN TIEMPO REAL
# ============================================

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket para monitoreo en tiempo real"""
    await manager.connect(websocket)

    try:
        while True:
            # Enviar datos cada 2 segundos
            data = {
                "type": "monitoring_update",
                "data": {
                    "database": get_database_status(),
                    "performance": get_performance_metrics(),
                    "sessions": get_active_sessions(),
                    "system": get_system_resources()
                },
                "timestamp": datetime.now().isoformat()
            }

            await websocket.send_json(data)
            await asyncio.sleep(2)  # Actualizar cada 2 segundos

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("Cliente desconectado del monitoreo")
    except Exception as e:
        print(f"❌ Error en WebSocket: {e}")
        manager.disconnect(websocket)
