from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, time
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
# MODELOS
# ============================================

class EventCreate(BaseModel):
    name: str
    description: Optional[str] = None
    event_date: date
    event_time: time
    location: str
    venue: Optional[str] = None
    category: str
    price: float
    total_tickets: int
    available_tickets: int
    image_url: Optional[str] = None
    status: str = 'draft'

class EventUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[date] = None
    event_time: Optional[time] = None
    location: Optional[str] = None
    venue: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    total_tickets: Optional[int] = None
    available_tickets: Optional[int] = None
    image_url: Optional[str] = None
    status: Optional[str] = None

# ============================================
# ENDPOINTS PÚBLICOS
# ============================================

@router.get("/public")
def get_public_events(
    category: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Obtener eventos públicos (publicados)"""
    try:
        print(f"📤 Obteniendo eventos públicos (category: {category}, limit: {limit})")
        
        query = """
            SELECT * FROM events 
            WHERE status = 'published'
        """
        
        params = {}
        
        if category:
            query += " AND category = :category"
            params['category'] = category
        
        query += " ORDER BY event_date ASC LIMIT :limit"
        params['limit'] = limit
        
        result = db.execute(text(query), params)
        events = result.fetchall()
        
        print(f"✅ {len(events)} eventos encontrados")
        
        return [dict(row._mapping) for row in events]
        
    except Exception as e:
        print(f"❌ Error al obtener eventos públicos: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener eventos"
        )

@router.get("/{event_id}")
def get_event_by_id(event_id: int, db: Session = Depends(get_db)):
    """Obtener un evento por ID"""
    try:
        print(f"📤 Obteniendo evento ID: {event_id}")
        
        query = text("SELECT * FROM events WHERE id = :event_id")
        result = db.execute(query, {"event_id": event_id})
        event = result.fetchone()
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Evento no encontrado"
            )
        
        print(f"✅ Evento encontrado: {event.name}")
        return dict(event._mapping)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al obtener evento: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener evento"
        )

# ============================================
# ENDPOINTS PROTEGIDOS (Gestor)
# ============================================

@router.post("/")
def create_event(event: EventCreate, db: Session = Depends(get_db)):
    """Crear un nuevo evento (Gestor)"""
    try:
        print(f"📤 Creando evento: {event.name}")
        
        # TODO: Obtener user_id del token JWT
        created_by = 1  # Por ahora hardcodeado
        
        query = text("""
            INSERT INTO events (
                name, description, category, event_date, event_time,
                location, venue, price, total_tickets, available_tickets,
                image_url, status, created_by, created_at
            ) VALUES (
                :name, :description, :category, :event_date, :event_time,
                :location, :venue, :price, :total_tickets, :available_tickets,
                :image_url, :status, :created_by, NOW()
            )
        """)
        
        result = db.execute(query, {
            "name": event.name,
            "description": event.description,
            "category": event.category,
            "event_date": event.event_date,
            "event_time": event.event_time,
            "location": event.location,
            "venue": event.venue or event.location,
            "price": event.price,
            "total_tickets": event.total_tickets,
            "available_tickets": event.available_tickets,
            "image_url": event.image_url,
            "status": event.status,
            "created_by": created_by
        })
        
        db.commit()
        
        # Obtener el evento creado
        event_id = result.lastrowid
        created_event = db.execute(
            text("SELECT * FROM events WHERE id = :id"),
            {"id": event_id}
        ).fetchone()
        
        print(f"✅ Evento creado con ID: {event_id}")
        return dict(created_event._mapping)
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error al crear evento: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear evento: {str(e)}"
        )

@router.get("/my-events")
def get_my_events(db: Session = Depends(get_db)):
    """Obtener eventos creados por el usuario (Gestor)"""
    try:
        # TODO: Obtener user_id del token JWT
        user_id = 1  # Por ahora hardcodeado
        
        print(f"📤 Obteniendo eventos del usuario {user_id}")
        
        query = text("""
            SELECT * FROM events 
            WHERE created_by = :user_id 
            ORDER BY created_at DESC
        """)
        
        result = db.execute(query, {"user_id": user_id})
        events = result.fetchall()
        
        print(f"✅ {len(events)} eventos encontrados")
        return [dict(row._mapping) for row in events]
        
    except Exception as e:
        print(f"❌ Error al obtener mis eventos: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener eventos"
        )

@router.put("/{event_id}")
def update_event(
    event_id: int, 
    event_update: EventUpdate, 
    db: Session = Depends(get_db)
):
    """Actualizar un evento (Gestor)"""
    try:
        print(f"📤 Actualizando evento ID: {event_id}")
        
        # Verificar que existe
        existing = db.execute(
            text("SELECT * FROM events WHERE id = :id"),
            {"id": event_id}
        ).fetchone()
        
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Evento no encontrado"
            )
        
        # Construir query dinámicamente solo con campos proporcionados
        update_fields = []
        params = {"event_id": event_id}
        
        for field, value in event_update.dict(exclude_unset=True).items():
            if value is not None:
                update_fields.append(f"{field} = :{field}")
                params[field] = value
        
        if not update_fields:
            return dict(existing._mapping)
        
        query = f"""
            UPDATE events 
            SET {', '.join(update_fields)}, updated_at = NOW()
            WHERE id = :event_id
        """
        
        db.execute(text(query), params)
        db.commit()
        
        # Obtener evento actualizado
        updated_event = db.execute(
            text("SELECT * FROM events WHERE id = :id"),
            {"id": event_id}
        ).fetchone()
        
        print(f"✅ Evento actualizado")
        return dict(updated_event._mapping)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error al actualizar evento: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar evento"
        )

@router.delete("/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    """Eliminar un evento (Gestor/Admin)"""
    try:
        print(f"📤 Eliminando evento ID: {event_id}")
        
        # Verificar que existe
        existing = db.execute(
            text("SELECT * FROM events WHERE id = :id"),
            {"id": event_id}
        ).fetchone()
        
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Evento no encontrado"
            )
        
        db.execute(text("DELETE FROM events WHERE id = :id"), {"id": event_id})
        db.commit()
        
        print(f"✅ Evento eliminado")
        return {"success": True, "message": "Evento eliminado"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error al eliminar evento: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar evento"
        )

@router.patch("/{event_id}/publish")
def publish_event(event_id: int, db: Session = Depends(get_db)):
    """Publicar un evento (Gestor)"""
    try:
        print(f"📤 Publicando evento ID: {event_id}")
        
        query = text("UPDATE events SET status = 'published' WHERE id = :id")
        result = db.execute(query, {"id": event_id})
        db.commit()
        
        if result.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Evento no encontrado"
            )
        
        print(f"✅ Evento publicado")
        return {"success": True, "message": "Evento publicado"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error al publicar evento: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al publicar evento"
        )

@router.patch("/{event_id}/unpublish")
def unpublish_event(event_id: int, db: Session = Depends(get_db)):
    """Despublicar un evento (Gestor)"""
    try:
        print(f"📤 Despublicando evento ID: {event_id}")
        
        query = text("UPDATE events SET status = 'draft' WHERE id = :id")
        result = db.execute(query, {"id": event_id})
        db.commit()
        
        if result.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Evento no encontrado"
            )
        
        print(f"✅ Evento despublicado")
        return {"success": True, "message": "Evento despublicado"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error al despublicar evento: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al despublicar evento"
        )
