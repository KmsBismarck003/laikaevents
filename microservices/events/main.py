from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional
from .database import get_db
from .security import get_current_user
from . import controller

app = FastAPI(title="Laika Event Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "alive", "service": "event-service"}

@app.get("/public")
def list_events(
    category: Optional[str] = None, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    return controller.get_public_events(db, category, limit)

@app.get("/all")
def list_all_events(
    limit: int = 100,
    db: Session = Depends(get_db)
):
    # En un microservicio real, esto requeriría rol admin
    return controller.get_all_events(db, limit=limit)

@app.get("/my-events")
@app.get("/manager/events")
def list_my_events(
    limit: int = 100,
    db: Session = Depends(get_db),
    # current_user: dict = Depends(get_current_user)
):
    # Por ahora usamos user_id=1 para simplificar, en producción usar current_user['id']
    return controller.get_user_events(db, user_id=1, limit=limit)

from . import schemas

@app.get("/{event_id}")
@app.get("/manager/events/{event_id}")
def get_event(event_id: int, db: Session = Depends(get_db)):
    return controller.get_event_by_id(db, event_id)

@app.post("/")
def create_event(
    event_data: schemas.EventCreate, 
    db: Session = Depends(get_db),
    # user_id: int = Depends(get_current_user) # Comentado para simplificar la creación por ahora
):
    return controller.create_event(db, event_data, user_id=1) 

@app.put("/{event_id}")
def update_event(
    event_id: int,
    event_data: schemas.EventUpdate,
    db: Session = Depends(get_db)
):
    return controller.update_event(db, event_id, event_data)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
