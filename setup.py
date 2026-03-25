#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════╗
║          LAIKA CLUB - INSTALADOR / SETUP DEL SISTEMA            ║
║          Ejecutar SOLO la primera vez en un equipo nuevo        ║
╚══════════════════════════════════════════════════════════════════╝

Uso:
    python setup.py

¿Qué hace?
  1. Verifica que Node.js, npm y Python estén instalados.
  2. Instala dependencias Python (requirements.txt).
  3. Instala dependencias del frontend (npm install).
  4. Verifica conexión a MySQL (XAMPP).
  5. Importa la base de datos laika_club desde laika_club_database.sql.
  6. Crea el archivo .env si no existe con valores por defecto.
"""

import os, sys, subprocess, shutil, platform, time

ROOT = os.path.dirname(os.path.abspath(__file__))
SQL_FILE = os.path.join(ROOT, "laika_club_database.sql")
ENV_FILE = os.path.join(ROOT, ".env")
REQUIREMENTS = os.path.join(ROOT, "requirements.txt")

# ── Colores ANSI ──────────────────────────────────────────────────
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
CYAN   = "\033[96m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

def banner():
    print(f"""
{CYAN}{BOLD}
╔══════════════════════════════════════════════════════════════════╗
║          🐾  LAIKA CLUB — INSTALADOR DEL SISTEMA  🐾            ║
╚══════════════════════════════════════════════════════════════════╝
{RESET}""")

def ok(msg):   print(f"  {GREEN}✔{RESET}  {msg}")
def warn(msg): print(f"  {YELLOW}⚠{RESET}  {msg}")
def err(msg):  print(f"  {RED}✘{RESET}  {msg}")
def step(msg): print(f"\n{BOLD}{CYAN}[PASO]{RESET} {msg}")

def run(cmd, cwd=ROOT, capture=True):
    result = subprocess.run(cmd, cwd=cwd, capture_output=capture,
                            text=True, shell=(platform.system() == "Windows"))
    return result

def check_command(cmd):
    return shutil.which(cmd) is not None

# ══════════════════════════════════════════════════════════════════
# PASO 1 — Verificar herramientas del sistema
# ══════════════════════════════════════════════════════════════════
def check_tools():
    step("Verificando herramientas del sistema...")
    all_good = True

    for tool, hint in [
        ("python",  "Instala Python 3.10+ desde https://python.org"),
        ("node",    "Instala Node.js 18+ desde https://nodejs.org"),
        ("npm",     "Instala Node.js 18+ desde https://nodejs.org"),
    ]:
        if check_command(tool):
            res = run([tool, "--version"])
            version = res.stdout.strip() or res.stderr.strip()
            ok(f"{tool} → {version}")
        else:
            err(f"{tool} NO encontrado. {hint}")
            all_good = False

    if not all_good:
        print(f"\n{RED}Instala las herramientas faltantes y vuelve a ejecutar setup.py{RESET}")
        sys.exit(1)

# ══════════════════════════════════════════════════════════════════
# PASO 2 — Crear / verificar .env
# ══════════════════════════════════════════════════════════════════
def setup_env():
    step("Verificando archivo .env...")

    default_env = """\
JWT_SECRET=super_secret_laika_club_2026
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=laika_club
MYSQLDUMP_PATH=C:\\xampp\\mysql\\bin\\mysqldump.exe
MYSQL_EXE_PATH=C:\\xampp\\mysql\\bin\\mysql.exe
MYSQLADMIN_EXE_PATH=C:\\xampp\\mysql\\bin\\mysqladmin.exe
REACT_APP_API_URL=http://localhost:8000/api
MONGO_URI="mongodb+srv://al222310440_db_user:4qbkoSVinVJkAMA6@laikaclubdata.rcedjaa.mongodb.net/?appName=LaikaClubData"
MONGO_DB="laika_analytics"
"""
    if not os.path.exists(ENV_FILE):
        with open(ENV_FILE, "w") as f:
            f.write(default_env)
        ok(".env creado con valores por defecto.")
        warn("Edita .env si tu contraseña de MySQL es diferente o cambias rutas.")
    else:
        ok(".env ya existe — no se sobreescribe.")

# ══════════════════════════════════════════════════════════════════
# PASO 3 — Instalar dependencias Python
# ══════════════════════════════════════════════════════════════════
def install_python_deps():
    step("Instalando dependencias Python (requirements.txt)...")
    if not os.path.exists(REQUIREMENTS):
        err("requirements.txt no encontrado.")
        sys.exit(1)

    result = run(
        [sys.executable, "-m", "pip", "install", "-r", REQUIREMENTS, "--quiet"],
        capture=False
    )
    if result.returncode == 0:
        ok("Dependencias Python instaladas correctamente.")
    else:
        err("Hubo errores al instalar dependencias Python. Revisa el output anterior.")
        sys.exit(1)

# ══════════════════════════════════════════════════════════════════
# PASO 4 — Instalar dependencias Node / npm
# ══════════════════════════════════════════════════════════════════
def install_node_deps():
    step("Instalando dependencias del frontend (npm install)...")
    package_json = os.path.join(ROOT, "package.json")
    if not os.path.exists(package_json):
        err("package.json no encontrado. ¿Estás en la carpeta correcta?")
        sys.exit(1)

    result = run(["npm", "install"], capture=False)
    if result.returncode == 0:
        ok("Dependencias Node.js instaladas correctamente.")
    else:
        err("Hubo errores en npm install. Revisa el output anterior.")
        sys.exit(1)

# ══════════════════════════════════════════════════════════════════
# PASO 5 — Detectar MySQL (XAMPP u otro)
# ══════════════════════════════════════════════════════════════════
def find_mysql():
    """Busca mysql.exe en varias rutas comunes."""
    step("Buscando MySQL en el sistema...")

    # Leer ruta desde .env si existe
    mysql_path_from_env = None
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE) as f:
            for line in f:
                if line.startswith("MYSQL_EXE_PATH="):
                    mysql_path_from_env = line.split("=", 1)[1].strip().strip('"')
                    break

    candidates = []
    if mysql_path_from_env:
        candidates.append(mysql_path_from_env)

    candidates += [
        r"C:\xampp\mysql\bin\mysql.exe",
        r"C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe",
        r"C:\wamp\bin\mysql\mysql8.0.31\bin\mysql.exe",
        r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
        r"C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
        "mysql",  # Si está en PATH
    ]

    for path in candidates:
        if os.path.exists(path):
            ok(f"MySQL encontrado: {path}")
            return path
        if shutil.which(path):
            ok(f"MySQL encontrado en PATH: {path}")
            return path

    warn("No se encontró mysql.exe automáticamente.")
    print(f"  {YELLOW}Si tienes XAMPP, asegúrate de que esté instalado en C:\\xampp\\{RESET}")
    print(f"  {YELLOW}Luego edita .env con la ruta correcta de MYSQL_EXE_PATH{RESET}")
    return None

# ══════════════════════════════════════════════════════════════════
# PASO 6 — Importar base de datos MySQL
# ══════════════════════════════════════════════════════════════════
def import_database(mysql_exe):
    step("Importando base de datos MySQL (laika_club_database.sql)...")

    if not os.path.exists(SQL_FILE):
        err(f"No se encontró {SQL_FILE}")
        warn("Asegúrate de que laika_club_database.sql esté en la raíz del proyecto.")
        return False

    # Leer credenciales de .env
    db_user = "root"
    db_pass = ""
    db_host = "localhost"

    if os.path.exists(ENV_FILE):
        with open(ENV_FILE) as f:
            for line in f:
                if line.startswith("MYSQL_USER="):
                    db_user = line.split("=", 1)[1].strip()
                elif line.startswith("MYSQL_PASSWORD="):
                    db_pass = line.split("=", 1)[1].strip()
                elif line.startswith("MYSQL_HOST="):
                    db_host = line.split("=", 1)[1].strip()

    print(f"  → Importando con usuario: {db_user} @ {db_host}")
    print(f"  → Archivo SQL: {os.path.basename(SQL_FILE)}")
    print(f"  {YELLOW}(Puede tardar unos segundos...){RESET}")

    # mysqldump con --databases incluye CREATE DATABASE, así que no necesitamos crearla antes
    if db_pass:
        cmd = f'"{mysql_exe}" -h{db_host} -u{db_user} -p{db_pass} < "{SQL_FILE}"'
    else:
        cmd = f'"{mysql_exe}" -h{db_host} -u{db_user} < "{SQL_FILE}"'

    try:
        result = subprocess.run(cmd, shell=True, cwd=ROOT,
                                capture_output=True, text=True)
        if result.returncode == 0:
            ok("Base de datos importada exitosamente.")
            return True
        else:
            stderr = result.stderr.strip()
            if "already exists" in stderr or "Can't create database" in stderr:
                ok("La base de datos ya existe. Importando de todas formas...")
                return True
            err(f"Error al importar base de datos:")
            print(f"    {RED}{stderr}{RESET}")
            warn("Asegúrate de que MySQL/XAMPP esté corriendo antes de ejecutar setup.py")
            return False
    except Exception as e:
        err(f"Error crítico al importar: {e}")
        return False

# ══════════════════════════════════════════════════════════════════
# PASO 7 — Crear carpetas necesarias
# ══════════════════════════════════════════════════════════════════
def create_folders():
    step("Verificando carpetas del sistema...")
    folders = [
        "uploads", "uploads/avatars", "uploads/tickets",
        "microservices_logs", "backups", "data"
    ]
    for folder in folders:
        path = os.path.join(ROOT, folder)
        os.makedirs(path, exist_ok=True)
    ok("Carpetas verificadas/creadas.")

# ══════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════
def main():
    banner()
    print(f"{BOLD}Este script configura el sistema Laika Club en este equipo.{RESET}")
    print(f"{YELLOW}Asegúrate de tener XAMPP (MySQL) instalado y el servicio MySQL activo.{RESET}\n")

    input(f"Presiona {BOLD}ENTER{RESET} para continuar (Ctrl+C para cancelar)...")

    check_tools()
    setup_env()
    install_python_deps()
    install_node_deps()
    create_folders()

    mysql_exe = find_mysql()
    if mysql_exe:
        db_ok = import_database(mysql_exe)
    else:
        warn("Saltando importación de MySQL — instala XAMPP primero si necesitas la BD.")
        db_ok = False

    # ── Resumen Final ─────────────────────────────────────────────
    print(f"""
{CYAN}{BOLD}
╔══════════════════════════════════════════════════════════════════╗
║                    ✅  SETUP COMPLETADO                         ║
╚══════════════════════════════════════════════════════════════════╝
{RESET}
  {GREEN}✔{RESET}  Dependencias Python instaladas
  {GREEN}✔{RESET}  Dependencias Node.js (frontend) instaladas
  {GREEN if db_ok else YELLOW}{"✔" if db_ok else "⚠"}{RESET}  Base de datos MySQL: {"importada" if db_ok else "pendiente (importar manualmente)"}

  {BOLD}Próximo paso:{RESET}
    python run.py

  {YELLOW}Si hay errores al iniciar, revisa que XAMPP esté activo.{RESET}
""")

if __name__ == "__main__":
    main()
