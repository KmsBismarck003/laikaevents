from pydantic import BaseModel
from typing import List, Optional

class TicketItem(BaseModel):
    eventId: int
    quantity: int
    functionId: Optional[int] = None

class TicketPurchase(BaseModel):
    items: List[TicketItem]
    paymentMethod: str

class TicketVerify(BaseModel):
    ticketCode: str
