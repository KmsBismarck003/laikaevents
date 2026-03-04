import logging
import os
from datetime import datetime
from pathlib import Path

class WinterLogger:
    LOG_DIR = Path("logs/winter_contingency")

    def __init__(self):
        self.LOG_DIR.mkdir(parents=True, exist_ok=True)
        self.logger = self._setup_logger()

    def _setup_logger(self):
        logger = logging.getLogger("WinterContingency")
        logger.setLevel(logging.INFO)

        # File handler
        log_file = self.LOG_DIR / "audit.log"
        handler = logging.FileHandler(log_file, encoding='utf-8')
        formatter = logging.Formatter('%(asctime)s | %(levelname)s | %(message)s')
        handler.setFormatter(formatter)

        # Avoid duplicate handlers
        if not logger.handlers:
            logger.addHandler(handler)

        return logger

    def log_event(self, event_type: str, message: str, severity: str = "INFO", details: dict = None):
        """
        Log forensic event
        """
        log_msg = f"[{event_type}] {message}"
        if details:
            log_msg += f" | DETAILS: {details}"

        if severity == "ERROR" or severity == "CRITICAL":
            self.logger.error(log_msg)
        elif severity == "WARNING":
            self.logger.warning(log_msg)
        else:
            self.logger.info(log_msg)

        # Force flush
        for handler in self.logger.handlers:
            handler.flush()

    def log_forensic_snapshot(self, trigger_source: str, context: dict = None):
        """
        Log environment state at moment of triggering
        """
        self.log_event(
            "FORENSIC_SNAPSHOT",
            f"Winter Contingency Triggered by {trigger_source}",
            "CRITICAL",
            context
        )
