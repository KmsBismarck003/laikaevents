import sys
from main import app

try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

print("Checking Manager Routes:")
found = False
for route in app.routes:
    if hasattr(route, 'path') and "/api/manager" in route.path:
        methods = ", ".join(sorted(route.methods))
        print(f"{methods}: {route.path}")
        if "upload-image" in route.path:
            found = True

if found:
    print("\nSUCCESS: Upload endpoint found!")
else:
    print("\nFAILURE: Upload endpoint NOT found.")
