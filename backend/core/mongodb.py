# backend/core/mongodb.py
from pymongo import MongoClient
import os
import traceback
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# ============================================
# MONGODB CONFIGURATION & CONNECTION
# ============================================

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("MONGODB_DATABASE", "laika_club_logs")

client = None
db = None

try:
    print(f"[*] Intentando conectar a MongoDB en {MONGODB_URL}...")
    client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=2000)
    # Check if the server is available
    client.admin.command('ping')
    db = client[DATABASE_NAME]
    print("[OK] MongoDB conectado exitosamente")
except Exception as e:
    print(f"[WARN] Error conectando a MongoDB. Se ignoraran las operaciones en MongoDB. Error: {e}")
    client = None
    db = None

# ============================================
# ANALYTICS LOGGING SERVICE (ISOLATED)
# ============================================
# Todo está rodeado de un try-except para no romper MySQL/FastAPI
# si MongoDB falla.

class MongoAnalytics:
    @staticmethod
    def _insert_safe(collection_name: str, document: dict):
        if db is None:
            return

        try:
            document["_inserted_at"] = datetime.utcnow()
            db[collection_name].insert_one(document)
        except Exception as e:
            # Silenciosos para no romper el programa principal
            print(f"⚠️ Error aisaldo al guardar en MongoDB ({collection_name}): {e}")

    @classmethod
    def log_user_registered(cls, user_id: int, role: str, email: str, metadata: dict = None):
        """Guarda información analítica cuando un usuario se registra"""
        doc = {
            "user_id": user_id,
            "role": role,
            "email_domain": email.split("@")[-1] if "@" in email else "unknown",
            "action": "user_registered",
            "metadata": metadata or {},
            "timestamp": datetime.utcnow()
        }
        cls._insert_safe("users_analytics", doc)

    @classmethod
    def log_event_created(cls, event_id: int, name: str, category: str, location: str, total_tickets: int, price: float, created_by: int):
        """Guarda información sobre la creación de un evento"""
        doc = {
            "event_id": event_id,
            "name": name,
            "category": category,
            "location": location,
            "total_tickets": total_tickets,
            "potential_revenue": float(total_tickets) * float(price),
            "price": float(price),
            "created_by": created_by,
            "action": "event_created",
            "timestamp": datetime.utcnow()
        }
        cls._insert_safe("events_analytics", doc)

    @classmethod
    def log_ticket_purchased(cls, ticket_code: str, event_id: int, user_id: int, ticket_type: str, price: float):
        """Guarda información de venta/financiera de boletos vendidos"""
        doc = {
            "ticket_code": ticket_code,
            "event_id": event_id,
            "user_id": user_id,
            "ticket_type": ticket_type,
            "price": float(price),
            "action": "ticket_purchased",
            "timestamp": datetime.utcnow()
        }
        cls._insert_safe("financial_analytics", doc)
        cls._insert_safe("tickets_analytics", doc)

    @classmethod
    def log_payment_processed(cls, transaction_id: str, user_id: int, event_id: int, amount: float, method: str):
        """Transacciones exitosas procesadas"""
        doc = {
            "transaction_id": transaction_id,
            "user_id": user_id,
            "event_id": event_id,
            "amount": float(amount),
            "method": method,
            "action": "payment_processed",
            "timestamp": datetime.utcnow()
        }
        cls._insert_safe("financial_analytics", doc)
