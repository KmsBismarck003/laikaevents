from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Dict, Optional
import traceback
import json

router = APIRouter()

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

class UserPermissions(BaseModel):
    # Permisos de lectura
    canViewEvents: bool = False
    canViewUsers: bool = False
    canViewStats: bool = False
    canViewTickets: bool = False
    
    # Permisos de escritura
    canCreateEvents: bool = False
    canEditEvents: bool = False
    canDeleteEvents: bool = False
    
    # Permisos de usuarios
    canCreateUsers: bool = False
    canEditUsers: bool = False
    canDeleteUsers: bool = False
    
    # Permisos de tickets
    canSellTickets: bool = False
    canValidateTickets: bool = False
    canRefundTickets: bool = False
    
    # Permisos administrativos
    canManageDatabase: bool = False
    canManageConfig: bool = False
    canViewLogs: bool = False

class UpdatePermissionsRequest(BaseModel):
    role: str
    permissions: UserPermissions

# ============================================
# PERMISOS POR ROL (Defaults)
# ============================================

DEFAULT_PERMISSIONS = {
    "admin": {
        "canViewEvents": True,
        "canViewUsers": True,
        "canViewStats": True,
        "canViewTickets": True,
        "canCreateEvents": True,
        "canEditEvents": True,
        "canDeleteEvents": True,
        "canCreateUsers": True,
        "canEditUsers": True,
        "canDeleteUsers": True,
        "canSellTickets": True,
        "canValidateTickets": True,
        "canRefundTickets": True,
        "canManageDatabase": True,
        "canManageConfig": True,
        "canViewLogs": True
    },
    "gestor": {
        "canViewEvents": True,
        "canViewUsers": True,
        "canViewStats": True,
        "canViewTickets": True,
        "canCreateEvents": True,
        "canEditEvents": True,
        "canDeleteEvents": False,
        "canCreateUsers": False,
        "canEditUsers": False,
        "canDeleteUsers": False,
        "canSellTickets": True,
        "canValidateTickets": True,
        "canRefundTickets": False,
        "canManageDatabase": False,
        "canManageConfig": False,
        "canViewLogs": False
    },
    "operador": {
        "canViewEvents": True,
        "canViewUsers": False,
        "canViewStats": False,
        "canViewTickets": True,
        "canCreateEvents": False,
        "canEditEvents": False,
        "canDeleteEvents": False,
        "canCreateUsers": False,
        "canEditUsers": False,
        "canDeleteUsers": False,
        "canSellTickets": True,
        "canValidateTickets": True,
        "canRefundTickets": False,
        "canManageDatabase": False,
        "canManageConfig": False,
        "canViewLogs": False
    },
    "usuario": {
        "canViewEvents": True,
        "canViewUsers": False,
        "canViewStats": False,
        "canViewTickets": False,
        "canCreateEvents": False,
        "canEditEvents": False,
        "canDeleteEvents": False,
        "canCreateUsers": False,
        "canEditUsers": False,
        "canDeleteUsers": False,
        "canSellTickets": False,
        "canValidateTickets": False,
        "canRefundTickets": False,
        "canManageDatabase": False,
        "canManageConfig": False,
        "canViewLogs": False
    }
}

# ============================================
# ENDPOINTS
# ============================================

@router.get("/{user_id}/permissions")
def get_user_permissions(user_id: int, db: Session = Depends(get_db)):
    """Obtener permisos de un usuario"""
    try:
        print(f"📤 Obteniendo permisos del usuario {user_id}")
        
        # Verificar que el usuario existe
        user_query = text("SELECT role, permissions FROM users WHERE id = :user_id")
        result = db.execute(user_query, {"user_id": user_id})
        user = result.fetchone()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        # Si el usuario tiene permisos personalizados, usarlos
        if user.permissions:
            try:
                permissions = json.loads(user.permissions)
            except:
                permissions = DEFAULT_PERMISSIONS.get(user.role, DEFAULT_PERMISSIONS["usuario"])
        else:
            # Usar permisos por defecto según el rol
            permissions = DEFAULT_PERMISSIONS.get(user.role, DEFAULT_PERMISSIONS["usuario"])
        
        print(f"✅ Permisos obtenidos para usuario {user_id}")
        
        return {
            "role": user.role,
            "permissions": permissions
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al obtener permisos: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener permisos"
        )

@router.put("/{user_id}/permissions")
def update_user_permissions(
    user_id: int,
    request: UpdatePermissionsRequest,
    db: Session = Depends(get_db)
):
    """Actualizar permisos de un usuario"""
    try:
        print(f"📤 Actualizando permisos del usuario {user_id}")
        print(f"   Nuevo rol: {request.role}")
        
        # Verificar que el usuario existe
        check_query = text("SELECT id FROM users WHERE id = :user_id")
        result = db.execute(check_query, {"user_id": user_id})
        if not result.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        # Convertir permisos a JSON
        permissions_json = json.dumps(request.permissions.dict())
        
        # Actualizar rol y permisos
        update_query = text("""
            UPDATE users 
            SET role = :role, 
                permissions = :permissions,
                updated_at = NOW()
            WHERE id = :user_id
        """)
        
        db.execute(update_query, {
            "user_id": user_id,
            "role": request.role,
            "permissions": permissions_json
        })
        db.commit()
        
        print(f"✅ Permisos actualizados para usuario {user_id}")
        
        return {
            "success": True,
            "message": "Permisos actualizados correctamente",
            "role": request.role,
            "permissions": request.permissions.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error al actualizar permisos: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar permisos"
        )
