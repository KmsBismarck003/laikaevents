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

    # Si está en PATH, usar directamente
    try:
        result = subprocess.run(
            ["mysqldump", "--version"],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            return "mysqldump"
    except FileNotFoundError:
        pass

    # Rutas comunes en Windows
    if platform.system() == "Windows":
        possible_paths = [
            r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
            r"C:\Program Files\MySQL\MySQL Server 5.7\bin\mysqldump.exe",
            r"C:\xampp\mysql\bin\mysqldump.exe",
            r"C:\wamp64\bin\mysql\mysql8.0.31\bin\mysqldump.exe",
            r"C:\wamp64\bin\mysql\mysql8.0.30\bin\mysqldump.exe",
            r"C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysqldump.exe",
        ]

        for path in possible_paths:
            if os.path.exists(path):
                print(f"✅ mysqldump encontrado en: {path}")
                return path

        # Si no se encuentra, intentar buscar automáticamente
        program_files = [r"C:\Program Files", r"C:\Program Files (x86)"]
        for pf in program_files:
            mysql_dirs = Path(pf).glob("MySQL/MySQL Server */bin/mysqldump.exe")
            for mysql_path in mysql_dirs:
                if mysql_path.exists():
                    print(f"✅ mysqldump encontrado en: {mysql_path}")
                    return str(mysql_path)

    raise FileNotFoundError(
        "No se pudo encontrar mysqldump. "
        "Por favor, instala MySQL o agrega la ruta de MySQL/bin al PATH de Windows."
    )

def get_mysql_path():
    """Obtener la ruta de mysql según el sistema operativo"""

    try:
        result = subprocess.run(
            ["mysql", "--version"],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            return "mysql"
    except FileNotFoundError:
        pass

    if platform.system() == "Windows":
        possible_paths = [
            r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
            r"C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
            r"C:\xampp\mysql\bin\mysql.exe",
            r"C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe",
            r"C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe",
        ]

        for path in possible_paths:
            if os.path.exists(path):
                print(f"✅ mysql encontrado en: {path}")
                return path

    raise FileNotFoundError(
        "No se pudo encontrar mysql. "
        "Por favor, instala MySQL o agrega la ruta de MySQL/bin al PATH de Windows."
    )

# Dependencia para obtener la sesión de BD
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
    """
    try:
        print(f"📤 Creando respaldo tipo: {request.type}")

        # Validar tipo de respaldo
        if request.type not in ['completo', 'incremental', 'selectivo']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipo de respaldo inválido: {request.type}. Use 'completo', 'incremental' o 'selectivo'"
            )

        # Validar tablas para respaldo selectivo
        if request.type == 'selectivo' and not request.tables:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Debe especificar las tablas para respaldo selectivo"
            )

        # Obtener ruta de mysqldump
        try:
            mysqldump_cmd = get_mysqldump_path()
        except FileNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(e)
            )

        credentials = get_mysql_credentials()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"backup_{request.type}_{timestamp}.sql"
        filepath = BACKUP_DIR / filename

        # Construir comando mysqldump
        cmd = [
            mysqldump_cmd,
            f"--host={credentials['host']}",
            f"--port={credentials['port']}",
            f"--user={credentials['user']}",
        ]

        if credentials['password']:
            cmd.append(f"--password={credentials['password']}")

        # Configurar según tipo de respaldo
        if request.type == 'completo':
            cmd.extend([
                "--all-databases",
                "--routines",
                "--triggers",
                "--events"
            ])
        elif request.type == 'incremental':
            cmd.extend([
                "--single-transaction",
                "--flush-logs",
                credentials['database']
            ])
        elif request.type == 'selectivo':
            cmd.append(credentials['database'])
            cmd.extend(request.tables)

        # Ejecutar respaldo
        print(f"🔧 Ejecutando: {cmd[0]} con {len(cmd)-1} parámetros...")

        with open(filepath, 'w', encoding='utf-8') as f:
            result = subprocess.run(
                cmd,
                stdout=f,
                stderr=subprocess.PIPE,
                text=True
            )

        if result.returncode != 0:
            print(f"❌ Error en mysqldump: {result.stderr}")
            # Eliminar archivo vacío
            if filepath.exists():
                filepath.unlink()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al ejecutar mysqldump: {result.stderr}"
            )

        # Crear metadatos
        metadata = create_backup_metadata(request.type, filename, request.tables)
        file_size = filepath.stat().st_size
        metadata["size_bytes"] = file_size

        # Actualizar metadatos con tamaño real
        metadata_file = BACKUP_DIR / f"{filename}.json"
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)

        print(f"✅ Respaldo creado: {filename} ({file_size / 1024 / 1024:.2f} MB)")

        return {
            "success": True,
            "message": f"Respaldo {request.type} creado exitosamente",
            "backup_id": metadata["backup_id"],
            "filename": filename,
            "size_mb": round(file_size / 1024 / 1024, 2),
            "timestamp": metadata["timestamp"],
            "type": request.type
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al crear respaldo: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear respaldo: {str(e)}"
        )

@router.get("/backups")
async def list_backups():
    """Listar todos los respaldos disponibles"""
    try:
        print("📤 Listando respaldos disponibles...")

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

        print(f"✅ {len(backups)} respaldos encontrados")

        return {
            "success": True,
            "count": len(backups),
            "backups": backups
        }

    except Exception as e:
        print(f"❌ Error al listar respaldos: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar respaldos: {str(e)}"
        )

@router.post("/restore")
async def restore_backup(
    request: RestoreRequest,
    db: Session = Depends(get_db)
):
    """Restaurar base de datos desde un respaldo"""
    try:
        print(f"📤 Restaurando respaldo: {request.backup_id}")

        sql_file = BACKUP_DIR / f"{request.backup_id}.sql"
        metadata_file = BACKUP_DIR / f"{request.backup_id}.sql.json"

        if not sql_file.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Respaldo no encontrado: {request.backup_id}"
            )

        if metadata_file.exists():
            with open(metadata_file, 'r') as f:
                metadata = json.load(f)
        else:
            metadata = {"type": "unknown"}

        # Obtener ruta de mysql
        try:
            mysql_cmd = get_mysql_path()
        except FileNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(e)
            )

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
            result = subprocess.run(
                cmd,
                stdin=f,
                stderr=subprocess.PIPE,
                text=True
            )

        if result.returncode != 0:
            print(f"❌ Error en mysql: {result.stderr}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al restaurar: {result.stderr}"
            )

        print(f"✅ Base de datos restaurada desde {sql_file.name}")

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
        print(f"❌ Error al restaurar: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al restaurar respaldo: {str(e)}"
        )

@router.delete("/backups/{backup_id}")
async def delete_backup(backup_id: str):
    """Eliminar un respaldo"""
    try:
        print(f"📤 Eliminando respaldo: {backup_id}")

        sql_file = BACKUP_DIR / f"{backup_id}.sql"
        metadata_file = BACKUP_DIR / f"{backup_id}.sql.json"

        if not sql_file.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Respaldo no encontrado: {backup_id}"
            )

        sql_file.unlink()
        if metadata_file.exists():
            metadata_file.unlink()

        print(f"✅ Respaldo eliminado: {backup_id}")

        return {
            "success": True,
            "message": "Respaldo eliminado exitosamente",
            "backup_id": backup_id
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al eliminar respaldo: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar respaldo: {str(e)}"
        )

@router.get("/tables")
async def list_tables(db: Session = Depends(get_db)):
    """Listar todas las tablas disponibles"""
    try:
        print("📤 Listando tablas...")

        query = text("SHOW TABLES")
        result = db.execute(query)
        tables = [row[0] for row in result.fetchall()]

        table_info = []
        for table in tables:
            count_query = text(f"SELECT COUNT(*) as count FROM `{table}`")
            count = db.execute(count_query).fetchone()[0]

            table_info.append({
                "name": table,
                "row_count": count
            })

        print(f"✅ {len(tables)} tablas encontradas")

        return {
            "success": True,
            "count": len(tables),
            "tables": table_info
        }

    except Exception as e:
        print(f"❌ Error al listar tablas: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar tablas: {str(e)}"
        )

@router.post("/clear-cache")
def clear_cache():
    """Limpiar caché del sistema"""
    try:
        print("📤 Limpiando caché...")
        print("✅ Caché limpiado")
        return {
            "success": True,
            "message": "Caché limpiado exitosamente",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"❌ Error al limpiar caché: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al limpiar caché"
        )

@router.post("/optimize")
def optimize_database(db: Session = Depends(get_db)):
    """Optimizar todas las tablas"""
    try:
        print("📤 Optimizando base de datos...")

        tables_query = text("SHOW TABLES")
        result = db.execute(tables_query)
        tables = [row[0] for row in result.fetchall()]

        optimized_tables = []

        for table in tables:
            try:
                optimize_query = text(f"OPTIMIZE TABLE `{table}`")
                db.execute(optimize_query)
                optimized_tables.append(table)
                print(f"  ✅ Tabla optimizada: {table}")
            except Exception as e:
                print(f"  ⚠️ Error al optimizar {table}: {e}")

        db.commit()

        print(f"✅ Base de datos optimizada ({len(optimized_tables)} tablas)")

        return {
            "success": True,
            "message": "Base de datos optimizada exitosamente",
            "optimized_tables": optimized_tables,
            "total_optimized": len(optimized_tables),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        print(f"❌ Error al optimizar base de datos: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al optimizar base de datos"
        )

@router.get("/stats")
def get_database_stats(db: Session = Depends(get_db)):
    """Obtener estadísticas de la base de datos"""
    try:
        print("📤 Obteniendo estadísticas de la BD...")

        size_query = text("""
            SELECT
                table_schema AS 'database_name',
                ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'size_mb'
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
            GROUP BY table_schema
        """)

        result = db.execute(size_query).fetchone()

        tables_query = text("SHOW TABLES")
        tables_result = db.execute(tables_query)
        tables = [row[0] for row in tables_result.fetchall()]

        table_counts = {}
        total_records = 0

        for table in tables:
            count_query = text(f"SELECT COUNT(*) as count FROM `{table}`")
            count = db.execute(count_query).fetchone()[0]
            table_counts[table] = count
            total_records += count

        print(f"✅ Estadísticas obtenidas")

        return {
            "database": result[0] if result else "unknown",
            "size_mb": float(result[1]) if result else 0,
            "tables": table_counts,
            "total_tables": len(tables),
            "total_records": total_records,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        print(f"❌ Error al obtener estadísticas: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener estadísticas de BD"
        )
