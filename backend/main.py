from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# MySQL
MYSQL_URL = f"mysql+pymysql://{os.getenv('MYSQL_USER', 'root')}:{os.getenv('MYSQL_PASSWORD', '')}@{os.getenv('MYSQL_HOST', 'localhost')}:3306/{os.getenv('MYSQL_DATABASE', 'laika_club')}"

try:
    mysql_engine = create_engine(MYSQL_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=mysql_engine)
    print("✅ MySQL conectado")
except Exception as e:
    print(f"❌ Error MySQL: {e}")
    SessionLocal = None

app = FastAPI(title="LAIKA Club API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# REGISTRAR TODOS LOS ROUTERS
# ============================================

print("\n📦 Registrando routers...")

# 1. Authentication
from routers import auth
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
print("  ✅ Auth router registrado: /api/auth")

# 2. Events (PLURAL para coincidir con frontend)
from routers import events
app.include_router(events.router, prefix="/api/events", tags=["Events"])
print("  ✅ Events router registrado: /api/events")

# 3. Tickets (PLURAL para coincidir con frontend)
from routers import tickets
app.include_router(tickets.router, prefix="/api/tickets", tags=["Tickets"])
print("  ✅ Tickets router registrado: /api/tickets")

# 4. Users (PLURAL para coincidir con frontend) ⭐
from routers import users
app.include_router(users.router, prefix="/api/users", tags=["Users"])
print("  ✅ Users router registrado: /api/users")

# 5. Stats (Estadísticas)
from routers import stats
app.include_router(stats.router, prefix="/api/stats", tags=["Statistics"])
print("  ✅ Stats router registrado: /api/stats")

# 6. Config (Configuración)
from routers import config
app.include_router(config.router, prefix="/api/config", tags=["Configuration"])
print("  ✅ Config router registrado: /api/config")

# 7. Database (Operaciones de BD)
from routers import database
app.include_router(database.router, prefix="/api/database", tags=["Database"])
print("  ✅ Database router registrado: /api/database")

print("\n🚀 Todos los routers registrados correctamente\n")

# ============================================
# ENDPOINTS BASE
# ============================================

@app.get("/")
def read_root():
    return {
        "message": "LAIKA Club API",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/auth",
            "events": "/api/events",      # ⭐ Plural
            "tickets": "/api/tickets",    # ⭐ Plural
            "users": "/api/users",        # ⭐ Plural
            "stats": "/api/stats",
            "config": "/api/config",
            "database": "/api/database",
            "docs": "/docs",
            "health": "/health"
        }
    }

@app.get("/health")
def health_check():
    try:
        with mysql_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        mysql_status = "connected"
    except Exception as e:
        mysql_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "databases": {"mysql": mysql_status},
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
