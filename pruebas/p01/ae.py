import os
from conexion import get_mongo_db

def main():
    db = get_mongo_db()
    if db is None:
        return

    coleccion = db["events_analytics"]

    # Pipeline de agregación
    pipeline = [
        {
            "$group": {
                "_id": "$category",
                "cantidad_eventos": {"$sum": 1},
                "total_boletos_ofertados": {"$sum": "$total_tickets"},
                "promedio_precio": {"$avg": "$price"},
                "potencial_recaudacion_total": {"$sum": "$potential_revenue"}
            }
        },
        {
            "$sort": {"potencial_recaudacion_total": -1}
        }
    ]

    print("=== analisis de eventos por cat ===")
    resultados = list(coleccion.aggregate(pipeline))

    if not resultados:
         print("No hay eventos nadita.")
         return

    for r in resultados:
        print(f"Categoría: {r['_id'].capitalize() if r['_id'] else 'Sin categoría'}")
        print(f"  Eventos en categoría: {r['cantidad_eventos']}")
        print(f"  Total de boletos ofertados: {r['total_boletos_ofertados']}")
        print(f"  Promedio de precio de boleto: ${r['promedio_precio']:.2f}")
        print(f"  Potencial recaudación total: ${r['potencial_recaudacion_total']:.2f}")
        print("-" * 40)

if __name__ == "__main__":
    main()
