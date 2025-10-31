"""
Fetcha Weather - API Integration Test
Version: v1.0 • Updated: 2025-10-28 19:19 AEST (Brisbane)

This script tests the complete API flow:
1. User signup
2. Email verification
3. User login (get JWT)
4. Create API key
5. Make weather request with API key
6. Check usage statistics
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000"
TEST_EMAIL = f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com"
TEST_PASSWORD = "TestPassword123!"
TEST_NAME = "Test User"

print("=" * 60)
print("FETCHA WEATHER API - INTEGRATION TEST")
print("=" * 60)
print(f"\nBase URL: {BASE_URL}")
print(f"Test Email: {TEST_EMAIL}")
print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} AEST\n")

# Helper function
def print_response(step, response):
    print(f"\n{step}")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")

try:
    # Step 1: Signup
    print("\n" + "=" * 60)
    print("STEP 1: User Signup")
    print("=" * 60)
    
    signup_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "full_name": TEST_NAME
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_data)
    print_response("Signup Response:", response)
    
    if response.status_code != 201:
        print("❌ Signup failed!")
        exit(1)
    
    signup_result = response.json()
    verification_token = signup_result.get('verification_token')
    user_id = signup_result['user']['id']
    
    print(f"✅ User created successfully!")
    print(f"   User ID: {user_id}")
    print(f"   Verification Token: {verification_token[:20]}...")
    
    # Step 2: Verify Email
    print("\n" + "=" * 60)
    print("STEP 2: Email Verification")
    print("=" * 60)
    
    verify_data = {"token": verification_token}
    response = requests.post(f"{BASE_URL}/api/auth/verify-email", json=verify_data)
    print_response("Verification Response:", response)
    
    if response.status_code != 200:
        print("❌ Email verification failed!")
        exit(1)
    
    print("✅ Email verified successfully!")
    
    # Step 3: Login
    print("\n" + "=" * 60)
    print("STEP 3: User Login")
    print("=" * 60)
    
    login_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    print_response("Login Response:", response)
    
    if response.status_code != 200:
        print("❌ Login failed!")
        exit(1)
    
    login_result = response.json()
    access_token = login_result['access_token']
    
    print(f"✅ Login successful!")
    print(f"   Access Token: {access_token[:30]}...")
    
    # Step 4: Get Current User
    print("\n" + "=" * 60)
    print("STEP 4: Get Current User (with JWT)")
    print("=" * 60)
    
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    print_response("Current User:", response)
    
    if response.status_code != 200:
        print("❌ Get current user failed!")
        exit(1)
    
    print("✅ User data retrieved successfully!")
    
    # Step 5: Create API Key
    print("\n" + "=" * 60)
    print("STEP 5: Create API Key")
    print("=" * 60)
    
    api_key_data = {"name": "Test API Key"}
    response = requests.post(f"{BASE_URL}/api/keys", json=api_key_data, headers=headers)
    print_response("API Key Creation:", response)
    
    if response.status_code != 201:
        print("❌ API key creation failed!")
        exit(1)
    
    api_key_result = response.json()
    api_key = api_key_result['key_value']
    api_key_id = api_key_result['api_key']['id']
    
    print(f"✅ API key created successfully!")
    print(f"   API Key: {api_key}")
    print(f"   Key ID: {api_key_id}")
    
    # Step 6: List API Keys
    print("\n" + "=" * 60)
    print("STEP 6: List API Keys")
    print("=" * 60)
    
    response = requests.get(f"{BASE_URL}/api/keys", headers=headers)
    print_response("List Keys:", response)
    
    if response.status_code != 200:
        print("❌ List API keys failed!")
        exit(1)
    
    print("✅ API keys listed successfully!")
    
    # Step 7: Validate API Key
    print("\n" + "=" * 60)
    print("STEP 7: Validate API Key")
    print("=" * 60)
    
    validate_data = {"api_key": api_key}
    response = requests.post(f"{BASE_URL}/api/keys/validate", json=validate_data)
    print_response("Validate Key:", response)
    
    if response.status_code != 200:
        print("❌ API key validation failed!")
        exit(1)
    
    print("✅ API key validated successfully!")
    
    # Step 8: Make Weather Request
    print("\n" + "=" * 60)
    print("STEP 8: Weather Data Request (with API Key)")
    print("=" * 60)
    
    weather_headers = {"X-API-Key": api_key}
    weather_params = {
        "location": "Launceston",
        "state": "TAS",
        "date_from": "2025-01-01",
        "date_to": "2025-01-31"
    }
    
    response = requests.get(
        f"{BASE_URL}/api/weather/location",
        headers=weather_headers,
        params=weather_params
    )
    print_response("Weather Request:", response)
    
    if response.status_code != 200:
        print("❌ Weather request failed!")
        exit(1)
    
    weather_result = response.json()
    print(f"✅ Weather data retrieved successfully!")
    print(f"   Response Time: {weather_result['meta']['response_time_ms']}ms")
    print(f"   Quota Used: {weather_result['meta']['quota_used']}")
    print(f"   Quota Remaining: {weather_result['meta']['quota_remaining']}")
    
    # Step 9: Check Usage Statistics
    print("\n" + "=" * 60)
    print("STEP 9: Check Usage Statistics")
    print("=" * 60)
    
    response = requests.get(f"{BASE_URL}/api/usage/monthly", headers=headers)
    print_response("Monthly Usage:", response)
    
    if response.status_code != 200:
        print("❌ Usage stats failed!")
        exit(1)
    
    print("✅ Usage statistics retrieved successfully!")
    
    # Step 10: Check Recent Requests
    print("\n" + "=" * 60)
    print("STEP 10: Check Recent Requests")
    print("=" * 60)
    
    response = requests.get(f"{BASE_URL}/api/usage/recent?limit=5", headers=headers)
    print_response("Recent Requests:", response)
    
    if response.status_code != 200:
        print("❌ Recent requests failed!")
        exit(1)
    
    print("✅ Recent requests retrieved successfully!")
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print("\n✅ ALL TESTS PASSED!")
    print(f"\nTest User Created:")
    print(f"  Email: {TEST_EMAIL}")
    print(f"  User ID: {user_id}")
    print(f"  API Key: {api_key}")
    print(f"\nYou can use these credentials to test the API manually.")
    print("\n" + "=" * 60)

except requests.exceptions.ConnectionError:
    print("\n❌ ERROR: Cannot connect to server!")
    print(f"Please ensure the Flask app is running at {BASE_URL}")
    print("\nTo start the server, run:")
    print("  cd 03_Website/backend")
    print("  python app.py")
    
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
