from logs import log_audit as system_log_audit
from datetime import datetime

class AuditLogger:
    """
    Module responsible for logging audit events related to External Backups.
    """

    @staticmethod
    def log_restore_attempt(user_id: int, source_path: str, status: str, details: str = None):
        """
        Log a restore attempt.
        """
        action = "EXTERNAL_RESTORE_ATTEMPT"
        msg = f"Source: {source_path}. Result: {status}. {details or ''}"

        system_log_audit(
            action=action,
            user_id=user_id,
            details=msg,
            status=status
        )
        print(f"📝 [AUDIT] {action} - User: {user_id} - {status}")

    @staticmethod
    def log_source_scan(user_id: int, detected_count: int):
         """
         Log a scan event (optional, maybe too noisy, but good for security)
         """
         system_log_audit(
             action="EXTERNAL_SOURCE_SCAN",
             user_id=user_id,
             details=f"Detected {detected_count} potential sources",
             status="success"
         )
