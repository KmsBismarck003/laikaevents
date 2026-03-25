import os
import motor.motor_asyncio
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI") # User will provide this
MONGO_DB = os.getenv("MONGO_DB", "laika_analytics")

client = None
db = None

def get_mongo_db():
    global client, db
    if client is None and MONGO_URI:
        try:
            client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
            db = client[MONGO_DB]
            print(f"[MONGO SYNC] Connected to MongoDB Atlas: {MONGO_DB}")
        except Exception as e:
            print(f"[MONGO SYNC] Error connecting to MongoDB: {e}")
            return None
    return db

async def sync_purchase_to_mongo(purchase_data: dict):
    """
    Sincroniza un evento de compra o pago a MongoDB Atlas para análisis.
    """
    mongo_db = get_mongo_db()
    if mongo_db is None:
        return False
        
    try:
        # Añadir timestamp de sincronización si no existe
        if "synced_at" not in purchase_data:
            purchase_data["synced_at"] = datetime.now().isoformat()
            
        collection = mongo_db["purchases"]
        result = await collection.insert_one(purchase_data)
        print(f"[MONGO SYNC] Data synced with ID: {result.inserted_id}")
        return True
    except Exception as e:
        print(f"[MONGO SYNC] Failed to sync data: {e}")
        return False
