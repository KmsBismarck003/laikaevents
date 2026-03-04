
import requests
import json
import sys

# Configuración
API_URL = "http://localhost:8000/api"
ADMIN_TOKEN = "" # Si necesitas token, pégalo aquí o ajusta el script para login

def print_result(test_name, success, details=""):
    icon = "[OK]" if success else "[FAIL]"
    print(f"{icon} {test_name}: {details}")

def test_permissions_flow():
    print("Iniciando Test de Permisos (Backend Strict Mode)\n")

    # 1. Crear usuario de prueba (o usar uno existente ID 1 si es seguro)
    # Para no romper nada, intentaremos leer el admin (ID 1)
    user_id = 99999 # ID invalido

    # 2. Test Get Permissions
    print("--- Test GET Permissions ---")
    try:
        # Prueba con usuario inexistente
        res = requests.get(f"{API_URL}/users/{user_id}/permissions")
        if res.status_code == 404:
            print_result("GET Usuario Inexistente", True, "Retorno 404 correctamente")
        else:
            print_result("GET Usuario Inexistente", False, f"Status: {res.status_code}")
    except Exception as e:
        print_result("GET Error Conexion", False, str(e))

    # NOTA: Para probar PUT necesitamos un usuario real.
    # No tengo credenciales de admin a mano en este script automatico.
    # El usuario debe probar esto manualmente o proveer un token.
    print("\n[WARN] Para pruebas completas de escritura (PUT), se requiere un token de admin valido.")
    print("       Por favor, verifica manualmente en el frontend o usa Swagger.")

if __name__ == "__main__":
    test_permissions_flow()
