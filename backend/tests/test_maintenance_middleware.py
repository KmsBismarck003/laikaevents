
from fastapi.testclient import TestClient
from main import app
from core.config_store import set_value
import os
import jwt
import sys
from datetime import datetime, timedelta

# Mock or use app
try:
    client = TestClient(app)
except Exception as e:
    print(f"Failed to create TestClient: {e}")
    sys.exit(1)

def test_maintenance_mode_enforcement():
    print("🧪 Starting Maintenance Middleware Test...")

    # 1. Normal Mode
    print("   [1/4] Testing Normal Mode...")
    set_value("maintenanceMode", False)
    response = client.get("/api/test")
    if response.status_code != 200:
        print(f"❌ Failed Normal Mode: {response.status_code}")
        return False

    print("   ✅ Normal Mode Passed")

    # 2. Enable Maintenance Mode
    print("   [2/4] Testing Maintenance Mode (Public Access)...")
    set_value("maintenanceMode", True)

    # Public endpoints should still work
    if client.get("/health").status_code != 200:
         print("❌ Failed Health Check")
         return False

    if client.get("/api/config").status_code != 200:
         print("❌ Failed Config Check")
         return False

    # Protected endpoint should be 503
    response = client.get("/api/test")
    if response.status_code != 503:
        print(f"❌ Failed Block: Status {response.status_code} (Expected 503)")
        return False

    print("   ✅ Maintenance Block Passed")

    # 3. Admin Access
    print("   [3/4] Testing Admin Access...")
    secret = os.getenv('JWT_SECRET', 'tu_clave_secreta_aqui')
    admin_token = jwt.encode({
        "user_id": 1,
        "role": "admin",
        "exp": datetime.utcnow() + timedelta(hours=1)
    }, secret, algorithm="HS256")

    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/api/test", headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed Admin Access: {response.status_code}")
        return False

    print("   ✅ Admin Access Passed")

    # 4. User Access (Should be blocked)
    print("   [4/4] Testing User Access...")
    user_token = jwt.encode({
        "user_id": 2,
        "role": "user",
        "exp": datetime.utcnow() + timedelta(hours=1)
    }, secret, algorithm="HS256")

    headers = {"Authorization": f"Bearer {user_token}"}
    response = client.get("/api/test", headers=headers)
    if response.status_code != 503:
        print(f"❌ Failed User Block: {response.status_code}")
        return False

    print("   ✅ User Block Passed")

    # Reset
    set_value("maintenanceMode", False)
    return True

if __name__ == "__main__":
    try:
        if test_maintenance_mode_enforcement():
            print("\n✅ SUCCESS: All Middleware Logic Verified!")
            sys.exit(0)
        else:
            print("\n❌ FAILURE: Middleware Logic Failed")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
