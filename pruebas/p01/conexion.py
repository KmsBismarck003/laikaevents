# pruebas/conexion.py
import os
from dotenv import load_dotenv
from pathlib import Path
from pymongo import MongoClient
import urllib.parse

def get_mongo_db():
    # Cargar .env de la carpeta pruebas
    env_path = Path(__file__).resolve().parent / ".env"
    load_dotenv(dotenv_path=env_path)

    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    database = os.getenv("MONGODB_DATABASE", "laika_club_logs")

    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        print(f"[OK] Conectado a MongoDB local: {mongo_uri} - Base: {database}")
        return client[database]
    except Exception as e:
        print(f"[ERROR] No se pudo conectar a MongoDB. Error: {e}")
        return None

if __name__ == "__main__":
    db = get_mongo_db()
    if db is not None:
        print("Colecciones disponibles:", db.list_collection_names())
