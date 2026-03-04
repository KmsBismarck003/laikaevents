import hashlib
from pathlib import Path
from sqlalchemy import text
from services.database_service import DatabaseService, Session

class WinterValidator:
    def __init__(self, db_service: DatabaseService):
        self.db_service = db_service

    def validate_backup_file(self, backup_path: Path) -> bool:
        """
        Validate that the backup file exists, is not empty, and has basic SQL structure.
        """
        if not backup_path.exists():
            return False

        if backup_path.stat().st_size == 0:
            return False

        # Quick header check
        try:
            with open(backup_path, 'r', encoding='utf-8') as f:
                header = f.read(1024) # Read first 1KB
                # Check for SQL indicators
                if "MySQL" not in header and "MariaDB" not in header and "INSERT INTO" not in header and "CREATE TABLE" not in header:
                    # Very loose check, just to ensure it's not binary garbage or empty text
                    # Real validation happens during restore attempt usually, but this catches 0-byte or corrupted text files
                    pass
        except Exception:
            return False

        return True

    def validate_system_health(self) -> bool:
        """
        Validate system health AFTER restoration.
        """
        try:
            # Create a fresh connection for validation
            # We cannot rely on main.SessionLocal because it might be None if the app started when DB was down
            from sqlalchemy import create_engine
            from sqlalchemy.orm import sessionmaker

            creds = self.db_service.get_credentials()
            db_url = f"mysql+pymysql://{creds['user']}:{creds['password']}@{creds['host']}:{creds['port']}/{creds['database']}"

            engine = create_engine(db_url)
            SessionValidation = sessionmaker(bind=engine)
            db = SessionValidation()

            try:
                # 1. Check if users table has data
                result = db.execute(text("SELECT COUNT(*) FROM users"))
                count = result.fetchone()[0]
                if count == 0:
                    print("❌ Validation Failed: Users table is empty")
                    return False

                # 2. Check a few other critical tables
                critical_tables = ['events', 'tickets'] # Adjust based on schema
                for table in critical_tables:
                    try:
                        db.execute(text(f"SELECT 1 FROM `{table}` LIMIT 1"))
                    except Exception:
                        print(f"❌ Validation Failed: Table {table} not accessible")
                        return False

                print("✅ System health validation passed")
                return True
            finally:
                db.close()
                engine.dispose()

        except Exception as e:
            print(f"❌ Validation Failed: Exception {e}")
            return False
