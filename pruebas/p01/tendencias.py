import os
from conexion import get_mongo_db

def main():
    db = get_mongo_db()
    if db is None:
        return

    coleccion = db["tickets_analytics"]

    pipeline_categorias = [
        {
            "$lookup": {
                "from": "events_analytics",
                "localField": "event_id",
                "foreignField": "event_id",
                "as": "datos_evento"
            }
        },
        {
            "$unwind": "$datos_evento"
        },
        {
            "$group": {
                "_id": "$datos_evento.category",
                "total_boletos_vendidos": {"$sum": 1},
                "ingresos_reales": {"$sum": "$price"}
            }
        },
        {
            "$sort": {"total_boletos_vendidos": -1}
        }
    ]

    pipeline_eventos = [
        {
            "$lookup": {
                "from": "events_analytics",
                "localField": "event_id",
                "foreignField": "event_id",
                "as": "datos_evento"
            }
        },
        {
            "$unwind": "$datos_evento"
        },
        {
            "$group": {
                "_id": "$datos_evento.name",
                "categoria": {"$first": "$datos_evento.category"},
                "total_boletos_vendidos": {"$sum": 1},
                "ingresos_reales": {"$sum": "$price"}
            }
        },
        {
            "$sort": {"total_boletos_vendidos": -1}
        },
        {
            "$limit": 10
        }
    ]

    print("\n" + "="*50)
    print(" +vendido")
    print("="*50)

    # pipe otra vez,..
    print("\n--> categorias mas interesantes? <--")
    resultados_cat = list(coleccion.aggregate(pipeline_categorias))

    if not resultados_cat:
         print("No hay nada por aqui... parece desierto")
    else:
        for r in resultados_cat:
            cat_name = r['_id'].capitalize() if r['_id'] else 'Sin Categoria'
            print(f"[*] Categoria: {cat_name}")
            print(f"   Boletos vendidos: {r['total_boletos_vendidos']}")
            print(f"   Ingresos generados: ${r['ingresos_reales']:.2f}")
            print("-" * 40)

    print("\n--> TOP 10 eventos mas visitados <--")
    resultados_evt = list(coleccion.aggregate(pipeline_eventos))

    for i, r in enumerate(resultados_evt, 1):
        print(f"[#{i}] Evento: {r['_id']} ({r['categoria'].capitalize()})")
        print(f"   Boletos v: {r['total_boletos_vendidos']}")
        print(f"   Ingresos g: ${r['ingresos_reales']:.2f}")
        print("-" * 40)

if __name__ == "__main__":
    main()
