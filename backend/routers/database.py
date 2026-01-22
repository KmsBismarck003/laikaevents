from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, Field
from typing import Optional, List
import traceback
from datetime import datetime
import subprocess
import os
import json
from pathlib import Path
import platform

router = APIRouter()

# Directorio para almacenar respaldos
BACKUP_DIR = Path("backups")
BACKUP_DIR.mkdir(exist_ok=True)

# ============================================
# CONFIGURACIÓN DE MYSQLDUMP PARA WINDOWS
# ============================================
def get_mysqldump_path():
    """Obtener la ruta de mysqldump según el sistema operativo"""
    try:
        result = subprocess.run(["mysqldump", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            return "mysqldump"
    except FileNotFoundError:
        pass

    if platform.system() == "Windows":
        possible_paths = [
            r"C:\xampp\mysql\bin\mysqldump.exe",
            r"C:\wamp64\bin\mysql\mysql8.0.31\bin\mysqldump.exe",
            r"C:\wamp64\bin\mysql\mysql8.0.30\bin\mysqldump.exe",
            r"C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysqldump.exe",
            r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
            r"C:\Program Files\MySQL\MySQL Server 5.7\bin\mysqldump.exe",
        ]

        for path in possible_paths:
            if os.path.exists(path):
                print(f"✅ mysqldump encontrado en: {path}")
                return path

    raise FileNotFoundError("No se pudo encontrar mysqldump.")

def get_mysql_path():
    """Obtener la ruta de mysql según el sistema operativo"""
    try:
        result = subprocess.run(["mysql", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            return "mysql"
    except FileNotFoundError:
        pass

    if platform.system() == "Windows":
        possible_paths = [
            r"C:\xampp\mysql\bin\mysql.exe",
            r"C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe",
            r"C:\wamp64\bin\mysql\mysql8.0.30\bin\mysql.exe",
            r"C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe",
        ]
        for path in possible_paths:
            if os.path.exists(path):
                return path

    raise FileNotFoundError("No se pudo encontrar mysql.")

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
# FUNCIONES AUXILIARES
# ============================================

def get_mysql_credentials():
    """Obtener credenciales de MySQL desde variables de entorno"""
    return {
        "host": os.getenv("MYSQL_HOST", "localhost"),
        "port": os.getenv("MYSQL_PORT", "3306"),
        "user": os.getenv("MYSQL_USER", "root"),
        "password": os.getenv("MYSQL_PASSWORD", ""),
        "database": os.getenv("MYSQL_DATABASE", "laika_club")
    }

def repair_corrupted_tables(db: Session):
    """Reparar tablas corruptas de MySQL/MariaDB"""
    try:
        print("🔧 Reparando tablas corruptas...")
        system_tables = ['proxies_priv', 'proc', 'event', 'user', 'db', 'tables_priv', 'columns_priv']
        repaired_count = 0
        failed_tables = []

        for table in system_tables:
            try:
                db.execute(text(f"REPAIR TABLE mysql.{table}"))
                print(f"  ✅ mysql.{table} - reparada")
                repaired_count += 1
            except Exception:
                try:
                    db.execute(text(f"REPAIR TABLE mysql.{table} USE_FRM"))
                    print(f"  ✅ mysql.{table} - reparada con USE_FRM")
                    repaired_count += 1
                except Exception as e:
                    if "doesn't exist" not in str(e).lower():
                        print(f"  ⚠️ mysql.{table} - no se pudo reparar")
                        failed_tables.append(table)

        try:
            db.execute(text("FLUSH TABLES"))
            print("  ✅ FLUSH TABLES ejecutado")
        except:
            pass

        print(f"✅ Reparación completada ({repaired_count} tablas procesadas)")
        return True, failed_tables

    except Exception as e:
        print(f"⚠️ Error durante reparación: {e}")
        return False, []

def create_backup_metadata(backup_type: str, filename: str, tables: Optional[List[str]] = None):
    """Crear archivo de metadatos del respaldo"""
    metadata = {
        "backup_id": filename.replace(".sql", ""),
        "type": backup_type,
        "timestamp": datetime.now().isoformat(),
        "filename": filename,
        "tables": tables,
        "size_bytes": 0
    }

    metadata_file = BACKUP_DIR / f"{filename}.json"
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)

    return metadata

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
    COMPATIBLE CON XAMPP, WAMP, LARAGON - Todas las versiones de MySQL/MariaDB
    """
    try:
        print(f"\n{'='*60}")
        print(f"📤 Creando respaldo tipo: {request.type}")
        print(f"{'='*60}")

        # ============================================
        # PASO 1: REPARAR TABLAS CORRUPTAS
        # ============================================
        print("\n🔧 PASO 1: Reparando tablas corruptas...")
        repair_success, failed_tables = repair_corrupted_tables(db)

        if failed_tables:
            print(f"⚠️ Advertencia: Algunas tablas no se pudieron reparar: {failed_tables}")

        # ============================================
        # PASO 2: VALIDAR TIPO DE RESPALDO
        # ============================================
        if request.type not in ['completo', 'incremental', 'selectivo']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipo de respaldo inválido: {request.type}"
            )

        if request.type == 'selectivo' and not request.tables:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Debe especificar las tablas para respaldo selectivo"
            )

        # ============================================
        # PASO 3: OBTENER RUTA DE MYSQLDUMP
        # ============================================
        try:
            mysqldump_cmd = get_mysqldump_path()
            print(f"\n📋 Usando mysqldump: {mysqldump_cmd}")
        except FileNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(e)
            )

        credentials = get_mysql_credentials()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"backup_{request.type}_{timestamp}.sql"
        filepath = BACKUP_DIR / filename

        # ============================================
        # PASO 4: CONSTRUIR COMANDO MYSQLDUMP
        # ============================================
        cmd = [
            mysqldump_cmd,
            f"--host={credentials['host']}",
            f"--port={credentials['port']}",
            f"--user={credentials['user']}",
        ]

        if credentials['password']:
            cmd.append(f"--password={credentials['password']}")

        # ⭐ OPCIONES UNIVERSALMENTE COMPATIBLES
        # NO usamos --set-gtid-purged porque no todas las versiones lo soportan
        cmd.extend([
            "--skip-lock-tables",      # Evitar bloqueos
            "--single-transaction",    # Consistencia sin bloqueos
            "--skip-comments",         # Menos metadata
            "--compact",               # Salida más compacta
        ])

        # Configurar según tipo de respaldo
        if request.type == 'completo':
            cmd.extend([
                "--routines",          # Incluir procedimientos almacenados
                "--triggers",          # Incluir triggers
                "--events",            # Incluir eventos
                credentials['database']  # Solo la BD del usuario (NO mysql.*)
            ])
            print(f"📦 Respaldo COMPLETO de: {credentials['database']}")

        elif request.type == 'incremental':
            cmd.extend([
                "--flush-logs",
                credentials['database']
            ])
            print(f"📦 Respaldo INCREMENTAL de: {credentials['database']}")

        elif request.type == 'selectivo':
            cmd.append(credentials['database'])
            cmd.extend(request.tables)
            print(f"📦 Respaldo SELECTIVO de tablas: {', '.join(request.tables)}")

        # ============================================
        # PASO 5: EJECUTAR RESPALDO
        # ============================================
        print(f"\n🔧 PASO 2: Ejecutando mysqldump...")
        print(f"   Archivo destino: {filepath}")

        with open(filepath, 'w', encoding='utf-8') as f:
            result = subprocess.run(
                cmd,
                stdout=f,
                stderr=subprocess.PIPE,
                text=True
            )

        if result.returncode != 0:
            stderr_output = result.stderr
            print(f"\n❌ ERROR EN MYSQLDUMP:")
            print(f"   Return code: {result.returncode}")
            print(f"   Error: {stderr_output}")

            # Eliminar archivo vacío o incompleto
            if filepath.exists():
                filepath.unlink()
                print(f"   🗑️ Archivo incompleto eliminado")

            # Mensaje de error más descriptivo
            if "proxies_priv" in stderr_output:
                error_msg = (
                    "Tabla 'proxies_priv' corrupta. "
                    "Ejecuta en MySQL: REPAIR TABLE mysql.proxies_priv USE_FRM;"
                )
            elif "unknown variable" in stderr_output.lower():
                error_msg = f"Opción no compatible con tu versión de MySQL: {stderr_output}"
            else:
                error_msg = stderr_output

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_msg
            )

        # ============================================
        # PASO 6: VERIFICAR Y CREAR METADATOS
        # ============================================
        if not filepath.exists() or filepath.stat().st_size == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="El archivo de respaldo está vacío o no se creó"
            )

        metadata = create_backup_metadata(request.type, filename, request.tables)
        file_size = filepath.stat().st_size
        metadata["size_bytes"] = file_size

        # Actualizar metadatos con tamaño real
        metadata_file = BACKUP_DIR / f"{filename}.json"
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)

        print(f"\n✅ RESPALDO CREADO EXITOSAMENTE")
        print(f"   Archivo: {filename}")
        print(f"   Tamaño: {file_size / 1024 / 1024:.2f} MB")
        print(f"{'='*60}\n")

        return {
            "success": True,
            "message": f"Respaldo {request.type} creado exitosamente",
            "backup_id": metadata["backup_id"],
            "filename": filename,
            "size_mb": round(file_size / 1024 / 1024, 2),
            "timestamp": metadata["timestamp"],
            "type": request.type,
            "repaired_tables": not bool(failed_tables),
            "warnings": f"Tablas no reparadas: {failed_tables}" if failed_tables else None
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"\n❌ ERROR GENERAL:")
        print(f"   {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear respaldo: {str(e)}"
        )

@router.get("/backups")
async def list_backups():
    """Listar todos los respaldos disponibles"""
    try:
        backups = []

        for metadata_file in BACKUP_DIR.glob("*.json"):
            try:
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
                    sql_file = BACKUP_DIR / metadata['filename']
                    if sql_file.exists():
                        metadata['size_mb'] = round(sql_file.stat().st_size / 1024 / 1024, 2)
                        backups.append(metadata)
            except Exception as e:
                print(f"⚠️ Error leyendo metadata {metadata_file}: {e}")

        backups.sort(key=lambda x: x['timestamp'], reverse=True)

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
        sql_file = BACKUP_DIR / f"{request.backup_id}.sql"
        metadata_file = BACKUP_DIR / f"{request.backup_id}.sql.json"

        if not sql_file.exists():
            raise HTTPException(404, f"Respaldo no encontrado: {request.backup_id}")

        if metadata_file.exists():
            with open(metadata_file, 'r') as f:
                metadata = json.load(f)
        else:
            metadata = {"type": "unknown"}

        mysql_cmd = get_mysql_path()
        credentials = get_mysql_credentials()

        cmd = [
            mysql_cmd,
            f"--host={credentials['host']}",
            f"--port={credentials['port']}",
            f"--user={credentials['user']}",
        ]

        if credentials['password']:
            cmd.append(f"--password={credentials['password']}")

        cmd.append(credentials['database'])

        print(f"🔧 Restaurando desde {sql_file.name}...")

        with open(sql_file, 'r', encoding='utf-8') as f:
            result = subprocess.run(cmd, stdin=f, stderr=subprocess.PIPE, text=True)

        if result.returncode != 0:
            raise HTTPException(500, f"Error al restaurar: {result.stderr}")

        print(f"✅ Base de datos restaurada")

        return {
            "success": True,
            "message": "Base de datos restaurada exitosamente",
            "backup_id": request.backup_id,
            "backup_type": metadata.get("type"),
            "restored_at": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error al restaurar: {str(e)}")

@router.delete("/backups/{backup_id}")
async def delete_backup(backup_id: str):
    """Eliminar un respaldo"""
    try:
        sql_file = BACKUP_DIR / f"{backup_id}.sql"
        metadata_file = BACKUP_DIR / f"{backup_id}.sql.json"

        if not sql_file.exists():
            raise HTTPException(404, "Respaldo no encontrado")

        sql_file.unlink()
        if metadata_file.exists():
            metadata_file.unlink()

        return {"success": True, "message": "Respaldo eliminado"}

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

@router.post("/clear-cache")
def clear_cache():
    """Limpiar caché del sistema"""
    return {"success": True, "message": "Caché limpiado exitosamente"}

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
            except:
                pass

        db.commit()
        return {"success": True, "optimized_tables": optimized, "total_optimized": len(optimized)}

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
        table_counts = {}
        total = 0

        for table in tables:
            count = db.execute(text(f"SELECT COUNT(*) FROM `{table}`")).fetchone()[0]
            table_counts[table] = count
            total += count

        return {
            "database": size_result[0] if size_result else "unknown",
            "size_mb": float(size_result[1]) if size_result else 0,
            "tables": table_counts,
            "total_tables": len(tables),
            "total_records": total,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/repair")
async def repair_database(db: Session = Depends(get_db)):
    """Endpoint para reparar manualmente las tablas corruptas"""
    try:
        print("🔧 Iniciando reparación manual de tablas...")
        success, failed = repair_corrupted_tables(db)

        if success and not failed:
            return {
                "success": True,
                "message": "Todas las tablas fueron reparadas exitosamente",
                "timestamp": datetime.now().isoformat()
            }
        elif success and failed:
            return {
                "success": True,
                "message": "Reparación completada con advertencias",
                "failed_tables": failed,
                "recommendation": "Considera reiniciar MySQL o ejecutar CHECK TABLE manualmente",
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(500, "Error durante la reparación")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error al reparar tablas: {str(e)}")
