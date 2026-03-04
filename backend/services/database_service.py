import subprocess
import os
import json
import platform
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy import text, create_engine
from sqlalchemy.orm import Session

class DatabaseService:
    BACKUP_DIR = Path("backups")

    def __init__(self):
        self.BACKUP_DIR.mkdir(exist_ok=True)

    def _get_tool_path(self, tool_name: str) -> str:
        """Obtener la ruta de una herramienta (mysql o mysqldump)"""
        # Intentar comando directo
        try:
            result = subprocess.run([tool_name, "--version"], capture_output=True, text=True)
            if result.returncode == 0:
                return tool_name
        except FileNotFoundError:
            pass

        # Buscar en rutas comunes de Windows
        if platform.system() == "Windows":
            possible_paths = [
                fr"C:\xampp\mysql\bin\{tool_name}.exe",
                fr"C:\wamp64\bin\mysql\mysql8.0.31\bin\{tool_name}.exe",
                fr"C:\wamp64\bin\mysql\mysql8.0.30\bin\{tool_name}.exe",
                fr"C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\{tool_name}.exe",
                fr"C:\Program Files\MySQL\MySQL Server 8.0\bin\{tool_name}.exe",
                fr"C:\Program Files\MySQL\MySQL Server 5.7\bin\{tool_name}.exe",
            ]
            for path in possible_paths:
                if os.path.exists(path):
                    return path

        raise FileNotFoundError(f"No se pudo encontrar {tool_name}.")

    def get_mysqldump_path(self) -> str:
        return self._get_tool_path("mysqldump")

    def get_mysql_path(self) -> str:
        return self._get_tool_path("mysql")

    def get_credentials(self) -> Dict[str, str]:
        """Obtener credenciales de MySQL desde variables de entorno"""
        return {
            "host": os.getenv("MYSQL_HOST", "localhost"),
            "port": os.getenv("MYSQL_PORT", "3306"),
            "user": os.getenv("MYSQL_USER", "root"),
            "password": os.getenv("MYSQL_PASSWORD", ""),
            "database": os.getenv("MYSQL_DATABASE", "laika_club")
        }

    def repair_corrupted_tables(self, db: Session) -> Tuple[bool, List[str]]:
        """Reparar tablas corruptas de MySQL/MariaDB"""
        try:
            print("🔧 Reparando tablas corruptas...")
            system_tables = ['proxies_priv', 'proc', 'event', 'user', 'db', 'tables_priv', 'columns_priv']
            repaired_count = 0
            failed_tables = []

            for table in system_tables:
                try:
                    db.execute(text(f"REPAIR TABLE mysql.{table}"))
                    repaired_count += 1
                except Exception:
                    try:
                        db.execute(text(f"REPAIR TABLE mysql.{table} USE_FRM"))
                        repaired_count += 1
                    except Exception as e:
                        if "doesn't exist" not in str(e).lower():
                            failed_tables.append(table)

            try:
                db.execute(text("FLUSH TABLES"))
            except:
                pass

            return True, failed_tables
        except Exception as e:
            print(f"⚠️ Error durante reparación: {e}")
            return False, []

    def create_backup(self, backup_type: str, tables: Optional[List[str]] = None, description: Optional[str] = None) -> Dict[str, Any]:
        """Crear respaldo de la base de datos"""
        mysqldump_cmd = self.get_mysqldump_path()
        credentials = self.get_credentials()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"backup_{backup_type}_{timestamp}.sql"
        filepath = self.BACKUP_DIR / filename

        cmd = [
            mysqldump_cmd,
            f"--host={credentials['host']}",
            f"--port={credentials['port']}",
            f"--user={credentials['user']}",
        ]

        if credentials['password']:
            cmd.append(f"--password={credentials['password']}")

        cmd.extend([
            "--skip-lock-tables",
            "--single-transaction",
            "--add-drop-table",
            "--add-drop-database",
            "--create-options",
            "--disable-keys",
            "--extended-insert",
            "--quick",
        ])

        if backup_type == 'completo':
            cmd.extend(["--routines", "--triggers", "--events", credentials['database']])
        elif backup_type == 'incremental':
            cmd.extend(["--flush-logs", credentials['database']])
        elif backup_type == 'selectivo' and tables:
            cmd.append(credentials['database'])
            cmd.extend(tables)

        print(f"🔧 Ejecutando mysqldump hacia {filepath}")

        with open(filepath, 'w', encoding='utf-8') as f:
            result = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, text=True)

        if result.returncode != 0:
            if filepath.exists():
                filepath.unlink()
            raise Exception(f"Mysqldump failed: {result.stderr}")

        if not filepath.exists() or filepath.stat().st_size == 0:
             raise Exception("Backup file is empty or was not created")

        metadata = {
            "backup_id": filename.replace(".sql", ""),
            "type": backup_type,
            "timestamp": datetime.now().isoformat(),
            "filename": filename,
            "tables": tables,
            "description": description,
            "size_bytes": filepath.stat().st_size
        }

        with open(self.BACKUP_DIR / f"{filename}.json", 'w') as f:
            json.dump(metadata, f, indent=2)

        return metadata

    def list_backups(self) -> List[Dict[str, Any]]:
        """Listar todos los respaldos disponibles ordenados por fecha (más reciente primero)"""
        backups = []
        for metadata_file in self.BACKUP_DIR.glob("*.json"):
            try:
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
                    sql_file = self.BACKUP_DIR / metadata['filename']
                    if sql_file.exists():
                        metadata['size_mb'] = round(sql_file.stat().st_size / 1024 / 1024, 2)
                        backups.append(metadata)
            except Exception:
                pass

        backups.sort(key=lambda x: x['timestamp'], reverse=True)
        return backups

    def ensure_database_exists(self):
        """Asegurar que la base de datos existe antes de restaurar"""
        try:
            creds = self.get_credentials()
            # Conectar sin seleccionar BD
            db_url = f"mysql+pymysql://{creds['user']}:{creds['password']}@{creds['host']}:{creds['port']}"
            engine = create_engine(db_url)

            with engine.connect() as conn:
                conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{creds['database']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
                print(f"✅ Base de datos `{creds['database']}` verificada/creada")

        except Exception as e:
            print(f"⚠️ Error al verificar base de datos: {e}")
            raise

    def restore_backup(self, backup_id: str) -> Dict[str, Any]:
        """Restaurar un respaldo específico"""
        sql_file = self.BACKUP_DIR / f"{backup_id}.sql"
        if not sql_file.exists():
            raise FileNotFoundError(f"Respaldo {backup_id} no encontrado")

        # 1. Asegurar que la BD existe
        self.ensure_database_exists()

        mysql_cmd = self.get_mysql_path()
        credentials = self.get_credentials()

        # Leer contenido
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()

        # Preparar SQL con bypass de restricciones
        restore_sql = f"""
SET FOREIGN_KEY_CHECKS = 0;
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';

{sql_content}

SET SQL_MODE=@OLD_SQL_MODE;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
SET FOREIGN_KEY_CHECKS = 1;
"""
        temp_file = self.BACKUP_DIR / f"temp_restore_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
        with open(temp_file, 'w', encoding='utf-8') as f:
            f.write(restore_sql)

        cmd = [
            mysql_cmd,
            f"--host={credentials['host']}",
            f"--port={credentials['port']}",
            f"--user={credentials['user']}",
        ]
        if credentials['password']:
            cmd.append(f"--password={credentials['password']}")

        cmd.extend(["--default-character-set=utf8mb4", credentials['database']])

        print(f"🔧 Restaurando {backup_id}...")
        with open(temp_file, 'r', encoding='utf-8') as f:
            result = subprocess.run(cmd, stdin=f, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)

        if temp_file.exists():
            temp_file.unlink()

        if result.returncode != 0:
            raise Exception(f"Restore failed: {result.stderr}")

        return {
            "success": True,
            "backup_id": backup_id,
            "restored_at": datetime.now().isoformat()
        }

    def delete_backup(self, backup_id: str) -> bool:
        """Eliminar un respaldo y sus metadatos"""
        sql_file = self.BACKUP_DIR / f"{backup_id}.sql"
        metadata_file = self.BACKUP_DIR / f"{backup_id}.sql.json"

        deleted = False
        if sql_file.exists():
            sql_file.unlink()
            deleted = True

        if metadata_file.exists():
            metadata_file.unlink()
            deleted = True

        return deleted
