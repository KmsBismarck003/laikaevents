import sys
import traceback
sys.path.append('C:\\Users\\Pc\\Music\\proyectolaika2.6.7\\microservices')
from events.database import SessionLocal
from events.controller import create_event
from events.schemas import EventCreate

def test():
    db = SessionLocal()
    payload = {
        "name": "TEST EVENT DIRECT DB",
        "description": "Prueba del nuevo CRUD directo en DB",
        "event_date": "2025-12-31",
        "event_time": "20:00:00",
        "location": "Arena CDMX",
        "category": "concert",
        "price": 500.0,
        "total_tickets": 1000,
        "available_tickets": 1000,
        "sections": [
            {"name": "VIP", "price": 1500.0, "capacity": 200, "available": 200, "badge_text": "PREVENTA VIP", "color_hex": "#ffd700"},
            {"name": "General", "price": 500.0, "capacity": 800, "available": 800, "color_hex": "#cccccc"}
        ],
        "rules": [
            {"title": "Edad", "icon": "user-check", "description": "Para mayores de 18 años."}
        ]
    }
    
    try:
        event_data = EventCreate(**payload)
        res = create_event(db, event_data, user_id=6)
        print("Success:", res)
    except Exception as e:
        print("Error!")
        traceback.print_exc()

if __name__ == '__main__':
    test()
