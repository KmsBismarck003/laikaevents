from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from .engine import AnalyticsEngine
import uvicorn

app = FastAPI(title="Laika Analytics Big Data Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar motor de Spark una sola vez
engine = None

@app.on_event("startup")
def startup_event():
    global engine
    try:
        engine = AnalyticsEngine()
    except Exception as e:
        print(f"FALLO AL INICIALIZAR SPARK: {e}")

@app.on_event("shutdown")
def shutdown_event():
    if engine:
        engine.stop()

@app.get("/health")
def health():
    return {"status": "alive", "service": "analytics-bigdata"}

@app.get("/api/analytics/tables")
def get_tables():
    if not engine:
        raise HTTPException(status_code=500, detail="Motor de analítica no inicializado")
    return {"tables": engine.get_available_tables()}

@app.get("/api/analytics/suggestions")
def get_suggestions():
    if not engine:
        raise HTTPException(status_code=500, detail="Motor de analítica no inicializado")
    return {"suggestions": engine.get_artist_suggestions()}

@app.get("/api/analytics/full")
def get_full_analysis():
    if not engine:
        raise HTTPException(status_code=500, detail="Motor de analítica no inicializado")
    data = engine.run_full_analysis()
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return {
        "status": "success",
        "data": data,
        "model": "Spark Full Analysis"
    }

@app.get("/api/analytics/incremental")
def get_incremental_analysis(last_date: str):
    if not engine:
        raise HTTPException(status_code=500, detail="Motor de analítica no inicializado")
    data = engine.run_incremental_analysis(last_date)
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return {
        "status": "success",
        "data": data,
        "model": "Spark Incremental Analysis"
    }

@app.get("/api/analytics/mapreduce")
def get_mapreduce(
    table: str = "tickets", 
    date_from: str = None, 
    date_to: str = None,
    category: str = None,
    role: str = None
):
    if not engine:
        raise HTTPException(status_code=500, detail="Motor de analítica no inicializado")
    
    filters = {
        "date_from": date_from,
        "date_to": date_to,
        "category": category,
        "role": role
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    
    data = engine.run_analysis(table_name=table, mode="mapreduce", filters=filters)
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    
    return {
        "status": "success",
        "data": data,
        "model": "MapReduce (Distributed via Spark)"
    }

@app.get("/api/analytics/3d")
def get_3d_stats(
    table: str = "tickets", 
    date_from: str = None, 
    date_to: str = None,
    category: str = None,
    role: str = None
):
    if not engine:
        raise HTTPException(status_code=500, detail="Motor de analítica no inicializado")
    
    filters = {
        "date_from": date_from,
        "date_to": date_to,
        "category": category,
        "role": role
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    
    data = engine.run_3d_analysis(table_name=table, filters=filters)
    return {"status": "success", "data": data}

@app.post("/api/analytics/predict")
async def get_prediction():
    if not engine: raise HTTPException(500, "Motor apagado")
    return engine.predict_sold_out()

@app.post("/api/analytics/anomalies")
async def get_anomalies():
    if not engine: raise HTTPException(500, "Motor apagado")
    return engine.detect_anomalies()

@app.post("/api/analytics/clean")
async def run_clean(table: str = "tickets"):
    if not engine: raise HTTPException(500, "Motor apagado")
    return {"status": "success", "data": engine.run_saneamiento(table)}

@app.get("/api/analytics/intelligence")
def get_intelligence(action: str = "sold_out", table: str = "tickets"):
    if not engine:
        raise HTTPException(status_code=500, detail="Motor de analítica no inicializado")
    
    res = engine.run_proactive_intelligence(action=action, table_name=table)
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.post("/api/analytics/vault/sync")
def sync_vault(payload: dict):
    if not engine:
        raise HTTPException(status_code=500, detail="Motor de analítica no inicializado")
    
    backup_type = payload.get("type", "completo")
    tables = payload.get("tables", None)
    
    return engine.sync_mysql_to_mongo(backup_type=backup_type, tables_to_sync=tables)

@app.get("/api/analytics/vault/download/{snapshot_id}")
async def download_vault_snapshot(snapshot_id: str):
    """Exporta el snapshot de MongoDB como un archivo JSON."""
    if not engine:
        raise HTTPException(status_code=500, detail="Motor de analítica no inicializado")
    
    try:
        from pymongo import MongoClient
        import json
        from bson import json_util
        
        client = MongoClient(engine.mongo_uri, tlsAllowInvalidCertificates=True)
        db = client[engine.mongo_db]
        
        if snapshot_id not in db.list_collection_names():
            raise HTTPException(status_code=404, detail="Snapshot no encontrado")
            
        data = list(db[snapshot_id].find({}, {"_id": 0}))
        json_data = json.dumps(data, default=json_util.default)
        
        from fastapi.responses import Response
        return Response(
            content=json_data,
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={snapshot_id}.json"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/vault/list")
def list_vault():
    if not engine:
        raise HTTPException(status_code=500, detail="Motor de analítica no inicializado")
    return engine.list_nosql_snapshots()

@app.delete("/api/analytics/vault/delete/{snapshot_id}")
def delete_vault_snapshot(snapshot_id: str):
    if not engine:
        raise HTTPException(status_code=500, detail="Motor de analítica no inicializado")
    return engine.delete_nosql_snapshot(snapshot_id)

@app.post("/api/analytics/vault/restore/{snapshot_id}")
def restore_vault_snapshot(snapshot_id: str):
    if not engine:
        raise HTTPException(status_code=500, detail="Motor de analítica no inicializado")
    return engine.restore_nosql_snapshot(snapshot_id)

@app.get("/api/analytics/vault/status")
def get_vault_status():
    if not engine:
        raise HTTPException(status_code=500, detail="Motor de analítica no inicializado")
    snapshots = engine.list_nosql_snapshots()
    return {
        "status": "ready", 
        "provider": "MongoDB Atlas", 
        "database": engine.mongo_db,
        "snapshots_count": len(snapshots) if isinstance(snapshots, list) else 0
    }

@app.get("/api/analytics/ml/regression")
def get_ml_regression():
    if not engine:
        raise HTTPException(status_code=500, detail="Motor de analítica no inicializado")
    return engine.predict_regression()

@app.get("/api/analytics/ml/decision-tree")
def get_ml_decision_tree():
    if not engine:
        raise HTTPException(status_code=500, detail="Motor de analítica no inicializado")
    return engine.predict_classification()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8007)
