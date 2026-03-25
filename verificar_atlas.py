# -*- coding: utf-8 -*-
import sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
from pymongo import MongoClient

def load_env():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    env_vars = {}
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                env_vars[k.strip()] = v.strip().strip('"').strip("'")
    return env_vars

env = load_env()
client = MongoClient(env['MONGO_URI'], serverSelectionTimeoutMS=10000)
db = client[env.get('MONGO_DB', 'laika_analytics')]

cols = sorted(db.list_collection_names())
print("=" * 50)
print("  COLECCIONES EN MONGODB ATLAS")
print("=" * 50)
for c in cols:
    n = db[c].count_documents({})
    print(f"  {c:<28}: {n} docs")

print("\n--- Muestra: usuarios (primeros 3) ---")
for u in db['usuarios'].find({}, {'_id':0,'id':1,'first_name':1,'last_name':1,'email':1,'role':1}).limit(3):
    print(" ", u)

print("\n--- Muestra: eventos (primeros 3) ---")
for e in db['eventos'].find({}, {'_id':0,'id':1,'name':1,'city':1,'status':1}).limit(3):
    print(" ", e)

client.close()
print("\n[OK] Verificacion completada.")
