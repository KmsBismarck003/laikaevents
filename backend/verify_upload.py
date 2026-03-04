import requests
import os

BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
UPLOAD_URL = f"{BASE_URL}/api/manager/events/upload-image"

def login(email, password):
    response = requests.post(LOGIN_URL, json={"email": email, "password": password})
    if response.status_code == 200:
        return response.json()["token"]
    print(f"Login failed: {response.text}")
    return None

def test_upload():
    print("Authenticating...")
    token = login("gestor@laikaclub.com", "Gestor123")
    if not token:
        return

    # Create dummy image
    with open("test_image.jpg", "wb") as f:
        f.write(b"fake image content")

    print("Uploading image...")
    headers = {"Authorization": f"Bearer {token}"}

    with open('test_image.jpg', 'rb') as img_file:
        files = {'file': ('test_image.jpg', img_file, 'image/jpeg')}
        res = requests.post(UPLOAD_URL, headers=headers, files=files)

    if res.status_code == 200:
        print("Upload successful!")
        print("Response:", res.json())
    else:
        print(f"Upload failed: {res.status_code}")
        print(res.text)

    # Clean up
    os.remove("test_image.jpg")

if __name__ == "__main__":
    try:
        test_upload()
    except Exception as e:
        print(f"Error: {e}")
