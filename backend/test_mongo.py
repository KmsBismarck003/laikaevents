import os
import sys

# Agregamos la ruta base para que los imports funcionen como en fastapi
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.mongodb import MongoAnalytics, db, client

if __name__ == "__main__":
    if db is not None:
        print("[OK] MongoDB esta corriendo en local.")
        print("Probando la insercion de un log de sistema...")
        try:
            MongoAnalytics._insert_safe("system_logs", {
                "level": "info",
                "action": "test_connection",
                "message": "Test de conexion desde script aislado"
            })
            print("[OK] Documento de prueba guardado con exito en MongoDB.")
        except Exception as e:
            print(f"[ERROR] Error al guardar documento: {e}")
    else:
        print("[WA] No se pudo conectar a MongoDB. Asegurate de tenerlo ejecutandose en localhost:27017.")
