from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from winter_plan.core.state import StateManager, WinterState

class WinterProtectionMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.state_manager = StateManager()

    async def dispatch(self, request, call_next):
        # Skip check for static files or documentation
        if request.url.path.startswith("/static") or request.url.path.startswith("/docs") or request.url.path.startswith("/redoc"):
            return await call_next(request)

        current_state = self.state_manager.current_state

        # PANIC / RESTORING / CRITICAL -> Block everything except maybe a status endpoint
        if self.state_manager.is_blocking():
            return JSONResponse(
                status_code=503,
                content={
                    "error": "Service Unavailable",
                    "detail": "Winter Contingency Protocol Verified. System is undergoing automated restoration.",
                    "state": current_state.value
                }
            )

        # READ_ONLY -> Block State-Changing Methods
        if self.state_manager.is_read_only():
            if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
                return JSONResponse(
                    status_code=503,
                    content={
                        "error": "Read Only Mode",
                        "detail": "System is currently in protective read-only mode.",
                        "state": current_state.value
                    }
                )

        return await call_next(request)
