import os
import sys
import json
import time
from datetime import datetime

# ==========================================
# 🦊 PLAN LIA - MONGODB ATLAS DISASTER RECOVERY
# ==========================================

# Auto-instalador de PyMongo para evitar fallos de librerías
try:
    from pymongo import MongoClient, errors
except ImportError:
    print("[*] Librería 'pymongo' no detectada. Instalando...")
    import subprocess
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pymongo"])
        from pymongo import MongoClient, errors
        print("[✅] PyMongo instalado con éxito!")
    except Exception as e:
        print(f"[❌] Error al instalar pymongo: {e}")
        sys.exit(1)

def load_env():
    """Carga variables de entorno manuales desde archivo .env"""
    env_vars = {}
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    # Dividir solo en el primer '='
                    parts = line.strip().split('=', 1)
                    if len(parts) == 2:
                        key, value = parts
                        # Quitar comillas si existen
                        if value.startswith('"') and value.endswith('"'):
                            value = value[1:-1]
                        env_vars[key] = value
    return env_vars

def print_banner():
    print("="*50)
    print("  🦊  SISTEMA DE RECUPERACIÓN - PLAN LIA 🦊  ")
    print("       (Recuperación Quirúrgica en Atlas)       ")
    print("="*50)

def validate_backup_integrity(filepath):
    """Valida que el archivo JSON esté íntegro parseándolo antes de importar."""
    print(f"[*] Validando integridad de {os.path.basename(filepath)}...")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list):
                print(f"[✅] Integridad OK. {len(data)} documentos listos para cargar.")
                return data
            elif isinstance(data, dict):
                 print(f"[✅] Integridad OK (Objeto único). 1 documento listo para cargar.")
                 return [data]
            else:
                print("[❌] Formato de respaldo inválido (No es un JSON Array ni Object).")
                return None
    except json.JSONDecodeError as e:
        print(f"[❌] ERROR DE INTEGRIDAD: El archivo JSON está corrupto. {str(e)}")
        return None
    except Exception as e:
        print(f"[❌] Error al leer el archivo: {str(e)}")
        return None

def main():
    print_banner()
    env = load_env()
    
    mongo_uri = env.get('MONGO_URI')
    db_name = env.get('MONGO_DB', 'laika_analytics')

    if not mongo_uri:
        print("[❌] ERROR: No se encontró MONGO_URI en el archivo .env")
        sys.exit(1)

    print(f"[*] Conectando a MongoDB Atlas...")
    print(f"    - Base de Datos: {db_name}")
    print("-" * 50)

    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        # Forzar conexión
        client.server_info()
        print("[✅] Conexión a MongoDB Atlas Exitosa.")
        db = client[db_name]
    except Exception as e:
        print(f"[❌] Error crítico al conectar a Atlas: {str(e)}")
        sys.exit(1)

    # 1. Buscar Respaldos
    # Buscaremos archivos .json en backups/ o la raíz
    backup_files = [f for f in os.listdir('.') if f.endswith('.json') and 'backup' in f.lower()]
    backups_dir = os.path.join(os.path.dirname(__file__), 'backups')
    
    if os.path.exists(backups_dir):
         backup_files += [os.path.join(backups_dir, f) for f in os.listdir(backups_dir) if f.endswith('.json')]

    if not backup_files:
         print("[⚠️] ADVERTENCIA: No se encontraron archivos .json de respaldo.")
         print("    Asegúrate de tener un archivo como 'usuarios_backup.json' creado.")
         sys.exit(1)

    backup_files.sort(key=lambda x: os.path.getmtime(x), reverse=True)
    latest_backup = backup_files[0]
    print(f"[✅] Respaldo más reciente encontrado: {os.path.basename(latest_backup)}")

    # Obtener nombre de colección sugerido (ej: 'usuarios_backup.json' -> 'usuarios')
    suggested_collection = os.path.basename(latest_backup).replace('.json', '').replace('_backup', '').replace('backup_', '')

    # 2. Argumentos
    action = sys.argv[1] if len(sys.argv) > 1 else '--restore'
    target_coll = sys.argv[2] if len(sys.argv) > 2 else suggested_collection

    if action == '--validate':
         print(f"\n[🛡️] Modo Validación para Colección: '{target_coll}'")
         validate_backup_integrity(latest_backup)
         
    elif action == '--restore':
         print(f"\n[🚨] INICIANDO RECUPERACIÓN QUIRÚRGICA: {db_name} -> {target_coll}")
         
         # Validar primero
         valid_data = validate_backup_integrity(latest_backup)
         if not valid_data:
              print("[❌] Abortando restauración por falla de integridad.")
              sys.exit(1)

         # Acción granular
         print(f"[*] Verificando colección existente '{target_coll}'...")
         coll = db[target_coll]
         current_count = coll.count_documents({})
         print(f"    - Documentos actuales en Atlas: {current_count}")

         # Aquí puedes poner lógica de "Solo insertar faltantes" si hay _id
         print(f"[*] Insertando documentos...")
         inserted_count = 0
         
         for doc in valid_data:
              try:
                   # Si ya existe por _id, lo skips o lo actualiza (Lógica Quirúrgica)
                   if '_id' in doc:
                        coll.update_one({'_id': doc['_id']}, {'$setOnInsert': doc}, upsert=True)
                   else:
                        coll.insert_one(doc)
                   inserted_count += 1
              except Exception as e:
                   pass # Ignorar duplicados o errores menores

         print("\n" + "="*50)
         print("   🎉  [PLAN LIA COMPLETADO CON ÉXITO]  🎉   ")
         print(f"       Se procesaron {inserted_count} documentos.")
         print("="*50)

if __name__ == '__main__':
    if len(sys.argv) == 1:
         print("Uso: python plan_lia_mongo.py [--validate | --restore] [nombre_coleccion]")
    main()
