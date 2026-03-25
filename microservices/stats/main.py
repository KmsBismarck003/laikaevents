from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import controller, database

app = FastAPI(title="Laika Stats Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "alive", "service": "stats-service"}

@app.get("/admin/dashboard")
async def dashboard_summary(db: Session = Depends(database.get_db)):
    return await controller.get_dashboard_summary(db)

@app.get("/admin/sales")
async def sales_by_event(db: Session = Depends(database.get_db)):
    return await controller.get_sales_by_event(db)

@app.get("/status")
async def system_status():
    return await controller.get_system_status()

@app.get("/metrics")
async def system_metrics():
    return await controller.get_system_metrics()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
