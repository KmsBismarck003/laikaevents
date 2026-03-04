"""
Refunds Router - Sistema de reembolsos de boletos.

AISLADO: Si se elimina este archivo, la app sigue funcionando.
SEGURO: Valida ownership del ticket, politica de reembolso, y usa transacciones.

Montado en: /api/refunds
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import traceback

from dependencies import get_current_user

router = APIRouter()

# Configuracion de politica de reembolsos
REFUND_CUTOFF_HOURS = 48  # No se puede reembolsar si faltan menos de 48hrs


# ============================================
# DB DEPENDENCY
# ============================================

def get_db():
    from main import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================
# MODELS
# ============================================

class RefundRequestModel(BaseModel):
    ticket_id: int
    reason: Optional[str] = "Solicitud del usuario"


# ============================================
# ENDPOINTS
# ============================================

@router.get("/policy/{event_id}")
def check_refund_policy(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Verificar si un evento permite reembolsos.
    Retorna eligibilidad y motivo.
    """
    try:
        event = db.execute(
            text("SELECT id, name, event_date, status FROM events WHERE id = :id"),
            {"id": event_id}
        ).fetchone()

        if not event:
            raise HTTPException(status_code=404, detail="Evento no encontrado")

        event_data = dict(event._mapping)
        event_status = event_data.get('status', '')
        event_date = event_data.get('event_date')

        # Si el evento esta cancelado, siempre se puede reembolsar
        if event_status == 'cancelled':
            return {
                "eligible": True,
                "reason": "El evento fue cancelado. El reembolso es automatico.",
                "event_name": event_data.get('name'),
                "policy": "event_cancelled"
            }

        # Si el evento ya paso
        if event_date:
            from datetime import date as date_type
            if isinstance(event_date, str):
                event_date = datetime.strptime(event_date, '%Y-%m-%d').date()
            if event_date < datetime.now().date():
                return {
                    "eligible": False,
                    "reason": "El evento ya ocurrio. No se permiten reembolsos.",
                    "event_name": event_data.get('name'),
                    "policy": "event_passed"
                }

        # Verificar ventana de tiempo
        if event_date:
            if isinstance(event_date, str):
                event_date = datetime.strptime(event_date, '%Y-%m-%d').date()
            cutoff = datetime.combine(event_date, datetime.min.time()) - timedelta(hours=REFUND_CUTOFF_HOURS)
            if datetime.now() > cutoff:
                return {
                    "eligible": False,
                    "reason": f"El reembolso debe solicitarse al menos {REFUND_CUTOFF_HOURS} horas antes del evento.",
                    "event_name": event_data.get('name'),
                    "policy": "too_late",
                    "cutoff": cutoff.isoformat()
                }

        return {
            "eligible": True,
            "reason": "El boleto es elegible para reembolso.",
            "event_name": event_data.get('name'),
            "policy": "eligible"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[Refunds] Error verificando politica: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Error al verificar politica de reembolso")


@router.post("/request")
def request_refund(
    body: RefundRequestModel,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Solicitar reembolso de un ticket.
    Transaccion atomica: actualiza ticket + incrementa available + crea log.
    """
    user_id = current_user['id']

    try:
        # 1. Verificar que el ticket existe y pertenece al usuario
        ticket = db.execute(
            text("""
                SELECT t.*, e.event_date, e.status as event_status, e.name as event_name
                FROM tickets t
                INNER JOIN events e ON t.event_id = e.id
                WHERE t.id = :ticket_id AND t.user_id = :user_id
            """),
            {"ticket_id": body.ticket_id, "user_id": user_id}
        ).fetchone()

        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Boleto no encontrado o no te pertenece"
            )

        ticket_data = dict(ticket._mapping)

        # 2. Verificar que el ticket esta activo
        if ticket_data.get('status') != 'active':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Solo se pueden reembolsar boletos activos. Estado actual: {ticket_data.get('status')}"
            )

        # 3. Verificar politica de reembolso (a menos que el evento este cancelado)
        event_status = ticket_data.get('event_status', '')
        if event_status != 'cancelled':
            event_date = ticket_data.get('event_date')
            if event_date:
                if isinstance(event_date, str):
                    event_date = datetime.strptime(event_date, '%Y-%m-%d').date()
                if event_date < datetime.now().date():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="No se puede reembolsar un boleto de un evento que ya ocurrio"
                    )
                cutoff = datetime.combine(event_date, datetime.min.time()) - timedelta(hours=REFUND_CUTOFF_HOURS)
                if datetime.now() > cutoff:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"El reembolso debe solicitarse al menos {REFUND_CUTOFF_HOURS} horas antes del evento"
                    )

        # --- TRANSACCION ATOMICA ---

        ticket_price = float(ticket_data.get('price', 0))
        event_id = ticket_data.get('event_id')

        # 4. Actualizar ticket
        db.execute(
            text("""
                UPDATE tickets
                SET status = 'refunded', refunded_at = NOW()
                WHERE id = :ticket_id AND status = 'active'
            """),
            {"ticket_id": body.ticket_id}
        )

        # 5. Incrementar tickets disponibles
        db.execute(
            text("""
                UPDATE events
                SET available_tickets = available_tickets + 1
                WHERE id = :event_id
            """),
            {"event_id": event_id}
        )

        # 6. Crear registro de reembolso
        db.execute(
            text("""
                INSERT INTO refund_logs (ticket_id, user_id, event_id, amount, reason, status, created_at)
                VALUES (:ticket_id, :user_id, :event_id, :amount, :reason, 'completed', NOW())
            """),
            {
                "ticket_id": body.ticket_id,
                "user_id": user_id,
                "event_id": event_id,
                "amount": ticket_price,
                "reason": body.reason or 'user_request'
            }
        )

        # 7. COMMIT
        db.commit()

        return {
            "success": True,
            "message": "Reembolso procesado exitosamente",
            "refund": {
                "ticket_id": body.ticket_id,
                "amount": ticket_price,
                "event_name": ticket_data.get('event_name', ''),
                "status": "completed"
            }
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"[Refunds] Error procesando reembolso: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar el reembolso"
        )


@router.get("/my-refunds")
def get_my_refunds(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtener historial de reembolsos del usuario."""
    try:
        user_id = current_user['id']

        result = db.execute(
            text("""
                SELECT
                    r.*,
                    e.name as event_name,
                    t.ticket_code
                FROM refund_logs r
                LEFT JOIN events e ON r.event_id = e.id
                LEFT JOIN tickets t ON r.ticket_id = t.id
                WHERE r.user_id = :user_id
                ORDER BY r.created_at DESC
            """),
            {"user_id": user_id}
        )

        refunds = [dict(row._mapping) for row in result.fetchall()]
        return refunds

    except Exception as e:
        print(f"[Refunds] Error obteniendo historial: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener historial de reembolsos"
        )
