import subprocess
import os
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime
from services.database_service import DatabaseService
from sqlalchemy.orm import Session
from sqlalchemy import text

class RestoreEngine:
    """
    Module responsible for executing the restore process.
    It wraps the low-level database operations.
    """

    def __init__(self):
        self.db_service = DatabaseService()

    def restore_from_external_source(self, external_file_path: str, backup_id: str) -> Dict[str, Any]:
        """
        Execute restore from an external .sql file.
        WARNING: verify_password SHOULD be called before this method.
        """
        sql_file = Path(external_file_path)

        if not sql_file.exists():
             raise FileNotFoundError(f"Backup file not found: {external_file_path}")

        print(f"🔄 INICIANDO RESTAURACIÓN DE EMERGENCIA DESDE: {sql_file}")

        # 1. Ensure DB exists (reuse existing service logic)
        self.db_service.ensure_database_exists()

        # 2. Get tools and creds
        mysql_cmd = self.db_service.get_mysql_path()
        credentials = self.db_service.get_credentials()

        # 3. Read content
        try:
             with open(sql_file, 'r', encoding='utf-8') as f:
                  sql_content = f.read()
        except UnicodeDecodeError:
             # Fallback for older backups
             with open(sql_file, 'r', encoding='latin-1') as f:
                  sql_content = f.read()

        # 4. Prepare SQL with safety wrappers
        restore_sql = f"""
SET FOREIGN_KEY_CHECKS = 0;
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';

{sql_content}

SET SQL_MODE=@OLD_SQL_MODE;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
SET FOREIGN_KEY_CHECKS = 1;
"""
        # Create temp file in SAFE local dir, not on external drive to avoid locking issues
        temp_dir = Path("backups/temp_restores")
        temp_dir.mkdir(exist_ok=True, parents=True)

        temp_file = temp_dir / f"restore_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"

        with open(temp_file, 'w', encoding='utf-8') as f:
             f.write(restore_sql)

        # 5. Execute
        cmd = [
            mysql_cmd,
            f"--host={credentials['host']}",
            f"--port={credentials['port']}",
            f"--user={credentials['user']}",
        ]
        if credentials['password']:
            cmd.append(f"--password={credentials['password']}")

        cmd.extend(["--default-character-set=utf8mb4", credentials['database']])

        print(f"🔧 Ejecutando comando mysql...")
        try:
            with open(temp_file, 'r', encoding='utf-8') as f:
                 result = subprocess.run(cmd, stdin=f, capture_output=True, text=True)

            if result.returncode != 0:
                 raise Exception(f"MySQL Error: {result.stderr}")

            return {
                "success": True,
                "message": "Restauración completada",
                "restored_from": str(sql_file),
                "timestamp": datetime.now().isoformat()
            }

        finally:
            # Cleanup
            if temp_file.exists():
                temp_file.unlink()
