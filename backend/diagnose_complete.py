"""
🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA
Ejecuta este script desde la carpeta backend para diagnosticar todos los problemas
"""

import os
import sys
from pathlib import Path

print("="*70)
print("🔍 DIAGNÓSTICO DEL SISTEMA LAIKA CLUB")
print("="*70)

# 1. Verificar estructura de archivos
print("\n1️⃣ Verificando estructura de archivos...")
print("-"*70)

required_files = {
    "main.py": "Archivo principal",
    "routers/users.py": "Router de usuarios",
    "routers/__init__.py": "Módulo de routers",
}

for file_path, description in required_files.items():
    exists = os.path.exists(file_path)
    status = "✅" if exists else "❌"
    print(f"{status} {file_path:30} - {description}")

    if not exists and file_path == "routers/users.py":
        print(f"   ⚠️  PROBLEMA CRÍTICO: {file_path} no existe!")
        print(f"   💡 Solución: Copia el archivo users_fixed.py a routers/users.py")

# 2. Verificar contenido de users.py
print("\n2️⃣ Verificando contenido de routers/users.py...")
print("-"*70)

if os.path.exists("routers/users.py"):
    with open("routers/users.py", "r", encoding="utf-8") as f:
        content = f.read()

    # Verificar que tenga el router
    has_router = "router = APIRouter()" in content
    has_get_all = '@router.get("")' in content or "@router.get('')" in content
    has_get_me = '@router.get("/me")' in content
    has_get_by_id = '@router.get("/{user_id}")' in content

    print(f"{'✅' if has_router else '❌'} Define router = APIRouter()")
    print(f"{'✅' if has_get_all else '❌'} Tiene endpoint GET '' (obtener todos)")
    print(f"{'✅' if has_get_me else '❌'} Tiene endpoint GET '/me'")
    print(f"{'✅' if has_get_by_id else '❌'} Tiene endpoint GET '/{{user_id}}'")

    if not has_get_all:
        print("\n   ❌ PROBLEMA CRÍTICO: Falta el endpoint GET '' para obtener todos los usuarios")
        print("   💡 Solución: Reemplaza routers/users.py con users_fixed.py")
else:
    print("❌ El archivo routers/users.py NO EXISTE")

# 3. Verificar routers/__init__.py
print("\n3️⃣ Verificando routers/__init__.py...")
print("-"*70)

if os.path.exists("routers/__init__.py"):
    print("✅ routers/__init__.py existe")
else:
    print("❌ routers/__init__.py NO existe")
    print("   💡 Creando archivo vacío...")
    os.makedirs("routers", exist_ok=True)
    with open("routers/__init__.py", "w") as f:
        f.write("# Routers module\n")
    print("   ✅ Archivo creado")

# 4. Intentar importar el router
print("\n4️⃣ Probando importación del router de usuarios...")
print("-"*70)

try:
    sys.path.insert(0, os.getcwd())
    from routers import users
    print("✅ Importación exitosa: from routers import users")

    # Verificar que tenga router
    if hasattr(users, 'router'):
        print("✅ El módulo tiene el atributo 'router'")

        # Listar rutas
        print("\n   Rutas definidas en el router:")
        for route in users.router.routes:
            if hasattr(route, 'methods') and hasattr(route, 'path'):
                methods = ','.join(route.methods)
                print(f"      {methods:8} {route.path}")
    else:
        print("❌ El módulo NO tiene el atributo 'router'")

except ImportError as e:
    print(f"❌ Error al importar: {e}")
    print("   💡 Solución: Verifica que routers/users.py esté correcto")
except Exception as e:
    print(f"❌ Error inesperado: {e}")

# 5. Verificar base de datos
print("\n5️⃣ Verificando conexión a base de datos...")
print("-"*70)

try:
    from dotenv import load_dotenv
    load_dotenv()

    from sqlalchemy import create_engine, text

    MYSQL_URL = f"mysql+pymysql://{os.getenv('MYSQL_USER', 'root')}:{os.getenv('MYSQL_PASSWORD', '')}@{os.getenv('MYSQL_HOST', 'localhost')}:3306/{os.getenv('MYSQL_DATABASE', 'laika_club')}"

    engine = create_engine(MYSQL_URL)

    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM users"))
        count = result.fetchone()[0]
        print(f"✅ Conexión exitosa a MySQL")
        print(f"   📊 Usuarios en base de datos: {count}")

except Exception as e:
    print(f"❌ Error de conexión: {e}")

# 6. Verificar servidor
print("\n6️⃣ Verificando servidor (si está corriendo)...")
print("-"*70)

try:
    import requests

    # Verificar health
    response = requests.get("http://localhost:8000/health", timeout=2)
    print(f"✅ Servidor respondiendo en http://localhost:8000")
    print(f"   Status: {response.status_code}")

    # Verificar endpoint de usuarios
    response = requests.get("http://localhost:8000/api/users?limit=100", timeout=2)
    if response.status_code == 200:
        users = response.json()
        print(f"✅ Endpoint /api/users funcionando")
        print(f"   📊 Usuarios retornados: {len(users)}")
    elif response.status_code == 404:
        print(f"❌ Endpoint /api/users retorna 404 (No encontrado)")
        print(f"   💡 El router NO está registrado correctamente en main.py")
    else:
        print(f"⚠️  Endpoint /api/users retorna código: {response.status_code}")

except requests.exceptions.ConnectionError:
    print("⚠️  Servidor NO está corriendo")
    print("   💡 Inicia el servidor con: python main.py")
except Exception as e:
    print(f"❌ Error verificando servidor: {e}")

# RESUMEN Y SOLUCIONES
print("\n" + "="*70)
print("📋 RESUMEN Y SOLUCIONES")
print("="*70)

print("\n🔧 PASOS PARA SOLUCIONAR:")
print("1. Reemplaza backend/routers/users.py con el archivo users_fixed.py")
print("2. Reemplaza backend/main.py con el archivo main_fixed.py")
print("3. Reinicia el servidor:")
print("   - Detén el servidor actual (Ctrl+C)")
print("   - Ejecuta: python main.py")
print("4. Verifica en http://localhost:8000/docs")
print("5. Busca la sección 'Users' y verifica que tengas estos endpoints:")
print("   - GET    /api/users")
print("   - GET    /api/users/me")
print("   - GET    /api/users/{user_id}")
print("   - PUT    /api/users/me")
print("   - PUT    /api/users/{user_id}")
print("   - DELETE /api/users/{user_id}")

print("\n" + "="*70)
print("✅ DIAGNÓSTICO COMPLETADO")
print("="*70)
