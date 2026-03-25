from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import get_db
from .security import get_current_user
from .schemas import TicketPurchase, TicketVerify
from . import controller

app = FastAPI(title="Laika Ticket Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "alive", "service": "ticket-service"}

@app.get("/my-tickets")
def my_tickets(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return controller.get_user_tickets(db, user['id'])

@app.post("/verify")
def verify_ticket(data: TicketVerify, db: Session = Depends(get_db)):
    return controller.verify_ticket(db, data.ticketCode)

@app.post("/redeem")
def redeem_ticket(data: TicketVerify, db: Session = Depends(get_db)):
    return controller.redeem_ticket(db, data.ticketCode)

@app.get("/busy-seats/{event_id}")
def busy_seats(event_id: int, db: Session = Depends(get_db)):
    return controller.get_busy_seats(db, event_id)

@app.post("/purchase")
async def purchase(data: TicketPurchase, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return await controller.purchase_tickets(db, user['id'], data.items, data.paymentMethod)

@app.post("/payments/create-intent")
def create_payment_intent(data: dict, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return controller.create_payment_intent(db, user['id'], data.get("amount"), data.get("event_id"), data.get("method", "card"))

@app.post("/payments/{reference}/confirm")
async def confirm_payment(reference: str, db: Session = Depends(get_db)):
    return await controller.confirm_payment(db, reference)

@app.post("/refund")
def refund(data: dict, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    ticket_id = data.get("ticket_id")
    if not ticket_id:
        raise HTTPException(status_code=400, detail="ticket_id requerido")
    return controller.process_refund(db, user['id'], ticket_id)

@app.post("/lucky-seat/assign")
async def assign_lucky_seat(data: dict, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    event_id = data.get("event_id")
    if not event_id:
        raise HTTPException(status_code=400, detail="event_id es requerido")
    return await controller.assign_lucky_seat(db, user['id'], event_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
