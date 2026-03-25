from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import HTTPException
from typing import Optional, List, Dict, Any
import traceback

def get_public_events(db: Session, category: Optional[str] = None, limit: int = 100):
    try:
        query = "SELECT * FROM events WHERE status = 'published'"
        params = {"limit": limit}
        if category:
            query += " AND category = :category"
            params['category'] = category
        query += " ORDER BY grid_position_y ASC, grid_position_x ASC, event_date ASC LIMIT :limit"
        
        result = db.execute(text(query), params)
        return [dict(row._mapping) for row in result.fetchall()]
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error en Event Service")

def get_all_events(db: Session, limit: int = 100):
    try:
        query = "SELECT * FROM events ORDER BY id DESC LIMIT :limit"
        result = db.execute(text(query), {"limit": limit})
        return [dict(row._mapping) for row in result.fetchall()]
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error al obtener todos los eventos")

def get_user_events(db: Session, user_id: int, limit: int = 100):
    try:
        query = "SELECT * FROM events WHERE created_by = :user_id ORDER BY id DESC LIMIT :limit"
        result = db.execute(text(query), {"user_id": user_id, "limit": limit})
        return [dict(row._mapping) for row in result.fetchall()]
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error al obtener eventos del usuario")

def get_event_by_id(db: Session, event_id: int):
    try:
        query = text("""
            SELECT *
            FROM events
            WHERE id = :event_id
        """)
        event = db.execute(query, {"event_id": event_id}).fetchone()
        if not event:
            raise HTTPException(status_code=404, detail="Evento no encontrado")
        
        res = dict(event._mapping)
        
        # Cargar secciones y reglas
        sections_query = text("SELECT * FROM event_ticket_sections WHERE event_id = :event_id")
        sections_db = db.execute(sections_query, {"event_id": event_id}).fetchall()
        res['sections'] = [dict(s._mapping) for s in sections_db]

        rules_query = text("SELECT * FROM event_rules WHERE event_id = :event_id")
        rules_db = db.execute(rules_query, {"event_id": event_id}).fetchall()
        res['rules'] = [dict(r._mapping) for r in rules_db]

        return res
    except HTTPException: raise
    except Exception:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error al obtener evento")

def create_event(db: Session, event_data: dict, user_id: int): # Note: event_data comes as Pydantic model
    try:
        data = event_data.dict()
        sections = data.pop('sections', []) or []
        rules = data.pop('rules', []) or []
        functions = data.pop('functions', []) or []
        data.pop('venue_id', None)  # The table doesn't have a venue_id column
        
        # 1. Crear Evento
        data['created_by'] = user_id
        columns = ', '.join(data.keys())
        values_placeholders = ', '.join([f":{k}" for k in data.keys()])
        
        insert_event = text(f"""
            INSERT INTO events ({columns})
            VALUES ({values_placeholders})
        """)
        result = db.execute(insert_event, data)
        new_event_id = result.lastrowid
        
        # 2. Crear Secciones
        if sections:
            for s in sections:
                s['event_id'] = new_event_id
                cols_s = ', '.join(s.keys())
                vals_s = ', '.join([f":{k}" for k in s.keys()])
                db.execute(text(f"INSERT INTO event_ticket_sections ({cols_s}) VALUES ({vals_s})"), s)
                
        # 3. Crear Reglas
        if rules:
            for r in rules:
                r['event_id'] = new_event_id
                cols_r = ', '.join(r.keys())
                vals_r = ', '.join([f":{k}" for k in r.keys()])
                db.execute(text(f"INSERT INTO event_rules ({cols_r}) VALUES ({vals_r})"), r)

        db.commit()
        return get_event_by_id(db, new_event_id)
        
    except Exception as e:
        db.rollback()
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error al crear evento")

def update_event(db: Session, event_id: int, event_data: dict):
    try:
        # Check exists
        get_event_by_id(db, event_id) # Raises 404 if not found
        
        data = event_data.dict(exclude_unset=True)
        sections = data.pop('sections', None)
        rules = data.pop('rules', None)
        functions = data.pop('functions', None)
        data.pop('venue_id', None) # Remove it if exists

        if data:
            set_clause = ", ".join([f"{k} = :{k}" for k in data.keys()])
            data['event_id'] = event_id
            update_query = text(f"UPDATE events SET {set_clause} WHERE id = :event_id")
            db.execute(update_query, data)

        if sections is not None:
            db.execute(text("DELETE FROM event_ticket_sections WHERE event_id = :event_id"), {"event_id": event_id})
            for s in sections:
                s.pop('id', None) # Remove it if exists
                s['event_id'] = event_id
                cols_s = ', '.join(s.keys())
                vals_s = ', '.join([f":{k}" for k in s.keys()])
                db.execute(text(f"INSERT INTO event_ticket_sections ({cols_s}) VALUES ({vals_s})"), s)

        if rules is not None:
            db.execute(text("DELETE FROM event_rules WHERE event_id = :event_id"), {"event_id": event_id})
            for r in rules:
                r.pop('id', None)
                r['event_id'] = event_id
                cols_r = ', '.join(r.keys())
                vals_r = ', '.join([f":{k}" for k in r.keys()])
                db.execute(text(f"INSERT INTO event_rules ({cols_r}) VALUES ({vals_r})"), r)

        db.commit()
        return get_event_by_id(db, event_id)
        
    except HTTPException: raise
    except Exception as e:
        db.rollback()
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error al actualizar evento")
