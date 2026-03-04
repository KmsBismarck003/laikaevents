"""
Revenue Service - Fuente unica de verdad para calculos financieros.

Centraliza TODOS los calculos de revenue para evitar inconsistencias
entre endpoints del manager, admin, y stats.

Reglas:
  - Revenue bruto = suma de precio de tickets con status 'active' o 'used'
  - Revenue reembolsado = suma de precio de tickets con status 'refunded'
  - Revenue neto = bruto - reembolsado
"""

from sqlalchemy.orm import Session
from sqlalchemy import text
import traceback


def calculate_event_revenue(event_id: int, db: Session) -> dict:
    """
    Calcula el desglose financiero completo de un evento.

    Returns:
        {
            "gross": float,           # Total cobrado (tickets active + used)
            "refunded_amount": float,  # Total reembolsado
            "net": float,             # gross - refunded_amount
            "tickets_sold": int,      # Tickets vendidos (active + used)
            "tickets_refunded": int,  # Tickets reembolsados
            "ticket_price": float,    # Precio unitario del evento
            "total_tickets": int,     # Capacidad total
            "available_tickets": int, # Disponibles para venta
            "occupancy_pct": float,   # % de capacidad vendida
            "projected_total": float, # Revenue si se vende todo
        }
    """
    try:
        # 1. Obtener datos base del evento
        event = db.execute(
            text("SELECT price, total_tickets, available_tickets FROM events WHERE id = :id"),
            {"id": event_id}
        ).fetchone()

        if not event:
            return _empty_revenue()

        event_data = dict(event._mapping)
        ticket_price = float(event_data.get('price', 0))
        total_tickets = int(event_data.get('total_tickets', 0))
        available_tickets = int(event_data.get('available_tickets', 0))

        # 2. Contar tickets por estado
        ticket_counts = db.execute(
            text("""
                SELECT
                    COALESCE(SUM(CASE WHEN status IN ('active', 'used') THEN 1 ELSE 0 END), 0) as sold,
                    COALESCE(SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END), 0) as used,
                    COALESCE(SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END), 0) as refunded,
                    COALESCE(SUM(CASE WHEN status IN ('active', 'used') THEN price ELSE 0 END), 0) as gross,
                    COALESCE(SUM(CASE WHEN status = 'refunded' THEN price ELSE 0 END), 0) as refunded_amount
                FROM tickets
                WHERE event_id = :event_id
            """),
            {"event_id": event_id}
        ).fetchone()

        if ticket_counts:
            counts = dict(ticket_counts._mapping)
            sold = int(counts.get('sold', 0))
            refunded = int(counts.get('refunded', 0))
            gross = float(counts.get('gross', 0))
            refunded_amount = float(counts.get('refunded_amount', 0))
        else:
            sold = 0
            refunded = 0
            gross = 0
            refunded_amount = 0

        net = gross - refunded_amount
        projected = ticket_price * total_tickets
        occupancy = round((sold / total_tickets * 100), 1) if total_tickets > 0 else 0

        return {
            "gross": gross,
            "refunded_amount": refunded_amount,
            "net": net,
            "tickets_sold": sold,
            "tickets_refunded": refunded,
            "ticket_price": ticket_price,
            "total_tickets": total_tickets,
            "available_tickets": available_tickets,
            "occupancy_pct": occupancy,
            "projected_total": projected,
        }

    except Exception as e:
        print(f"[RevenueService] Error calculando revenue para evento {event_id}: {e}")
        traceback.print_exc()
        return _empty_revenue()


def _empty_revenue() -> dict:
    """Retorna estructura vacia con valores por defecto."""
    return {
        "gross": 0,
        "refunded_amount": 0,
        "net": 0,
        "tickets_sold": 0,
        "tickets_refunded": 0,
        "ticket_price": 0,
        "total_tickets": 0,
        "available_tickets": 0,
        "occupancy_pct": 0,
        "projected_total": 0,
    }
