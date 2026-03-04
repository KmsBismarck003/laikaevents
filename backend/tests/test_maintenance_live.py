
import urllib.request
import urllib.error
import json
import time

BASE_URL = "http://localhost:8000"

def request(method, path, data=None, headers=None):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, method=method)

    if headers:
        for k, v in headers.items():
            req.add_header(k, v)

    if data:
        json_data = json.dumps(data).encode('utf-8')
        req.add_header('Content-Type', 'application/json')
        req.data = json_data

    try:
        with urllib.request.urlopen(req) as response:
            return {
                "status": response.status,
                "body": json.loads(response.read().decode('utf-8'))
            }
    except urllib.error.HTTPError as e:
        content = e.read()
        return {
            "status": e.code,
            "body": json.loads(content.decode('utf-8')) if content else {}
        }
    except Exception as e:
        return {"error": str(e)}

def test_live_maintenance():
    print("[TEST] Starting LIVE Maintenance Mode Test...")

    # 1. Ensure Normal Mode
    print("   [1/5] Setting Normal Mode...")
    resp = request("PUT", "/api/config", {"maintenanceMode": False})
    if resp.get("status") != 200:
        print(f"[FAIL] Failed to set normal mode: {resp}")
        return False

    resp = request("GET", "/api/test")
    if resp.get("status") != 200:
        print(f"[FAIL] /api/test failed in normal mode: {resp}")
        return False
    print("   [PASS] Normal Mode Verified")

    # 2. Enable Maintenance
    print("   [2/5] Enabling Maintenance Mode...")
    resp = request("PUT", "/api/config", {"maintenanceMode": True})
    if resp.get("status") != 200:
        print(f"[FAIL] Failed to enable maintenance: {resp}")
        return False

    # 3. Verify Block
    print("   [3/5] Verifying Block...")
    resp = request("GET", "/api/test")
    if resp.get("status") != 503:
        print(f"[FAIL] /api/test NOT blocked: {resp}")
        return False
    print("   [PASS] Block Verified (503 Service Unavailable)")

    # 4. Verify Bypass (Health)
    print("   [4/5] Verifying Health Check Bypass...")
    resp = request("GET", "/health")
    if resp.get("status") != 200:
        print(f"[FAIL] /health blocked: {resp}")
        return False
    print("   [PASS] Health Check Bypass Verified")

    # 5. Restore
    print("   [5/5] Restoring System...")
    resp = request("PUT", "/api/config", {"maintenanceMode": False})
    if resp.get("status") != 200:
        print(f"[FAIL] Failed to restore: {resp}")
        return False

    resp = request("GET", "/api/test")
    if resp.get("status") != 200:
        print(f"[FAIL] /api/test failed after restore: {resp}")
        return False
    print("   [PASS] Restoration Verified")

    return True

if __name__ == "__main__":
    try:
        if test_live_maintenance():
            print("\n[SUCCESS] Maintenance Mode Live Test Passed!")
        else:
            print("\n[FAILURE] Live Test Failed")
            import sys
            sys.exit(1)
    except Exception as e:
        print(f"\n[CRITICAL ERROR] {e}")
        import traceback
        traceback.print_exc()
