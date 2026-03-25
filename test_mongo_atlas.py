# -*- coding: utf-8 -*-
"""
LAIKA CLUB - TEST CONEXION MongoDB Atlas
"""
import sys
import os
import io

# Forzar UTF-8 en la salida de Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from datetime import datetime

# Auto-install pymongo
try:
    from pymongo import MongoClient
    from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
except ImportError:
    print("[*] Instalando pymongo...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pymongo"])
    from pymongo import MongoClient
    from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

def load_env():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    key, value = line.split('=', 1)
                    value = value.strip().strip('"').strip("'")
                    env_vars[key.strip()] = value
    return env_vars

def main():
    print("=" * 55)
    print("  LAIKA CLUB - TEST MONGODB ATLAS")
    print("=" * 55)

    env = load_env()
    mongo_uri = env.get('MONGO_URI') or os.environ.get('MONGO_URI')
    db_name = env.get('MONGO_DB', 'laika_analytics')

    if not mongo_uri:
        print("\n[ERROR] No se encontro MONGO_URI en .env")
        env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
        if not os.path.exists(env_path):
            with open(env_path, 'w', encoding='utf-8') as f:
                f.write("# MongoDB Atlas - Laika Club\n")
                f.write("MONGO_URI=mongodb+srv://USUARIO:PASSWORD@cluster0.XXXXX.mongodb.net/\n")
                f.write("MONGO_DB=laika_analytics\n")
            print(f"[OK] Archivo .env creado. Editalo con tu URI real y re-corre el script.")
        sys.exit(1)

    print(f"\n[...] Conectando a Atlas - DB: {db_name}")
    uri_preview = mongo_uri[:45] + "..." if len(mongo_uri) > 45 else mongo_uri
    print(f"      URI: {uri_preview}")

    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=10000)
        info = client.server_info()
        print(f"\n[OK] CONEXION EXITOSA A MONGODB ATLAS!")
        print(f"     Version MongoDB: {info.get('version', 'N/A')}")

        db = client[db_name]

        colecciones = db.list_collection_names()
        print(f"\n[DB] Base de datos: '{db_name}'")
        if colecciones:
            print(f"     Colecciones ({len(colecciones)}):")
            for col in colecciones:
                count = db[col].count_documents({})
                print(f"       - {col}: {count} documentos")
        else:
            print("     (Base de datos vacia - lista para usar!)")

        # Test de latencia
        start = datetime.now()
        client.admin.command('ping')
        latency = (datetime.now() - start).microseconds / 1000
        print(f"\n[PING] Latencia: {latency:.1f} ms")

        # Test escritura/lectura/borrado
        print("\n[TEST] Prueba escritura -> lectura -> borrado...")
        test_col = db["_conexion_test"]
        doc = {
            "test": True,
            "timestamp": datetime.now().isoformat(),
            "proyecto": "Laika Club"
        }
        result = test_col.insert_one(doc)
        leido = test_col.find_one({"_id": result.inserted_id})
        test_col.delete_one({"_id": result.inserted_id})

        if leido:
            print("       Escritura -> OK")
            print("       Lectura   -> OK")
            print("       Borrado   -> OK")

        print("\n" + "=" * 55)
        print("  ATLAS FUNCIONANDO AL 100% - LAIKA READY!")
        print("=" * 55)
        client.close()

    except ServerSelectionTimeoutError as e:
        print(f"\n[ERROR] TIMEOUT - No se pudo conectar a Atlas")
        print("  Posibles causas:")
        print("  - Tu IP no esta en la whitelist (Network Access en Atlas)")
        print("  - Usuario o contrasena incorrectos en el URI")
        print("  - Cluster pausado")
        print(f"\n  Detalle: {str(e)[:200]}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] {type(e).__name__}: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
