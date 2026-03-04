# routers/restore_audit.py
# ============================================
# MÓDULO DE AUDITORÍA DE RESTAURACIONES
# Completamente independiente — usa su propia SQLite DB
# Solo accesible por administradores
# ============================================

from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum
import sqlite3
import threading
import csv
import io
import os
import json
import traceback

# Auth dependency
from dependencies import get_current_user

router = APIRouter()

# ============================================
# CONFIGURACIÓN DE BASE DE DATOS INDEPENDIENTE
# ============================================

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "restore_audit.db")

# Lock global para operaciones atómicas de confirmación
_confirm_lock = threading.Lock()


def get_audit_db():
    """Obtener conexión a la BD independiente de auditoría"""
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_audit_db():
    """Crear tablas si no existen"""
    conn = get_audit_db()
    try:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS restore_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                -- Info General
                start_datetime TEXT NOT NULL,
                end_datetime TEXT,
                duration_seconds REAL,
                admin_user_id INTEGER NOT NULL,
                admin_username TEXT NOT NULL,
                database_name TEXT NOT NULL,
                environment TEXT NOT NULL CHECK(environment IN ('dev','staging','produccion')),
                restore_type TEXT NOT NULL,
                backup_size_mb REAL,
                restore_reason TEXT NOT NULL,
                execution_method TEXT NOT NULL CHECK(execution_method IN ('manual','script','automatizado')),
                server_name TEXT NOT NULL,
                -- Estado
                is_confirmed INTEGER NOT NULL DEFAULT 0,
                confirmed_at TEXT,
                confirmed_by_user_id INTEGER,
                confirmed_by_username TEXT,
                -- Tracking
                created_at TEXT NOT NULL,
                last_modified_at TEXT NOT NULL,
                last_modified_by_user_id INTEGER NOT NULL,
                last_modified_by_username TEXT NOT NULL,
                -- Secciones completadas
                technical_checks_completed INTEGER NOT NULL DEFAULT 0,
                functional_checks_completed INTEGER NOT NULL DEFAULT 0,
                operational_impact_completed INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS technical_checks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL UNIQUE,
                integrity_verified INTEGER NOT NULL DEFAULT 0,
                integrity_result TEXT NOT NULL DEFAULT 'pendiente',
                integrity_observations TEXT,
                total_tables INTEGER,
                critical_record_count INTEGER,
                log_errors_detected TEXT,
                log_errors_observations TEXT,
                data_consistency_validated INTEGER NOT NULL DEFAULT 0,
                data_consistency_observations TEXT,
                checksum_match INTEGER,
                checksum_observations TEXT,
                created_at TEXT NOT NULL,
                last_modified_at TEXT NOT NULL,
                FOREIGN KEY (event_id) REFERENCES restore_events(id) ON DELETE RESTRICT
            );

            CREATE TABLE IF NOT EXISTS functional_checks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL UNIQUE,
                auth_result TEXT NOT NULL DEFAULT 'pendiente',
                auth_observations TEXT,
                critical_modules_result TEXT NOT NULL DEFAULT 'pendiente',
                critical_modules_observations TEXT,
                main_apis_result TEXT NOT NULL DEFAULT 'pendiente',
                main_apis_observations TEXT,
                sensitive_operations_result TEXT NOT NULL DEFAULT 'pendiente',
                sensitive_operations_observations TEXT,
                admin_panel_result TEXT NOT NULL DEFAULT 'pendiente',
                admin_panel_observations TEXT,
                created_at TEXT NOT NULL,
                last_modified_at TEXT NOT NULL,
                FOREIGN KEY (event_id) REFERENCES restore_events(id) ON DELETE RESTRICT
            );

            CREATE TABLE IF NOT EXISTS operational_impact (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL UNIQUE,
                had_downtime INTEGER NOT NULL DEFAULT 0,
                downtime_minutes REAL DEFAULT 0,
                estimated_affected_users INTEGER DEFAULT 0,
                severity TEXT NOT NULL DEFAULT 'bajo' CHECK(severity IN ('bajo','medio','alto','critico')),
                needed_retry INTEGER NOT NULL DEFAULT 0,
                needed_rollback INTEGER NOT NULL DEFAULT 0,
                observations TEXT,
                created_at TEXT NOT NULL,
                last_modified_at TEXT NOT NULL,
                FOREIGN KEY (event_id) REFERENCES restore_events(id) ON DELETE RESTRICT
            );

            CREATE TABLE IF NOT EXISTS confirmations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL UNIQUE,
                admin_user_id INTEGER NOT NULL,
                admin_username TEXT NOT NULL,
                final_comments TEXT,
                accepts_responsibility INTEGER NOT NULL DEFAULT 1,
                confirmed_at TEXT NOT NULL,
                FOREIGN KEY (event_id) REFERENCES restore_events(id) ON DELETE RESTRICT
            );

            CREATE INDEX IF NOT EXISTS idx_restore_events_environment ON restore_events(environment);
            CREATE INDEX IF NOT EXISTS idx_restore_events_admin ON restore_events(admin_user_id);
            CREATE INDEX IF NOT EXISTS idx_restore_events_confirmed ON restore_events(is_confirmed);
            CREATE INDEX IF NOT EXISTS idx_restore_events_created ON restore_events(created_at);
        """)
        conn.commit()
    finally:
        conn.close()


# Inicializar DB al cargar el módulo
try:
    init_audit_db()
    print("  ✅ Restore Audit DB inicializada correctamente")
except Exception as e:
    print(f"  ⚠️ Error inicializando Restore Audit DB: {e}")
    traceback.print_exc()


# ============================================
# HELPERS
# ============================================

def require_admin(user):
    """Validar que el usuario sea admin. Ejecutar en TODOS los endpoints."""
    user_role = None
    if hasattr(user, '_mapping'):
        user_role = user._mapping.get('role')
    elif hasattr(user, 'role'):
        user_role = user.role
    else:
        try:
            user_role = user['role']
        except (TypeError, KeyError):
            pass

    if user_role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Solo administradores pueden acceder a este módulo."
        )
    return user


def get_user_info(user):
    """Extraer id y username de forma segura"""
    uid = None
    uname = "unknown"
    if hasattr(user, '_mapping'):
        m = user._mapping
        uid = m.get('id')
        uname = f"{m.get('first_name', '')} {m.get('last_name', '')}".strip() or m.get('email', 'unknown')
    elif hasattr(user, 'id'):
        uid = user.id
        uname = getattr(user, 'first_name', '') + ' ' + getattr(user, 'last_name', '')
    else:
        try:
            uid = user['id']
            uname = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
        except (TypeError, KeyError):
            pass
    return uid, uname.strip() or "Admin"


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def check_not_confirmed(conn, event_id: int):
    """Verificar que un evento NO esté confirmado. Lanza 409 si ya lo está."""
    row = conn.execute(
        "SELECT is_confirmed FROM restore_events WHERE id = ?", (event_id,)
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Evento de restauración no encontrado")
    if row['is_confirmed']:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este evento ya fue confirmado y no puede ser modificado."
        )
    return True


def row_to_dict(row):
    if row is None:
        return None
    return dict(row)


def rows_to_list(rows):
    return [dict(r) for r in rows]


# ============================================
# MODELOS PYDANTIC
# ============================================

class CreateEventRequest(BaseModel):
    start_datetime: str = Field(..., description="ISO datetime de inicio")
    end_datetime: Optional[str] = Field(None, description="ISO datetime de fin")
    database_name: str = Field(..., min_length=1)
    environment: str = Field(..., description="dev | staging | produccion")
    restore_type: str = Field(..., min_length=1)
    backup_size_mb: Optional[float] = Field(None, ge=0)
    restore_reason: str = Field(..., min_length=1)
    execution_method: str = Field(..., description="manual | script | automatizado")
    server_name: str = Field(..., min_length=1)

    @validator('environment')
    def validate_env(cls, v):
        if v not in ('dev', 'staging', 'produccion'):
            raise ValueError('environment debe ser dev, staging o produccion')
        return v

    @validator('execution_method')
    def validate_method(cls, v):
        if v not in ('manual', 'script', 'automatizado'):
            raise ValueError('execution_method debe ser manual, script o automatizado')
        return v


class UpdateEventRequest(BaseModel):
    start_datetime: Optional[str] = None
    end_datetime: Optional[str] = None
    database_name: Optional[str] = None
    environment: Optional[str] = None
    restore_type: Optional[str] = None
    backup_size_mb: Optional[float] = None
    restore_reason: Optional[str] = None
    execution_method: Optional[str] = None
    server_name: Optional[str] = None

    @validator('environment')
    def validate_env(cls, v):
        if v is not None and v not in ('dev', 'staging', 'produccion'):
            raise ValueError('environment debe ser dev, staging o produccion')
        return v

    @validator('execution_method')
    def validate_method(cls, v):
        if v is not None and v not in ('manual', 'script', 'automatizado'):
            raise ValueError('execution_method debe ser manual, script o automatizado')
        return v


class TechnicalChecksRequest(BaseModel):
    integrity_verified: bool = False
    integrity_result: str = Field("pendiente", description="exito | fallo | pendiente")
    integrity_observations: Optional[str] = None
    total_tables: Optional[int] = Field(None, ge=0)
    critical_record_count: Optional[int] = Field(None, ge=0)
    log_errors_detected: Optional[str] = None
    log_errors_observations: Optional[str] = None
    data_consistency_validated: bool = False
    data_consistency_observations: Optional[str] = None
    checksum_match: Optional[bool] = None
    checksum_observations: Optional[str] = None


class FunctionalChecksRequest(BaseModel):
    auth_result: str = Field("pendiente", description="exito | fallo | pendiente")
    auth_observations: Optional[str] = None
    critical_modules_result: str = Field("pendiente")
    critical_modules_observations: Optional[str] = None
    main_apis_result: str = Field("pendiente")
    main_apis_observations: Optional[str] = None
    sensitive_operations_result: str = Field("pendiente")
    sensitive_operations_observations: Optional[str] = None
    admin_panel_result: str = Field("pendiente")
    admin_panel_observations: Optional[str] = None


class OperationalImpactRequest(BaseModel):
    had_downtime: bool = False
    downtime_minutes: Optional[float] = Field(0, ge=0)
    estimated_affected_users: Optional[int] = Field(0, ge=0)
    severity: str = Field("bajo", description="bajo | medio | alto | critico")
    needed_retry: bool = False
    needed_rollback: bool = False
    observations: Optional[str] = None

    @validator('severity')
    def validate_severity(cls, v):
        if v not in ('bajo', 'medio', 'alto', 'critico'):
            raise ValueError('severity debe ser bajo, medio, alto o critico')
        return v


class ConfirmEventRequest(BaseModel):
    final_comments: Optional[str] = None
    accepts_responsibility: bool = Field(..., description="El admin acepta responsabilidad operativa")


# ============================================
# ENDPOINTS
# ============================================

@router.post("/events", status_code=201)
async def create_event(request: CreateEventRequest, user=Depends(get_current_user)):
    """Crear un nuevo evento de restauración"""
    require_admin(user)
    uid, uname = get_user_info(user)
    ts = now_iso()

    # Calcular duración si ambas fechas están presentes
    duration = None
    if request.end_datetime and request.start_datetime:
        try:
            start = datetime.fromisoformat(request.start_datetime.replace('Z', '+00:00'))
            end = datetime.fromisoformat(request.end_datetime.replace('Z', '+00:00'))
            duration = (end - start).total_seconds()
            if duration < 0:
                raise HTTPException(400, "end_datetime no puede ser anterior a start_datetime")
        except ValueError:
            pass

    conn = get_audit_db()
    try:
        cursor = conn.execute("""
            INSERT INTO restore_events (
                start_datetime, end_datetime, duration_seconds,
                admin_user_id, admin_username,
                database_name, environment, restore_type,
                backup_size_mb, restore_reason, execution_method, server_name,
                created_at, last_modified_at, last_modified_by_user_id, last_modified_by_username
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            request.start_datetime, request.end_datetime, duration,
            uid, uname,
            request.database_name, request.environment, request.restore_type,
            request.backup_size_mb, request.restore_reason, request.execution_method, request.server_name,
            ts, ts, uid, uname
        ))
        conn.commit()
        event_id = cursor.lastrowid

        event = row_to_dict(conn.execute("SELECT * FROM restore_events WHERE id = ?", (event_id,)).fetchone())
        return {"success": True, "event": event}
    except Exception as e:
        conn.rollback()
        traceback.print_exc()
        raise HTTPException(500, f"Error al crear evento: {str(e)}")
    finally:
        conn.close()


@router.get("/events")
async def list_events(
    start_date: Optional[str] = Query(None, description="Fecha inicio filtro YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Fecha fin filtro YYYY-MM-DD"),
    environment: Optional[str] = Query(None),
    admin_user_id: Optional[int] = Query(None),
    severity: Optional[str] = Query(None),
    is_confirmed: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user=Depends(get_current_user)
):
    """Listar eventos de restauración con filtros"""
    require_admin(user)

    conn = get_audit_db()
    try:
        where_clauses = []
        params = []

        if start_date:
            where_clauses.append("re.created_at >= ?")
            params.append(start_date)
        if end_date:
            where_clauses.append("re.created_at <= ?")
            params.append(end_date + "T23:59:59")
        if environment:
            where_clauses.append("re.environment = ?")
            params.append(environment)
        if admin_user_id is not None:
            where_clauses.append("re.admin_user_id = ?")
            params.append(admin_user_id)
        if severity:
            where_clauses.append("oi.severity = ?")
            params.append(severity)
        if is_confirmed is not None:
            where_clauses.append("re.is_confirmed = ?")
            params.append(1 if is_confirmed else 0)

        where_sql = ""
        if where_clauses:
            where_sql = "WHERE " + " AND ".join(where_clauses)

        # Join para filtrar por severity
        count_row = conn.execute(
            f"""SELECT COUNT(*) as total FROM restore_events re
                LEFT JOIN operational_impact oi ON re.id = oi.event_id
                {where_sql}""",
            params
        ).fetchone()
        total = count_row['total']

        rows = conn.execute(
            f"""SELECT re.*, oi.severity
                FROM restore_events re
                LEFT JOIN operational_impact oi ON re.id = oi.event_id
                {where_sql}
                ORDER BY re.created_at DESC LIMIT ? OFFSET ?""",
            params + [limit, offset]
        ).fetchall()

        return {
            "success": True,
            "total": total,
            "limit": limit,
            "offset": offset,
            "events": rows_to_list(rows)
        }
    finally:
        conn.close()


@router.get("/events/{event_id}")
async def get_event(event_id: int, user=Depends(get_current_user)):
    """Obtener detalle completo de un evento"""
    require_admin(user)

    conn = get_audit_db()
    try:
        event = row_to_dict(conn.execute("SELECT * FROM restore_events WHERE id = ?", (event_id,)).fetchone())
        if not event:
            raise HTTPException(404, "Evento no encontrado")

        technical = row_to_dict(conn.execute("SELECT * FROM technical_checks WHERE event_id = ?", (event_id,)).fetchone())
        functional = row_to_dict(conn.execute("SELECT * FROM functional_checks WHERE event_id = ?", (event_id,)).fetchone())
        impact = row_to_dict(conn.execute("SELECT * FROM operational_impact WHERE event_id = ?", (event_id,)).fetchone())
        confirmation = row_to_dict(conn.execute("SELECT * FROM confirmations WHERE event_id = ?", (event_id,)).fetchone())

        return {
            "success": True,
            "event": event,
            "technical_checks": technical,
            "functional_checks": functional,
            "operational_impact": impact,
            "confirmation": confirmation
        }
    finally:
        conn.close()


@router.put("/events/{event_id}")
async def update_event(event_id: int, request: UpdateEventRequest, user=Depends(get_current_user)):
    """Actualizar info general de un evento (solo si NO está confirmado)"""
    require_admin(user)
    uid, uname = get_user_info(user)

    conn = get_audit_db()
    try:
        check_not_confirmed(conn, event_id)

        updates = {}
        data = request.dict(exclude_unset=True)
        if not data:
            raise HTTPException(400, "No se enviaron campos para actualizar")

        for key, value in data.items():
            updates[key] = value

        # Recalcular duración si se actualizan fechas
        if 'start_datetime' in updates or 'end_datetime' in updates:
            current = row_to_dict(conn.execute("SELECT start_datetime, end_datetime FROM restore_events WHERE id = ?", (event_id,)).fetchone())
            start_str = updates.get('start_datetime', current['start_datetime'])
            end_str = updates.get('end_datetime', current['end_datetime'])
            if start_str and end_str:
                try:
                    start = datetime.fromisoformat(start_str.replace('Z', '+00:00'))
                    end = datetime.fromisoformat(end_str.replace('Z', '+00:00'))
                    dur = (end - start).total_seconds()
                    if dur < 0:
                        raise HTTPException(400, "end_datetime no puede ser anterior a start_datetime")
                    updates['duration_seconds'] = dur
                except ValueError:
                    pass

        updates['last_modified_at'] = now_iso()
        updates['last_modified_by_user_id'] = uid
        updates['last_modified_by_username'] = uname

        set_clause = ", ".join(f"{k} = ?" for k in updates.keys())
        params = list(updates.values()) + [event_id]
        conn.execute(f"UPDATE restore_events SET {set_clause} WHERE id = ?", params)
        conn.commit()

        event = row_to_dict(conn.execute("SELECT * FROM restore_events WHERE id = ?", (event_id,)).fetchone())
        return {"success": True, "event": event}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        traceback.print_exc()
        raise HTTPException(500, f"Error al actualizar evento: {str(e)}")
    finally:
        conn.close()


@router.post("/events/{event_id}/technical-checks")
async def save_technical_checks(event_id: int, request: TechnicalChecksRequest, user=Depends(get_current_user)):
    """Guardar o actualizar validaciones técnicas"""
    require_admin(user)
    uid, uname = get_user_info(user)

    conn = get_audit_db()
    try:
        check_not_confirmed(conn, event_id)
        ts = now_iso()

        existing = conn.execute("SELECT id FROM technical_checks WHERE event_id = ?", (event_id,)).fetchone()

        if existing:
            conn.execute("""
                UPDATE technical_checks SET
                    integrity_verified=?, integrity_result=?, integrity_observations=?,
                    total_tables=?, critical_record_count=?,
                    log_errors_detected=?, log_errors_observations=?,
                    data_consistency_validated=?, data_consistency_observations=?,
                    checksum_match=?, checksum_observations=?,
                    last_modified_at=?
                WHERE event_id=?
            """, (
                int(request.integrity_verified), request.integrity_result, request.integrity_observations,
                request.total_tables, request.critical_record_count,
                request.log_errors_detected, request.log_errors_observations,
                int(request.data_consistency_validated), request.data_consistency_observations,
                int(request.checksum_match) if request.checksum_match is not None else None, request.checksum_observations,
                ts, event_id
            ))
        else:
            conn.execute("""
                INSERT INTO technical_checks (
                    event_id, integrity_verified, integrity_result, integrity_observations,
                    total_tables, critical_record_count,
                    log_errors_detected, log_errors_observations,
                    data_consistency_validated, data_consistency_observations,
                    checksum_match, checksum_observations,
                    created_at, last_modified_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                event_id,
                int(request.integrity_verified), request.integrity_result, request.integrity_observations,
                request.total_tables, request.critical_record_count,
                request.log_errors_detected, request.log_errors_observations,
                int(request.data_consistency_validated), request.data_consistency_observations,
                int(request.checksum_match) if request.checksum_match is not None else None, request.checksum_observations,
                ts, ts
            ))

        # Marcar sección completa
        conn.execute("UPDATE restore_events SET technical_checks_completed=1, last_modified_at=?, last_modified_by_user_id=?, last_modified_by_username=? WHERE id=?",
                      (ts, uid, uname, event_id))
        conn.commit()

        result = row_to_dict(conn.execute("SELECT * FROM technical_checks WHERE event_id = ?", (event_id,)).fetchone())
        return {"success": True, "technical_checks": result}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        traceback.print_exc()
        raise HTTPException(500, f"Error al guardar validaciones técnicas: {str(e)}")
    finally:
        conn.close()


@router.post("/events/{event_id}/functional-checks")
async def save_functional_checks(event_id: int, request: FunctionalChecksRequest, user=Depends(get_current_user)):
    """Guardar o actualizar validaciones funcionales"""
    require_admin(user)
    uid, uname = get_user_info(user)

    conn = get_audit_db()
    try:
        check_not_confirmed(conn, event_id)
        ts = now_iso()

        existing = conn.execute("SELECT id FROM functional_checks WHERE event_id = ?", (event_id,)).fetchone()

        if existing:
            conn.execute("""
                UPDATE functional_checks SET
                    auth_result=?, auth_observations=?,
                    critical_modules_result=?, critical_modules_observations=?,
                    main_apis_result=?, main_apis_observations=?,
                    sensitive_operations_result=?, sensitive_operations_observations=?,
                    admin_panel_result=?, admin_panel_observations=?,
                    last_modified_at=?
                WHERE event_id=?
            """, (
                request.auth_result, request.auth_observations,
                request.critical_modules_result, request.critical_modules_observations,
                request.main_apis_result, request.main_apis_observations,
                request.sensitive_operations_result, request.sensitive_operations_observations,
                request.admin_panel_result, request.admin_panel_observations,
                ts, event_id
            ))
        else:
            conn.execute("""
                INSERT INTO functional_checks (
                    event_id, auth_result, auth_observations,
                    critical_modules_result, critical_modules_observations,
                    main_apis_result, main_apis_observations,
                    sensitive_operations_result, sensitive_operations_observations,
                    admin_panel_result, admin_panel_observations,
                    created_at, last_modified_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                event_id,
                request.auth_result, request.auth_observations,
                request.critical_modules_result, request.critical_modules_observations,
                request.main_apis_result, request.main_apis_observations,
                request.sensitive_operations_result, request.sensitive_operations_observations,
                request.admin_panel_result, request.admin_panel_observations,
                ts, ts
            ))

        conn.execute("UPDATE restore_events SET functional_checks_completed=1, last_modified_at=?, last_modified_by_user_id=?, last_modified_by_username=? WHERE id=?",
                      (ts, uid, uname, event_id))
        conn.commit()

        result = row_to_dict(conn.execute("SELECT * FROM functional_checks WHERE event_id = ?", (event_id,)).fetchone())
        return {"success": True, "functional_checks": result}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        traceback.print_exc()
        raise HTTPException(500, f"Error al guardar validaciones funcionales: {str(e)}")
    finally:
        conn.close()


@router.post("/events/{event_id}/operational-impact")
async def save_operational_impact(event_id: int, request: OperationalImpactRequest, user=Depends(get_current_user)):
    """Guardar o actualizar impacto operativo"""
    require_admin(user)
    uid, uname = get_user_info(user)

    conn = get_audit_db()
    try:
        check_not_confirmed(conn, event_id)
        ts = now_iso()

        existing = conn.execute("SELECT id FROM operational_impact WHERE event_id = ?", (event_id,)).fetchone()

        if existing:
            conn.execute("""
                UPDATE operational_impact SET
                    had_downtime=?, downtime_minutes=?, estimated_affected_users=?,
                    severity=?, needed_retry=?, needed_rollback=?, observations=?,
                    last_modified_at=?
                WHERE event_id=?
            """, (
                int(request.had_downtime), request.downtime_minutes, request.estimated_affected_users,
                request.severity, int(request.needed_retry), int(request.needed_rollback), request.observations,
                ts, event_id
            ))
        else:
            conn.execute("""
                INSERT INTO operational_impact (
                    event_id, had_downtime, downtime_minutes, estimated_affected_users,
                    severity, needed_retry, needed_rollback, observations,
                    created_at, last_modified_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                event_id,
                int(request.had_downtime), request.downtime_minutes, request.estimated_affected_users,
                request.severity, int(request.needed_retry), int(request.needed_rollback), request.observations,
                ts, ts
            ))

        conn.execute("UPDATE restore_events SET operational_impact_completed=1, last_modified_at=?, last_modified_by_user_id=?, last_modified_by_username=? WHERE id=?",
                      (ts, uid, uname, event_id))
        conn.commit()

        result = row_to_dict(conn.execute("SELECT * FROM operational_impact WHERE event_id = ?", (event_id,)).fetchone())
        return {"success": True, "operational_impact": result}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        traceback.print_exc()
        raise HTTPException(500, f"Error al guardar impacto operativo: {str(e)}")
    finally:
        conn.close()


@router.post("/events/{event_id}/confirm")
async def confirm_event(event_id: int, request: ConfirmEventRequest, user=Depends(get_current_user)):
    """
    Confirmar formalmente un evento de restauración.
    Requiere: todas las secciones completadas + accepts_responsibility = True.
    Operación atómica con lock para evitar confirmaciones duplicadas.
    """
    require_admin(user)
    uid, uname = get_user_info(user)

    if not request.accepts_responsibility:
        raise HTTPException(400, "Debe aceptar la responsabilidad operativa para confirmar")

    # Lock atómico para evitar condiciones de carrera
    with _confirm_lock:
        conn = get_audit_db()
        try:
            # 1. Verificar que no esté confirmado
            event = row_to_dict(conn.execute("SELECT * FROM restore_events WHERE id = ?", (event_id,)).fetchone())
            if not event:
                raise HTTPException(404, "Evento no encontrado")
            if event['is_confirmed']:
                raise HTTPException(status.HTTP_409_CONFLICT, "Este evento ya fue confirmado")

            # 2. Validar que todas las secciones estén completas
            errors = []
            if not event['technical_checks_completed']:
                errors.append("Validaciones técnicas no completadas")
            if not event['functional_checks_completed']:
                errors.append("Validaciones funcionales no completadas")
            if not event['operational_impact_completed']:
                errors.append("Impacto operativo no completado")

            # 3. Validar campos críticos de info general
            if not event['start_datetime']:
                errors.append("Fecha/hora de inicio no registrada")
            if not event['database_name']:
                errors.append("Nombre de base de datos no registrado")
            if not event['restore_reason']:
                errors.append("Motivo de restauración no registrado")
            if not event['server_name']:
                errors.append("Servidor no registrado")

            # 4. Validar campos críticos técnicos
            tc = row_to_dict(conn.execute("SELECT * FROM technical_checks WHERE event_id = ?", (event_id,)).fetchone())
            if tc:
                if tc['integrity_result'] == 'pendiente':
                    errors.append("Resultado de integridad en estado pendiente")
            else:
                errors.append("Sección de validaciones técnicas no registrada")

            # 5. Validar campos funcionales
            fc = row_to_dict(conn.execute("SELECT * FROM functional_checks WHERE event_id = ?", (event_id,)).fetchone())
            if fc:
                pending_funcs = []
                if fc['auth_result'] == 'pendiente':
                    pending_funcs.append("Autenticación")
                if fc['critical_modules_result'] == 'pendiente':
                    pending_funcs.append("Módulos críticos")
                if fc['main_apis_result'] == 'pendiente':
                    pending_funcs.append("APIs principales")
                if fc['sensitive_operations_result'] == 'pendiente':
                    pending_funcs.append("Operaciones sensibles")
                if fc['admin_panel_result'] == 'pendiente':
                    pending_funcs.append("Panel administrativo")
                if pending_funcs:
                    errors.append(f"Validaciones funcionales pendientes: {', '.join(pending_funcs)}")
            else:
                errors.append("Sección de validaciones funcionales no registrada")

            # 6. Validar impacto operativo
            oi = row_to_dict(conn.execute("SELECT * FROM operational_impact WHERE event_id = ?", (event_id,)).fetchone())
            if not oi:
                errors.append("Sección de impacto operativo no registrada")

            # 7. Si severidad alta/crítica y hay errores técnicos, advertir
            if oi and oi['severity'] in ('alto', 'critico') and tc:
                if tc['integrity_result'] == 'fallo':
                    errors.append("No se puede confirmar con integridad fallida y severidad alta/crítica")
                if tc['log_errors_detected'] and tc['log_errors_detected'].strip():
                    has_unresolved = True
                    obs = tc.get('log_errors_observations', '') or ''
                    if 'resuelto' in obs.lower() or 'resolved' in obs.lower():
                        has_unresolved = False
                    if has_unresolved:
                        errors.append("Hay errores en logs sin resolver con severidad alta/crítica")

            if errors:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={
                        "message": "No se puede confirmar: checklist incompleto",
                        "errors": errors
                    }
                )

            # 8. Ejecutar confirmación atómica
            ts = now_iso()
            conn.execute("""
                INSERT INTO confirmations (event_id, admin_user_id, admin_username, final_comments, accepts_responsibility, confirmed_at)
                VALUES (?, ?, ?, ?, 1, ?)
            """, (event_id, uid, uname, request.final_comments, ts))

            conn.execute("""
                UPDATE restore_events SET
                    is_confirmed = 1,
                    confirmed_at = ?,
                    confirmed_by_user_id = ?,
                    confirmed_by_username = ?,
                    last_modified_at = ?,
                    last_modified_by_user_id = ?,
                    last_modified_by_username = ?
                WHERE id = ?
            """, (ts, uid, uname, ts, uid, uname, event_id))

            conn.commit()

            return {
                "success": True,
                "message": "Evento confirmado exitosamente. Registro bloqueado para edición.",
                "confirmed_at": ts,
                "confirmed_by": uname
            }
        except HTTPException:
            raise
        except Exception as e:
            conn.rollback()
            traceback.print_exc()
            raise HTTPException(500, f"Error al confirmar evento: {str(e)}")
        finally:
            conn.close()


@router.get("/stats")
async def get_stats(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    user=Depends(get_current_user)
):
    """Estadísticas agregadas de restauraciones"""
    require_admin(user)

    conn = get_audit_db()
    try:
        where_clauses = []
        params = []
        if start_date:
            where_clauses.append("re.created_at >= ?")
            params.append(start_date)
        if end_date:
            where_clauses.append("re.created_at <= ?")
            params.append(end_date + "T23:59:59")

        where_sql = ""
        if where_clauses:
            where_sql = "WHERE " + " AND ".join(where_clauses)

        # Total restauraciones
        total = conn.execute(f"SELECT COUNT(*) as c FROM restore_events re {where_sql}", params).fetchone()['c']

        # Confirmadas
        confirmed = conn.execute(
            f"SELECT COUNT(*) as c FROM restore_events re {where_sql} {'AND' if where_clauses else 'WHERE'} re.is_confirmed = 1",
            params
        ).fetchone()['c']

        # Promedio duración (solo con duración registrada)
        avg_dur = conn.execute(
            f"SELECT AVG(re.duration_seconds) as avg_d FROM restore_events re {where_sql} {'AND' if where_clauses else 'WHERE'} re.duration_seconds IS NOT NULL",
            params
        ).fetchone()['avg_d'] or 0

        # Total downtime acumulado
        dt_where = where_sql.replace("re.", "oi.event_id IN (SELECT id FROM restore_events re ") if where_sql else ""
        total_downtime = conn.execute(
            f"SELECT COALESCE(SUM(oi.downtime_minutes), 0) as total FROM operational_impact oi JOIN restore_events re ON oi.event_id = re.id {where_sql}",
            params
        ).fetchone()['total']

        # Distribución por entorno
        by_env = rows_to_list(conn.execute(
            f"SELECT re.environment, COUNT(*) as count FROM restore_events re {where_sql} GROUP BY re.environment ORDER BY count DESC",
            params
        ).fetchall())

        # Distribución por causa (motivo)
        by_reason = rows_to_list(conn.execute(
            f"SELECT re.restore_reason as reason, COUNT(*) as count FROM restore_events re {where_sql} GROUP BY re.restore_reason ORDER BY count DESC LIMIT 10",
            params
        ).fetchall())

        # Tasa de errores (integridad fallo)
        total_tc = conn.execute(
            f"SELECT COUNT(*) as c FROM technical_checks tc JOIN restore_events re ON tc.event_id = re.id {where_sql}",
            params
        ).fetchone()['c']
        error_tc = conn.execute(
            f"SELECT COUNT(*) as c FROM technical_checks tc JOIN restore_events re ON tc.event_id = re.id {where_sql} {'AND' if where_clauses else 'WHERE'} tc.integrity_result = 'fallo'",
            params
        ).fetchone()['c']
        error_rate = (error_tc / total_tc * 100) if total_tc > 0 else 0

        # Tasa impacto crítico
        total_oi = conn.execute(
            f"SELECT COUNT(*) as c FROM operational_impact oi JOIN restore_events re ON oi.event_id = re.id {where_sql}",
            params
        ).fetchone()['c']
        critical_oi = conn.execute(
            f"SELECT COUNT(*) as c FROM operational_impact oi JOIN restore_events re ON oi.event_id = re.id {where_sql} {'AND' if where_clauses else 'WHERE'} oi.severity = 'critico'",
            params
        ).fetchone()['c']
        critical_rate = (critical_oi / total_oi * 100) if total_oi > 0 else 0

        # Distribución severidad
        by_severity = rows_to_list(conn.execute(
            f"SELECT oi.severity, COUNT(*) as count FROM operational_impact oi JOIN restore_events re ON oi.event_id = re.id {where_sql} GROUP BY oi.severity",
            params
        ).fetchall())

        # Por administrador
        by_admin = rows_to_list(conn.execute(
            f"SELECT re.admin_username, COUNT(*) as count FROM restore_events re {where_sql} GROUP BY re.admin_user_id ORDER BY count DESC",
            params
        ).fetchall())

        # Tendencia mensual
        monthly_trend = rows_to_list(conn.execute(
            f"""SELECT strftime('%Y-%m', re.created_at) as month, COUNT(*) as count
                FROM restore_events re {where_sql}
                GROUP BY month ORDER BY month DESC LIMIT 12""",
            params
        ).fetchall())

        return {
            "success": True,
            "stats": {
                "total_restorations": total,
                "confirmed": confirmed,
                "pending_confirmation": total - confirmed,
                "avg_duration_seconds": round(avg_dur, 2),
                "avg_duration_formatted": f"{int(avg_dur // 3600)}h {int((avg_dur % 3600) // 60)}m {int(avg_dur % 60)}s" if avg_dur else "N/A",
                "total_downtime_minutes": round(total_downtime, 2),
                "error_rate_percent": round(error_rate, 2),
                "critical_impact_rate_percent": round(critical_rate, 2),
                "by_environment": by_env,
                "by_reason": by_reason,
                "by_severity": by_severity,
                "by_admin": by_admin,
                "monthly_trend": monthly_trend
            }
        }
    finally:
        conn.close()


@router.get("/export")
async def export_history(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    environment: Optional[str] = Query(None),
    user=Depends(get_current_user)
):
    """Exportar historial en CSV para auditoría externa"""
    require_admin(user)

    conn = get_audit_db()
    try:
        where_clauses = []
        params = []
        if start_date:
            where_clauses.append("re.created_at >= ?")
            params.append(start_date)
        if end_date:
            where_clauses.append("re.created_at <= ?")
            params.append(end_date + "T23:59:59")
        if environment:
            where_clauses.append("re.environment = ?")
            params.append(environment)

        where_sql = ""
        if where_clauses:
            where_sql = "WHERE " + " AND ".join(where_clauses)

        rows = conn.execute(
            f"""SELECT
                re.id, re.start_datetime, re.end_datetime, re.duration_seconds,
                re.admin_username, re.database_name, re.environment, re.restore_type,
                re.backup_size_mb, re.restore_reason, re.execution_method, re.server_name,
                re.is_confirmed, re.confirmed_at, re.confirmed_by_username,
                tc.integrity_result, tc.total_tables, tc.critical_record_count,
                tc.data_consistency_validated, tc.checksum_match,
                fc.auth_result, fc.critical_modules_result, fc.main_apis_result,
                fc.sensitive_operations_result, fc.admin_panel_result,
                oi.had_downtime, oi.downtime_minutes, oi.estimated_affected_users,
                oi.severity, oi.needed_retry, oi.needed_rollback,
                c.final_comments, c.confirmed_at as confirmation_timestamp
            FROM restore_events re
            LEFT JOIN technical_checks tc ON re.id = tc.event_id
            LEFT JOIN functional_checks fc ON re.id = fc.event_id
            LEFT JOIN operational_impact oi ON re.id = oi.event_id
            LEFT JOIN confirmations c ON re.id = c.event_id
            {where_sql}
            ORDER BY re.created_at DESC""",
            params
        ).fetchall()

        output = io.StringIO()
        writer = csv.writer(output)
        if rows:
            writer.writerow(rows[0].keys())
            for row in rows:
                writer.writerow(tuple(row))

        csv_content = output.getvalue()
        output.close()

        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=restore_audit_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            }
        )
    finally:
        conn.close()


# ============================================
# VERIFICACIÓN AL CARGAR
# ============================================
print("\n" + "=" * 70)
print("✅ RESTORE AUDIT ROUTER CARGADO EXITOSAMENTE")
print("=" * 70)
print("   Base de datos: " + DB_PATH)
print("   Endpoints registrados:")
for route in router.routes:
    if hasattr(route, 'methods') and hasattr(route, 'path'):
        methods = ','.join(sorted(route.methods))
        print(f"      {methods:12} {route.path}")
print("=" * 70 + "\n")
