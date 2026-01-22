# routers/users.py - VERSIÓN CORREGIDA CON ENDPOINT RAÍZ ARREGLADO
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr
from typing import Optional
import traceback

router = APIRouter()

# ============================================
# DEPENDENCIA PARA OBTENER SESIÓN DE BD
# ============================================

def get_db():
    """Dependencia para obtener sesión de base de datos"""
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
# ENDPOINTS - ORDEN CRÍTICO
# ============================================

# 🔥 IMPORTANTE: /me DEBE IR ANTES QUE /{user_id}
# FastAPI evalúa rutas en orden, y "/me" podría confundirse con "/{user_id}"

@router.get("/me")
def get_profile(db: Session = Depends(get_db)):
    """Obtener perfil del usuario actual"""
    try:
        # TODO: Obtener user_id del token JWT
        user_id = 1  # Por ahora hardcodeado

        print(f"📤 Obteniendo perfil del usuario {user_id}")

        query = text("SELECT * FROM users WHERE id = :user_id")
        result = db.execute(query, {"user_id": user_id})
        user = result.fetchone()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )

        print(f"✅ Perfil obtenido: {user.email}")

        user_dict = dict(user._mapping)
        user_dict.pop('password_hash', None)

        return user_dict

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al obtener perfil: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener perfil"
        )

@router.put("/me")
def update_profile(user_update: UserUpdate, db: Session = Depends(get_db)):
    """Actualizar perfil del usuario actual"""
    try:
        user_id = 1  # TODO: Obtener del JWT

        print(f"📤 Actualizando perfil del usuario {user_id}")

        # Construir query dinámicamente
        update_fields = []
        params = {"user_id": user_id}

        for field, value in user_update.dict(exclude_unset=True).items():
            if value is not None:
                update_fields.append(f"{field} = :{field}")
                params[field] = value

        if not update_fields:
            return get_profile(db)

        query = f"""
            UPDATE users
            SET {', '.join(update_fields)}, updated_at = NOW()
            WHERE id = :user_id
        """

        db.execute(text(query), params)
        db.commit()

        print(f"✅ Perfil actualizado")

        return get_profile(db)

    except Exception as e:
        db.rollback()
        print(f"❌ Error al actualizar perfil: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar perfil"
        )

# 🔥 ENDPOINT RAÍZ - AHORA CON PATH EXPLÍCITO "/"
@router.get("/")
def get_all_users(
    limit: int = 100,
    role: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Obtener todos los usuarios (Admin)

    Este endpoint DEBE responder en /api/users/
    """
    try:
        print(f"\n{'='*50}")
        print(f"📤 GET /api/users/ - Obteniendo usuarios")
        print(f"   Parámetros: limit={limit}, role={role}")
        print(f"{'='*50}\n")

        # Query base
        query = "SELECT * FROM users WHERE 1=1"
        params = {"limit": limit}

        # Filtro por rol si se especifica
        if role:
            query += " AND role = :role"
            params['role'] = role

        # Ordenar y limitar
        query += " ORDER BY created_at DESC LIMIT :limit"

        result = db.execute(text(query), params)
        users = result.fetchall()

        print(f"✅ {len(users)} usuarios encontrados")

        # Convertir a lista de diccionarios
        users_list = []
        for user in users:
            user_dict = dict(user._mapping)
            # Remover password_hash por seguridad
            user_dict.pop('password_hash', None)
            users_list.append(user_dict)

        return users_list

    except Exception as e:
        print(f"❌ Error al obtener usuarios: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener usuarios: {str(e)}"
        )

@router.get("/{user_id}")
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    """Obtener usuario específico por ID"""
    try:
        print(f"📤 Obteniendo usuario ID: {user_id}")

        query = text("SELECT * FROM users WHERE id = :user_id")
        result = db.execute(query, {"user_id": user_id})
        user = result.fetchone()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )

        print(f"✅ Usuario obtenido: {user.email}")

        user_dict = dict(user._mapping)
        user_dict.pop('password_hash', None)

        return user_dict

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al obtener usuario: {e}")
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
    """Actualizar usuario específico (Admin)"""
    try:
        print(f"📤 Actualizando usuario ID: {user_id}")

        # Construir query dinámicamente
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

        print(f"✅ Usuario actualizado")

        return get_user_by_id(user_id, db)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error al actualizar usuario: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar usuario"
        )

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Eliminar un usuario (Admin)"""
    try:
        print(f"📤 Eliminando usuario ID: {user_id}")

        # Verificar que existe
        check_query = text("SELECT id FROM users WHERE id = :user_id")
        result = db.execute(check_query, {"user_id": user_id})
        user = result.fetchone()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )

        # Eliminar usuario
        delete_query = text("DELETE FROM users WHERE id = :user_id")
        db.execute(delete_query, {"user_id": user_id})
        db.commit()

        print(f"✅ Usuario eliminado")

        return {
            "success": True,
            "message": "Usuario eliminado exitosamente"
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error al eliminar usuario: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar usuario"
        )
