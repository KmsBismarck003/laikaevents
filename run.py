#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════╗
║            LAIKA CLUB — LANZADOR PRINCIPAL                      ║
║  Teclas de control (presionar en cada terminal):               ║
║    R  →  Recargar / reiniciar ese servicio                     ║
║    S  →  Detener ese servicio y salir                          ║
╚══════════════════════════════════════════════════════════════════╝

Uso:
    python run.py

Abre dos terminales:
  • Terminal 1: Backend (microservicios Python en puertos 8000-8007)
  • Terminal 2: Frontend (React en puerto 3000)
"""

import os
import sys
import subprocess
import platform
import time

ROOT = os.path.dirname(os.path.abspath(__file__))

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
║              🐾  LAIKA CLUB — SISTEMA DE LANZAMIENTO  🐾        ║
╚══════════════════════════════════════════════════════════════════╝
{RESET}""")

IS_WINDOWS = platform.system() == "Windows"

def launch_windows():
    """Lanza backend y frontend en dos ventanas cmd separadas con control."""
    # Script de control de backend ─────────────────────────────────
    backend_runner = os.path.join(ROOT, "_backend_runner.py")
    frontend_runner = os.path.join(ROOT, "_frontend_runner.py")

    # Crear scripts temporales de control
    _write_backend_runner(backend_runner)
    _write_frontend_runner(frontend_runner)

    print(f"  {GREEN}[1/2]{RESET} Abriendo terminal del {BOLD}Backend{RESET}...")
    subprocess.Popen(
        f'start cmd /k "title [LAIKA] Backend && cd /d {ROOT} && python _backend_runner.py"',
        shell=True, cwd=ROOT
    )
    time.sleep(2)

    print(f"  {GREEN}[2/2]{RESET} Abriendo terminal del {BOLD}Frontend{RESET}...")
    subprocess.Popen(
        f'start cmd /k "title [LAIKA] Frontend && cd /d {ROOT} && python _frontend_runner.py"',
        shell=True, cwd=ROOT
    )

    print(f"""
{CYAN}══════════════════════════════════════════════════════════════════{RESET}
  {GREEN}✔{RESET}  Se abrieron 2 terminales con el sistema Laika Club.

  {BOLD}En cada terminal puedes presionar:{RESET}
    {YELLOW}R{RESET}  →  Recargar / reiniciar ese servicio
    {YELLOW}S{RESET}  →  Detener ese servicio

  {BOLD}URLs del sistema:{RESET}
    Frontend  →  {CYAN}http://localhost:3000{RESET}
    API       →  {CYAN}http://localhost:8000/api{RESET}

  Esta ventana puede cerrarse.
{CYAN}══════════════════════════════════════════════════════════════════{RESET}
""")


def _write_backend_runner(path):
    code = '''#!/usr/bin/env python3
"""Backend runner con control de teclado R=reload, S=stop"""
import subprocess, sys, os, time, threading

ROOT = os.path.dirname(os.path.abspath(__file__))
PROCESS = None

GREEN  = "\\033[92m"
YELLOW = "\\033[93m"
RED    = "\\033[91m"
CYAN   = "\\033[96m"
RESET  = "\\033[0m"
BOLD   = "\\033[1m"

def start_backend():
    global PROCESS
    print(f"\\n{CYAN}[BACKEND]{RESET} Iniciando microservicios...\\n")
    PROCESS = subprocess.Popen(
        [sys.executable, "run_microservices.py"],
        cwd=ROOT
    )
    return PROCESS

def stop_backend():
    global PROCESS
    if PROCESS and PROCESS.poll() is None:
        print(f"\\n{YELLOW}[BACKEND]{RESET} Deteniendo microservicios...")
        PROCESS.terminate()
        try:
            PROCESS.wait(timeout=5)
        except:
            PROCESS.kill()
        print(f"{RED}[BACKEND]{RESET} Microservicios detenidos.")
    PROCESS = None

def read_keys():
    """Lee teclas del teclado — Windows usa msvcrt"""
    try:
        import msvcrt
        while True:
            if msvcrt.kbhit():
                key = msvcrt.getwch().upper()
                if key == "R":
                    print(f"\\n{YELLOW}[BACKEND]{RESET} Recargando backend (R)...")
                    stop_backend()
                    time.sleep(1)
                    start_backend()
                elif key == "S":
                    print(f"\\n{RED}[BACKEND]{RESET} Deteniendo sistema (S)...")
                    stop_backend()
                    sys.exit(0)
            time.sleep(0.1)
    except ImportError:
        # Linux/Mac: usar input estándar
        while True:
            try:
                line = input()
                key = line.strip().upper()
                if key == "R":
                    print(f"\\n{YELLOW}[BACKEND]{RESET} Recargando backend...")
                    stop_backend()
                    time.sleep(1)
                    start_backend()
                elif key == "S":
                    stop_backend()
                    sys.exit(0)
            except (EOFError, KeyboardInterrupt):
                stop_backend()
                sys.exit(0)

def main():
    print(f"""
{CYAN}{BOLD}╔════════════════════════════════════════╗
║  LAIKA CLUB — BACKEND (Microservicios) ║
╚════════════════════════════════════════╝{RESET}
  {YELLOW}R{RESET} → Recargar   {YELLOW}S{RESET} → Detener
""")
    start_backend()

    # Leer teclado en hilo separado
    t = threading.Thread(target=read_keys, daemon=True)
    t.start()

    try:
        while True:
            # Verificar si el proceso murió inesperadamente
            if PROCESS and PROCESS.poll() is not None:
                print(f"\\n{RED}[BACKEND] El proceso terminó inesperadamente. Reiniciando en 3s...{RESET}")
                time.sleep(3)
                start_backend()
            time.sleep(1)
    except KeyboardInterrupt:
        stop_backend()
        sys.exit(0)

if __name__ == "__main__":
    main()
'''
    with open(path, "w", encoding="utf-8") as f:
        f.write(code)


def _write_frontend_runner(path):
    code = '''#!/usr/bin/env python3
"""Frontend runner con control de teclado R=reload, S=stop"""
import subprocess, sys, os, time, threading, platform

ROOT = os.path.dirname(os.path.abspath(__file__))
PROCESS = None

GREEN  = "\\033[92m"
YELLOW = "\\033[93m"
RED    = "\\033[91m"
CYAN   = "\\033[96m"
RESET  = "\\033[0m"
BOLD   = "\\033[1m"

IS_WIN = platform.system() == "Windows"

def start_frontend():
    global PROCESS
    print(f"\\n{CYAN}[FRONTEND]{RESET} Iniciando React (npm start)...\\n")
    if IS_WIN:
        PROCESS = subprocess.Popen(
            "npm start",
            cwd=ROOT, shell=True
        )
    else:
        PROCESS = subprocess.Popen(
            ["npm", "start"],
            cwd=ROOT
        )
    return PROCESS

def stop_frontend():
    global PROCESS
    if PROCESS and PROCESS.poll() is None:
        print(f"\\n{YELLOW}[FRONTEND]{RESET} Deteniendo React...")
        if IS_WIN:
            # En Windows hay que matar todo el árbol de procesos
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(PROCESS.pid)],
                           capture_output=True)
        else:
            PROCESS.terminate()
        try:
            PROCESS.wait(timeout=5)
        except:
            PROCESS.kill()
        print(f"{RED}[FRONTEND]{RESET} React detenido.")
    PROCESS = None

def read_keys():
    try:
        import msvcrt
        while True:
            if msvcrt.kbhit():
                key = msvcrt.getwch().upper()
                if key == "R":
                    print(f"\\n{YELLOW}[FRONTEND]{RESET} Recargando frontend (R)...")
                    stop_frontend()
                    time.sleep(1)
                    start_frontend()
                elif key == "S":
                    stop_frontend()
                    sys.exit(0)
            time.sleep(0.1)
    except ImportError:
        while True:
            try:
                line = input()
                key = line.strip().upper()
                if key == "R":
                    stop_frontend()
                    time.sleep(1)
                    start_frontend()
                elif key == "S":
                    stop_frontend()
                    sys.exit(0)
            except (EOFError, KeyboardInterrupt):
                stop_frontend()
                sys.exit(0)

def main():
    print(f"""
{CYAN}{BOLD}╔════════════════════════════════════════╗
║  LAIKA CLUB — FRONTEND (React)         ║
╚════════════════════════════════════════╝{RESET}
  {YELLOW}R{RESET} → Recargar   {YELLOW}S{RESET} → Detener
  Abrirá http://localhost:3000 automáticamente.
""")
    start_frontend()

    t = threading.Thread(target=read_keys, daemon=True)
    t.start()

    try:
        while True:
            if PROCESS and PROCESS.poll() is not None:
                print(f"\\n{RED}[FRONTEND] El proceso terminó inesperadamente. Reiniciando en 3s...{RESET}")
                time.sleep(3)
                start_frontend()
            time.sleep(1)
    except KeyboardInterrupt:
        stop_frontend()
        sys.exit(0)

if __name__ == "__main__":
    main()
'''
    with open(path, "w", encoding="utf-8") as f:
        f.write(code)


def main():
    banner()
    print(f"{BOLD}Este script lanza el sistema completo en 2 terminales separadas.{RESET}")
    print(f"{YELLOW}Asegúrate de haber ejecutado setup.py primero si es un equipo nuevo.{RESET}\n")

    if not IS_WINDOWS:
        print(f"{YELLOW}Nota: En Linux/Mac, abre 2 terminales manualmente y ejecuta:{RESET}")
        print(f"  Terminal 1: {BOLD}python run_microservices.py{RESET}")
        print(f"  Terminal 2: {BOLD}npm start{RESET}")
        sys.exit(0)

    launch_windows()


if __name__ == "__main__":
    main()
