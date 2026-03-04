import time
import shutil
from pathlib import Path
from datetime import datetime
from services.database_service import DatabaseService
from winter_plan.core.state import StateManager, WinterState
from winter_plan.core.logger import WinterLogger
from winter_plan.core.validator import WinterValidator

class WinterRestorer:
    def __init__(self):
        self.db_service = DatabaseService()
        self.state_manager = StateManager()
        self.logger = WinterLogger()
        self.validator = WinterValidator(self.db_service)
        self.QUARANTINE_DIR = Path("backups/quarantine")
        self.QUARANTINE_DIR.mkdir(parents=True, exist_ok=True)

    def execute_restoration(self):
        """
        Main entry point for restoration process.
        Returns True if successful, False otherwise.
        """
        self.state_manager.set_state(WinterState.RESTORING, "Starting automated restoration")
        self.logger.log_event("RESTORATION_START", "Initiating Winter Contingency Restoration Protocol")

        try:
            # 1. Quarantine Current State (Snapshot)
            self._create_snapshot()

            # 2. Find Valid Backup
            backup = self._find_best_backup()
            if not backup:
                self.logger.log_event("RESTORATION_FAILED", "No valid backups found", "CRITICAL")
                self.state_manager.set_state(WinterState.CRITICAL, "No valid backups")
                return False

            # 3. Attempt Restoration
            success = self._restore_and_validate(backup)

            if success:
                self.state_manager.set_state(WinterState.COOLDOWN, "Restoration successful, entering cooldown")
                self.logger.log_event("RESTORATION_SUCCESS", f"Restored from {backup['filename']}")
                return True
            else:
                # Try fallback (simplified for now, usually loops through backups)
                self.logger.log_event("RESTORATION_FAILED", "Restoration verification failed", "CRITICAL")
                self.state_manager.set_state(WinterState.CRITICAL, "Restoration validation failed")
                return False

        except Exception as e:
            self.logger.log_event("RESTORATION_ERROR", str(e), "CRITICAL")
            self.state_manager.set_state(WinterState.CRITICAL, f"Exception: {str(e)}")
            return False

    def _create_snapshot(self):
        """Save current potentially broken state for forensics"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        # Since it's MySQL, we can't just copy files easily without stopping service.
        # We will try a "force dump" even if broken, just in case.
        try:
            self.db_service.create_backup("quarantine", description=f"Forensic Snapshot {timestamp}")
            self.logger.log_event("SNAPSHOT", "Created forensic snapshot")
        except Exception as e:
            self.logger.log_event("SNAPSHOT_FAILED", f"Could not create snapshot: {e}", "WARNING")

    def _find_best_backup(self):
        """Find the most recent VALID backup"""
        backups = self.db_service.list_backups()

        for backup_meta in backups:
            backup_id = backup_meta.get("backup_id")
            filename = backup_meta.get("filename")
            backup_path = self.db_service.BACKUP_DIR / filename

            if self.validator.validate_backup_file(backup_path):
                return backup_meta

        return None

    def _restore_and_validate(self, backup_meta):
        """Restore specific backup and validate result"""
        backup_id = backup_meta.get("backup_id")

        try:
            # Restore
            self.db_service.restore_backup(backup_id)

            # Post-Restore Validation
            if self.validator.validate_system_health():
                return True
            else:
                self.logger.log_event("VALIDATION_FAILED", f"Backup {backup_id} restored but system is unhealthy")
                return False

        except Exception as e:
            self.logger.log_event("RESTORE_EXCEPTION", f"Failed to restore {backup_id}: {e}")
            return False
