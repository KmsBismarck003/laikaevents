from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, Field
from typing import Optional, List
import traceback
from datetime import datetime
import json
from services.database_service import DatabaseService

router = APIRouter()
db_service = DatabaseService()

def get_db():
    from main import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================================
# MODELOS PYDANTIC
# ============================================

class BackupRequest(BaseModel):
    type: str = Field(..., description="Tipo: 'completo', 'incremental', 'selectivo'")
    tables: Optional[List[str]] = Field(None, description="Tablas para respaldo selectivo")
    description: Optional[str] = Field(None, description="Descripción del respaldo")

class RestoreRequest(BaseModel):
    backup_id: str = Field(..., description="ID del respaldo a restaurar")

# ============================================
# ENDPOINTS
# ============================================

@router.post("/backup")
async def create_backup(
    request: BackupRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Crear respaldo de la base de datos
    """
    try:
        print(f"\n{'='*60}")
        print(f"📤 Creando respaldo tipo: {request.type}")
        print(f"{'='*60}")

        # PASO 1: REPARAR TABLAS CORRUPTAS
        db_service.repair_corrupted_tables(db)

        # PASO 2: VALIDAR SOLICITUD
        if request.type not in ['completo', 'incremental', 'selectivo']:
            raise HTTPException(400, f"Tipo de respaldo inválido: {request.type}")
        if request.type == 'selectivo' and not request.tables:
            raise HTTPException(400, "Debe especificar las tablas para respaldo selectivo")

        # PASO 3: EJECUTAR RESPALDO
        metadata = db_service.create_backup(request.type, request.tables, request.description)

        print(f"\n✅ RESPALDO CREADO EXITOSAMENTE: {metadata['filename']}")
        return {
            "success": True,
            "message": f"Respaldo {request.type} creado exitosamente",
            "backup_id": metadata["backup_id"],
            "filename": metadata["filename"],
            "size_mb": round(metadata["size_bytes"] / 1024 / 1024, 2),
            "timestamp": metadata["timestamp"]
        }

    except Exception as e:
        print(f"❌ Error al crear respaldo: {e}")
        traceback.print_exc()
        raise HTTPException(500, f"Error al crear respaldo: {str(e)}")

@router.get("/backups")
async def list_backups():
    """Listar todos los respaldos disponibles"""
    try:
        backups = db_service.list_backups()
        return {
            "success": True,
            "count": len(backups),
            "backups": backups
        }
    except Exception as e:
        raise HTTPException(500, f"Error al listar respaldos: {str(e)}")

@router.post("/restore")
async def restore_backup(request: RestoreRequest, db: Session = Depends(get_db)):
    """Restaurar base de datos desde un respaldo"""
    try:
        print(f"\n{'='*60}")
        print(f"🔄 RESTAURANDO RESPALDO: {request.backup_id}")

        result = db_service.restore_backup(request.backup_id)

        print(f"\n✅ RESTAURACIÓN COMPLETADA EXITOSAMENTE")
        return {
            "success": True,
            "message": "Base de datos restaurada exitosamente",
            "backup_id": result["backup_id"],
            "restored_at": result["restored_at"]
        }

    except FileNotFoundError:
        raise HTTPException(404, "Respaldo no encontrado")
    except Exception as e:
        print(f"❌ Error al restaurar: {e}")
        raise HTTPException(500, f"Error al restaurar: {str(e)}")

@router.delete("/backups/{backup_id}")
async def delete_backup(backup_id: str):
    """Eliminar un respaldo"""
    try:
        if db_service.delete_backup(backup_id):
            return {"success": True, "message": "Respaldo eliminado"}
        else:
            raise HTTPException(404, "Respaldo no encontrado")
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/tables")
async def list_tables(db: Session = Depends(get_db)):
    """Listar todas las tablas disponibles"""
    try:
        result = db.execute(text("SHOW TABLES"))
        tables = [row[0] for row in result.fetchall()]

        table_info = []
        for table in tables:
            count = db.execute(text(f"SELECT COUNT(*) FROM `{table}`")).fetchone()[0]
            table_info.append({"name": table, "row_count": count})

        return {"success": True, "count": len(tables), "tables": table_info}

    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/optimize")
def optimize_database(db: Session = Depends(get_db)):
    """Optimizar todas las tablas"""
    try:
        result = db.execute(text("SHOW TABLES"))
        tables = [row[0] for row in result.fetchall()]
        optimized = []
        for table in tables:
            try:
                db.execute(text(f"OPTIMIZE TABLE `{table}`"))
                optimized.append(table)
            except: pass
        db.commit()
        return {"success": True, "optimized_tables": optimized}
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/stats")
def get_database_stats(db: Session = Depends(get_db)):
    """Obtener estadísticas de la base de datos"""
    try:
        size_result = db.execute(text("""
            SELECT table_schema, ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
            FROM information_schema.tables WHERE table_schema = DATABASE() GROUP BY table_schema
        """)).fetchone()

        tables = [row[0] for row in db.execute(text("SHOW TABLES")).fetchall()]
        total = sum(db.execute(text(f"SELECT COUNT(*) FROM `{t}`")).fetchone()[0] for t in tables)

        return {
            "database": size_result[0] if size_result else "unknown",
            "size_mb": float(size_result[1]) if size_result else 0,
            "total_tables": len(tables),
            "total_records": total
        }
    except Exception as e:
        raise HTTPException(500, str(e))
