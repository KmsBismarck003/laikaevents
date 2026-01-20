from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import traceback

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

# ============================================
# ENDPOINTS
# ============================================

@router.get("/my-tickets")
def get_my_tickets(db: Session = Depends(get_db)):
    """Obtener boletos del usuario actual"""
    try:
        # TODO: Obtener user_id del token JWT
        user_id = 1  # Por ahora hardcodeado
        
        print(f"📤 Obteniendo boletos del usuario {user_id}")
        
        query = text("""
            SELECT 
                t.*,
                e.name as event_name,
                e.event_date,
                e.event_time,
                e.location
            FROM tickets t
            INNER JOIN events e ON t.event_id = e.id
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

@router.post("/verify")
def verify_ticket(request: TicketVerify, db: Session = Depends(get_db)):
    """Verificar si un boleto es válido (Operador)"""
    try:
        print(f"📤 Verificando boleto: {request.ticketCode}")
        
        query = text("""
            SELECT 
                t.*,
                e.name as event_name,
                u.first_name,
                u.last_name
            FROM tickets t
            INNER JOIN events e ON t.event_id = e.id
            INNER JOIN users u ON t.user_id = u.id
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
                "purchaseDate": str(ticket.purchase_date)
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
        
        # TODO: Obtener user_id del operador desde JWT
        operator_id = 1
        
        # Marcar como usado
        query_update = text("""
            UPDATE tickets 
            SET status = 'used', 
                used_at = NOW(),
                used_by = :operator_id
            WHERE ticket_code = :ticket_code
        """)
        
        db.execute(query_update, {
            "ticket_code": request.ticketCode,
            "operator_id": operator_id
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
                e.event_date,
                e.event_time,
                e.location,
                u.first_name,
                u.last_name
            FROM tickets t
            INNER JOIN events e ON t.event_id = e.id
            INNER JOIN users u ON t.user_id = u.id
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
