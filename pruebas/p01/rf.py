import os
from conexion import get_mongo_db

def main():
    db = get_mongo_db()
    if db is None:
        return

    coleccion = db["financial_analytics"]

    pipeline = [
        {
            "$match": {
                "action": "ticket_purchased"
            }
        },
        {
            "$group": {
                "_id": "$event_id",
                "total_cantidad_boletos": {"$sum": 1},
                "promedio_precio": {"$avg": "$price"},
                "total_ingresos": {"$sum": "$price"}
            }
        },
        {
            "$sort": {"total_ingresos": -1}
        }
    ]

    print("=== resumen financiero por eventito ===")
    resultados = list(coleccion.aggregate(pipeline))

    if not resultados:
         print("No hay datos financieros registrados en Mondongo.")
         return

    for r in resultados:
        print(f"Evento ID: {r['_id']}")
        print(f"  Boletos vendidos: {r['total_cantidad_boletos']}")
        print(f"  Promedio de precio: ${r['promedio_precio']:.2f}")
        print(f"  Total de ingresos: ${r['total_ingresos']:.2f}")
        print("-" * 40)

if __name__ == "__main__":
    main()
