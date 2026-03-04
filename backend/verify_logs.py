import sys
import os
import requests
from datetime import datetime

# Añadir directorio actual al path para importar módulos locales
sys.path.append(os.getcwd())

try:
    from logs import log_audit, log_request, get_audit_logs, get_request_logs
    print("Modulo logs.py importado correctamente")
except ImportError as e:
    print(f"Error importando logs.py: {e}")
    sys.exit(1)

def test_internal_logging():
    print("\n--- Testing Internal Logging ---")

    # 1. Test Audit Log
    try:
        log_audit(
            action="TEST_ACTION",
            user_id=1,
            details="Verification Script Test",
            ip_address="127.0.0.1"
        )
        print("log_audit ejecutado sin errores")
    except Exception as e:
        print(f"log_audit fallo: {e}")

    # 2. Test Request Log
    try:
        log_request(
            method="TEST",
            path="/verify",
            status_code=200,
            duration_ms=123.45,
            ip_address="127.0.0.1"
        )
        print("log_request ejecutado sin errores")
    except Exception as e:
        print(f"log_request fallo: {e}")

    # 3. Verify Reading
    audits = get_audit_logs(limit=5, action="TEST_ACTION")
    if audits and audits[0]['action'] == "TEST_ACTION":
        print(f"Audit log recuperado: {audits[0]['details']}")
    else:
        print("No se pudo recuperar el audit log")

    requests_logs = get_request_logs(limit=5, method="TEST")
    if requests_logs and requests_logs[0]['method'] == "TEST":
        print(f"Request log recuperado: {requests_logs[0]['path']}")
    else:
        print("No se pudo recuperar el request log")

def test_api_endpoints():
    print("\n--- Testing API Endpoints (Requires running server) ---")
    # Nota: Esto requiere que el servidor esté corriendo y tener un token válido.
    # Por ahora solo verificamos que el endpoint responda (aunque sea 401/403)
    try:
        # 1. Audit Logs
        response = requests.get("http://localhost:8000/api/logs/audit")
        print(f"📡 GET /api/logs/audit -> Status: {response.status_code}")
        print(f"GET /api/logs/audit -> Status: {response.status_code}")

        # 2. Monitoring Status
        response_mon = requests.get("http://localhost:8000/api/monitoring/status")
        print(f"GET /api/monitoring/status -> Status: {response_mon.status_code}")

        if response.status_code in [200, 401, 403] and response_mon.status_code in [200, 401, 403]:
             print("Endpoints alcanzables")
        else:
             print("Algunos endpoints devolvieron status inesperado")

    except Exception as e:
        print(f"No se pudo conectar a la API (¿Servidor apagado?): {e}")

if __name__ == "__main__":
    test_internal_logging()
    test_api_endpoints()
