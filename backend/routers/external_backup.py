from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from dependencies import get_db, get_current_user
from modules.external_backup import (
    SourceDetector,
    SourceSelector,
    SecurityGate,
    RestoreEngine,
    AuditLogger
)

# Initialize modules
detector = SourceDetector()
selector = SourceSelector()
security_gate = SecurityGate()
restore_engine = RestoreEngine()

router = APIRouter()

# --- Pydantic Models ---

class DetectRequest(BaseModel):
    manual_path: Optional[str] = None

class VerifyPasswordRequest(BaseModel):
    password: str

class RestoreExternalRequest(BaseModel):
    source_path: str
    backup_id: str
    password: str # Required again for double verification at moment of impact

# --- Endpoints ---

@router.get("/sources")
def get_external_sources(current_user: dict = Depends(get_current_user)):
    """
    List potential external backup sources.
    Only allows users with valid session.
    """
    try:
        sources = detector.scan_sources()
        AuditLogger.log_source_scan(current_user['id'], len(sources))
        return {"success": True, "sources": sources}
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/validate-source")
def validate_source(
    request: RestoreExternalRequest, # We reuse the model but only care about source_path/backup_id mostly
    current_user: dict = Depends(get_current_user)
):
    """
    Validate a specific backup file without restoring it.
    """
    # Simply check if the file exists and get details
    try:
         # Construct full path if needed, or assume source_path is full file path
         # For now, let's assume source_path is the FOLDER and backup_id is the FILENAME
         import os
         full_path = os.path.join(request.source_path, request.backup_id)

         details = selector.get_backup_details(full_path)
         if "error" in details:
              raise HTTPException(400, details["error"])

         return {"success": True, "details": details}

    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/verify-security")
def verify_security_gate(
    request: VerifyPasswordRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Pre-check password before showing confirm modal.
    """
    is_valid, msg = security_gate.verify_password(db, current_user['id'], request.password)

    if not is_valid:
        raise HTTPException(401, msg)

    return {"success": True, "message": "Authorized"}

@router.post("/restore")
def execute_external_restore(
    request: RestoreExternalRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    FINAL STEP: Execute restoration.
    Requires password re-verification.
    """
    # 1. FINAL SECURITY CHECK
    is_valid, msg = security_gate.verify_password(db, current_user['id'], request.password)
    if not is_valid:
        AuditLogger.log_restore_attempt(current_user['id'], request.source_path, "failed", "Invalid password")
        raise HTTPException(401, "Contraseña incorrecta. Restauración abortada.")

    # 2. CHECK ADMIN PRIVILEGES (Optional, but recommended)
    if not security_gate.is_admin(db, current_user['id']):
         AuditLogger.log_restore_attempt(current_user['id'], request.source_path, "denied", "User not admin")
         raise HTTPException(403, "Se requieren permisos de administrador.")

    # 3. EXECUTE RESTORE
    try:
        import os
        full_path = os.path.join(request.source_path, request.backup_id)

        result = restore_engine.restore_from_external_source(full_path, request.backup_id)

        AuditLogger.log_restore_attempt(current_user['id'], full_path, "success")
        return result

    except Exception as e:
        import os
        full_path = os.path.join(request.source_path, request.backup_id)
        AuditLogger.log_restore_attempt(current_user['id'], full_path, "failed", str(e))
        raise HTTPException(500, f"Error crítico durante la restauración: {str(e)}")
