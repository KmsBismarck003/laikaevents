"""
Event Service - Logica de negocio para gestion de eventos.

Separa la logica del HTTP layer (routers).
Todos los metodos validan ownership y usan transacciones atomicas.
"""

from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import HTTPException, status
from datetime import datetime
import traceback


# ============================================
# OWNERSHIP
# ============================================

def get_event_with_ownership(event_id: int, user_id: int, db: Session) -> dict:
    """
    Obtiene un evento validando que el usuario sea el propietario.
    Admins pueden acceder a cualquier evento.

    Raises HTTPException 404 si no existe, 403 si no es propietario.
    """
    event = db.execute(
        text("SELECT * FROM events WHERE id = :id"),
        {"id": event_id}
    ).fetchone()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evento no encontrado"
        )

    event_dict = dict(event._mapping)

    # Verificar ownership
    if event_dict.get('created_by') != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos sobre este evento"
        )

    return event_dict


def check_ownership_or_admin(event_id: int, user: dict, db: Session) -> dict:
    """
    Verifica ownership O que el usuario sea admin.
    """
    event = db.execute(
        text("SELECT * FROM events WHERE id = :id"),
        {"id": event_id}
    ).fetchone()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evento no encontrado"
        )

    event_dict = dict(event._mapping)
    user_id = user.get('id')
    user_role = user.get('role', '')

    if event_dict.get('created_by') != user_id and user_role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos sobre este evento"
        )

    return event_dict


# ============================================
# CANCEL EVENT (ATOMIC)
# ============================================

def cancel_event(event_id: int, reason: str, user: dict, db: Session) -> dict:
    """
    Cancela un evento de forma atomica:
    1. Actualiza status del evento a 'cancelled'
    2. Reembolsa todos los tickets activos
    3. Registra en audit log

    Todo en UNA sola transaccion. Si algo falla, rollback completo.

    Returns: { event_id, tickets_refunded, reason }
    """
    user_id = user.get('id')

    try:
        # 1. Validar ownership
        event = check_ownership_or_admin(event_id, user, db)

        # 2. Validar que se puede cancelar
        current_status = event.get('status', '')
        if current_status == 'cancelled':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El evento ya esta cancelado"
            )

        if current_status == 'archived':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede cancelar un evento archivado"
            )

        # --- INICIO TRANSACCION ATOMICA ---

        # 3. Actualizar evento
        db.execute(
            text("""
                UPDATE events
                SET status = 'cancelled',
                    cancel_reason = :reason,
                    cancelled_at = NOW(),
                    cancelled_by = :user_id
                WHERE id = :event_id
            """),
            {
                "reason": reason,
                "user_id": user_id,
                "event_id": event_id
            }
        )

        # 4. Contar tickets que se van a reembolsar
        active_tickets = db.execute(
            text("""
                SELECT COUNT(*) as count, COALESCE(SUM(price), 0) as total_amount
                FROM tickets
                WHERE event_id = :event_id AND status = 'active'
            """),
            {"event_id": event_id}
        ).fetchone()

        tickets_count = 0
        total_refunded = 0
        if active_tickets:
            mapping = dict(active_tickets._mapping)
            tickets_count = int(mapping.get('count', 0))
            total_refunded = float(mapping.get('total_amount', 0))

        # 5. Reembolsar todos los tickets activos
        if tickets_count > 0:
            db.execute(
                text("""
                    UPDATE tickets
                    SET status = 'refunded',
                        refunded_at = NOW()
                    WHERE event_id = :event_id AND status = 'active'
                """),
                {"event_id": event_id}
            )

            # 6. Crear registros de reembolso individuales
            db.execute(
                text("""
                    INSERT INTO refund_logs (ticket_id, user_id, event_id, amount, reason, status, created_at)
                    SELECT id, user_id, event_id, price, 'event_cancelled', 'completed', NOW()
                    FROM tickets
                    WHERE event_id = :event_id AND status = 'refunded' AND refunded_at IS NOT NULL
                """),
                {"event_id": event_id}
            )

        # 7. Audit log
        _log_manager_action(
            db=db,
            user_id=user_id,
            event_id=event_id,
            action='cancel_event',
            reason=reason,
            metadata_str=f'{{"tickets_refunded": {tickets_count}, "amount_refunded": {total_refunded}}}'
        )

        # 8. COMMIT - todo o nada
        db.commit()

        print(f"[EventService] Evento {event_id} cancelado. {tickets_count} tickets reembolsados.")

        return {
            "event_id": event_id,
            "tickets_refunded": tickets_count,
            "amount_refunded": total_refunded,
            "reason": reason,
            "cancelled_at": datetime.now().isoformat()
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"[EventService] Error al cancelar evento {event_id}: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al cancelar el evento"
        )


# ============================================
# TICKET ANALYTICS
# ============================================

def get_ticket_analytics(event_id: int, db: Session) -> dict:
    """
    Desglose completo de tickets para un evento.
    """
    try:
        # Conteo por status
        counts = db.execute(
            text("""
                SELECT
                    COALESCE(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0) as active,
                    COALESCE(SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END), 0) as used,
                    COALESCE(SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END), 0) as refunded,
                    COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) as cancelled,
                    COUNT(*) as total_issued
                FROM tickets
                WHERE event_id = :event_id
            """),
            {"event_id": event_id}
        ).fetchone()

        count_data = dict(counts._mapping) if counts else {
            "active": 0, "used": 0, "refunded": 0, "cancelled": 0, "total_issued": 0
        }

        # Datos del evento
        event = db.execute(
            text("SELECT total_tickets, available_tickets FROM events WHERE id = :id"),
            {"id": event_id}
        ).fetchone()

        event_data = dict(event._mapping) if event else {"total_tickets": 0, "available_tickets": 0}

        # Compras recientes (ultimas 10)
        recent = db.execute(
            text("""
                SELECT
                    t.ticket_code,
                    t.status,
                    t.price,
                    t.purchase_date,
                    u.first_name,
                    u.last_name
                FROM tickets t
                LEFT JOIN users u ON t.user_id = u.id
                WHERE t.event_id = :event_id
                ORDER BY t.purchase_date DESC
                LIMIT 10
            """),
            {"event_id": event_id}
        ).fetchall()

        recent_purchases = []
        for row in recent:
            r = dict(row._mapping)
            recent_purchases.append({
                "ticket_code": r.get('ticket_code'),
                "status": r.get('status'),
                "price": float(r.get('price', 0)),
                "purchase_date": str(r.get('purchase_date', '')),
                "customer": f"{r.get('first_name', '')} {r.get('last_name', '')}".strip()
            })

        sold = int(count_data.get('active', 0)) + int(count_data.get('used', 0))
        total = int(event_data.get('total_tickets', 0))

        return {
            "total_capacity": total,
            "available": int(event_data.get('available_tickets', 0)),
            "sold": sold,
            "active": int(count_data.get('active', 0)),
            "used": int(count_data.get('used', 0)),
            "refunded": int(count_data.get('refunded', 0)),
            "cancelled": int(count_data.get('cancelled', 0)),
            "total_issued": int(count_data.get('total_issued', 0)),
            "sell_through_pct": round((sold / total * 100), 1) if total > 0 else 0,
            "recent_purchases": recent_purchases
        }

    except Exception as e:
        print(f"[EventService] Error en analytics de tickets para evento {event_id}: {e}")
        traceback.print_exc()
        return {
            "total_capacity": 0, "available": 0, "sold": 0,
            "active": 0, "used": 0, "refunded": 0, "cancelled": 0,
            "total_issued": 0, "sell_through_pct": 0,
            "recent_purchases": []
        }


# ============================================
# AUDIT LOGGING (fail-safe)
# ============================================

def _log_manager_action(db: Session, user_id: int, event_id: int,
                         action: str, reason: str = None, metadata_str: str = None):
    """
    Registra una accion critica del manager. Fail-safe: si falla, no bloquea
    la operacion principal.
    """
    try:
        db.execute(
            text("""
                INSERT INTO manager_action_logs
                (user_id, event_id, action, reason, metadata, created_at)
                VALUES (:user_id, :event_id, :action, :reason, :metadata, NOW())
            """),
            {
                "user_id": user_id,
                "event_id": event_id,
                "action": action,
                "reason": reason,
                "metadata": metadata_str
            }
        )
    except Exception as e:
        # Fail-safe: log error pero no bloquear la operacion
        print(f"[AuditLog] Error al registrar accion (no critico): {e}")
