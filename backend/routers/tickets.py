from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import traceback
from dependencies import get_current_user
import uuid
import json

router = APIRouter()

# Dependencia para obtener la sesión de BD
def get_db():
    from main import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================================
# MODELOS
# ============================================

class TicketVerify(BaseModel):
    ticketCode: str

class TicketRedeem(BaseModel):
    ticketCode: str

class TicketItem(BaseModel):
    eventId: int
    quantity: int
    functionId: Optional[int] = None

class TicketPurchase(BaseModel):
    items: List[TicketItem]
    paymentMethod: str


# ============================================
# ENDPOINTS
# ============================================

@router.get("/my-tickets")
def get_my_tickets(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtener boletos del usuario actual"""
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else current_user['id']

        print(f"📤 Obteniendo boletos del usuario {user_id}")

        query = text("""
            SELECT
                t.*,
                e.name as event_name,
                COALESCE(ef.date, e.event_date) as event_date,
                COALESCE(ef.time, e.event_time) as event_time,
                COALESCE(v.name, e.venue, e.location) as location,
                v.city as venue_city,
                v.map_url
            FROM tickets t
            INNER JOIN events e ON t.event_id = e.id
            LEFT JOIN event_functions ef ON t.event_function_id = ef.id
            LEFT JOIN venues v ON ef.venue_id = v.id
            WHERE t.user_id = :user_id
            ORDER BY t.purchase_date DESC
        """)

        result = db.execute(query, {"user_id": user_id})
        tickets = result.fetchall()

        print(f"✅ {len(tickets)} boletos encontrados")

        return [dict(row._mapping) for row in tickets]

    except Exception as e:
        print(f"❌ Error al obtener boletos: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener boletos"
        )

@router.post("/purchase")
def purchase_tickets(
    purchase: TicketPurchase,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Comprar boletos (Simulado)
    Genera los boletos y los asocia al usuario.
    """
    try:
        user_id = current_user.id if hasattr(current_user, 'id') else current_user['id']
        print(f"📤 Procesando compra para usuario {user_id}")

        purchased_tickets = []

        # Iniciar transacción
        try:
            for item in purchase.items:
                # Obtener evento para verificar y usar datos
                event_query = text("SELECT * FROM events WHERE id = :event_id")
                event = db.execute(event_query, {"event_id": item.eventId}).fetchone()

                if not event:
                    print(f"⚠️ Evento no encontrado: {item.eventId}")
                    continue

                # Generar boletos según cantidad
                for _ in range(item.quantity):
                    ticket_code = f"TKT-{uuid.uuid4().hex[:8].upper()}"

                    insert_query = text("""
                        INSERT INTO tickets
                        (user_id, event_id, event_function_id, ticket_code, status, purchase_date, price, ticket_type)
                        VALUES
                        (:user_id, :event_id, :function_id, :ticket_code, 'active', NOW(), :price, 'GENERAL')
                    """)

                    db.execute(insert_query, {
                        "user_id": user_id,
                        "event_id": item.eventId,
                        "function_id": item.functionId,
                        "ticket_code": ticket_code,
                        "price": event.price if hasattr(event, 'price') else 0
                    })

                    # Agregar a la lista de respuesta
                    purchased_tickets.append({
                        "ticketCode": ticket_code,
                        "eventId": item.eventId,
                        "eventName": event.name,
                        "price": float(event.price) if hasattr(event, 'price') else 0
                    })

            db.commit()
            print(f"[TICKETS] Compra exitosa: {len(purchased_tickets)} boletos generados")

            # Guardar en MongoDB la analitica financiera asincronamente
            try:
                from core.mongodb import MongoAnalytics
                for t in purchased_tickets:
                    background_tasks.add_task(
                        MongoAnalytics.log_ticket_purchased,
                        ticket_code=t["ticketCode"],
                        event_id=t["eventId"],
                        user_id=user_id,
                        ticket_type="GENERAL", # Fix hardcode later if dynamic
                        price=t["price"]
                    )
                # Tambien registrar el pago procesado
                total_amount = sum(t["price"] for t in purchased_tickets)
                if total_amount > 0:
                     background_tasks.add_task(
                        MongoAnalytics.log_payment_processed,
                        transaction_id=f"TXN-{uuid.uuid4().hex[:8].upper()}",
                        user_id=user_id,
                        event_id=purchase.items[0].eventId if purchase.items else 0,
                        amount=total_amount,
                        method=purchase.paymentMethod
                    )
                print("✅ Tareas asincronas de MongoDB (financieras) encoladas")
            except Exception as mongo_err:
                print(f"⚠️ Error al encolar analítica financiera de MongoDB: {mongo_err}")


            # ============================================
            # HOOK: Verificar logros (fail-safe, aislado)
            # ============================================
            newly_unlocked = []
            try:
                from routers.achievements import check_and_unlock
                newly_unlocked = check_and_unlock(user_id, db)
                if newly_unlocked:
                    print(f"[ACHIEVEMENTS] {len(newly_unlocked)} logros desbloqueados!")
            except ImportError:
                pass  # Modulo de logros no disponible
            except Exception as ach_err:
                print(f"[ACHIEVEMENTS] Error (no critico): {ach_err}")
            # ============================================

            return {
                "success": True,
                "message": "Compra realizada con exito",
                "tickets": purchased_tickets,
                "achievements_unlocked": newly_unlocked
            }

        except Exception as e:
            db.rollback()
            raise e

    except Exception as e:
        print(f"❌ Error en compra: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar la compra"
        )

@router.post("/verify")
def verify_ticket(request: TicketVerify, db: Session = Depends(get_db)):
    """Verificar si un boleto es válido (Operador)"""
    try:
        print(f"📤 Verificando boleto: {request.ticketCode}")

        query = text("""
            SELECT
                t.*,
                e.name as event_name,
                COALESCE(ef.date, e.event_date) as event_date,
                COALESCE(ef.time, e.event_time) as event_time,
                u.first_name,
                u.last_name
            FROM tickets t
            INNER JOIN events e ON t.event_id = e.id
            INNER JOIN users u ON t.user_id = u.id
            LEFT JOIN event_functions ef ON t.event_function_id = ef.id
            WHERE t.ticket_code = :ticket_code
        """)

        result = db.execute(query, {"ticket_code": request.ticketCode})
        ticket = result.fetchone()

        if not ticket:
            print(f"❌ Boleto no encontrado: {request.ticketCode}")
            return {
                "valid": False,
                "message": "Boleto no encontrado"
            }

        # Verificar si ya fue usado
        if ticket.status == "used":
            print(f"⚠️ Boleto ya usado: {request.ticketCode}")
            return {
                "valid": False,
                "already_used": True,
                "message": "Boleto ya utilizado",
                "ticketCode": ticket.ticket_code,
                "eventName": ticket.event_name,
                "customerName": f"{ticket.first_name} {ticket.last_name}",
                "ticketType": ticket.ticket_type,
                "purchaseDate": str(ticket.purchase_date),
                "usedAt": str(ticket.used_at) if hasattr(ticket, 'used_at') else None
            }

        # Verificar si está cancelado o reembolsado
        if ticket.status in ["cancelled", "refunded"]:
            print(f"❌ Boleto {ticket.status}: {request.ticketCode}")
            return {
                "valid": False,
                "message": f"Boleto {ticket.status}"
            }

        print(f"✅ Boleto válido: {request.ticketCode}")

        return {
            "valid": True,
            "id": ticket.id,
            "ticketCode": ticket.ticket_code,
            "event": {
                "name": ticket.event_name
            },
            "customer": {
                "name": f"{ticket.first_name} {ticket.last_name}"
            },
            "ticketType": ticket.ticket_type,
            "purchaseDate": str(ticket.purchase_date),
            "price": float(ticket.price)
        }

    except Exception as e:
        print(f"❌ Error al verificar boleto: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al verificar boleto"
        )

@router.post("/redeem")
def redeem_ticket(request: TicketRedeem, db: Session = Depends(get_db)):
    """Canjear boleto (marcar como usado) - Operador"""
    try:
        print(f"📤 Canjeando boleto: {request.ticketCode}")

        # Primero verificar que existe y está activo
        query_check = text("""
            SELECT * FROM tickets
            WHERE ticket_code = :ticket_code
        """)

        result = db.execute(query_check, {"ticket_code": request.ticketCode})
        ticket = result.fetchone()

        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Boleto no encontrado"
            )

        if ticket.status == "used":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Boleto ya utilizado"
            )

        if ticket.status in ["cancelled", "refunded"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Boleto {ticket.status}"
            )

        # ✅ FIX: Marcar como usado SIN el campo used_by para evitar error de FK
        query_update = text("""
            UPDATE tickets
            SET status = 'used',
                used_at = NOW()
            WHERE ticket_code = :ticket_code
        """)

        db.execute(query_update, {
            "ticket_code": request.ticketCode
        })
        db.commit()

        print(f"✅ Boleto canjeado: {request.ticketCode}")

        return {
            "success": True,
            "message": "Entrada registrada exitosamente",
            "ticketCode": request.ticketCode
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error al canjear boleto: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al canjear boleto"
        )

@router.get("/{ticket_code}")
def get_ticket_by_code(ticket_code: str, db: Session = Depends(get_db)):
    """Obtener información de un boleto por código"""
    try:
        print(f"📤 Obteniendo boleto: {ticket_code}")

        query = text("""
            SELECT
                t.*,
                e.name as event_name,
                COALESCE(ef.date, e.event_date) as event_date,
                COALESCE(ef.time, e.event_time) as event_time,
                COALESCE(v.name, e.venue, e.location) as location,
                u.first_name,
                u.last_name
            FROM tickets t
            INNER JOIN events e ON t.event_id = e.id
            INNER JOIN users u ON t.user_id = u.id
            LEFT JOIN event_functions ef ON t.event_function_id = ef.id
            LEFT JOIN venues v ON ef.venue_id = v.id
            WHERE t.ticket_code = :ticket_code
        """)

        result = db.execute(query, {"ticket_code": ticket_code})
        ticket = result.fetchone()

        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Boleto no encontrado"
            )

        print(f"✅ Boleto encontrado")
        return dict(ticket._mapping)

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error al obtener boleto: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener boleto"
        )
