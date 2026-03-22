import requests
import time
import sys
import os

BASE_URL = "http://localhost:8001/api"
# Clean test environment
email = f"test_prog_{int(time.time())}@example.com"
password = "MySecurePassword123!"

def test_progress_endpoints():
    print(f"Testing with user: {email}")
    
    # 1. Register & Verify & Login
    print("1. Registering...")
    resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email, "full_name": "Pro User", "date_of_birth": "1999-01-01", "password": password
    })
    if resp.status_code != 200:
        print(f"Register failed: {resp.text}")
        return False
        
    print("2. Verifying OTP...")
    resp = requests.post(f"{BASE_URL}/auth/verify-otp", json={"email": email, "code": "123456"})
    data = resp.json()
    if "access_token" not in data:
        print(f"OTP failed: {resp.text}")
        return False
        
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Got Token:", token[:20] + "...")
    
    # 3. Test GET /user/progress (Initial)
    print("3. Getting initial progress...")
    resp = requests.get(f"{BASE_URL}/user/progress", headers=headers)
    print(f"Initial Progress: {resp.status_code} {resp.text}")
    prog = resp.json()
    if prog["power_level"] != 1 or prog["xp"] != 0:
        print("Initial stats wrong")
        return False
        
    # 4. Test POST /user/streak
    print("4. Updating streak...")
    resp = requests.post(f"{BASE_URL}/user/streak", headers=headers, json={
        "streak_type": "nofap",
        "current_streak": 5,
        "last_activity_date": "2023-10-27"
    })
    print(f"Streak Update: {resp.status_code} {resp.text}")
    if resp.status_code != 200: return False
    
    # Verify streak update
    resp = requests.get(f"{BASE_URL}/user/progress", headers=headers)
    prog = resp.json()
    streak = next((s for s in prog["streaks"] if s["type"] == "nofap"), None)
    if not streak or streak["current"] != 5:
        print("Streak verification failed")
        return False
        
    # 5. Test POST /user/workout
    print("5. Logging workout...")
    resp = requests.post(f"{BASE_URL}/user/workout", headers=headers, json={
        "workout_id": "jaw_101",
        "workout_type": "jaw",
        "xp_earned": 500
    })
    print(f"Workout Log: {resp.status_code} {resp.text}")
    if resp.status_code != 200: return False
    
    # 6. Test POST /user/xp
    print("6. Adding XP...")
    resp = requests.post(f"{BASE_URL}/user/xp", headers=headers, json={
        "amount": 600,
        "reason": "Bonus"
    })
    print(f"XP Add: {resp.status_code} {resp.text}")
    data = resp.json()
    # Total XP should be 500 + 600 = 1100. Level should be 1 + 1100//1000 = 2.
    if data["new_level"] != 2:
        print(f"Level calc failed. Expected 2, got {data['new_level']}")
        return False
        
    print("SUCCESS: User Progress API endpoints working correctly.")
    return True

if __name__ == "__main__":
    if test_progress_endpoints():
        sys.exit(0)
    else:
        sys.exit(1)
