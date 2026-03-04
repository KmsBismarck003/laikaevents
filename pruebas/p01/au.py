import os
from conexion import get_mongo_db

def main():
    db = get_mongo_db()
    if db is None:
        return

    coleccion = db["users_analytics"]

    # Pipeline de agregación
    pipeline = [
        {
            "$group": {
                "_id": "$role",
                "cantidad_usuarios": {"$sum": 1},
            }
        },
        {
            "$sort": {"cantidad_usuarios": -1}
        }
    ]

    print("=== ANÁLISIS DE USUARIOS (Por Rol) ===")
    resultados = list(coleccion.aggregate(pipeline))

    if not resultados:
         print("No hay usuarios registrados en Mondongo.")
         return

    for r in resultados:
        print(f"Rol de usuario: {r['_id'].capitalize() if r['_id'] else 'Desconocido'}")
        print(f"  Cantidad registrada: {r['cantidad_usuarios']}")
        print("-" * 40)

if __name__ == "__main__":
    main()
