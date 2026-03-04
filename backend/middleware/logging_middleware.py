from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time
import traceback
from logs import log_request
import json

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        # Capturar datos iniciales
        method = request.method
        path = request.url.path
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "")

        try:
            # Procesar la request
            response = await call_next(request)

            # Calcular duración
            process_time = (time.time() - start_time) * 1000 # ms

            # Intentar obtener user_id si existe en el estado (inyectado por auth middleware)
            user_id = None
            if hasattr(request.state, "user"):
                try:
                    user_data = request.state.user
                    # Puede ser objeto o dict dependiendo de la implementación de auth
                    if isinstance(user_data, dict):
                        user_id = user_data.get("id")
                    elif hasattr(user_data, "id"):
                        user_id = user_data.id
                except:
                    pass

            # Registrar log de forma "fire and forget" (fail-safe interno en logs.py)
            log_request(
                method=method,
                path=path,
                status_code=response.status_code,
                duration_ms=process_time,
                user_id=user_id,
                ip_address=client_ip,
                user_agent=user_agent
            )

            return response

        except Exception as e:
            # Si hay error en la aplicación (500), también queremos loguearlo
            process_time = (time.time() - start_time) * 1000
            error_msg = str(e)

            log_request(
                method=method,
                path=path,
                status_code=500,
                duration_ms=process_time,
                user_id=None,
                ip_address=client_ip,
                user_agent=user_agent,
                error_details=error_msg
            )

            # Re-lanzar la excepción para que el ExceptionHandler de FastAPI la maneje
            raise e
