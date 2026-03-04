from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import traceback

router = APIRouter()

# Dependency
def get_db():
    from main import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Models
class VenueCreate(BaseModel):
    name: str
    address: str
    city: str
    map_url: Optional[str] = None
    capacity: Optional[int] = None
    image_url: Optional[str] = None
    status: str = 'active'

class VenueUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    map_url: Optional[str] = None
    capacity: Optional[int] = None
    image_url: Optional[str] = None
    status: Optional[str] = None

# Routes

@router.get("/")
def get_venues(status_filter: Optional[str] = 'active', db: Session = Depends(get_db)):
    """List venues (Public/Manager/Admin)"""
    try:
        print(f"📤 Obteniendo recintos (status: {status_filter})")

        query = "SELECT * FROM venues WHERE 1=1"
        params = {}

        if status_filter != 'all':
            query += " AND status = :status"
            params['status'] = status_filter

        query += " ORDER BY name ASC"

        result = db.execute(text(query), params)
        venues = result.fetchall()

        print(f"✅ {len(venues)} recintos encontrados")
        return [dict(row._mapping) for row in venues]

    except Exception as e:
        print(f"❌ Error al obtener recintos: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener recintos"
        )

@router.post("/")
def create_venue(venue: VenueCreate, db: Session = Depends(get_db)):
    """Create a new venue (Admin)"""
    try:
        print(f"📤 Creando recinto: {venue.name}")

        # Check specific validation if provided
        if not venue.name or not venue.city or not venue.address:
             raise HTTPException(status_code=400, detail="Nombre, Dirección y Ciudad son obligatorios")

        query = text("""
            INSERT INTO venues (name, address, city, map_url, capacity, image_url, status)
            VALUES (:name, :address, :city, :map_url, :capacity, :image_url, :status)
        """)

        result = db.execute(query, venue.dict())
        db.commit()

        venue_id = result.lastrowid
        print(f"✅ Recinto creado con ID: {venue_id}")

        return {**venue.dict(), "id": venue_id}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error al crear recinto: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear recinto"
        )

@router.get("/{venue_id}")
def get_venue(venue_id: int, db: Session = Depends(get_db)):
    """Get venue details"""
    try:
        query = text("SELECT * FROM venues WHERE id = :id")
        result = db.execute(query, {"id": venue_id}).fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="Recinto no encontrado")

        return dict(result._mapping)

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al obtener recinto: {e}")
        raise HTTPException(status_code=500, detail="Error de servidor")

@router.put("/{venue_id}")
def update_venue(venue_id: int, venue: VenueUpdate, db: Session = Depends(get_db)):
    """Update venue (Admin)"""
    try:
        print(f"📤 Actualizando recinto ID: {venue_id}")

        current = db.execute(text("SELECT * FROM venues WHERE id = :id"), {"id": venue_id}).fetchone()
        if not current:
            raise HTTPException(status_code=404, detail="Recinto no encontrado")

        update_data = venue.dict(exclude_unset=True)
        if not update_data:
            return dict(current._mapping)

        set_clauses = ", ".join([f"{k} = :{k}" for k in update_data.keys()])
        query = text(f"UPDATE venues SET {set_clauses} WHERE id = :id")

        db.execute(query, {**update_data, "id": venue_id})
        db.commit()

        print(f"✅ Recinto actualizado")
        return {**dict(current._mapping), **update_data}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error al actualizar recinto: {e}")
        raise HTTPException(status_code=500, detail="Error al actualizar recinto")

@router.delete("/{venue_id}")
def delete_venue(venue_id: int, db: Session = Depends(get_db)):
    """Delete (or deactivate) venue"""
    try:
        # Soft delete implies setting status to inactive, but here we might prefer hard delete if no events are linked
        # Standard implementation often checks constraints.
        # But for simplicity let's try delete and catch constraint error.

        try:
             db.execute(text("DELETE FROM venues WHERE id = :id"), {"id": venue_id})
             db.commit()
             return {"message": "Recinto eliminado"}
        except Exception:
             db.rollback()
             # Fallback to soft delete
             db.execute(text("UPDATE venues SET status = 'inactive' WHERE id = :id"), {"id": venue_id})
             db.commit()
             return {"message": "Recinto desactivado (tiene eventos asociados)"}

    except Exception as e:
        db.rollback()
        print(f"❌ Error al eliminar recinto: {e}")
        raise HTTPException(status_code=500, detail="Error al eliminar recinto")
