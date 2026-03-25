import requests

url = "http://localhost:8002/"
payload = {
    "name": "Subagent VIP Tour 2026",
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

try:
    res = requests.post(url, json=payload, headers={"x-user-id": "6"})
    print("STATUS CODE:", res.status_code)
    print("RESPONSE JSON:", res.json())
except Exception as e:
    print("ERROR AL LLAMAR AL API:", e)
