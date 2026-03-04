from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Any
from datetime import datetime
import traceback
from core.config_store import get_config as get_system_config, set_value, get_value

router = APIRouter()

# ============================================
# MODELOS
# ============================================

class ConfigUpdate(BaseModel):
    value: Any

# ============================================
# ENDPOINTS
# ============================================

@router.get("")
def get_config():
    """Obtener configuración del sistema"""
    try:
        # print("📤 Obteniendo configuración del sistema") # Reduced verbosity
        config = get_system_config()
        # print(f"✅ Configuración: {config}")

        return {
            **config,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        print(f"❌ Error al obtener configuración: {e}")
        traceback.print_exc()

        # Fallback safe config
        return {
            "maintenanceMode": False,
            "registrationEnabled": True,
            "sessionTimeout": 30
        }

@router.put("")
def update_config(config_data: dict):
    """Actualizar toda la configuración"""
    try:
        print(f"📤 Actualizando configuración completa: {config_data}")

        for key, value in config_data.items():
            set_value(key, value)

        print(f"✅ Configuración actualizada")

        return {
            "success": True,
            "config": get_system_config(),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        print(f"❌ Error al actualizar configuración: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar configuración: {str(e)}"
        )

@router.get("/{key}")
def get_parameter(key: str):
    """Obtener un parámetro específico"""
    try:
        value = get_value(key)

        if value is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Parámetro '{key}' no encontrado"
            )

        return {
            "key": key,
            "value": value,
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al obtener parámetro: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.patch("/{key}")
def update_parameter(key: str, update: ConfigUpdate):
    """Actualizar un parámetro específico"""
    try:
        print(f"📤 Actualizando parámetro: {key} = {update.value}")

        # Verify existence first (optional, but good for feedback)
        if get_value(key) is None:
             # Look if we can set it anyway? For now let's allow setting new keys or require existence?
             # existing logic allowed strict updating.
             # Let's trust set_value to handle it or just set it.
             pass

        set_value(key, update.value)

        return {
            "success": True,
            "key": key,
            "value": update.value,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        print(f"❌ Error al actualizar parámetro: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
