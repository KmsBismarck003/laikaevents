import os
import subprocess
import sys

def run(cmd):
    return subprocess.check_output(cmd, shell=True).decode('utf-8').strip()

def clear():
    os.system('cls' if os.name == 'nt' else 'clear')

def main():
    clear()
    print("="*50)
    print("🚀 ASISTENTE DE GITHUB - LAIKA CLUB")
    print("="*50)

    # 1. Mostrar Ramas
    branches = run("git branch")
    print(f"\n📍 RAMAS ACTUALES:\n{branches}")

    # 2. Mostrar Cambios
    status = run("git status -s")
    if not status:
        print("\n✅ No hay cambios pendientes.")
        input("\nPresiona Enter para salir...")
        return

    print(f"\n📝 CAMBIOS DETECTADOS:\n{status}")
    print("-" * 50)

    # 3. Preguntar
    choice = input("\n¿Quieres subir estos cambios a GitHub? (s/n): ").lower()
    
    if choice == 's':
        msg = input("Escribe un mensaje corto (ej: se cambio tal cosa): ")
        if not msg:
            msg = "actualización de sistema"
        
        print("\n⏳ Subiendo...")
        try:
            subprocess.run("git add .", shell=True)
            subprocess.run(f'git commit -m "{msg}"', shell=True)
            subprocess.run("git push origin main", shell=True)
            print("\n✨ ¡Cambios subidos con éxito!")
        except Exception as e:
            print(f"\n❌ Error al subir: {e}")
    else:
        print("\nAcción cancelada.")

    input("\nPresiona Enter para salir...")

if __name__ == "__main__":
    main()
