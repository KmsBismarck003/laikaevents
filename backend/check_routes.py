#!/usr/bin/env python3
"""
Script de diagnóstico para verificar rutas de FastAPI
Ejecutar: python check_routes.py
"""

import sys
import os

# Agregar el directorio actual al path
sys.path.insert(0, os.path.dirname(__file__))

print("\n" + "="*80)
print("🔍 DIAGNÓSTICO DE RUTAS DE FASTAPI")
print("="*80 + "\n")

try:
    print("1️⃣  Importando main.app...")
    from main import app
    print("    ✅ main.app importado exitosamente\n")

    print("2️⃣  Analizando rutas registradas...\n")

    # Agrupar rutas por prefijo
    routes_by_prefix = {}

    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            # Obtener el prefijo (primera parte del path)
            path_parts = route.path.split('/')
            prefix = f"/{path_parts[1]}" if len(path_parts) > 1 else "/"

            if prefix not in routes_by_prefix:
                routes_by_prefix[prefix] = []

            routes_by_prefix[prefix].append({
                'methods': ','.join(sorted(route.methods)),
                'path': route.path,
                'name': route.name if hasattr(route, 'name') else 'unnamed'
            })

    # Mostrar rutas agrupadas
    print("-"*80)

    # Rutas críticas primero
    critical_prefixes = ['/api']
    for prefix in critical_prefixes:
        if prefix in routes_by_prefix:
            print(f"\n🔥 RUTAS {prefix.upper()}: ({len(routes_by_prefix[prefix])} rutas)")
            print("-"*80)

            for route in sorted(routes_by_prefix[prefix], key=lambda x: x['path']):
                print(f"  {route['methods']:15} {route['path']:50} ({route['name']})")

            # Buscar específicamente las rutas de auth
            auth_routes = [r for r in routes_by_prefix[prefix] if '/auth' in r['path']]
            if auth_routes:
                print(f"\n  📌 Rutas de autenticación encontradas: {len(auth_routes)}")
                for route in auth_routes:
                    print(f"     {route['methods']:15} {route['path']}")
            else:
                print("\n  ❌ NO SE ENCONTRARON RUTAS DE AUTENTICACIÓN")

    # Otras rutas
    print(f"\n📍 OTRAS RUTAS:")
    print("-"*80)
    for prefix, routes in sorted(routes_by_prefix.items()):
        if prefix not in critical_prefixes:
            print(f"\n{prefix}: ({len(routes)} rutas)")
            for route in sorted(routes, key=lambda x: x['path'])[:5]:  # Solo las primeras 5
                print(f"  {route['methods']:15} {route['path']}")

    print("\n" + "="*80)
    print(f"✅ Total de rutas registradas: {len(app.routes)}")
    print("="*80)

    # Verificación específica de /api/auth/login
    print("\n" + "="*80)
    print("🔍 VERIFICACIÓN ESPECÍFICA: /api/auth/login")
    print("="*80)

    login_route_found = False
    for route in app.routes:
        if hasattr(route, 'path') and route.path == '/api/auth/login':
            login_route_found = True
            print(f"✅ RUTA ENCONTRADA!")
            print(f"   Path: {route.path}")
            if hasattr(route, 'methods'):
                print(f"   Methods: {route.methods}")
            if hasattr(route, 'name'):
                print(f"   Name: {route.name}")
            break

    if not login_route_found:
        print("❌ RUTA NO ENCONTRADA!")
        print("\nPosibles causas:")
        print("  1. El router de auth no está registrado en main.py")
        print("  2. El prefijo del router está mal configurado")
        print("  3. Error en la importación del módulo auth")

        # Buscar rutas similares
        print("\n🔍 Buscando rutas similares...")
        for route in app.routes:
            if hasattr(route, 'path') and 'auth' in route.path.lower():
                print(f"   Encontrada: {route.path}")

    print("="*80 + "\n")

    # Verificar importación directa del router
    print("3️⃣  Verificando importación del router de auth...\n")
    try:
        from routers import auth
        print("    ✅ Módulo auth importado correctamente")
        print(f"    ✅ Router disponible: {hasattr(auth, 'router')}")

        if hasattr(auth, 'router'):
            print(f"\n    📋 Rutas en el router de auth:")
            for route in auth.router.routes:
                if hasattr(route, 'path') and hasattr(route, 'methods'):
                    methods = ','.join(sorted(route.methods))
                    print(f"       {methods:12} {route.path}")

    except ImportError as e:
        print(f"    ❌ Error al importar módulo auth: {e}")
    except Exception as e:
        print(f"    ❌ Error inesperado: {e}")

    print("\n" + "="*80)
    print("✅ DIAGNÓSTICO COMPLETADO")
    print("="*80 + "\n")

except Exception as e:
    print(f"\n❌ ERROR EN DIAGNÓSTICO:")
    print(f"   {str(e)}")
    import traceback
    traceback.print_exc()
    print("\n" + "="*80 + "\n")
    sys.exit(1)
