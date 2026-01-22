from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
import traceback
from dotenv import load_dotenv

load_dotenv()

# ============================================
# CONFIGURACIÓN DE BASE DE DATOS
# ============================================

MYSQL_URL = f"mysql+pymysql://{os.getenv('MYSQL_USER', 'root')}:{os.getenv('MYSQL_PASSWORD', '')}@{os.getenv('MYSQL_HOST', 'localhost')}:3306/{os.getenv('MYSQL_DATABASE', 'laika_club')}"

try:
    mysql_engine = create_engine(
        MYSQL_URL,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=mysql_engine)

    with mysql_engine.connect() as conn:
        conn.execute(text("SELECT 1"))

    print("✅ MySQL conectado exitosamente")

except Exception as e:
    print(f"❌ Error al conectar con MySQL: {e}")
    print(f"   URL de conexión: mysql://{os.getenv('MYSQL_USER')}:***@{os.getenv('MYSQL_HOST')}:3306/{os.getenv('MYSQL_DATABASE')}")
    SessionLocal = None

# ============================================
# CREAR APLICACIÓN FASTAPI
# ============================================

app = FastAPI(
    title="LAIKA Club API",
    version="2.0.0",
    description="API para gestión de eventos LAIKA Club",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ============================================
# MIDDLEWARE DE CORS
# ============================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# ============================================
# MIDDLEWARE PARA LOGGING DE REQUESTS
# ============================================

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Middleware para logging de todas las peticiones"""
    start_time = datetime.now()

    print(f"\n{'='*50}")
    print(f"📥 {request.method} {request.url.path}")
    print(f"   Cliente: {request.client.host if request.client else 'unknown'}")

    try:
        response = await call_next(request)
        duration = (datetime.now() - start_time).total_seconds()

        print(f"✅ {response.status_code} - {duration:.3f}s")
        print(f"{'='*50}\n")

        return response

    except Exception as e:
        print(f"❌ Error procesando request: {e}")
        traceback.print_exc()
        print(f"{'='*50}\n")

        return JSONResponse(
            status_code=500,
            content={
                "detail": "Error interno del servidor",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        )

# ============================================
# EXCEPTION HANDLERS
# ============================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Manejador global de excepciones"""
    print(f"\n❌ EXCEPCIÓN NO MANEJADA:")
    print(f"   URL: {request.url}")
    print(f"   Método: {request.method}")
    print(f"   Error: {exc}")
    traceback.print_exc()

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Error interno del servidor",
            "error": str(exc),
            "path": str(request.url),
            "timestamp": datetime.now().isoformat()
        }
    )

# ============================================
# REGISTRAR TODOS LOS ROUTERS - ORDEN CORRECTO
# ============================================

print("\n📦 Registrando routers...\n")

# 1. Authentication
try:
    from routers import auth
    app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
    print("  ✅ Auth router registrado: /api/auth")
except Exception as e:
    print(f"  ❌ Error al cargar Auth router: {e}")
    traceback.print_exc()

# 2. Events
try:
    from routers import events
    app.include_router(events.router, prefix="/api/events", tags=["Events"])
    print("  ✅ Events router registrado: /api/events")
except Exception as e:
    print(f"  ❌ Error al cargar Events router: {e}")
    traceback.print_exc()

# 3. Tickets
try:
    from routers import tickets
    app.include_router(tickets.router, prefix="/api/tickets", tags=["Tickets"])
    print("  ✅ Tickets router registrado: /api/tickets")
except Exception as e:
    print(f"  ❌ Error al cargar Tickets router: {e}")
    traceback.print_exc()

# 4. Stats
try:
    from routers import stats
    app.include_router(stats.router, prefix="/api/stats", tags=["Statistics"])
    print("  ✅ Stats router registrado: /api/stats")
except Exception as e:
    print(f"  ❌ Error al cargar Stats router: {e}")
    traceback.print_exc()

# 5. Config
try:
    from routers import config
    app.include_router(config.router, prefix="/api/config", tags=["Configuration"])
    print("  ✅ Config router registrado: /api/config")
except Exception as e:
    print(f"  ❌ Error al cargar Config router: {e}")
    traceback.print_exc()

# 6. Database
try:
    from routers import database
    app.include_router(database.router, prefix="/api/database", tags=["Database"])
    print("  ✅ Database router registrado: /api/database")
except Exception as e:
    print(f"  ❌ Error al cargar Database router: {e}")
    traceback.print_exc()

# 7. Automatic Backups
try:
    from routers import automatic_backup
    app.include_router(automatic_backup.router, prefix="/api/database", tags=["Automatic Backups"])
    print("  ✅ Automatic Backup router registrado: /api/database/automatic-backup")
except ImportError:
    print(f"  ⚠️  Automatic Backup router no disponible")
except Exception as e:
    print(f"  ❌ Error al cargar Automatic Backup router: {e}")
    traceback.print_exc()

# 8. Monitoring
try:
    from routers import monitoring
    app.include_router(monitoring.router, prefix="/api/monitoring", tags=["Monitoring"])
    print("  ✅ Monitoring router registrado: /api/monitoring")
except ImportError:
    print(f"  ⚠️  Monitoring router no disponible")
except Exception as e:
    print(f"  ❌ Error al cargar Monitoring router: {e}")
    traceback.print_exc()

# ============================================
# ⭐ IMPORTANTE: USERS DEBE IR ANTES DE USER_PERMISSIONS
# ============================================

# 9. Users - REGISTRAR PRIMERO (rutas generales)
try:
    from routers import users
    app.include_router(users.router, prefix="/api/users", tags=["Users"])
    print("  ✅ Users router registrado: /api/users")
    print("     Endpoints disponibles:")

    # Listar rutas del router
    for route in users.router.routes:
        methods = ','.join(route.methods) if hasattr(route, 'methods') else 'N/A'
        path = route.path
        print(f"       {methods:8} /api/users{path}")

except Exception as e:
    print(f"  ❌ Error al cargar Users router: {e}")
    traceback.print_exc()

# 10. User Permissions - REGISTRAR DESPUÉS (rutas específicas)
try:
    from routers import user_permissions
    app.include_router(user_permissions.router, prefix="/api/users", tags=["User Permissions"])
    print("  ✅ User Permissions router registrado: /api/users/{user_id}/permissions")
except ImportError:
    print(f"  ⚠️  User Permissions router no disponible")
except Exception as e:
    print(f"  ❌ Error al cargar User Permissions router: {e}")
    traceback.print_exc()

print("\n🚀 Proceso de registro de routers completado\n")

# ============================================
# ENDPOINTS BASE
# ============================================

@app.get("/")
def read_root():
    """Endpoint raíz - información de la API"""
    return {
        "message": "LAIKA Club API",
        "status": "running",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "documentation": "/docs",
            "alternative_docs": "/redoc",
            "health": "/health",
            "auth": "/api/auth",
            "events": "/api/events",
            "tickets": "/api/tickets",
            "users": "/api/users",
            "stats": "/api/stats",
            "config": "/api/config",
            "database": "/api/database",
            "monitoring": "/api/monitoring",
            "user_permissions": "/api/users/{user_id}/permissions",
            "automatic_backups": "/api/database/automatic-backup"
        }
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    mysql_status = "disconnected"
    mysql_error = None

    try:
        with mysql_engine.connect() as conn:
            result = conn.execute(text("SELECT VERSION() as version"))
            version = result.fetchone()
            mysql_status = "connected"
            mysql_version = version[0] if version else "unknown"
    except Exception as e:
        mysql_error = str(e)
        mysql_version = None

    health_data = {
        "status": "healthy" if mysql_status == "connected" else "degraded",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "api": {"status": "running", "version": "2.0.0"},
            "mysql": {
                "status": mysql_status,
                "version": mysql_version,
                "error": mysql_error
            }
        }
    }

    status_code = 200 if mysql_status == "connected" else 503
    return JSONResponse(content=health_data, status_code=status_code)

@app.get("/api/test")
def test_endpoint():
    """Endpoint de prueba"""
    return {
        "message": "API funcionando correctamente",
        "timestamp": datetime.now().isoformat(),
        "database_connected": SessionLocal is not None
    }

# ============================================
# STARTUP EVENT
# ============================================

@app.on_event("startup")
async def startup_event():
    """Evento al iniciar"""
    print("\n" + "="*60)
    print("🚀 LAIKA Club API - Iniciando servidor")
    print("="*60)
    print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌐 Host: 0.0.0.0:8000")
    print(f"📚 Documentación: http://localhost:8000/docs")
    print(f"🏥 Health Check: http://localhost:8000/health")
    print("="*60 + "\n")

    # Listar TODAS las rutas registradas
    print("\n📋 RUTAS REGISTRADAS:")
    print("="*60)
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            methods = ','.join(route.methods)
            print(f"  {methods:10} {route.path}")
    print("="*60 + "\n")

@app.on_event("shutdown")
async def shutdown_event():
    """Evento al cerrar"""
    print("\n" + "="*60)
    print("👋 LAIKA Club API - Cerrando servidor")
    print("="*60 + "\n")

    if mysql_engine:
        mysql_engine.dispose()
        print("✅ Conexiones cerradas")

# ============================================
# EJECUCIÓN DEL SERVIDOR
# ============================================

if __name__ == "__main__":
    import uvicorn

    print("\n🔧 Iniciando servidor en modo desarrollo...\n")

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["./"],
        log_level="info",
        access_log=True
    )
