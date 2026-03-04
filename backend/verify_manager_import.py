import sys
import traceback

print("Attempting to import routers.manager...")

try:
    from routers import manager
    print("SUCCESS: routers.manager imported successfully.")
except ImportError as e:
    print(f"FAILURE: ImportError: {e}")
    traceback.print_exc()
except Exception as e:
    print(f"FAILURE: Exception: {e}")
    traceback.print_exc()
