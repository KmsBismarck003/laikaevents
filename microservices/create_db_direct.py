import sys
sys.path.append('.') # Ensure microservices can be imported

from microservices.events.database import get_db, SessionLocal
from microservices.events.controller import create_event
from fastapi import HTTPException

db = SessionLocal()

payload = {
    "name": "Subagent VIP Tour Direct",
    "description": "Una prueba full stack del flujo de compra y creación de eventos.",
    "event_date": "2026-12-31",
    "event_time": "21:00",
    "location": "Arena CDMX",
    "venue": "Arena CDMX Principal",
    "category": "concert",
    "price": 500,
    "total_tickets": 1000,
    "available_tickets": 1000,
    "image_url": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    "status": "published",
    "sections": [
        {"name": "General", "price": 500, "capacity": 800, "available": 800, "badge_text": "", "color_hex": "#2c6cdd"},
        {"name": "Zona VIP", "price": 1500, "capacity": 200, "available": 200, "badge_text": "VIP Premium", "color_hex": "#f59e0b"}
    ],
    "rules": [
        {"title": "Acceso Restringido", "icon": "alert-triangle", "description": "No armas ni comida externa."},
        {"title": "Edad Mínima", "icon": "user-check", "description": "18 años."}
    ]
}

# The controller expects a pydantic model OR dict with pop. Since in controller.py we do event_data.dict(), we must pass a pydantic model or mock it.
class MockEvent:
    def __init__(self, data):
        self.data = data
    def dict(self):
        return self.data.copy()

try:
    event_data = MockEvent(payload)
    res = create_event(db, event_data, user_id=6)
    print("SUCCESS:", res)
except HTTPException as e:
    print("HTTP EXCEPTION:", e.detail)
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
