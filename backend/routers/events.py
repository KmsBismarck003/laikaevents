from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
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

class FunctionCreate(BaseModel):
    date: date
    time: time
    venue_id: int

class EventCreate(BaseModel):
    name: str
    description: Optional[str] = None
    event_date: date
    event_time: time
    location: str
    venue: Optional[str] = None
    venue_id: Optional[int] = None # Optional default venue
    category: str
    price: float
    total_tickets: int
    available_tickets: int
    image_url: Optional[str] = None
    status: str = 'draft'
    functions: Optional[List[FunctionCreate]] = None # List of specific functions

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
    venue_id: Optional[int] = None
    functions: Optional[List[FunctionCreate]] = None

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
        events_rows = result.fetchall()

        events = [dict(row._mapping) for row in events_rows]

        # Populate detailed info if feasible, or just let the details endpoint handle it.
        # For listing, the basic fields are acceptable.

        print(f"✅ {len(events)} eventos encontrados")

        return events

    except Exception as e:
        print(f"❌ Error al obtener eventos públicos: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener eventos"
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

@router.get("/all")
def get_all_events(
    limit: int = 100,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Obtener TODOS los eventos (Admin)"""
    try:
        print(f"📤 Obteniendo TODOS los eventos (limit: {limit})")

        query = "SELECT * FROM events WHERE 1=1"
        params = {"limit": limit}

        if status_filter and status_filter != 'ALL':
            query += " AND status = :status"
            params['status'] = status_filter

        query += " ORDER BY created_at DESC LIMIT :limit"

        result = db.execute(text(query), params)
        events = result.fetchall()

        print(f"✅ {len(events)} eventos encontrados")

        return [dict(row._mapping) for row in events]

    except Exception as e:
        print(f"❌ Error al obtener todos los eventos: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener eventos"
        )

@router.get("/{event_id}")
def get_event_by_id(event_id: int, db: Session = Depends(get_db)):
    """Obtener un evento por ID con sus funciones"""
    try:
        print(f"📤 Obteniendo evento ID: {event_id}")

        query = text("""
            SELECT e.*, v.name as venue_name, v.city as venue_city, v.map_url, v.address as venue_address
            FROM events e
            LEFT JOIN venues v ON e.venue_id = v.id
            WHERE e.id = :event_id
        """)
        result = db.execute(query, {"event_id": event_id})
        event = result.fetchone()

        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Evento no encontrado"
            )

        event_dict = dict(event._mapping)

        # Get Functions
        funcs_query = text("""
            SELECT ef.*, v.name as venue_name, v.city as venue_city, v.map_url
            FROM event_functions ef
            JOIN venues v ON ef.venue_id = v.id
            WHERE ef.event_id = :event_id AND ef.status = 'active'
            ORDER BY ef.date ASC, ef.time ASC
        """)
        funcs_res = db.execute(funcs_query, {"event_id": event_id}).fetchall()
        event_dict["functions"] = [dict(row._mapping) for row in funcs_res]

        print(f"✅ Evento encontrado: {event.name} ({len(event_dict['functions'])} funciones)")
        return event_dict

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
def create_event(event: EventCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Crear un nuevo evento (Gestor)"""
    try:
        print(f"📤 Creando evento: {event.name}")

        # TODO: Obtener user_id del token JWT
        created_by = 1  # Por ahora hardcodeado

        # Determine Main Venue/Location strings
        # If functions provided, use first one to populate header info if not manual
        # If venue_id provided directly, fetch it.

        location_str = event.location
        venue_str = event.venue

        # If functions provided and venue/location are "placeholder" or empty-ish
        if event.functions and len(event.functions) > 0:
            first_func = event.functions[0]
            # Fetch venue
            v = db.execute(text("SELECT * FROM venues WHERE id=:id"), {"id": first_func.venue_id}).fetchone()
            if v:
                if not venue_str: venue_str = v.name
                if not location_str: location_str = v.city

        if not event.venue and event.venue_id:
             v = db.execute(text("SELECT * FROM venues WHERE id=:id"), {"id": event.venue_id}).fetchone()
             if v:
                venue_str = v.name
                location_str = v.city

        query = text("""
            INSERT INTO events (
                name, description, category, event_date, event_time,
                location, venue, venue_id, price, total_tickets, available_tickets,
                image_url, status, created_by, created_at
            ) VALUES (
                :name, :description, :category, :event_date, :event_time,
                :location, :venue, :venue_id, :price, :total_tickets, :available_tickets,
                :image_url, :status, :created_by, NOW()
            )
        """)

        result = db.execute(query, {
            "name": event.name,
            "description": event.description,
            "category": event.category,
            "event_date": event.event_date,
            "event_time": event.event_time,
            "location": location_str,
            "venue": venue_str or location_str,
            "venue_id": event.venue_id, # Can be None
            "price": event.price,
            "total_tickets": event.total_tickets,
            "available_tickets": event.available_tickets,
            "image_url": event.image_url,
            "status": event.status,
            "created_by": created_by
        })

        event_id = result.lastrowid

        # Insert Functions
        if event.functions:
            print(f"   📅 Insertando {len(event.functions)} funciones...")
            for f in event.functions:
                db.execute(text("""
                    INSERT INTO event_functions (event_id, venue_id, date, time)
                    VALUES (:eid, :vid, :date, :time)
                """), {
                    "eid": event_id,
                    "vid": f.venue_id,
                    "date": f.date,
                    "time": f.time
                })

        db.commit()

        # Obtener el evento creado
        created_event = db.execute(
            text("SELECT * FROM events WHERE id = :id"),
            {"id": event_id}
        ).fetchone()

        print(f"✅ Evento creado con ID: {event_id}")

        # Guardar en MongoDB la analitica de eventos asincronamente
        try:
            from core.mongodb import MongoAnalytics
            background_tasks.add_task(
                MongoAnalytics.log_event_created,
                event_id=event_id,
                name=event.name,
                category=event.category,
                location=location_str,
                total_tickets=event.total_tickets,
                price=event.price,
                created_by=created_by
            )
            print("✅ Tarea asíncrona de MongoDB (evento) encolada")
        except Exception as mongo_err:
            print(f"⚠️ Error al encolar analítica de MongoDB: {mongo_err}")

        return dict(created_event._mapping)

    except Exception as e:
        db.rollback()
        print(f"❌ Error al crear evento: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear evento: {str(e)}"
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

        # Separar functions del resto de campos
        update_data = event_update.dict(exclude_unset=True)
        functions_data = update_data.pop('functions', None)

        for field, value in update_data.items():
            if value is not None:
                update_fields.append(f"{field} = :{field}")
                params[field] = value

        if update_fields:
            query = f"""
                UPDATE events
                SET {', '.join(update_fields)}, updated_at = NOW()
                WHERE id = :event_id
            """
            db.execute(text(query), params)

        # Handle Functions Update
        if functions_data is not None:
             print(f"   📅 Actualizando funciones ({len(functions_data)})...")
             # Delete existing functions (simplest strategy for now)
             db.execute(text("DELETE FROM event_functions WHERE event_id = :event_id"), {"event_id": event_id})

             # Insert new ones
             for f in functions_data:
                db.execute(text("""
                    INSERT INTO event_functions (event_id, venue_id, date, time)
                    VALUES (:eid, :vid, :date, :time)
                """), {
                    "eid": event_id,
                    "vid": f['venue_id'],
                    "date": f['date'],
                    "time": f['time']
                })

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
