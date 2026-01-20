from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
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
# ENDPOINTS
# ============================================

@router.get("/admin/dashboard")
def get_admin_dashboard(db: Session = Depends(get_db)):
    """Obtener estadísticas para el dashboard del admin"""
    try:
        print("📤 Obteniendo estadísticas del dashboard admin")
        
        # Total de usuarios
        total_users_query = text("SELECT COUNT(*) as count FROM users")
        total_users = db.execute(total_users_query).fetchone().count
        
        # Total de eventos
        total_events_query = text("SELECT COUNT(*) as count FROM events WHERE status = 'published'")
        total_events = db.execute(total_events_query).fetchone().count
        
        # Total de ventas (tickets vendidos)
        total_sales_query = text("SELECT COUNT(*) as count FROM tickets WHERE status IN ('active', 'used')")
        total_sales = db.execute(total_sales_query).fetchone().count
        
        # Usuarios activos (usuarios con al menos 1 ticket)
        active_users_query = text("""
            SELECT COUNT(DISTINCT user_id) as count 
            FROM tickets 
            WHERE status IN ('active', 'used')
        """)
        active_users = db.execute(active_users_query).fetchone().count
        
        print(f"✅ Estadísticas obtenidas")
        
        return {
            "total_users": total_users,
            "total_events": total_events,
            "total_sales": total_sales,
            "active_users": active_users
        }
        
    except Exception as e:
        print(f"❌ Error al obtener estadísticas: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener estadísticas"
        )
