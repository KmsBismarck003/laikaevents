# routers/admin_users.py - Módulo aislado de gestión de usuarios (Admin)
# No modifica ningún router existente. Prefijo: /api/admin/users

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from typing import Optional
import traceback

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ============================================
# DEPENDENCIAS (reutilizadas de dependencies.py)
# ============================================

from dependencies import get_db, get_current_user


def require_admin(current_user=Depends(get_current_user)):
    """Verificar que el usuario autenticado sea admin"""
    role = current_user.role if hasattr(current_user, 'role') else current_user.get('role')
    if role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador"
        )
    return current_user


# ============================================
# MODELOS PYDANTIC
# ============================================

class AdminCreateUser(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    role: str = "usuario"  # usuario, operador, gestor, admin


class AdminResetPassword(BaseModel):
    new_password: str


class AdminChangeStatus(BaseModel):
    status: str  # active, disabled


# ============================================
# HELPERS REUTILIZABLES
# ============================================

def _user_row_to_dict(row):
    """Convierte un row de SQLAlchemy a dict, removiendo password_hash."""
    user_dict = dict(row._mapping)
    user_dict.pop('password_hash', None)
    # Serializar datetimes
    for key, val in user_dict.items():
        if hasattr(val, 'isoformat'):
            user_dict[key] = val.isoformat()
    return user_dict


def _get_user_or_404(db: Session, user_id: int):
    """Obtiene un usuario por ID o lanza 404."""
    result = db.execute(text("SELECT * FROM users WHERE id = :uid"), {"uid": user_id})
    user = result.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


# ============================================
# ENDPOINTS
# ============================================

@router.get("/")
def list_users(
    search: Optional[str] = Query(None, description="Buscar por nombre o email"),
    role: Optional[str] = Query(None, description="Filtrar por rol"),
    user_status: Optional[str] = Query(None, alias="status", description="Filtrar por estado"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin)
):
    """Listar usuarios con búsqueda y filtros avanzados."""
    try:
        conditions = ["1=1"]
        params = {"limit": limit, "offset": offset}

        if search:
            conditions.append(
                "(LOWER(first_name) LIKE :search OR LOWER(last_name) LIKE :search OR LOWER(email) LIKE :search)"
            )
            params["search"] = f"%{search.lower()}%"

        if role:
            conditions.append("role = :role")
            params["role"] = role

        if user_status:
            conditions.append("status = :user_status")
            params["user_status"] = user_status

        where = " AND ".join(conditions)

        # Contar total
        count_result = db.execute(text(f"SELECT COUNT(*) as total FROM users WHERE {where}"), params)
        total = count_result.fetchone()._mapping['total']

        # Obtener usuarios
        query = f"""
            SELECT * FROM users
            WHERE {where}
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """
        result = db.execute(text(query), params)
        users = [_user_row_to_dict(row) for row in result.fetchall()]

        return {"users": users, "total": total, "limit": limit, "offset": offset}

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al listar usuarios (admin): {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al listar usuarios: {str(e)}")


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_user(
    data: AdminCreateUser,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin)
):
    """Crear un nuevo usuario desde el panel admin."""
    try:
        # Validar contraseña
        if len(data.password) < 6:
            raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")

        # Validar rol
        valid_roles = {'usuario', 'operador', 'gestor', 'admin'}
        if data.role not in valid_roles:
            raise HTTPException(status_code=400, detail=f"Rol inválido. Roles válidos: {', '.join(valid_roles)}")

        # Verificar email duplicado
        check = db.execute(text("SELECT id FROM users WHERE email = :email"), {"email": data.email})
        if check.fetchone():
            raise HTTPException(status_code=400, detail="El email ya está registrado")

        # Hash de contraseña
        password_hash = pwd_context.hash(data.password)

        # Insertar
        insert_query = text("""
            INSERT INTO users (first_name, last_name, email, phone, password_hash, role, status, created_at)
            VALUES (:first_name, :last_name, :email, :phone, :password_hash, :role, 'active', NOW())
        """)
        db.execute(insert_query, {
            "first_name": data.first_name,
            "last_name": data.last_name,
            "email": data.email,
            "phone": data.phone,
            "password_hash": password_hash,
            "role": data.role
        })
        db.commit()

        # Retornar usuario creado
        result = db.execute(text("SELECT * FROM users WHERE email = :email"), {"email": data.email})
        new_user = result.fetchone()

        print(f"✅ Usuario creado por admin: {data.email} (rol: {data.role})")
        return _user_row_to_dict(new_user)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error al crear usuario (admin): {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al crear usuario: {str(e)}")


@router.get("/{user_id}")
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin)
):
    """Obtener detalle de un usuario."""
    user = _get_user_or_404(db, user_id)
    return _user_row_to_dict(user)


@router.patch("/{user_id}/password")
def reset_user_password(
    user_id: int,
    data: AdminResetPassword,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin)
):
    """Resetear contraseña de un usuario (Admin)."""
    try:
        _get_user_or_404(db, user_id)

        if len(data.new_password) < 6:
            raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")

        password_hash = pwd_context.hash(data.new_password)

        db.execute(
            text("UPDATE users SET password_hash = :hash, updated_at = NOW() WHERE id = :uid"),
            {"hash": password_hash, "uid": user_id}
        )
        db.commit()

        print(f"✅ Contraseña reseteada por admin para usuario ID: {user_id}")
        return {"success": True, "message": "Contraseña actualizada exitosamente"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error al resetear contraseña: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error al actualizar contraseña")


@router.patch("/{user_id}/status")
def change_user_status(
    user_id: int,
    data: AdminChangeStatus,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin)
):
    """Cambiar estado de un usuario (active / disabled)."""
    try:
        _get_user_or_404(db, user_id)

        valid_statuses = {'active', 'disabled'}
        if data.status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Estado inválido. Estados válidos: {', '.join(valid_statuses)}")

        db.execute(
            text("UPDATE users SET status = :status, updated_at = NOW() WHERE id = :uid"),
            {"status": data.status, "uid": user_id}
        )
        db.commit()

        label = "habilitado" if data.status == "active" else "deshabilitado"
        print(f"✅ Usuario ID {user_id} {label} por admin")
        return {"success": True, "message": f"Usuario {label} exitosamente", "new_status": data.status}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error al cambiar estado: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error al cambiar estado del usuario")


@router.patch("/{user_id}/unlock")
def unlock_user(
    user_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin)
):
    """Desbloquear cuenta de usuario."""
    try:
        _get_user_or_404(db, user_id)

        db.execute(
            text("UPDATE users SET status = 'active', updated_at = NOW() WHERE id = :uid"),
            {"uid": user_id}
        )
        db.commit()

        print(f"✅ Usuario ID {user_id} desbloqueado por admin")
        return {"success": True, "message": "Usuario desbloqueado exitosamente"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error al desbloquear usuario: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error al desbloquear usuario")
