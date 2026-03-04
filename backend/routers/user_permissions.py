from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, ValidationError
from typing import Dict, Any, Optional
import traceback
import json
import logging

# Configurar logger específico
logger = logging.getLogger("user_permissions")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)

router = APIRouter()

def get_db():
    from main import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================================
# CONSTANTES Y VALIDACIONES
# ============================================

VALID_ROLES = {'admin', 'gestor', 'operador', 'usuario'}

# Estructura de referencia para validación
VALID_STRUCTURE = {
    "canViewEvents": bool,
    "canViewUsers": bool,
    "canViewStats": bool,
    "canViewTickets": bool,
    "canCreateEvents": bool,
    "canEditEvents": bool,
    "canDeleteEvents": bool,
    "canCreateUsers": bool,
    "canEditUsers": bool,
    "canDeleteUsers": bool,
    "canSellTickets": bool,
    "canValidateTickets": bool,
    "canRefundTickets": bool,
    "canManageDatabase": bool,
    "canManageConfig": bool,
    "canViewLogs": bool
}

# ============================================
# PERMISOS POR ROL (Defaults)
# ============================================

DEFAULT_PERMISSIONS = {
    "admin": {k: True for k in VALID_STRUCTURE},
    "gestor": {
        "canViewEvents": True, "canViewUsers": True, "canViewStats": True, "canViewTickets": True,
        "canCreateEvents": True, "canEditEvents": True, "canDeleteEvents": False,
        "canCreateUsers": False, "canEditUsers": False, "canDeleteUsers": False,
        "canSellTickets": True, "canValidateTickets": True, "canRefundTickets": False,
        "canManageDatabase": False, "canManageConfig": False, "canViewLogs": False
    },
    "operador": {
        "canViewEvents": True, "canViewUsers": False, "canViewStats": False, "canViewTickets": True,
        "canCreateEvents": False, "canEditEvents": False, "canDeleteEvents": False,
        "canCreateUsers": False, "canEditUsers": False, "canDeleteUsers": False,
        "canSellTickets": True, "canValidateTickets": True, "canRefundTickets": False,
        "canManageDatabase": False, "canManageConfig": False, "canViewLogs": False
    },
    "usuario": {
        "canViewEvents": True, "canViewUsers": False, "canViewStats": False, "canViewTickets": False,
        "canCreateEvents": False, "canEditEvents": False, "canDeleteEvents": False,
        "canCreateUsers": False, "canEditUsers": False, "canDeleteUsers": False,
        "canSellTickets": False, "canValidateTickets": False, "canRefundTickets": False,
        "canManageDatabase": False, "canManageConfig": False, "canViewLogs": False
    }
}

# ============================================
# MODELOS
# ============================================

class UpdatePermissionsRequest(BaseModel):
    role: str
    permissions: Any # Recibimos Any para poder validar manualmente si es string, dict, etc.

# ============================================
# ENDPOINTS
# ============================================

@router.get("/{user_id}/permissions")
def get_user_permissions(user_id: int, db: Session = Depends(get_db)):
    """Obtener permisos de un usuario de forma segura"""
    try:
        logger.info(f"📤 Obteniendo permisos del usuario {user_id}")

        # Verificar usuario
        user_query = text("SELECT id, role, permissions FROM users WHERE id = :user_id")
        result = db.execute(user_query, {"user_id": user_id})
        user = result.fetchone()

        if not user:
            logger.warning(f"⚠️ Usuario {user_id} no encontrado")
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        current_role = user.role if user.role in VALID_ROLES else "usuario"

        # Parsear permisos
        permissions_data = {}
        if user.permissions:
            try:
                if isinstance(user.permissions, str):
                    permissions_data = json.loads(user.permissions)
                elif isinstance(user.permissions, dict):
                    permissions_data = user.permissions
            except Exception as e:
                logger.error(f"❌ Error al parsear permisos guardados para usuario {user_id}: {e}")
                permissions_data = {}

        # Asegurar que tenga todas las keys
        final_permissions = DEFAULT_PERMISSIONS.get(current_role, DEFAULT_PERMISSIONS["usuario"]).copy()

        # Sobrescribir con lo guardado en BD, si es válido
        for key in VALID_STRUCTURE:
            if key in permissions_data and isinstance(permissions_data[key], bool):
                final_permissions[key] = permissions_data[key]

        return {
            "role": current_role,
            "permissions": final_permissions
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error crítico en get_user_permissions: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error interno al obtener permisos")


@router.put("/{user_id}/permissions")
def update_user_permissions(
    user_id: int,
    request: UpdatePermissionsRequest,
    db: Session = Depends(get_db)
):
    """Actualizar permisos con validación estricta"""
    try:
        logger.info(f"🔄 Intento de actualización de permisos para usuario {user_id}")
        logger.info(f"   Rol solicitado: {request.role}")

        # 1. Validar Usuario
        check_query = text("SELECT id FROM users WHERE id = :user_id")
        if not db.execute(check_query, {"user_id": user_id}).fetchone():
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # 2. Validar Rol Estricto
        if request.role not in VALID_ROLES:
            logger.warning(f"🚫 Rol inválido recibido: {request.role}")
            raise HTTPException(
                status_code=400,
                detail=f"Rol inválido. Permitidos: {', '.join(VALID_ROLES)}"
            )

        # 3. Normalizar Permissions
        raw_perms = request.permissions
        parsed_perms = {}

        if isinstance(raw_perms, str):
            try:
                parsed_perms = json.loads(raw_perms)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="El campo permissions no es un JSON válido")
        elif isinstance(raw_perms, dict):
            parsed_perms = raw_perms
        else:
            raise HTTPException(status_code=400, detail="Formato de permisos inválido")

        # 4. Validar Estructura y Tipos
        clean_permissions = {}
        for key, expected_type in VALID_STRUCTURE.items():
            if key not in parsed_perms:
                raise HTTPException(status_code=400, detail=f"Falta el permiso requerido: {key}")

            val = parsed_perms[key]
            if not isinstance(val, expected_type):
                # Intentar conversión segura si es string "true"/"false" (común en algunos frontends)
                if isinstance(val, str):
                    if val.lower() == 'true': val = True
                    elif val.lower() == 'false': val = False
                    else: raise HTTPException(status_code=400, detail=f"Valor inválido para {key}: se esperaba booleano")
                elif val != 0 and val != 1: # Permitir 0/1 como bool
                     raise HTTPException(status_code=400, detail=f"Tipo inválido para {key}: se esperaba booleano")

            clean_permissions[key] = bool(val)

        # 5. Persistencia
        permissions_json = json.dumps(clean_permissions)

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

        # 6. Commit Explícito
        db.commit()

        logger.info(f"✅ Permisos actualizados exitosamente para usuario {user_id}")
        logger.debug(f"   Permisos guardados: {clean_permissions}")

        return {
            "success": True,
            "message": "Permisos actualizados correctamente",
            "role": request.role,
            "permissions": clean_permissions
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error al actualizar permisos: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
