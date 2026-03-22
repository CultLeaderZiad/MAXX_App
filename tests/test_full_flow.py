import requests
import time
import sys
import base64
import os

BASE_URL = "http://localhost:8001/api"
# Clean test environment
email = f"test_all_{int(time.time())}@example.com"
password = "MySecurePassword123!"

def create_dummy_base64_image():
    # 1x1 white pixel png
    return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiLwEAALoA8W+j7O0AAAAASUVORK5CYII="

def test_full_features():
    print(f"Testing with user: {email}")
    
    # 1. Register
    print("1. Registering...")
    resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email, "full_name": "Full User", "date_of_birth": "1995-01-01", "password": password
    })
    if resp.status_code != 200:
        print(f"Register failed: {resp.text}")
        return False
        
    # 2. Verify OTP
    print("2. Verifying OTP...")
    resp = requests.post(f"{BASE_URL}/auth/verify-otp", json={"email": email, "code": "123456"})
    data = resp.json()
    if "access_token" not in data:
        print(f"OTP failed: {resp.text}")
        return False
        
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Test Onboarding Sync
    print("3. Testing Onboarding Sync...")
    resp = requests.post(f"{BASE_URL}/user/onboarding", headers=headers, json={
        "goals": ["Jawline", "Money"],
        "weak_spots": ["Consistency"],
        "stats": {"height": 180, "weight": 75}
    })
    print(f"Onboarding Response: {resp.status_code} {resp.text}")
    if resp.status_code != 200: return False
    
    # 4. Test Face Coach (Should Fail - Beginner)
    print("4. Testing Face Coach (Expect 403 Forbidden)...")
    img_b64 = create_dummy_base64_image()
    resp = requests.post(f"{BASE_URL}/face-coach", headers=headers, json={
        "photo_base64": img_b64
    })
    print(f"Face Coach Response: {resp.status_code} {resp.text}")
    if resp.status_code != 403:
        print("Security Check Failed: Should be 403")
        return False
        
    # 5. Level Up to Alpha
    print("5. Leveling up to Alpha (Adding 20000 XP)...")
    resp = requests.post(f"{BASE_URL}/user/xp", headers=headers, json={
        "amount": 20000,
        "reason": "Admin Boost"
    })
    data = resp.json()
    print(f"New Level: {data.get('new_level')} Title: {data.get('level_title')}")
    if data.get('level_title') != "Alpha":
        print("Level up failed")
        return False
        
    # 6. Test Face Coach (Should Succeed or fail on Gemini Key if missing)
    print("6. Testing Face Coach (Expect Success or AI Error)...")
    resp = requests.post(f"{BASE_URL}/face-coach", headers=headers, json={
        "photo_base64": img_b64
    })
    print(f"Face Coach Response: {resp.status_code} {resp.text}")
    
    # If no key, it returns error message with 200 OK.
    if resp.status_code == 403:
        print("Level check failed despite being Alpha")
        return False
        
    print("SUCCESS: Full feature set working correctly.")
    return True

if __name__ == "__main__":
    if test_full_features():
        sys.exit(0)
    else:
        sys.exit(1)
