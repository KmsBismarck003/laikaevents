from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import traceback
import json
import os

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

class AutomaticBackupConfig(BaseModel):
    enabled: bool = False
    frequency: str = 'daily'  # hourly, daily, weekly, monthly
    time: str = '02:00'  # HH:MM formato 24h
    backupType: str = 'completo'  # completo, incremental
    retentionDays: int = 30
    maxBackups: int = 10
    notifyOnSuccess: bool = True
    notifyOnError: bool = True
    dayOfWeek: int = 0  # 0-6 (0 = Domingo)
    dayOfMonth: int = 1  # 1-31

# ============================================
# FUNCIONES AUXILIARES
# ============================================

def calculate_next_backup(config: AutomaticBackupConfig) -> datetime:
    """Calcular la fecha y hora del próximo respaldo"""
    now = datetime.now()
    time_parts = config.time.split(':')
    hour = int(time_parts[0])
    minute = int(time_parts[1])

    if config.frequency == 'hourly':
        # Próxima hora en punto
        next_backup = now.replace(minute=0, second=0, microsecond=0)
        if now.minute > 0:
            next_backup += timedelta(hours=1)

    elif config.frequency == 'daily':
        # Mismo día a la hora configurada, o mañana si ya pasó
        next_backup = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if now >= next_backup:
            next_backup += timedelta(days=1)

    elif config.frequency == 'weekly':
        # Próximo día de la semana configurado
        days_ahead = config.dayOfWeek - now.weekday()
        if days_ahead <= 0:  # El día ya pasó esta semana
            days_ahead += 7
        next_backup = now + timedelta(days=days_ahead)
        next_backup = next_backup.replace(hour=hour, minute=minute, second=0, microsecond=0)

    elif config.frequency == 'monthly':
        # Próximo día del mes configurado
        next_backup = now.replace(day=config.dayOfMonth, hour=hour, minute=minute, second=0, microsecond=0)
        if now >= next_backup:
            # Próximo mes
            if now.month == 12:
                next_backup = next_backup.replace(year=now.year + 1, month=1)
            else:
                next_backup = next_backup.replace(month=now.month + 1)

    else:
        next_backup = now + timedelta(days=1)

    return next_backup

def cleanup_old_backups(config: AutomaticBackupConfig):
    """Limpiar respaldos antiguos según la configuración de retención"""
    try:
        from pathlib import Path
        backup_dir = Path("backups")

        if not backup_dir.exists():
            return

        # Obtener todos los archivos de respaldo
        backup_files = sorted(
            backup_dir.glob("backup_*.sql"),
            key=lambda x: x.stat().st_mtime,
            reverse=True
        )

        # Eliminar por antigüedad (retentionDays)
        cutoff_date = datetime.now() - timedelta(days=config.retentionDays)

        for backup_file in backup_files:
            file_time = datetime.fromtimestamp(backup_file.stat().st_mtime)
            if file_time < cutoff_date:
                # Eliminar archivo .sql y .json
                backup_file.unlink()
                json_file = backup_dir / f"{backup_file.stem}.json"
                if json_file.exists():
                    json_file.unlink()
                print(f"🗑️ Respaldo antiguo eliminado: {backup_file.name}")

        # Eliminar por cantidad (maxBackups)
        remaining_files = sorted(
            backup_dir.glob("backup_*.sql"),
            key=lambda x: x.stat().st_mtime,
            reverse=True
        )

        if len(remaining_files) > config.maxBackups:
            for backup_file in remaining_files[config.maxBackups:]:
                backup_file.unlink()
                json_file = backup_dir / f"{backup_file.stem}.json"
                if json_file.exists():
                    json_file.unlink()
                print(f"🗑️ Respaldo excedente eliminado: {backup_file.name}")

        print(f"✅ Limpieza de respaldos completada")

    except Exception as e:
        print(f"⚠️ Error al limpiar respaldos antiguos: {e}")

# ============================================
# ENDPOINTS
# ============================================

@router.get("/automatic-backup/config")
def get_automatic_backup_config(db: Session = Depends(get_db)):
    """Obtener configuración de respaldos automáticos"""
    try:
        print("📤 Obteniendo configuración de respaldos automáticos...")

        # ✅ CORRECCIÓN: Escapar 'key' con backticks
        config_query = text("""
            SELECT value FROM system_config
            WHERE `key` = 'automatic_backup_config'
        """)
        result = db.execute(config_query)
        row = result.fetchone()

        if row and row.value:
            config_dict = json.loads(row.value)
            config = AutomaticBackupConfig(**config_dict)
        else:
            # Configuración por defecto
            config = AutomaticBackupConfig()

        # Obtener último respaldo
        last_backup_query = text("""
            SELECT MAX(created_at) as last_backup
            FROM backup_history
        """)
        last_result = db.execute(last_backup_query)
        last_row = last_result.fetchone()
        last_backup = last_row.last_backup if last_row and last_row.last_backup else None

        # Calcular próximo respaldo
        next_backup = None
        if config.enabled:
            next_backup = calculate_next_backup(config).isoformat()

        print("✅ Configuración obtenida")

        return {
            "config": config.dict(),
            "lastBackup": last_backup.isoformat() if last_backup else None,
            "nextBackup": next_backup
        }

    except Exception as e:
        print(f"❌ Error al obtener configuración: {e}")
        traceback.print_exc()
        # Retornar configuración por defecto si hay error
        return {
            "config": AutomaticBackupConfig().dict(),
            "lastBackup": None,
            "nextBackup": None
        }

@router.put("/automatic-backup/config")
def update_automatic_backup_config(
    config: AutomaticBackupConfig,
    db: Session = Depends(get_db)
):
    """Actualizar configuración de respaldos automáticos"""
    try:
        print("📤 Actualizando configuración de respaldos automáticos...")

        config_json = json.dumps(config.dict())

        # Verificar si existe la tabla system_config
        create_table_query = text("""
            CREATE TABLE IF NOT EXISTS system_config (
                id INT AUTO_INCREMENT PRIMARY KEY,
                `key` VARCHAR(255) UNIQUE NOT NULL,
                `value` TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)
        db.execute(create_table_query)

        # ✅ CORRECCIÓN: Escapar 'key' y 'value' con backticks
        upsert_query = text("""
            INSERT INTO system_config (`key`, `value`)
            VALUES ('automatic_backup_config', :config)
            ON DUPLICATE KEY UPDATE `value` = :config
        """)

        db.execute(upsert_query, {"config": config_json})
        db.commit()

        # Calcular próximo respaldo
        next_backup = None
        if config.enabled:
            next_backup = calculate_next_backup(config)

        print("✅ Configuración actualizada")

        return {
            "success": True,
            "message": "Configuración guardada correctamente",
            "nextBackup": next_backup.isoformat() if next_backup else None
        }

    except Exception as e:
        db.rollback()
        print(f"❌ Error al actualizar configuración: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al guardar configuración"
        )

@router.get("/automatic-backup/scheduled")
def get_scheduled_backups(db: Session = Depends(get_db)):
    """Obtener lista de respaldos programados"""
    try:
        print("📤 Obteniendo respaldos programados...")

        # Crear tabla si no existe
        create_table_query = text("""
            CREATE TABLE IF NOT EXISTS backup_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                backup_id VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                status VARCHAR(50) NOT NULL,
                scheduled_at DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                error_message TEXT
            )
        """)
        db.execute(create_table_query)

        # Obtener respaldos programados pendientes
        query = text("""
            SELECT * FROM backup_history
            WHERE status = 'scheduled'
            ORDER BY scheduled_at ASC
            LIMIT 20
        """)

        result = db.execute(query)
        scheduled = [dict(row._mapping) for row in result.fetchall()]

        print(f"✅ {len(scheduled)} respaldos programados encontrados")

        return {
            "scheduled": scheduled
        }

    except Exception as e:
        print(f"❌ Error al obtener respaldos programados: {e}")
        traceback.print_exc()
        return {"scheduled": []}

@router.delete("/automatic-backup/scheduled/{schedule_id}")
def cancel_scheduled_backup(schedule_id: int, db: Session = Depends(get_db)):
    """Cancelar un respaldo programado"""
    try:
        print(f"📤 Cancelando respaldo programado {schedule_id}...")

        delete_query = text("""
            DELETE FROM backup_history
            WHERE id = :schedule_id AND status = 'scheduled'
        """)

        result = db.execute(delete_query, {"schedule_id": schedule_id})
        db.commit()

        if result.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Respaldo programado no encontrado"
            )

        print("✅ Respaldo cancelado")

        return {
            "success": True,
            "message": "Respaldo cancelado correctamente"
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error al cancelar respaldo: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al cancelar respaldo"
        )

@router.post("/automatic-backup/trigger")
async def trigger_backup_now(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Ejecutar un respaldo inmediatamente"""
    try:
        print("📤 Ejecutando respaldo inmediato...")

        # Obtener configuración actual
        config_query = text("""
            SELECT value FROM system_config
            WHERE key = 'automatic_backup_config'
        """)
        result = db.execute(config_query)
        row = result.fetchone()

        if row and row.value:
            config_dict = json.loads(row.value)
            backup_type = config_dict.get('backupType', 'completo')
        else:
            backup_type = 'completo'

        # Importar función de respaldo
        from routers.database import create_backup, BackupRequest

        # Crear respaldo
        request = BackupRequest(type=backup_type)
        result = await create_backup(request, background_tasks, db)

        print("✅ Respaldo inmediato completado")

        return result

    except Exception as e:
        print(f"❌ Error al ejecutar respaldo inmediato: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al ejecutar respaldo"
        )

@router.post("/automatic-backup/cleanup")
def cleanup_old_backups_endpoint(db: Session = Depends(get_db)):
    """Ejecutar limpieza manual de respaldos antiguos"""
    try:
        print("📤 Ejecutando limpieza de respaldos antiguos...")

        # Obtener configuración
        config_query = text("""
            SELECT value FROM system_config
            WHERE key = 'automatic_backup_config'
        """)
        result = db.execute(config_query)
        row = result.fetchone()

        if row and row.value:
            config_dict = json.loads(row.value)
            config = AutomaticBackupConfig(**config_dict)
        else:
            config = AutomaticBackupConfig()

        # Ejecutar limpieza
        cleanup_old_backups(config)

        print("✅ Limpieza completada")

        return {
            "success": True,
            "message": "Limpieza de respaldos completada"
        }

    except Exception as e:
        print(f"❌ Error en limpieza: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error en limpieza de respaldos"
        )
