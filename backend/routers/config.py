from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Any
import traceback

router = APIRouter()

# Configuración en memoria (temporal - puedes moverla a MongoDB después)
_system_config = {
    "maintenance_mode": False,
    "registration_enabled": True,
    "session_timeout": 30,
    "max_tickets_per_user": 10
}

# ============================================
# MODELOS
# ============================================

class ConfigUpdate(BaseModel):
    value: Any

# ============================================
# ENDPOINTS
# ============================================

@router.get("/")
def get_config():
    """Obtener configuración del sistema"""
    try:
        print("📤 Obteniendo configuración del sistema")
        print(f"✅ Configuración obtenida: {_system_config}")
        return _system_config
        
    except Exception as e:
        print(f"❌ Error al obtener configuración: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener configuración"
        )

@router.patch("/{key}")
def update_parameter(key: str, update: ConfigUpdate):
    """Actualizar un parámetro de configuración"""
    try:
        print(f"📤 Actualizando configuración: {key} = {update.value}")
        
        if key not in _system_config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Parámetro '{key}' no encontrado"
            )
        
        _system_config[key] = update.value
        
        print(f"✅ Configuración actualizada")
        return {"success": True, "key": key, "value": update.value}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al actualizar configuración: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar configuración"
        )
