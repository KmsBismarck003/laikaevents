from pydantic import BaseModel
from typing import Optional, List
from datetime import date, time

class FunctionCreate(BaseModel):
    date: date
    time: time
    venue_id: int

class EventTicketSectionCreate(BaseModel):
    name: str
    price: float
    capacity: int
    available: int
    badge_text: Optional[str] = None
    color_hex: Optional[str] = None

class EventRuleCreate(BaseModel):
    title: str
    icon: str
    description: str

class EventCreate(BaseModel):
    name: str
    description: Optional[str] = None
    event_date: date
    event_time: time
    location: str
    venue: Optional[str] = None
    venue_id: Optional[int] = None
    category: str
    price: float
    total_tickets: int
    available_tickets: int
    image_url: Optional[str] = None
    status: str = 'draft'
    grid_position_x: Optional[int] = None
    grid_position_y: Optional[int] = None
    grid_span_x: int = 1
    grid_span_y: int = 1
    grid_page: Optional[int] = None
    functions: Optional[List[FunctionCreate]] = None
    sections: Optional[List[EventTicketSectionCreate]] = None
    rules: Optional[List[EventRuleCreate]] = None

class EventTicketSectionUpdate(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    price: Optional[float] = None
    capacity: Optional[int] = None
    available: Optional[int] = None
    badge_text: Optional[str] = None
    color_hex: Optional[str] = None

class EventRuleUpdate(BaseModel):
    id: Optional[int] = None
    title: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None

class EventUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[date] = None
    event_time: Optional[time] = None
    location: Optional[str] = None
    venue: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    total_tickets: Optional[int] = None
    available_tickets: Optional[int] = None
    image_url: Optional[str] = None
    status: Optional[str] = None
    grid_position_x: Optional[int] = None
    grid_position_y: Optional[int] = None
    grid_span_x: Optional[int] = 1
    grid_span_y: Optional[int] = 1
    grid_page: Optional[int] = None
    venue_id: Optional[int] = None
    functions: Optional[List[FunctionCreate]] = None
    sections: Optional[List[EventTicketSectionUpdate]] = None
    rules: Optional[List[EventRuleUpdate]] = None
