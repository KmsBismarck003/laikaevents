from enum import Enum
from datetime import datetime
import threading

class WinterState(Enum):
    NORMAL = "NORMAL"
    READ_ONLY = "READ_ONLY"      # Pre-panic, allows GET but blocks POST/PUT/DELETE
    PANIC = "PANIC"              # Full blockade (503 Service Unavailable)
    RESTORING = "RESTORING"      # Active restoration in progress
    COOLDOWN = "COOLDOWN"        # Monitoring post-restoration
    CRITICAL = "CRITICAL"        # Restoration failed, manual intervention required

class StateManager:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(StateManager, cls).__new__(cls)
                    cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self._current_state = WinterState.NORMAL
        self._last_change = datetime.now()
        self._restoration_attempts = 0
        self._last_restoration = None
        self._state_history = []

    @property
    def current_state(self):
        return self._current_state

    def set_state(self, state: WinterState, reason: str = None):
        with self._lock:
            if self._current_state != state:
                prev_state = self._current_state
                self._current_state = state
                self._last_change = datetime.now()
                self._state_history.append({
                    "timestamp": self._last_change.isoformat(),
                    "from": prev_state.value,
                    "to": state.value,
                    "reason": reason
                })
                print(f"❄️ [WINTER CONTINGENCY] State changed: {prev_state.value} -> {state.value} ({reason})")

    def increment_attempts(self):
        with self._lock:
            self._restoration_attempts += 1

    def reset_attempts(self):
        with self._lock:
            self._restoration_attempts = 0

    def get_attempts(self):
        return self._restoration_attempts

    def is_blocking(self):
        return self._current_state in [WinterState.PANIC, WinterState.RESTORING, WinterState.CRITICAL]

    def is_read_only(self):
        return self._current_state == WinterState.READ_ONLY
