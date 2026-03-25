import os
import subprocess
import sys
from datetime import datetime

# ==========================================
# ❄️ PLAN DE INVIERNO - MYSQL DISASTER RECOVERY
# ==========================================

def load_env():
    """Carga variables de entorno manuales desde archivo .env"""
    env_vars = {}
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    # Quitar comillas si existen
                    if value.startswith('"') and value.endswith('"'):
                        value = value[1:-1]
                    env_vars[key] = value
    return env_vars

def print_banner():
    print("="*50)
    print("  ❄️  SISTEMA DE RECUPERACIÓN - PLAN DE INVIERNO ❄️  ")
    print("="*50)

def main():
    print_banner()
    env = load_env()
    
    # Extraer variables
    mysql_exe = env.get('MYSQL_EXE_PATH', r'C:\xampp\mysql\bin\mysql.exe')
    db_name = env.get('MYSQL_DATABASE', 'laika_club')
    db_user = env.get('MYSQL_USER', 'root')
    db_pass = env.get('MYSQL_PASSWORD', '')
    db_host = env.get('MYSQL_HOST', 'localhost')
    
    print(f"[*] Configuración cargada:")
    print(f"    - Base de Datos: {db_name}")
    print(f"    - Usuario: {db_user}")
    print(f"    - Binario MySQL: {mysql_exe}")
    print("-" * 50)

    # 1. Validar binario de MySQL
    if not os.path.exists(mysql_exe):
        print(f"[❌] ERROR: No se encontró el binario de MySQL en {mysql_exe}")
        print("    Por favor, valida tu archivo .env o ruta de Xampp.")
        sys.exit(1)

    # 2. Buscar Respaldo más reciente
    backups_dir = os.path.join(os.path.dirname(__file__), 'backups')
    sql_files = []
    
    # Buscar en carpeta backups/
    if os.path.exists(backups_dir):
        sql_files += [os.path.join(backups_dir, f) for f in os.listdir(backups_dir) if f.endswith('.sql')]
        
    # Buscar en la raíz también por seguridad
    sql_files += [f for f in os.listdir('.') if f.endswith('.sql') and 'back' in f.lower()]

    if not sql_files:
        print("[⚠️] ADVERTENCIA: No se encontraron archivos .sql de respaldo.")
        print("    Crea un respaldo antes de usar el plan de emergencia.")
        sys.exit(0)

    # Ordenar por fecha de modificación (el más reciente primero)
    sql_files.sort(key=lambda x: os.path.getmtime(x), reverse=True)
    latest_backup = sql_files[0]
    print(f"[✅] Respaldo más reciente encontrado: {os.path.basename(latest_backup)}")

    # 3. Flujo de Control (Argumentos)
    action = sys.argv[1] if len(sys.argv) > 1 else '--restore'

    if action == '--check':
        print("[🛡️] Modo Chequeo: Verificando conexión...")
        cmd = [mysql_exe, f"-h{db_host}", f"-u{db_user}", "-e", "SHOW DATABASES;"]
        if db_pass:
            cmd.insert(3, f"-p{db_pass}")
            
        try:
            res = subprocess.run(cmd, capture_output=True, text=True)
            if res.returncode == 0:
                print("[✅] Conexión a MySQL exitosa.")
            else:
                print(f"[❌] Error de conexión: {res.stderr}")
        except Exception as e:
            print(f"[❌] Error crítico al conectar: {str(e)}")
            
    elif action == '--restore':
        print(f"\n[🚨] INICIANDO RESTAURACIÓN DE EMERGENCIA EN: {db_name}")
        print(f"    -> Archivo: {latest_backup}")
        print("    (Esto recreará las tablas perdidas)")

        # Comando de restauración
        # mysql -u user -p pass database < file.sql
        cmd = f'"{mysql_exe}" -u {db_user}'
        if db_pass:
            cmd += f' -p{db_pass}'
        cmd += f' {db_name} < "{latest_backup}"'

        print(f"[*] Ejecutando comando...")
        try:
            # shell=True es requerido para el operador '<' de redirección en Windows
            process = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            
            if process.returncode == 0:
                print("\n" + "="*50)
                print("   🎉  [PLAN DE INVIERNO COMPLETADO CON ÉXITO]  🎉   ")
                print("       La base de datos ha sido re-montada.")
                print("="*50)
            else:
                print(f"\n[❌] ERROR de Restauración: {process.stderr}")
                print("    Asegúrate de que la base de datos vacía exista primero.")
        except Exception as e:
            print(f"[❌] Error al ejecutar restauración: {str(e)}")

if __name__ == '__main__':
    if len(sys.argv) == 1:
        print("Uso: python plan_invierno_mysql.py [--check | --restore]")
    main()
