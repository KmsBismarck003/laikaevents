from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
import traceback

router = APIRouter()

# Dependencia para obtener la sesión de BD
def get_db():
    from main import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================================
# FUNCIÓN AUXILIAR PARA QUERIES SEGURAS
# ============================================

def safe_query(db: Session, query: str, params: dict = None, default=0):
    """Ejecuta un query de forma segura, retornando valor por defecto si falla"""
    try:
        result = db.execute(text(query), params or {}).fetchone()
        if result:
            # Puede venir como tupla o como objeto con atributos
            if hasattr(result, '_mapping'):
                return result._mapping.get('count', result._mapping.get('total', default))
            elif hasattr(result, 'count'):
                return result.count
            elif hasattr(result, 'total'):
                return result.total
            elif isinstance(result, tuple) and len(result) > 0:
                return result[0]
        return default
    except Exception as e:
        print(f"⚠️ Query fallido (usando default {default}): {e}")
        return default

def table_exists(db: Session, table_name: str) -> bool:
    """Verifica si una tabla existe"""
    try:
        query = text("""
            SELECT COUNT(*) as count
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
            AND table_name = :table_name
        """)
        result = db.execute(query, {"table_name": table_name}).fetchone()
        return result.count > 0 if result else False
    except:
        return False

# ============================================
# ENDPOINTS
# ============================================

@router.get("/admin/dashboard")
def get_admin_dashboard(db: Session = Depends(get_db)):
    """Obtener estadísticas para el dashboard del admin"""
    try:
        print("📤 Obteniendo estadísticas del dashboard admin")

        # Verificar qué tablas existen
        tables_status = {
            "users": table_exists(db, "users"),
            "events": table_exists(db, "events"),
            "tickets": table_exists(db, "tickets"),
            "transactions": table_exists(db, "transactions")
        }

        print(f"📊 Estado de tablas: {tables_status}")

        # Total de usuarios
        total_users = 0
        if tables_status["users"]:
            total_users = safe_query(
                db,
                "SELECT COUNT(*) as count FROM users",
                default=0
            )

        # Total de eventos
        total_events = 0
        if tables_status["events"]:
            total_events = safe_query(
                db,
                "SELECT COUNT(*) as count FROM events WHERE status IN ('published', 'active')",
                default=0
            )

        # Total de ventas (suma de montos o cantidad de tickets)
        total_sales = 0
        if tables_status["transactions"]:
            total_sales = safe_query(
                db,
                "SELECT COALESCE(SUM(total_amount), 0) as total FROM transactions WHERE status = 'completed'",
                default=0
            )
        elif tables_status["tickets"]:
            # Si no hay tabla de transacciones, contar tickets
            total_sales = safe_query(
                db,
                "SELECT COUNT(*) as count FROM tickets WHERE status IN ('active', 'used')",
                default=0
            )

        # Usuarios activos
        active_users = 0
        if tables_status["users"]:
            active_users = safe_query(
                db,
                "SELECT COUNT(*) as count FROM users WHERE status = 'active'",
                default=0
            )

        result = {
            "total_users": int(total_users),
            "totalUsers": int(total_users),
            "total_events": int(total_events),
            "totalEvents": int(total_events),
            "total_sales": float(total_sales),
            "totalSales": float(total_sales),
            "active_users": int(active_users),
            "activeUsers": int(active_users),
            "timestamp": datetime.now().isoformat(),
            "_debug": {
                "tables_available": tables_status
            }
        }

        print(f"✅ Estadísticas obtenidas: {result}")
        return result

    except Exception as e:
        print(f"❌ Error crítico al obtener estadísticas: {e}")
        traceback.print_exc()

        # Devolver valores por defecto en caso de error
        return {
            "total_users": 0,
            "totalUsers": 0,
            "total_events": 0,
            "totalEvents": 0,
            "total_sales": 0,
            "totalSales": 0,
            "active_users": 0,
            "activeUsers": 0,
            "timestamp": datetime.now().isoformat(),
            "_error": str(e)
        }

@router.get("/manager/dashboard")
def get_manager_dashboard(db: Session = Depends(get_db)):
    """Obtener estadísticas para el dashboard del gestor"""
    try:
        print("📤 Obteniendo estadísticas del gestor")

        my_events = safe_query(
            db,
            "SELECT COUNT(*) as count FROM events",
            default=0
        )

        my_sales = safe_query(
            db,
            "SELECT COALESCE(SUM(total_amount), 0) as total FROM transactions WHERE status = 'completed'",
            default=0
        )

        tickets_sold = safe_query(
            db,
            "SELECT COUNT(*) as count FROM tickets WHERE status IN ('active', 'used')",
            default=0
        )

        return {
            "myEvents": int(my_events),
            "totalSales": float(my_sales),
            "ticketsSold": int(tickets_sold),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        print(f"❌ Error al obtener estadísticas del gestor: {e}")
        return {
            "myEvents": 0,
            "totalSales": 0,
            "ticketsSold": 0,
            "timestamp": datetime.now().isoformat()
        }

@router.get("/staff/dashboard")
def get_staff_dashboard(db: Session = Depends(get_db)):
    """Obtener estadísticas para el dashboard del operador"""
    try:
        print("📤 Obteniendo estadísticas del operador")

        tickets_today = safe_query(
            db,
            "SELECT COUNT(*) as count FROM tickets WHERE DATE(created_at) = CURDATE()",
            default=0
        )

        active_tickets = safe_query(
            db,
            "SELECT COUNT(*) as count FROM tickets WHERE status = 'active'",
            default=0
        )

        return {
            "ticketsToday": int(tickets_today),
            "activeTickets": int(active_tickets),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        print(f"❌ Error al obtener estadísticas del operador: {e}")
        return {
            "ticketsToday": 0,
            "activeTickets": 0,
            "timestamp": datetime.now().isoformat()
        }

@router.get("/events/{event_id}")
def get_event_stats(event_id: int, db: Session = Depends(get_db)):
    """Obtener estadísticas de un evento específico"""
    try:
        print(f"📤 Obteniendo estadísticas del evento {event_id}")

        tickets_sold = safe_query(
            db,
            "SELECT COUNT(*) as count FROM tickets WHERE event_id = :event_id",
            {"event_id": event_id},
            default=0
        )

        revenue = safe_query(
            db,
            """SELECT COALESCE(SUM(total_amount), 0) as total
               FROM transactions
               WHERE event_id = :event_id AND status = 'completed'""",
            {"event_id": event_id},
            default=0
        )

        return {
            "eventId": event_id,
            "ticketsSold": int(tickets_sold),
            "revenue": float(revenue),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        print(f"❌ Error al obtener estadísticas del evento: {e}")
        return {
            "eventId": event_id,
            "ticketsSold": 0,
            "revenue": 0,
            "timestamp": datetime.now().isoformat()
        }

@router.get("/sales/report")
def get_sales_report(
    start_date: str = None,
    end_date: str = None,
    event_id: int = None,
    db: Session = Depends(get_db)
):
    """Generar reporte de ventas"""
    try:
        print(f"📤 Generando reporte de ventas")

        query = "SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM transactions WHERE status = 'completed'"
        params = {}

        if start_date:
            query += " AND created_at >= :start_date"
            params["start_date"] = start_date

        if end_date:
            query += " AND created_at <= :end_date"
            params["end_date"] = end_date

        if event_id:
            query += " AND event_id = :event_id"
            params["event_id"] = event_id

        result = db.execute(text(query), params).fetchone()

        transactions_count = 0
        total_revenue = 0

        if result:
            if hasattr(result, '_mapping'):
                transactions_count = result._mapping.get('count', 0)
                total_revenue = result._mapping.get('total', 0)
            elif isinstance(result, tuple):
                transactions_count = result[0] if len(result) > 0 else 0
                total_revenue = result[1] if len(result) > 1 else 0

        return {
            "transactions": int(transactions_count),
            "totalRevenue": float(total_revenue),
            "startDate": start_date,
            "endDate": end_date,
            "eventId": event_id,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        print(f"❌ Error al generar reporte de ventas: {e}")
        traceback.print_exc()
        return {
            "transactions": 0,
            "totalRevenue": 0,
            "startDate": start_date,
            "endDate": end_date,
            "eventId": event_id,
            "timestamp": datetime.now().isoformat()
        }
