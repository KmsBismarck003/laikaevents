from fastapi import FastAPI, Depends, Request, HTTPException, BackgroundTasks, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from .database import get_db, engine, Base
from .schemas import LoginRequest, RegisterRequest, TokenResponse, StatusUpdateRequest, AdminPasswordResetRequest
from . import controller
import os, uuid, shutil
from pathlib import Path

app = FastAPI(title="Laika Auth Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurar estáticos
UPLOAD_DIR = Path("uploads")
AVATARS_DIR = UPLOAD_DIR / "avatars"
AVATARS_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/health")
def health_check():
    return {"status": "alive", "service": "auth-service"}

@app.get("/debug-routes")
def debug_routes():
    from starlette.routing import Route
    return [{"path": route.path, "methods": list(route.methods) if isinstance(route, Route) else "N/A"} for route in app.routes]

@app.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, background_tasks: BackgroundTasks, req: Request, db: Session = Depends(get_db)):
    ip = req.headers.get("X-Forwarded-For", req.client.host if req.client else "N/A")
    ua = req.headers.get("User-Agent", "N/A")
    return controller.login_user(db, request.email, request.password, background_tasks, ip_address=ip, user_agent=ua)

@app.post("/register", response_model=TokenResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    return controller.register_user(db, request.dict())

from .security import get_current_user
from .permission_schemas import PermissionRequest

@app.post("/request-permission")
def request_permission(request: PermissionRequest, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return controller.create_permission_request(db, user['id'], request.permission_type)

@app.get("/all-requests")
def list_requests(db: Session = Depends(get_db)):
    return controller.get_all_permission_requests(db)

@app.get("/check-lockout")
def check_lockout(email: str, db: Session = Depends(get_db)):
    """Verifica si una cuenta está bloqueada. Seguro — no revela si el email existe."""
    from datetime import datetime
    from sqlalchemy import text
    try:
        result = db.execute(
            text("SELECT lockout_until, failed_attempts FROM users WHERE LOWER(email) = :email"),
            {"email": email.lower().strip()}
        ).mappings().fetchone()
        if not result:
            return {"locked": False}
        lockout_val = result.get("lockout_until")
        if not lockout_val:
            return {"locked": False, "failed_attempts": result.get("failed_attempts", 0)}
        lockout_until = lockout_val
        if isinstance(lockout_until, str):
            lockout_until = datetime.fromisoformat(lockout_until.split(".")[0])
        if lockout_until.tzinfo:
            lockout_until = lockout_until.replace(tzinfo=None)
        now = datetime.now()
        if now < lockout_until:
            remaining = int((lockout_until - now).total_seconds())
            return {"locked": True, "retry_after": remaining, "failed_attempts": result.get("failed_attempts", 0)}
        return {"locked": False, "failed_attempts": result.get("failed_attempts", 0)}
    except Exception as e:
        print(f"⚠️ [AUTH] check-lockout error: {e}")
        return {"locked": False}


@app.post("/login/google")
async def login_google(data: dict, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    token = data.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token no proporcionado")
    return await controller.social_login_user(db, token, "google", background_tasks)

@app.post("/login/apple")
def login_apple(data: dict, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Simulación por ahora hasta tener keys de Apple
    email = data.get("email")
    return controller.social_login_user(db, email, "apple", background_tasks)

@app.get("/users/me")
def get_me(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return controller.get_user_by_id(db, current_user['id'])

@app.get("/verify")
def verify_token(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return controller.verify_token(db, current_user)

@app.post("/logout")
def logout(req: Request, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    ip = req.headers.get("X-Forwarded-For", req.client.host if req.client else "N/A")
    ua = req.headers.get("User-Agent", "N/A")
    return controller.logout_user(db, current_user, ip_address=ip, user_agent=ua)

@app.post("/refresh")
def refresh(current_user: dict = Depends(get_current_user)):
    return controller.refresh_token(current_user)

@app.post("/forgot-password")
async def forgot_password(data: dict, db: Session = Depends(get_db)):
    return await controller.forgot_password(db, data.get("email"))

# ── PERFIL DE USUARIO ──

@app.post("/users/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    try:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
            raise HTTPException(status_code=400, detail="Formato no soportado")
            
        filename = f"user_{current_user['id']}_{uuid.uuid4().hex[:8]}{ext}"
        filepath = AVATARS_DIR / filename
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        avatar_url = f"/api/auth/uploads/avatars/{filename}"
        return controller.update_user_avatar(db, current_user['id'], avatar_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir avatar: {str(e)}")

# ── ENDPOINTS DE ADMINISTRACIÓN (Mantenimiento de Usuarios) ──

@app.get("/admin/users")
def get_admin_users(
    search: str = None, 
    role: str = None, 
    status: str = None, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    # Verificación ruda de admin
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador")
    return controller.get_users(db, search, role, status)

@app.patch("/admin/users/{user_id}/status")
def patch_user_status(
    user_id: int, 
    request: StatusUpdateRequest, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Acción no permitida")
    return controller.update_user_status(db, user_id, request.status)

@app.patch("/admin/users/{user_id}/password")
def patch_user_password(
    user_id: int, 
    request: AdminPasswordResetRequest, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Acción no permitida")
    return controller.reset_user_password(db, user_id, request.new_password)

@app.patch("/admin/users/{user_id}/unlock")
def patch_unlock_user(
    user_id: int, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Acción no permitida")
    return controller.unlock_user(db, user_id)

@app.post("/admin/broadcast")
async def admin_broadcast(data: dict, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Acceso denegado")
    
    content = data.get("content")
    if not content:
        raise HTTPException(status_code=400, detail="Contenido faltante")
        
    emails = controller.get_all_emails(db)
    from .notifier import EmailNotifier
    sent = await EmailNotifier.broadcast_announcement(emails, content)
    return {"status": "success", "sent_to": sent}

@app.post("/admin/test-email")
async def test_email(data: dict, current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Acceso denegado")
    
    email = data.get("email")
    from .notifier import EmailNotifier
    res = await EmailNotifier.send_email(
        email, 
        "LAIKA Club - Prueba de Conectividad", 
        "announcement.html", 
        {"content": "<p>Esta es una prueba de que el sistema de correos de LAIKA Club está correctamente configurado. 🎉</p>"}
    )
    return {"status": "success" if res else "error"}

@app.get("/audit")
def get_audit_logs(
    limit: int = 200,
    role: str = None,
    event_type: str = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get('role') not in ('admin', 'gestor'):
        raise HTTPException(status_code=403, detail="Acceso denegado")
    return controller.get_auth_logs(db, limit=limit, role=role, event_type=event_type)

@app.get("/users/{user_id}/permissions")
def get_user_permissions(user_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return controller.get_user_permissions(db, user_id)

@app.put("/users/{user_id}/permissions")
def update_user_permissions(user_id: int, data: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return controller.update_user_permissions(db, user_id, data.get('role'), data.get('permissions'))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
