from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import httpx
import uvicorn
import time
from typing import Dict, Any

# Simple cache for public resources
# { url: { "content": bytes, "headers": dict, "status": int, "expires": float } }
GET_CACHE: Dict[str, Any] = {}
CACHE_TTL = 60 # 60 seconds cache for public data

app = FastAPI(title="Laika API Gateway", version="1.0.0")

# Configuración de destinos
SERVICES = {
    "auth": "http://127.0.0.1:8001",
    "events": "http://127.0.0.1:8002",
    "tickets": "http://127.0.0.1:8003",
    "stats": "http://127.0.0.1:8004",
    "admin": "http://127.0.0.1:8005",
    "achievements": "http://127.0.0.1:8006",
    "analytics": "http://127.0.0.1:8007",
}

@app.middleware("http")
async def proxy_middleware(request: Request, call_next):
    path = request.url.path
    method = request.method
    
    # Redirigir según el prefijo
    target_url = None
    cacheable = False

    # Logic to map paths to target_url
    if path.startswith("/api/auth"):
        target_url = f"{SERVICES['auth']}{path.replace('/api/auth', '')}"
    elif path.startswith("/api/events"):
        target_url = f"{SERVICES['events']}{path.replace('/api/events', '')}"
        if "/public" in path: cacheable = True
    elif path.startswith("/api/manager"):
        target_url = f"{SERVICES['events']}{path.replace('/api/manager', '/manager')}"
    elif path.startswith("/api/tickets"):
        target_url = f"{SERVICES['tickets']}{path.replace('/api/tickets', '')}"
    elif path.startswith("/api/payments"):
        target_url = f"{SERVICES['tickets']}/payments{path.replace('/api/payments', '')}"
    elif path.startswith("/api/refunds"):
        target_url = f"{SERVICES['tickets']}/refund{path.replace('/api/refunds', '')}"
    elif path.startswith("/api/stats"):
        target_url = f"{SERVICES['stats']}{path.replace('/api/stats', '')}"
    elif path.startswith("/api/monitoring"):
        target_url = f"{SERVICES['stats']}{path.replace('/api/monitoring', '')}"
    elif path.startswith("/api/database"):
        target_url = f"{SERVICES['admin']}{path.replace('/api', '')}"
    elif path == "/api/ads/public":
        try:
            import pymysql, json
            from starlette.responses import JSONResponse
            conn = pymysql.connect(host='127.0.0.1', user='root', password='', database='laika_club', cursorclass=pymysql.cursors.DictCursor)
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, title, image_url, link_url, position, active FROM ads WHERE active=1 ORDER BY id DESC")
                rows = cursor.fetchall()
            conn.close()
            print(f"[GATEWAY HOTPATCH DEBUG] Fetched {len(rows)} rows from MySQL")
            if rows: print(f"[GATEWAY HOTPATCH DEBUG] First row: {rows[0]}")
            # Formatear active a booleano y asegurar que created_at no de error si se añade
            for r in rows:
                r['active'] = bool(r.get('active', 0))
            return Response(content=json.dumps(rows), status_code=200, headers={"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"})
        except Exception as e:
            print(f"[GATEWAY HOTPATCH ERROR] {e}")
            target_url = f"{SERVICES['admin']}{path.replace('/api', '')}"
    elif path.startswith("/api/ads"):
        target_url = f"{SERVICES['admin']}{path.replace('/api', '')}"
    elif path.startswith("/api/config"):
        target_url = f"{SERVICES['admin']}{path.replace('/api', '')}"
    elif path.startswith("/api/admin/uploads"):
        target_url = f"{SERVICES['admin']}{path.replace('/api/admin', '')}"
    elif path.startswith("/api/admin/users"):
        target_url = f"{SERVICES['auth']}{path.replace('/api', '')}"
    elif path.startswith("/api/users"):
        target_url = f"{SERVICES['auth']}{path.replace('/api', '')}"
    elif path.startswith("/api/admin"):
        target_url = f"{SERVICES['admin']}{path.replace('/api', '')}"
    elif path.startswith("/api/achievements"):
        target_url = f"{SERVICES['achievements']}{path.replace('/api/achievements', '')}"
    elif path.startswith("/api/analytics"):
        target_url = f"{SERVICES['analytics']}{path}"
    
    if target_url:
        full_url = f"{target_url}?{request.query_params}" if request.query_params else target_url
        
        # Check Cache
        if method == "GET" and cacheable and full_url in GET_CACHE:
            entry = GET_CACHE[full_url]
            if time.time() < entry['expires']:
                print(f"[GATEWAY CACHE] HIT: {full_url}")
                return Response(
                    content=entry['content'],
                    status_code=entry['status'],
                    headers=entry['headers']
                )

        print(f"[GATEWAY] Proxying {method} {path} -> {target_url}")
        try:
            content = await request.body()
            
            # Filtrar headers
            headers = {}
            for k, v in request.headers.items():
                if k.lower() not in ["host", "content-length", "connection"]:
                    headers[k] = v
            
            async with httpx.AsyncClient(timeout=30.0) as local_client:
                response = await local_client.request(
                    method,
                    target_url,
                    params=dict(request.query_params),
                    headers=headers,
                    data=content if method in ["POST", "PUT", "PATCH"] else None
                )
                
                # Filtrar headers de respuesta
                resp_headers = {}
                for k, v in response.headers.items():
                    if k.lower() not in ["content-encoding", "transfer-encoding", "content-length"]:
                        resp_headers[k] = v
                
                # Obtener contenido inmediatamente para evitar errores de cierre
                resp_content = response.content
                resp_status = response.status_code

                # Update Cache if applicable
                if method == "GET" and cacheable and resp_status == 200:
                    GET_CACHE[full_url] = {
                        "content": resp_content,
                        "status": resp_status,
                        "headers": resp_headers,
                        "expires": time.time() + CACHE_TTL
                    }

                return Response(
                    content=resp_content,
                    status_code=resp_status,
                    headers=resp_headers
                )
        except Exception as e:
            print(f"[GATEWAY ERROR] {str(e)}")
            return Response(
                content=f'{{"detail": "Gateway Error: {str(e)}"}}',
                status_code=502,
                headers={"Content-Type": "application/json"}
            )

    return await call_next(request)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Laika API Gateway Active", "debug_check": "v2", "routing_to": SERVICES}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
