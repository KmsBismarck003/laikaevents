import sys
import os

# Añadir el directorio actual al path
sys.path.append(os.getcwd())

try:
    print("Intentando importar routers.monitoring...")
    from routers import monitoring
    print("SUCCESS: routers.monitoring importado correctamente.")
except ImportError as e:
    print(f"FAILURE: ImportError al importar monitoring: {e}")
except Exception as e:
    print(f"FAILURE: Exception al importar monitoring: {e}")
