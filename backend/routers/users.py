from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr
from typing import Optional
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

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    birth_date: Optional[str] = None

# ============================================
# ENDPOINTS
# ============================================

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
        # No enviar password_hash
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
        # TODO: Obtener user_id del token JWT
        user_id = 1  # Por ahora hardcodeado
        
        print(f"📤 Actualizando perfil del usuario {user_id}")
        
        # Construir query dinámicamente
        update_fields = []
        params = {"user_id": user_id}
        
        for field, value in user_update.dict(exclude_unset=True).items():
            if value is not None:
                update_fields.append(f"{field} = :{field}")
                params[field] = value
        
        if not update_fields:
            # Sin cambios
            return get_profile(db)
        
        query = f"""
            UPDATE users 
            SET {', '.join(update_fields)}, updated_at = NOW()
            WHERE id = :user_id
        """
        
        db.execute(text(query), params)
        db.commit()
        
        print(f"✅ Perfil actualizado")
        
        # Retornar perfil actualizado
        return get_profile(db)
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error al actualizar perfil: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar perfil"
        )

@router.get("/")
def get_all_users(
    limit: int = 100,
    role: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Obtener todos los usuarios (Admin)"""
    try:
        print(f"📤 Obteniendo usuarios (limit: {limit}, role: {role})")
        
        query = "SELECT * FROM users WHERE 1=1"
        params = {"limit": limit}
        
        if role:
            query += " AND role = :role"
            params['role'] = role
        
        query += " ORDER BY created_at DESC LIMIT :limit"
        
        result = db.execute(text(query), params)
        users = result.fetchall()
        
        print(f"✅ {len(users)} usuarios encontrados")
        
        # Remover password_hash
        users_list = []
        for user in users:
            user_dict = dict(user._mapping)
            user_dict.pop('password_hash', None)
            users_list.append(user_dict)
        
        return users_list
        
    except Exception as e:
        print(f"❌ Error al obtener usuarios: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener usuarios"
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
        
        # Eliminar usuario (CASCADE eliminará tickets, etc.)
        delete_query = text("DELETE FROM users WHERE id = :user_id")
        db.execute(delete_query, {"user_id": user_id})
        db.commit()
        
        print(f"✅ Usuario eliminado")
        return {"success": True, "message": "Usuario eliminado"}
        
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
