
import sys
import os

# Add the current directory to sys.path
sys.path.append(os.getcwd())

print("Attempting to import headers...")
try:
    import psutil
    print("[OK] psutil found")
except ImportError as e:
    print(f"[FAIL] psutil NOT found: {e}")

print("Attempting to import routers.monitoring...")
try:
    from routers import monitoring
    print("[OK] routers.monitoring imported successfully")
except ImportError as e:
    print(f"[FAIL] ImportError importing routers.monitoring: {e}")
except Exception as e:
    print(f"[FAIL] Exception importing routers.monitoring: {e}")
