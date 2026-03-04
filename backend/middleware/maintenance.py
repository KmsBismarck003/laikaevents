from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from core.config_store import is_maintenance_mode
import jwt
import os
import re

class MaintenanceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Check if maintenance is active (Fast in-memory check)
        if not is_maintenance_mode():
            return await call_next(request)

        # 2. Define allowed paths (Whitelist)
        path = request.url.path

        # Exact matches
        ALLOWED_EXACT = [
            "/docs",
            "/redoc",
            "/openapi.json",
            "/health",
            "/api/auth/login",
            "/api/auth/refresh",
            "/api/auth/verify",
            "/api/auth/logout",
            "/api/config", # Frontend needs to poll this to know when to refresh
            "/api/config/maintenance-mode" # Specific lightweight endpoint if we make one
        ]

        # Prefix matches
        ALLOWED_PREFIXES = [
            "/static",
            "/api/auth" # Allow all auth flows
        ]

        if path in ALLOWED_EXACT:
            return await call_next(request)

        for prefix in ALLOWED_PREFIXES:
            if path.startswith(prefix):
                 return await call_next(request)

        # 3. Allow OPTIONS (CORS)
        if request.method == "OPTIONS":
            return await call_next(request)

        # 4. Check for Admin Privileges via JWT
        # We manually check the token here because Middleware runs before Dependencies.
        auth_header = request.headers.get("Authorization")

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                # Decode token without verification first to check role/exp?
                # Better to verify signature to prevent spoofing admin role.
                secret_key = os.getenv('JWT_SECRET', 'tu_clave_secreta_aqui')
                payload = jwt.decode(token, secret_key, algorithms=["HS256"])

                role = payload.get("role")
                if role == "admin":
                    return await call_next(request)

            except Exception as e:
                # Token invalid, expired, or error -> Block
                print(f"🔒 Maintenance blocked request with invalid token: {e}")
                pass

        # 5. Block Request
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "detail": "Sistema en mantenimiento",
                "maintenance": True,
                "message": "El sistema está realizando tareas programadas. Intente más tarde."
            }
        )
