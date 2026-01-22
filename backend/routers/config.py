from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Any
from datetime import datetime
import traceback

router = APIRouter()

# Configuración en memoria (temporal - puedes moverla a BD después)
_system_config = {
    "maintenance_mode": False,
    "maintenanceMode": False,
    "registration_enabled": True,
    "registrationEnabled": True,
    "session_timeout": 30,
    "sessionTimeout": 30,
    "max_tickets_per_user": 10,
    "maxTicketsPerUser": 10
}

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
        print("📤 Obteniendo configuración del sistema")
        print(f"✅ Configuración: {_system_config}")

        return {
            **_system_config,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        print(f"❌ Error al obtener configuración: {e}")
        traceback.print_exc()

        # Devolver configuración por defecto
        return {
            "maintenance_mode": False,
            "maintenanceMode": False,
            "registration_enabled": True,
            "registrationEnabled": True,
            "session_timeout": 30,
            "sessionTimeout": 30,
            "max_tickets_per_user": 10,
            "maxTicketsPerUser": 10,
            "timestamp": datetime.now().isoformat()
        }

@router.put("")
def update_config(config_data: dict):
    """Actualizar toda la configuración"""
    try:
        print(f"📤 Actualizando configuración completa: {config_data}")

        # Actualizar configuración en memoria
        for key, value in config_data.items():
            if key in _system_config:
                _system_config[key] = value

        print(f"✅ Configuración actualizada")

        return {
            "success": True,
            "config": _system_config,
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
        print(f"📤 Obteniendo parámetro: {key}")

        if key not in _system_config:
            # Intentar con guiones bajos en lugar de camelCase
            key_snake = key.replace('_', '')
            for config_key in _system_config:
                if config_key.replace('_', '') == key_snake:
                    key = config_key
                    break

        if key not in _system_config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Parámetro '{key}' no encontrado"
            )

        value = _system_config[key]
        print(f"✅ Parámetro obtenido: {key} = {value}")

        return {
            "key": key,
            "value": value,
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al obtener parámetro: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener parámetro: {str(e)}"
        )

@router.patch("/{key}")
def update_parameter(key: str, update: ConfigUpdate):
    """Actualizar un parámetro específico"""
    try:
        print(f"📤 Actualizando parámetro: {key} = {update.value}")

        # Buscar el key (manejar snake_case y camelCase)
        actual_key = key
        if key not in _system_config:
            key_snake = key.replace('_', '')
            for config_key in _system_config:
                if config_key.replace('_', '') == key_snake:
                    actual_key = config_key
                    break

        if actual_key not in _system_config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Parámetro '{key}' no encontrado"
            )

        # Actualizar ambas versiones (snake_case y camelCase)
        _system_config[actual_key] = update.value

        # Si existe la versión alternativa, también actualizarla
        if actual_key.replace('_', '') != actual_key:
            camel_key = ''.join(
                word.capitalize() if i > 0 else word
                for i, word in enumerate(actual_key.split('_'))
            )
            if camel_key in _system_config:
                _system_config[camel_key] = update.value

        print(f"✅ Parámetro actualizado: {actual_key} = {update.value}")

        return {
            "success": True,
            "key": actual_key,
            "value": update.value,
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al actualizar parámetro: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar parámetro: {str(e)}"
        )
