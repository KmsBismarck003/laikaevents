"""
Script para probar el endpoint de registro directamente
"""

import requests
import json

API_URL = "http://localhost:8000/api/auth"

def test_register():
    """Probar el endpoint de registro"""

    print("="*60)
    print("PRUEBA DE ENDPOINT /register")
    print("="*60)

    # Datos de prueba
    test_user = {
        "firstName": "Juan",
        "lastName": "Pérez",
        "email": "juan.perez@test.com",
        "phone": "5551234567",
        "password": "password123"
    }

    print(f"\n📤 Enviando datos:")
    print(json.dumps(test_user, indent=2))

    try:
        # Hacer POST request
        print(f"\n🔄 Haciendo POST a {API_URL}/register...")
        response = requests.post(
            f"{API_URL}/register",
            json=test_user,
            headers={"Content-Type": "application/json"}
        )

        print(f"\n📥 Respuesta recibida:")
        print(f"   Status Code: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")

        # Imprimir respuesta
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ REGISTRO EXITOSO")
            print(f"   Token: {data.get('token', 'N/A')[:50]}...")
            print(f"   User ID: {data.get('user', {}).get('id')}")
            print(f"   Email: {data.get('user', {}).get('email')}")
            print(f"   Role: {data.get('user', {}).get('role')}")
        else:
            print(f"\n❌ ERROR EN REGISTRO")
            try:
                error_data = response.json()
                print(f"   Error: {error_data}")
            except:
                print(f"   Error text: {response.text}")

        return response

    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: No se puede conectar a la API")
        print("   Asegúrate de que FastAPI está corriendo en http://localhost:8000")
        return None

    except Exception as e:
        print(f"\n❌ ERROR INESPERADO: {e}")
        import traceback
        traceback.print_exc()
        return None


def test_simple_endpoint():
    """Probar el endpoint de prueba simplificado"""

    print("\n" + "="*60)
    print("PRUEBA DE ENDPOINT /test-register (simplificado)")
    print("="*60)

    try:
        print(f"\n🔄 Haciendo POST a {API_URL}/test-register...")
        response = requests.post(f"{API_URL}/test-register")

        print(f"\n📥 Respuesta:")
        print(f"   Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ RESULTADO:")
            print(json.dumps(data, indent=2))
        else:
            print(f"\n❌ ERROR:")
            print(response.text)

        return response

    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: No se puede conectar a la API")
        return None

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        return None


def verify_user_in_db():
    """Verificar si el usuario se guardó en la BD"""
    import pymysql
    import os
    from dotenv import load_dotenv

    load_dotenv()

    print("\n" + "="*60)
    print("VERIFICACIÓN DIRECTA EN BASE DE DATOS")
    print("="*60)

    try:
        conn = pymysql.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            password=os.getenv('MYSQL_PASSWORD', ''),
            database=os.getenv('MYSQL_DATABASE', 'laika_club')
        )

        cursor = conn.cursor()

        # Buscar el usuario de prueba
        cursor.execute("SELECT * FROM users WHERE email = 'juan.perez@test.com'")
        user = cursor.fetchone()

        if user:
            print(f"\n✅ USUARIO ENCONTRADO EN BD:")
            print(f"   ID: {user[0]}")
            print(f"   Nombre: {user[1]} {user[2]}")
            print(f"   Email: {user[3]}")
            print(f"   Phone: {user[4]}")
            print(f"   Role: {user[6]}")
            print(f"   Status: {user[7]}")
            print(f"   Created: {user[10]}")

            # Preguntar si eliminar
            print("\n⚠️  ¿Eliminar usuario de prueba? (s/n): ", end="")
            if input().lower() == 's':
                cursor.execute("DELETE FROM users WHERE email = 'juan.perez@test.com'")
                conn.commit()
                print("✅ Usuario eliminado")
        else:
            print(f"\n❌ USUARIO NO ENCONTRADO EN BD")
            print("   Email buscado: juan.perez@test.com")

            # Mostrar todos los usuarios
            cursor.execute("SELECT id, email, first_name, last_name FROM users")
            users = cursor.fetchall()
            print(f"\n📋 Usuarios actuales en BD ({len(users)}):")
            for u in users:
                print(f"   - ID: {u[0]}, Email: {u[1]}, Nombre: {u[2]} {u[3]}")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"\n❌ ERROR: {e}")


if __name__ == "__main__":
    print("\n🚀 INICIANDO PRUEBAS DE REGISTRO\n")

    # Test 1: Endpoint de registro normal
    response1 = test_register()

    if response1:
        # Test 2: Verificar en BD
        verify_user_in_db()

    # Test 3: Endpoint simplificado (si existe)
    print("\n" + "="*60)
    print("PRUEBA ADICIONAL (endpoint simplificado)")
    print("="*60)
    print("Nota: Este endpoint solo existe si agregaste el código test_endpoint.py")
    input("Presiona ENTER para continuar...")
    test_simple_endpoint()

    print("\n" + "="*60)
    print("PRUEBAS COMPLETADAS")
    print("="*60)
