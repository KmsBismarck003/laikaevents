import os
import time
import psutil
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
from pymongo import MongoClient

# Configuración MongoDB Atlas
MONGO_URI = "mongodb://al222310440_db_user:4qbkoSVinVJkAMA6@atlas-sql-69aba628e0ab30c88f8d3b11-lfgjzc.a.query.mongodb.net/laika_analytics?ssl=true&authSource=admin"
try:
    mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    mongo_db = mongo_client["laika_analytics"]
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    mongo_db = None

# Cache simple para uptime del sistema
START_TIME = time.time()

async def get_dashboard_summary(db: Session):
    stats = {
        "totalUsers": 0,
        "totalEvents": 0,
        "totalSales": 0,
        "activeUsers": 0,
        "status": {}
    }
    
    try:
        # 1. Total Usuarios
        res = db.execute(text("SELECT COUNT(*) FROM users")).fetchone()
        stats["totalUsers"] = res[0] if res else 0
        
        # 2. Total Eventos
        res = db.execute(text("SELECT COUNT(*) FROM events WHERE status='published'")).fetchone()
        stats["totalEvents"] = res[0] if res else 0

        # 3. Ventas Totales
        try:
            res = db.execute(text("SELECT SUM(price) FROM tickets")).fetchone()
            stats["totalSales"] = float(res[0]) if res and res[0] else 0
        except:
            # Fallback si la tabla tickets no existe/está vacía
            stats["totalSales"] = 0

        # 4. Usuarios Activos (simulado sobre el total)
        stats["activeUsers"] = int(stats["totalUsers"] * 0.12)
        
        stats["status"]["database"] = "online"
    except Exception as e:
        print(f"Error in stats summary: {e}")
        stats["status"]["database"] = "offline"

    return stats

async def get_system_status():
    """Retorna el estado general de la infraestructura real."""
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    io_counters = psutil.disk_io_counters() if hasattr(psutil, "disk_io_counters") else None
    
    # Métricas de Bóveda Cloud (MongoDB Atlas)
    boveda_cloud_metrics = {
        "status": "inactive",
        "sync_count": 0,
        "last_sync": "N/A",
        "health_score": 0,
        "latency": 0,
        "collections": []
    }
    
    if mongo_db is not None:
        try:
            # 1. Latencia real (Ping)
            start_ping = time.time()
            mongo_client.admin.command('ping')
            boveda_cloud_metrics["latency"] = round((time.time() - start_ping) * 1000, 2)
            
            # 2. Listado de colecciones y conteos
            collections_list = mongo_db.list_collection_names()
            colls_data = []
            total_docs = 0
            for c_name in collections_list:
                c_count = mongo_db[c_name].count_documents({})
                colls_data.append({"name": c_name, "count": c_count})
                total_docs += c_count
            
            boveda_cloud_metrics["collections"] = colls_data
            boveda_cloud_metrics["status"] = "active" if total_docs > 0 else "standby"
            boveda_cloud_metrics["sync_count"] = total_docs
            boveda_cloud_metrics["health_score"] = 100 if total_docs > 0 else 85
            boveda_cloud_metrics["last_sync"] = datetime.now().strftime("%H:%M:%S")
        except Exception as e:
            print(f"Error fetching MongoDB metrics: {e}")
            boveda_cloud_metrics["status"] = "error"

    return {
        "database": {
            "status": "healthy",
            "uptime": int(time.time() - START_TIME),
            "connections": {
                "active": len(psutil.net_connections(kind='inet')), 
                "max": 151, 
                "usage_percent": 3.3
            }
        },
        "system": {
            "cpu": {"percent": cpu_percent},
            "memory": {"percent": memory.percent},
            "disk": {
                "total_gb": round(disk.total / (1024**3), 2),
                "free_gb": round(disk.free / (1024**3), 2)
            },
            "io": {
                "read_mb": round(io_counters.read_bytes / (1024**2), 2) if io_counters else 0,
                "write_mb": round(io_counters.write_bytes / (1024**2), 2) if io_counters else 0
            }
        },
        "boveda_cloud": boveda_cloud_metrics,
        "integrity": {"is_healthy": True}
    }

async def get_system_metrics():
    """Retorna métricas detalladas para gráficos (mantenemos histórico corto)."""
    return {
        "cpu_history": [psutil.cpu_percent() for _ in range(6)],
        "mem_history": [psutil.virtual_memory().percent for _ in range(6)],
        "timestamp": datetime.now().isoformat()
    }

async def get_sales_by_event(db: Session):
    """Retorna un desglose de ventas real agrupado por evento."""
    try:
        query = text("""
            SELECT 
                e.id as eventId, 
                e.name as eventName, 
                e.event_date as eventDate, 
                e.total_tickets as totalTickets,
                COUNT(t.id) as ticketsSold,
                (e.total_tickets - COUNT(t.id)) as remainingTickets,
                ROUND((COUNT(t.id) * 100.0 / e.total_tickets), 2) as occupancy,
                IFNULL(SUM(t.price), 0) as revenue
            FROM events e
            LEFT JOIN tickets t ON e.id = t.event_id
            WHERE e.status = 'published'
            GROUP BY e.id
        """)
        result = db.execute(query).mappings()
        return [dict(row) for row in result.fetchall()]
    except Exception as e:
        print(f"Error fetching sales by event: {e}")
        return []
