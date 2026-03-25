import requests

def test_create_event():
    url = "http://localhost:8002/"
    payload = {
        "name": "TEST EVENT CON ZONAS",
        "description": "Prueba del nuevo CRUD",
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
    
    response = requests.post(url, json=payload)
    print("STATUS:", response.status_code)
    print("JSON:", response.json())

if __name__ == "__main__":
    test_create_event()
