
import requests
import json

# URL base de la API
BASE_URL = "http://localhost:8000/api"

# Función para obtener token de administrador
def get_admin_token():
    print("🔑 Iniciando sesión como admin...")
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": "admin@laikaclub.com",
            "password": "Admin123"
        })

        if response.status_code == 200:
            token = response.json().get("access_token")
            print("✅ Login exitoso")
            return token
        else:
            print(f"❌ Error en login: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return None

# Función para probar el endpoint de ventas por evento
def test_sales_by_event(token):
    print("\n📊 Probando endpoint de ventas por evento...")

    headers = {
        "Authorization": f"Bearer {token}"
    }

    try:
        response = requests.get(f"{BASE_URL}/stats/admin/sales-by-event", headers=headers)

        if response.status_code == 200:
            data = response.json()
            print("✅ Endpoint respondió correctamente")
            print(json.dumps(data, indent=2))
            return True
        else:
            print(f"❌ Error en endpoint: {response.status_code} - {response.text}")
            return False

    except Exception as e:
        print(f"❌ Error al consultar endpoint: {e}")
        return False

if __name__ == "__main__":
    token = get_admin_token()
    if token:
        test_sales_by_event(token)
