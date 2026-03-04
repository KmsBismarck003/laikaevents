from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from logs import get_audit_logs as fetch_audit_logs, get_request_logs as fetch_request_logs
from dependencies import get_current_user

router = APIRouter()

# ============================================
# DEPENDENCIAS DE SEGURIDAD
# ============================================

def admin_required(current_user: dict = Depends(get_current_user)):
    """Verifica que el usuario sea Admin"""
    role = current_user.get("role") if isinstance(current_user, dict) else getattr(current_user, "role", None)

    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso restringido a administradores"
        )
    return current_user

# ============================================
# ENDPOINTS
# ============================================

@router.get("/audit", dependencies=[Depends(admin_required)])
def get_audit_logs(
    limit: int = Query(100, le=1000),
    offset: int = 0,
    user_id: Optional[int] = None,
    action: Optional[str] = None
):
    """Obtener logs de auditoría (acciones críticas)"""
    return fetch_audit_logs(limit=limit, offset=offset, user_id=user_id, action=action)

@router.get("/requests", dependencies=[Depends(admin_required)])
def get_request_logs(
    limit: int = Query(100, le=1000),
    offset: int = 0,
    status_code: Optional[int] = None,
    method: Optional[str] = None
):
    """Obtener logs de peticiones HTTP"""
    return fetch_request_logs(limit=limit, offset=offset, status_code=status_code, method=method)
