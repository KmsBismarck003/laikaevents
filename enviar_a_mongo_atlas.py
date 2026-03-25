# -*- coding: utf-8 -*-
"""
LAIKA CLUB - ENVIAR USUARIOS Y EVENTOS A MONGODB ATLAS
Extrae datos reales de MySQL -> Sube a MongoDB Atlas
"""
import sys
import os
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from datetime import datetime

# --- Auto-install dependencias ---
def ensure_lib(lib, install_name=None):
    try:
        __import__(lib)
    except ImportError:
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", install_name or lib])

ensure_lib("pymongo")
ensure_lib("pymysql")

from pymongo import MongoClient, UpdateOne
from pymongo.errors import ServerSelectionTimeoutError
import pymysql
import pymysql.cursors

# ---- Cargar .env ----
def load_env():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip().strip('"').strip("'")
    return env_vars

def print_sep(title=""):
    print("\n" + "=" * 55)
    if title:
        print(f"  {title}")
        print("=" * 55)

# ---- Conexion MySQL ----
def get_mysql_conn(env):
    return pymysql.connect(
        host=env.get('MYSQL_HOST', 'localhost'),
        user=env.get('MYSQL_USER', 'root'),
        password=env.get('MYSQL_PASSWORD', ''),
        database=env.get('MYSQL_DATABASE', 'laika_club'),
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

# ---- Extraer Usuarios de MySQL ----
def fetch_usuarios(conn):
    with conn.cursor() as cur:
        # SELECT * para tomar todas las columnas reales
        cur.execute("SELECT * FROM users ORDER BY id")
        rows = cur.fetchall()
    # Normalizar datetimes y bytes a string para MongoDB
    for r in rows:
        for k, v in r.items():
            if hasattr(v, 'isoformat'):
                r[k] = v.isoformat()
            elif isinstance(v, bytes):
                r[k] = v.decode('utf-8', errors='replace')
            elif hasattr(v, 'total_seconds'):  # timedelta
                total = int(v.total_seconds())
                r[k] = f"{total//3600:02d}:{(total%3600)//60:02d}:{total%60:02d}"
    return rows

# ---- Extraer Eventos de MySQL ----
def fetch_eventos(conn):
    with conn.cursor() as cur:
        # SELECT * para tomar todas las columnas reales
        cur.execute("SELECT * FROM events ORDER BY id")
        rows = cur.fetchall()
    for r in rows:
        for k, v in r.items():
            if hasattr(v, 'isoformat'):
                r[k] = v.isoformat()
            elif isinstance(v, bytes):
                r[k] = v.decode('utf-8', errors='replace')
            elif hasattr(v, 'total_seconds'):  # timedelta (ej: event_time)
                total = int(v.total_seconds())
                r[k] = f"{total//3600:02d}:{(total%3600)//60:02d}:{total%60:02d}"
    return rows

# ---- Upsert masivo a MongoDB ----
def upsert_coleccion(mongo_db, coleccion_nombre, docs, id_field='id'):
    if not docs:
        print(f"  [!] Sin documentos para '{coleccion_nombre}'")
        return 0

    col = mongo_db[coleccion_nombre]
    operations = [
        UpdateOne(
            {id_field: doc[id_field]},
            {'$set': {**doc, 'laika_synced_at': datetime.now().isoformat()}},
            upsert=True
        )
        for doc in docs
    ]
    result = col.bulk_write(operations)
    inserted  = result.upserted_count
    modified  = result.modified_count
    print(f"  Nuevos  : {inserted}")
    print(f"  Actualizados: {modified}")
    print(f"  Total docs en Atlas: {col.count_documents({})}")
    return inserted + modified

# ======================== MAIN ========================
def main():
    print_sep("LAIKA CLUB - SYNC MySQL -> MongoDB Atlas")

    env = load_env()
    mongo_uri = env.get('MONGO_URI') or os.environ.get('MONGO_URI')
    db_name   = env.get('MONGO_DB', 'laika_analytics')

    if not mongo_uri:
        print("[ERROR] No hay MONGO_URI en .env")
        sys.exit(1)

    # ----- Conectar MongoDB Atlas -----
    print(f"\n[...] Conectando a MongoDB Atlas ({db_name})...")
    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=12000)
        client.server_info()
        print("[OK] Conexion a Atlas exitosa!")
    except ServerSelectionTimeoutError as e:
        print(f"[ERROR] Timeout Atlas: {str(e)[:150]}")
        print("\n  >> Agrega tu IP en Atlas -> Network Access -> Allow from Anywhere (0.0.0.0/0)")
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] {e}")
        sys.exit(1)

    mongo_db = client[db_name]

    # ----- Conectar MySQL -----
    print(f"\n[...] Conectando a MySQL ({env.get('MYSQL_DATABASE','laika_club')})...")
    try:
        conn = get_mysql_conn(env)
        print("[OK] MySQL conectado!")
    except Exception as e:
        print(f"[ERROR] MySQL: {e}")
        sys.exit(1)

    # ===== USUARIOS =====
    print_sep("COLECCION: usuarios")
    try:
        usuarios = fetch_usuarios(conn)
        print(f"  Extraidos de MySQL: {len(usuarios)} usuarios")
        upsert_coleccion(mongo_db, 'usuarios', usuarios)
    except Exception as e:
        print(f"  [ERROR] Usuarios: {e}")

    # ===== EVENTOS =====
    print_sep("COLECCION: eventos")
    try:
        eventos = fetch_eventos(conn)
        print(f"  Extraidos de MySQL: {len(eventos)} eventos")
        upsert_coleccion(mongo_db, 'eventos', eventos)
    except Exception as e:
        print(f"  [ERROR] Eventos: {e}")

    # ===== RESUMEN FINAL =====
    print_sep("RESUMEN FINAL - ATLAS")
    colecciones = mongo_db.list_collection_names()
    for col in sorted(colecciones):
        count = mongo_db[col].count_documents({})
        print(f"  {col:30s}: {count} docs")

    print("\n[LISTO] Sync completado. Datos disponibles en MongoDB Atlas!")
    conn.close()
    client.close()

if __name__ == '__main__':
    main()
