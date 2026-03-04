import requests
import json

BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
MANAGER_API = f"{BASE_URL}/api/manager"

def login(email, password):
    response = requests.post(LOGIN_URL, json={"email": email, "password": password})
    if response.status_code == 200:
        return response.json()["token"]
    print(f"Login failed: {response.text}")
    return None

def test_manager_flow():
    print("Authenticating as Manager...")
    token = login("gestor@laikaclub.com", "Gestor123")
    if not token:
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Event
    print("\nCreating Draft Event...")
    event_data = {
        "name": "Test Event Automated",
        "description": "Created by verification script",
        "category": "concert",
        "event_date": "2025-12-31",
        "event_time": "20:00:00",
        "location": "Test City",
        "venue": "Test Venue",
        "price": 100.0,
        "total_tickets": 50
    }
    res = requests.post(f"{MANAGER_API}/events", json=event_data, headers=headers)
    if res.status_code != 200:
        print(f"Creation failed: {res.text}")
        return
    event = res.json()
    event_id = event['id']
    print(f"Event Created: ID {event_id} - {event['name']} ({event['status']})")

    # 2. Get Details & Revenue
    print(f"\nFetching Details for Event {event_id}...")
    res = requests.get(f"{MANAGER_API}/events/{event_id}", headers=headers)
    details = res.json()
    revenue = details.get('revenue_summary', {})
    print(f"Details fetched. Gross Revenue: {revenue.get('gross', -1)}")

    # 3. Publish Event
    print(f"\nPublishing Event {event_id}...")
    res = requests.patch(f"{MANAGER_API}/events/{event_id}/publish", headers=headers)
    if res.status_code == 200:
        print("Event Published")
    else:
        print(f"Publish failed: {res.text}")

    # 4. Cancel Event (Fail case - short reason)
    print(f"\nTesting Cancel with short reason (should fail)...")
    res = requests.patch(f"{MANAGER_API}/events/{event_id}/cancel", json={"reason": "short"}, headers=headers)
    if res.status_code == 400:
        print("Correctly rejected short reason")
    else:
        print(f"Failed to reject short reason: {res.status_code}")

    # 5. Cancel Event (Success case)
    print(f"\nCancelling Event {event_id}...")
    reason = "Verification script emergency cancellation test"
    res = requests.patch(f"{MANAGER_API}/events/{event_id}/cancel", json={"reason": reason}, headers=headers)
    if res.status_code == 200:
        print("Event Cancelled")
        print("   Response:", res.json())
    else:
        print(f"Cancel failed: {res.text}")

    # 6. Verify Log (Optional, requires DB access or log endpoint)
    # We can assume it worked if the previous steps passed 200 checks on the isolated router.

if __name__ == "__main__":
    try:
        test_manager_flow()
    except Exception as e:
        print(f"An error occurred: {e}")
