# routers/users.py - Endpoints de usuario con soporte de foto de perfil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr
from typing import Optional
import traceback
import os
import uuid
import shutil

router = APIRouter()

# ============================================
# DEPENDENCIA PARA OBTENER SESION DE BD
# ============================================

def get_db():
    """Dependencia para obtener sesion de base de datos"""
    from main import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================================
# MODELOS PYDANTIC
# ============================================

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    birth_date: Optional[str] = None

# ============================================
# ENDPOINTS
# ============================================

from dependencies import get_current_user

# Directorio para fotos de perfil
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "profiles")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def safe_user_dict(user):
    """Convierte current_user a dict y elimina password_hash"""
    if isinstance(user, dict):
        d = dict(user)
    elif hasattr(user, '_mapping'):
        d = dict(user._mapping)
    else:
        d = dict(user)
    d.pop('password_hash', None)
    return d


@router.get("/me")
def get_profile(current_user: dict = Depends(get_current_user)):
    """Obtener perfil del usuario actual"""
    try:
        return safe_user_dict(current_user)
    except Exception as e:
        print(f"Error al obtener perfil: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener perfil"
        )


@router.put("/me")
def update_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Actualizar perfil del usuario actual"""
    try:
        user_id = current_user['id']

        # Construir query dinamicamente
        update_fields = []
        params = {"user_id": user_id}

        for field, value in user_update.dict(exclude_unset=True).items():
            if value is not None:
                update_fields.append(f"{field} = :{field}")
                params[field] = value

        if not update_fields:
            return safe_user_dict(current_user)

        query = f"""
            UPDATE users
            SET {', '.join(update_fields)}, updated_at = NOW()
            WHERE id = :user_id
        """

        db.execute(text(query), params)
        db.commit()

        # Obtener usuario actualizado
        result = db.execute(text("SELECT * FROM users WHERE id = :user_id"), {"user_id": user_id})
        updated_user = result.fetchone()

        return safe_user_dict(updated_user)

    except Exception as e:
        db.rollback()
        print(f"Error al actualizar perfil: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar perfil"
        )


@router.post("/me/photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Subir foto de perfil del usuario actual"""
    try:
        user_id = current_user['id']

        # Validar extension
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Formato no permitido. Usa: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # Validar tamano
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail="La imagen no debe superar 5MB"
            )

        # Generar nombre unico
        filename = f"user_{user_id}_{uuid.uuid4().hex[:8]}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)

        # Eliminar foto anterior si existe
        old_photo = current_user.get('profile_photo')
        if old_photo:
            old_path = os.path.join(UPLOAD_DIR, os.path.basename(old_photo))
            if os.path.exists(old_path):
                os.remove(old_path)

        # Guardar archivo
        with open(filepath, "wb") as f:
            f.write(contents)

        # Actualizar en BD
        photo_url = f"/static/profiles/{filename}"

        # Intentar actualizar la columna profile_photo
        try:
            db.execute(
                text("UPDATE users SET profile_photo = :photo, updated_at = NOW() WHERE id = :user_id"),
                {"photo": photo_url, "user_id": user_id}
            )
            db.commit()
        except Exception:
            # Si la columna no existe, crearla
            db.rollback()
            try:
                db.execute(text("ALTER TABLE users ADD COLUMN profile_photo VARCHAR(500) NULL"))
                db.commit()
                db.execute(
                    text("UPDATE users SET profile_photo = :photo, updated_at = NOW() WHERE id = :user_id"),
                    {"photo": photo_url, "user_id": user_id}
                )
                db.commit()
            except Exception as col_err:
                db.rollback()
                print(f"Error al agregar columna profile_photo: {col_err}")

        # Obtener usuario actualizado
        result = db.execute(text("SELECT * FROM users WHERE id = :user_id"), {"user_id": user_id})
        updated_user = result.fetchone()

        return {
            "success": True,
            "photo_url": photo_url,
            "user": safe_user_dict(updated_user)
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error al subir foto de perfil: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al subir foto de perfil"
        )


@router.delete("/me/photo")
def delete_profile_photo(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Eliminar foto de perfil"""
    try:
        user_id = current_user['id']
        old_photo = current_user.get('profile_photo')

        if old_photo:
            old_path = os.path.join(UPLOAD_DIR, os.path.basename(old_photo))
            if os.path.exists(old_path):
                os.remove(old_path)

        try:
            db.execute(
                text("UPDATE users SET profile_photo = NULL, updated_at = NOW() WHERE id = :user_id"),
                {"user_id": user_id}
            )
            db.commit()
        except Exception:
            db.rollback()

        return {"success": True, "message": "Foto de perfil eliminada"}

    except Exception as e:
        print(f"Error al eliminar foto de perfil: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar foto de perfil"
        )


# ============================================
# ENDPOINTS ADMIN
# ============================================

@router.get("/")
def get_all_users(
    limit: int = 100,
    role: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Obtener todos los usuarios (Admin)"""
    try:
        query = "SELECT * FROM users WHERE 1=1"
        params = {"limit": limit}

        if role:
            query += " AND role = :role"
            params['role'] = role

        query += " ORDER BY created_at DESC LIMIT :limit"

        result = db.execute(text(query), params)
        users = result.fetchall()

        users_list = []
        for user in users:
            users_list.append(safe_user_dict(user))

        return users_list

    except Exception as e:
        print(f"Error al obtener usuarios: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener usuarios: {str(e)}"
        )


@router.get("/{user_id}")
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    """Obtener usuario especifico por ID"""
    try:
        query = text("SELECT * FROM users WHERE id = :user_id")
        result = db.execute(query, {"user_id": user_id})
        user = result.fetchone()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )

        return safe_user_dict(user)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error al obtener usuario: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener usuario"
        )


@router.put("/{user_id}")
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar usuario especifico (Admin)"""
    try:
        update_fields = []
        params = {"user_id": user_id}

        for field, value in user_update.dict(exclude_unset=True).items():
            if value is not None:
                update_fields.append(f"{field} = :{field}")
                params[field] = value

        if not update_fields:
            return get_user_by_id(user_id, db)

        query = f"""
            UPDATE users
            SET {', '.join(update_fields)}, updated_at = NOW()
            WHERE id = :user_id
        """

        result = db.execute(text(query), params)
        db.commit()

        if result.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )

        return get_user_by_id(user_id, db)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error al actualizar usuario: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar usuario"
        )


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Eliminar un usuario (Admin)"""
    try:
        check_query = text("SELECT id FROM users WHERE id = :user_id")
        result = db.execute(check_query, {"user_id": user_id})
        user = result.fetchone()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )

        delete_query = text("DELETE FROM users WHERE id = :user_id")
        db.execute(delete_query, {"user_id": user_id})
        db.commit()

        return {
            "success": True,
            "message": "Usuario eliminado exitosamente"
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error al eliminar usuario: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar usuario"
        )
