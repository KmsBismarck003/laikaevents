import time
import threading
from sqlalchemy import text, create_engine
from services.database_service import DatabaseService
from winter_plan.core.state import StateManager, WinterState
from winter_plan.core.restorer import WinterRestorer
from winter_plan.core.logger import WinterLogger
import os

class WinterMonitor(threading.Thread):
    def __init__(self, interval=5):
        super().__init__()
        self.interval = interval
        self.daemon = True
        self.db_service = DatabaseService()
        self.state_manager = StateManager()
        self.logger = WinterLogger()
        self.restorer = WinterRestorer()
        self._stop_event = threading.Event()

        # Monitor specific connection to avoid pool contamination
        creds = self.db_service.get_credentials()
        self.db_url = f"mysql+pymysql://{creds['user']}:{creds['password']}@{creds['host']}:{creds['port']}"
        self.target_db = creds['database']

    def run(self):
        self.logger.log_event("MONITOR_START", "Winter Monitor Background Thread Started")

        while not self._stop_event.is_set():
            if self.state_manager.current_state == WinterState.NORMAL or self.state_manager.current_state == WinterState.COOLDOWN:
                self._check_health()

            time.sleep(self.interval)

    def stop(self):
        self._stop_event.set()

    def _check_health(self):
        try:
            # We use a raw engine to connect, first to server (no DB) then check DB
            engine = create_engine(self.db_url)
            with engine.connect() as conn:
                # 1. Check connectivity to server
                conn.execute(text("SELECT 1"))

                # 2. Check if database exists
                result = conn.execute(text(f"SHOW DATABASES LIKE '{self.target_db}'"))
                if not result.fetchone():
                    self._trigger_protocol("MISSING_DATABASE")
                    return

                # 3. Check if critical table exists (Schema validation)
                # Switch to DB context
                conn.execute(text(f"USE {self.target_db}"))
                try:
                    conn.execute(text("SELECT 1 FROM users LIMIT 1"))
                except Exception as e:
                    # Check error code for "Table doesn't exist" (1146)
                    if "1146" in str(e):
                        self._trigger_protocol("MISSING_TABLE_USERS")
                    else:
                        # Other errors might be connectivity, ignore for now or log warning
                        pass

            # If we reached here, everything is fine
            if self.state_manager.current_state == WinterState.COOLDOWN:
                 self.state_manager.set_state(WinterState.NORMAL, "System healthy after cooldown")

        except Exception as e:
            # If we simply can't connect, it might be the server is down.
            # Winter Plan is for DB Restoration, not Server Restart.
            # But if the error is "Unknown database", catch it.
            if "1049" in str(e): # Unknown Database
                self._trigger_protocol("MISSING_DATABASE_EXCEPTION")

            # self.logger.log_event("MONITOR_ERROR", str(e), "WARNING")

    def _trigger_protocol(self, reason):
        # Double check (Consistency check)
        time.sleep(1)


        self.logger.log_event("TRIGGER", f"Protocol Activated: {reason}", "CRITICAL")

        # Check attempts
        if self.state_manager.get_attempts() >= 3:
            self.state_manager.set_state(WinterState.CRITICAL, "Max attempts reached")
            return

        self.state_manager.increment_attempts()

        # Execute Restore
        success = self.restorer.execute_restoration()

        if success:
            self.logger.log_event("PROTOCOL_SUCCESS", "Automatic restoration successful", "INFO")
            # CRITICAL: Reset attempts counter to allow infinite persistence against future attacks/failures
            self.state_manager.reset_attempts()
        else:
             self.logger.log_event("PROTOCOL_FAILURE", "Automatic restoration failed", "CRITICAL")
