"""
Manager Router - Endpoints exclusivos para gestores de eventos.

AISLADO: No modifica events.py ni tickets.py.
SEGURO: Cada endpoint valida ownership via JWT + created_by.
ATOMICO: Operaciones criticas usan transacciones con rollback.

Montado en: /api/manager
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from datetime import date, time
import traceback
import shutil
import os
import uuid
from dependencies import get_current_user


router = APIRouter()


# ... imports ...

# ... existing code ...

@router.post("/events/upload-image")
def upload_event_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Subir imagen para un evento."""
    require_manager_role(current_user)

    try:
        # Validar extension
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ('.jpg', '.jpeg', '.png', '.webp'):
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se permiten imagenes JPG, PNG o WEBP"
            )

        # Generar nombre unico
        filename = f"{uuid.uuid4()}{ext}"
        upload_dir = "static/uploads/events"
        os.makedirs(upload_dir, exist_ok=True)

        file_path = f"{upload_dir}/{filename}"

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Retornar URL relativa (ajustar si se usa dominio completo en frontend, aqui devolvemos path absoluto desde root)
        # Frontend asume que puede hacer GET /static/...
        return {"url": f"http://localhost:8000/static/uploads/events/{filename}"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"[Manager] Error subiendo imagen: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar la imagen"
        )

# Services
from services.event_service import (
    get_event_with_ownership,
    check_ownership_or_admin,
    cancel_event,
    get_ticket_analytics,
    _log_manager_action
)
from services.revenue_service import calculate_event_revenue





# ============================================
# DB DEPENDENCY
# ============================================

def get_db():
    from main import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================
# MODELS
# ============================================

class EventCreateModel(BaseModel):
    name: str
    description: Optional[str] = None
    event_date: date
    event_time: time
    location: str
    venue: Optional[str] = None
    category: str
    price: float
    total_tickets: int
    image_url: Optional[str] = None

class EventUpdateModel(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[date] = None
    event_time: Optional[time] = None
    location: Optional[str] = None
    venue: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    total_tickets: Optional[int] = None
    image_url: Optional[str] = None

class CancelEventModel(BaseModel):
    reason: str


# ============================================
# ROLE CHECK HELPER
# ============================================

def require_manager_role(user: dict):
    """Verifica que el usuario sea gestor o admin."""
    role = user.get('role', '')
    if role not in ('gestor', 'admin'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de gestor o admin"
        )


# ============================================
# ENDPOINTS
# ============================================

@router.get("/events")
def list_my_events(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Listar eventos del gestor autenticado."""
    require_manager_role(current_user)

    try:
        user_id = current_user['id']

        result = db.execute(
            text("""
                SELECT e.*,
                    COALESCE((SELECT COUNT(*) FROM tickets t WHERE t.event_id = e.id AND t.status IN ('active','used')), 0) as tickets_sold
                FROM events e
                WHERE e.created_by = :user_id
                ORDER BY e.created_at DESC
            """),
            {"user_id": user_id}
        )
        events = [dict(row._mapping) for row in result.fetchall()]

        return events

    except Exception as e:
        print(f"[Manager] Error listando eventos: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener eventos"
        )


@router.get("/events/{event_id}")
def get_event_detail(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtener detalle de un evento con ownership check."""
    require_manager_role(current_user)

    event = check_ownership_or_admin(event_id, current_user, db)

    # Agregar datos extras
    revenue = calculate_event_revenue(event_id, db)
    tickets = get_ticket_analytics(event_id, db)

    return {
        **event,
        "revenue_summary": revenue,
        "ticket_summary": tickets
    }


@router.get("/events/{event_id}/tickets")
def get_event_tickets(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtener analytics de tickets de un evento."""
    require_manager_role(current_user)
    check_ownership_or_admin(event_id, current_user, db)

    return get_ticket_analytics(event_id, db)


@router.get("/events/{event_id}/revenue")
def get_event_revenue(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtener revenue de un evento."""
    require_manager_role(current_user)
    check_ownership_or_admin(event_id, current_user, db)

    return calculate_event_revenue(event_id, db)


@router.post("/events")
def create_event(
    event: EventCreateModel,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Crear evento nuevo (status: draft)."""
    require_manager_role(current_user)

    try:
        user_id = current_user['id']

        result = db.execute(
            text("""
                INSERT INTO events (
                    name, description, category, event_date, event_time,
                    location, venue, price, total_tickets, available_tickets,
                    image_url, status, created_by, created_at
                ) VALUES (
                    :name, :description, :category, :event_date, :event_time,
                    :location, :venue, :price, :total_tickets, :available_tickets,
                    :image_url, 'draft', :created_by, NOW()
                )
            """),
            {
                "name": event.name,
                "description": event.description,
                "category": event.category,
                "event_date": event.event_date,
                "event_time": event.event_time,
                "location": event.location,
                "venue": event.venue or event.location,
                "price": event.price,
                "total_tickets": event.total_tickets,
                "available_tickets": event.total_tickets,
                "image_url": event.image_url,
                "created_by": user_id
            }
        )

        db.commit()
        event_id = result.lastrowid

        # Log
        _log_manager_action(db, user_id, event_id, 'create_event')
        db.commit()

        # Fetch created event
        created = db.execute(
            text("SELECT * FROM events WHERE id = :id"),
            {"id": event_id}
        ).fetchone()

        return dict(created._mapping)

    except Exception as e:
        db.rollback()
        print(f"[Manager] Error creando evento: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear evento: {str(e)}"
        )


@router.put("/events/{event_id}")
def update_event(
    event_id: int,
    event_update: EventUpdateModel,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Actualizar configuracion de un evento."""
    require_manager_role(current_user)
    existing = check_ownership_or_admin(event_id, current_user, db)

    try:
        # Build dynamic update
        update_fields = []
        params = {"event_id": event_id}

        for field, value in event_update.dict(exclude_unset=True).items():
            if value is not None:
                update_fields.append(f"{field} = :{field}")
                params[field] = value

        if not update_fields:
            return existing

        query = f"""
            UPDATE events
            SET {', '.join(update_fields)}, updated_at = NOW()
            WHERE id = :event_id
        """

        db.execute(text(query), params)
        db.commit()

        # Log
        _log_manager_action(db, current_user['id'], event_id, 'update_event')
        db.commit()

        # Fetch updated
        updated = db.execute(
            text("SELECT * FROM events WHERE id = :id"),
            {"id": event_id}
        ).fetchone()

        return dict(updated._mapping)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[Manager] Error actualizando evento {event_id}: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar evento"
        )


@router.patch("/events/{event_id}/publish")
def publish_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Publicar un evento."""
    require_manager_role(current_user)
    event = check_ownership_or_admin(event_id, current_user, db)

    if event.get('status') not in ('draft',):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Solo se pueden publicar eventos en borrador. Estado actual: {event.get('status')}"
        )

    try:
        db.execute(
            text("UPDATE events SET status = 'published', updated_at = NOW() WHERE id = :id"),
            {"id": event_id}
        )

        _log_manager_action(db, current_user['id'], event_id, 'publish')
        db.commit()

        return {"success": True, "message": "Evento publicado exitosamente"}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al publicar evento"
        )


@router.patch("/events/{event_id}/unpublish")
def unpublish_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Despublicar un evento (volver a borrador)."""
    require_manager_role(current_user)
    event = check_ownership_or_admin(event_id, current_user, db)

    if event.get('status') != 'published':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden despublicar eventos publicados"
        )

    try:
        db.execute(
            text("UPDATE events SET status = 'draft', updated_at = NOW() WHERE id = :id"),
            {"id": event_id}
        )

        _log_manager_action(db, current_user['id'], event_id, 'unpublish')
        db.commit()

        return {"success": True, "message": "Evento despublicado"}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al despublicar evento"
        )


@router.patch("/events/{event_id}/cancel")
def cancel_event_endpoint(
    event_id: int,
    body: CancelEventModel,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Cancelar un evento de emergencia.
    Atomico: cancela evento + reembolsa tickets + audit log.
    """
    require_manager_role(current_user)

    if not body.reason or len(body.reason.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El motivo de cancelacion debe tener al menos 10 caracteres"
        )

    return cancel_event(event_id, body.reason.strip(), current_user, db)


@router.delete("/events/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Eliminar un evento (solo borradores sin tickets vendidos)."""
    require_manager_role(current_user)
    event = check_ownership_or_admin(event_id, current_user, db)

    if event.get('status') != 'draft':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden eliminar eventos en borrador. Para eventos publicados, usa cancelar."
        )

    # Verificar que no tenga tickets
    ticket_count = db.execute(
        text("SELECT COUNT(*) as count FROM tickets WHERE event_id = :id"),
        {"id": event_id}
    ).fetchone()

    if ticket_count and dict(ticket_count._mapping).get('count', 0) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar un evento que tiene tickets emitidos. Usa cancelar."
        )

    try:
        db.execute(text("DELETE FROM events WHERE id = :id"), {"id": event_id})
        _log_manager_action(db, current_user['id'], event_id, 'delete_event')
        db.commit()

        return {"success": True, "message": "Evento eliminado"}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar evento"
        )
