
import requests
import sys

try:
    print("Testing GET http://localhost:8000/api/monitoring/status...")
    response = requests.get("http://localhost:8000/api/monitoring/status")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text[:200]}...") # Print first 200 chars

    if response.status_code == 200:
        print("[OK] Endpoint is WORKING on localhost:8000")
    else:
        print("[FAIL] Endpoint returned non-200 status")

except Exception as e:
    print(f"[FAIL] Error connecting to server: {e}")
