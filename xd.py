import subprocess
import threading
import os
import signal
import sys

processes = []

def run_process(command, cwd=None):
    process = subprocess.Popen(
        command,
        cwd=cwd,
        shell=True
    )
    processes.append(process)
    process.wait()

def start_frontend():
    run_process("npm start")

def start_backend():
    backend_path = os.path.join(os.getcwd(), "backend")
    run_process("python main.py", cwd=backend_path)

def shutdown(signum=None, frame=None):
    print("\nCerrando procesos...")
    for p in processes:
        p.terminate()
    sys.exit(0)

if __name__ == "__main__":
    signal.signal(signal.SIGINT, shutdown)

    frontend_thread = threading.Thread(target=start_frontend)
    backend_thread = threading.Thread(target=start_backend)

    frontend_thread.start()
    backend_thread.start()

    frontend_thread.join()
    backend_thread.join()
