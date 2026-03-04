
# backend/core/config_store.py
from datetime import datetime

# Centralized in-memory configuration
# In a real production app with multiple workers, this should be in Redis or DB.
# For this single-process setup, in-memory is fine (and fast!).

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

def get_config():
    """Get entire config"""
    return _system_config

def get_value(key, default=None):
    """Get specific value handling camelCase/snake_case"""
    if key in _system_config:
        return _system_config[key]

    # Try alternate casing
    key_snake = key.replace('_', '')
    for config_key in _system_config:
        if config_key.replace('_', '') == key_snake:
            return _system_config[config_key]

    return default

def set_value(key, value):
    """Set value with dual casing support"""
    # 1. Update/Set exact key
    _system_config[key] = value

    # 2. Update alternate casing if exists
    key_snake = key.replace('_', '')
    for config_key in _system_config:
        if config_key != key and config_key.replace('_', '') == key_snake:
            _system_config[config_key] = value

def is_maintenance_mode():
    """Helper to check maintenance status"""
    return _system_config.get("maintenanceMode", False) or _system_config.get("maintenance_mode", False)
