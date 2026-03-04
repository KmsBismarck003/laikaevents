from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text, Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import traceback
import enum
import shutil
import os
import uuid

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
# MODELOS DE BASE DE DATOS (SQLAlchemy)
# ============================================

# Nota: Idealmente esto iría en un archivo models.py compartido,
# pero para mantener la modularidad por router lo definimos aquí o asumimos que main.py lo crea.
# Por simplicidad y consistencia con el proyecto actual (si no usa alembic estricto),
# definiremos la creación de tabla vía SQL directo si no existe, o usaremos el ORM.

class AdPosition(str, enum.Enum):
    MAIN = "main"          # Carrusel principal (1098x342)
    SIDE_LEFT = "side_left"   # Lateral izquierdo (160x600)
    SIDE_RIGHT = "side_right" # Lateral derecho (160x600)

# ============================================
# SCHEMAS (Pydantic)
# ============================================

class AdBase(BaseModel):
    title: str
    image_url: str
    link_url: Optional[str] = None
    position: AdPosition
    active: bool = True

class AdCreate(AdBase):
    pass

class AdUpdate(BaseModel):
    title: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    position: Optional[AdPosition] = None
    active: Optional[bool] = None

class AdResponse(AdBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True

# ============================================
# ENDPOINTS
# ============================================

@router.on_event("startup")
def startup_event():
    try:
        # Crear tabla si no existe (dado que no tenemos un sistema de migraciones completo visible)
        from main import mysql_engine as engine
        if engine is None: # Si falló en main.py
             return

        with engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS ads (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    image_url TEXT NOT NULL,
                    link_url TEXT,
                    position ENUM('main', 'side_left', 'side_right') NOT NULL,
                    active BOOLEAN DEFAULT TRUE,
                    created_at DATETIME DEFAULT NOW()
                )
            """))
            conn.commit()
    except Exception as e:
        print(f"⚠️ [ADS] No se pudo inicializar tabla 'ads' (¿Base de datos offline?): {e}")

@router.get("/public", response_model=List[dict])
def get_public_ads(db: Session = Depends(get_db)):
    """Obtener anuncios activos agrupados o listados para el frontend"""
    try:
        # Retornamos dict simple o lista flat, el frontend filtrará por posición
        query = text("SELECT * FROM ads WHERE active = 1 ORDER BY created_at DESC")
        result = db.execute(query).fetchall()
        return [dict(row._mapping) for row in result]
    except Exception as e:
        print(f"❌ Error al obtener anuncios públicos: {e}")
        return []

@router.get("/admin", response_model=List[dict])
def get_admin_ads(db: Session = Depends(get_db)):
    """Obtener todos los anuncios (Admin)"""
    try:
        query = text("SELECT * FROM ads ORDER BY created_at DESC")
        result = db.execute(query).fetchall()
        return [dict(row._mapping) for row in result]
    except Exception as e:
        print(f"❌ Error al obtener anuncios admin: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_ad_image(file: UploadFile = File(...)):
    """Subir imagen de anuncio"""
    try:
        # Validar tipo de archivo
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")

        # Crear directorio si no existe
        UPLOAD_DIR = "static/uploads/ads"
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        # Generar nombre único
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        # Guardar archivo
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Construir URL (asumiendo que static/uploads/ads es accesible)
        # Nota: Ajustar la URL base según configuración del servidor
        # En desarrollo local: http://localhost:8000/static/uploads/ads/...
        file_url = f"/static/uploads/ads/{unique_filename}"

        return {"url": file_url}

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al subir imagen: {e}")
        raise HTTPException(status_code=500, detail=f"Error al subir imagen: {str(e)}")

@router.post("/", response_model=dict)
def create_ad(ad: AdCreate, db: Session = Depends(get_db)):
    """Crear nuevo anuncio"""
    try:
        query = text("""
            INSERT INTO ads (title, image_url, link_url, position, active, created_at)
            VALUES (:title, :image_url, :link_url, :position, :active, NOW())
        """)
        result = db.execute(query, {
            "title": ad.title,
            "image_url": ad.image_url,
            "link_url": ad.link_url,
            "position": ad.position.value,
            "active": ad.active
        })
        db.commit()
        return {**ad.dict(), "id": result.lastrowid, "created_at": datetime.now()}
    except Exception as e:
        db.rollback()
        print(f"❌ Error al crear anuncio: {e}")
        raise HTTPException(status_code=500, detail="Error al crear anuncio")

@router.put("/{ad_id}", response_model=dict)
def update_ad(ad_id: int, ad_update: AdUpdate, db: Session = Depends(get_db)):
    """Actualizar anuncio"""
    try:
        fields = []
        params = {"id": ad_id}

        if ad_update.title is not None:
            fields.append("title = :title")
            params["title"] = ad_update.title
        if ad_update.image_url is not None:
            fields.append("image_url = :image_url")
            params["image_url"] = ad_update.image_url
        if ad_update.link_url is not None:
            fields.append("link_url = :link_url")
            params["link_url"] = ad_update.link_url
        if ad_update.position is not None:
            fields.append("position = :position")
            params["position"] = ad_update.position.value
        if ad_update.active is not None:
            fields.append("active = :active")
            params["active"] = ad_update.active

        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")

        query = text(f"UPDATE ads SET {', '.join(fields)} WHERE id = :id")
        result = db.execute(query, params)
        db.commit()

        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Anuncio no encontrado")

        return {"id": ad_id, "message": "Anuncio actualizado"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{ad_id}")
def delete_ad(ad_id: int, db: Session = Depends(get_db)):
    """Eliminar anuncio"""
    try:
        query = text("DELETE FROM ads WHERE id = :id")
        result = db.execute(query, {"id": ad_id})
        db.commit()

        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Anuncio no encontrado")

        return {"success": True, "message": "Anuncio eliminado"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
