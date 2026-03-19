#!/usr/bin/env python3
"""
CORS & Backend Diagnostic Script
Tests if the issue is in backend CORS config or frontend
"""

import requests
import json
from urllib.parse import urljoin
import sys

# Fix encoding for Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

# Configuration
BACKEND_URL = "https://nextgen-ta95.onrender.com"
API_BASE = urljoin(BACKEND_URL, "/api")
TEST_ORIGINS = [
    "https://next-gen-rosy.vercel.app",
    "https://next-gen-silk.vercel.app",
    "https://next-qqm31awm0-obaidullahofficials-projects.vercel.app",
    "http://localhost:5173",
]

print("=" * 80)
print("NextGen CORS & Backend Diagnostic Script")
print("=" * 80)

# Test 1: Backend Connectivity
print("\n[TEST 1] Backend Connectivity")
print("-" * 80)
try:
    response = requests.get(f"{BACKEND_URL}/", timeout=10)
    print(f"[OK] Backend is UP (Status: {response.status_code})")
except Exception as e:
    print(f"[FAIL] Backend is DOWN or unreachable")
    print(f"  Error: {e}")
    print("\n[ERROR] Backend server is not responding!")
    exit(1)

# Test 2: API Endpoint Connectivity
print("\n[TEST 2] API Endpoints")
print("-" * 80)
test_endpoints = [
    "/api/health",
    "/api/users",
    "/api/society-profiles",
    "/api/advertisements/active?limit=1",
    "/api/reviews",
]

for endpoint in test_endpoints:
    try:
        url = urljoin(BACKEND_URL, endpoint)
        response = requests.get(url, timeout=5)
        status = "[OK]" if response.status_code < 500 else "[FAIL]"
        print(f"{status} {endpoint}: {response.status_code}")
    except Exception as e:
        print(f"[FAIL] {endpoint}: {str(e)[:60]}")

# Test 3: CORS Headers with OPTIONS request
print("\n[TEST 3] CORS Preflight Test (OPTIONS Request)")
print("-" * 80)

for origin in TEST_ORIGINS:
    print(f"\nTesting origin: {origin}")
    print("-" * 40)
    
    headers = {
        "Origin": origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, Authorization",
    }
    
    try:
        response = requests.options(
            f"{API_BASE}/login",
            headers=headers,
            timeout=5,
            allow_redirects=False
        )
        
        cors_allow_origin = response.headers.get("Access-Control-Allow-Origin", "NOT SET")
        cors_allow_methods = response.headers.get("Access-Control-Allow-Methods", "NOT SET")
        cors_allow_headers = response.headers.get("Access-Control-Allow-Headers", "NOT SET")
        
        print(f"  Status: {response.status_code}")
        print(f"  CORS Allow-Origin: {cors_allow_origin}")
        print(f"  CORS Allow-Methods: {cors_allow_methods}")
        print(f"  CORS Allow-Headers: {cors_allow_headers}")
        
        if cors_allow_origin != "NOT SET" and origin in cors_allow_origin:
            print(f"  [OK] CORS Headers Present & Correct")
        else:
            print(f"  [FAIL] CORS Headers Missing or Incorrect")
            
    except Exception as e:
        print(f"  [FAIL] Request failed: {e}")

# Test 4: Actual API Request with CORS
print("\n[TEST 4] Actual API Request with CORS Headers")
print("-" * 80)

for origin in TEST_ORIGINS[:1]:  # Test first origin
    print(f"\nTesting: {origin}")
    print("-" * 40)
    
    headers = {
        "Origin": origin,
        "Content-Type": "application/json",
    }
    
    try:
        response = requests.get(
            f"{API_BASE}/society-profiles",
            headers=headers,
            timeout=5
        )
        
        print(f"  Status: {response.status_code}")
        print(f"  Content-Type: {response.headers.get('Content-Type', 'NOT SET')}")
        print(f"  CORS Allow-Origin: {response.headers.get('Access-Control-Allow-Origin', 'NOT SET')}")
        
        if response.status_code == 200:
            print(f"  [OK] Request successful")
        elif response.status_code == 401:
            print(f"  [INFO] Request needs authentication (expected)")
        elif response.status_code >= 500:
            print(f"  [FAIL] Server error")
            print(f"  Response: {response.text[:200]}")
        else:
            print(f"  Response: {response.text[:200]}")
            
    except Exception as e:
        print(f"  [FAIL] Request failed: {e}")

# Test 5: Check if backend has the new CORS code
print("\n[TEST 5] Backend Code Check")
print("-" * 80)
print("\nReading backend/app.py to verify CORS configuration...")

try:
    with open("backend/app.py", "r", encoding='utf-8') as f:
        content = f.read()
    
    checks = {
        "Has CORS import": "from flask_cors import CORS" in content,
        "Has wildcard pattern config": "*.vercel.app" in content or "vercel.app" in content,
        "Has localhost pattern": "localhost" in content,
        "Uses flask-cors": "CORS(app" in content,
    }
    
    for check, passed in checks.items():
        status = "[OK]" if passed else "[FAIL]"
        print(f"{status} {check}")
        
    if all(checks.values()):
        print("\n[OK] Backend code looks correct!")
    else:
        print("\n[FAIL] Backend code may be missing CORS configuration")
        
except Exception as e:
    print(f"[FAIL] Could not read backend/app.py: {e}")

# Summary
print("\n" + "=" * 80)
print("DIAGNOSTIC SUMMARY")
print("=" * 80)
print("""
If you see:
[OK] Backend is UP
[OK] CORS Allow-Origin headers present
  -> Issue is likely FRONTEND configuration or BROWSER CACHE

If you see:
[FAIL] Backend is DOWN
  -> Issue is BACKEND server not running or Render deployment failed

If you see:
[FAIL] CORS Allow-Origin headers missing
  -> Issue is BACKEND CORS code not updated or redeployed

NEXT STEPS:
1. If backend is UP but CORS fails: Redeploy on Render
2. If headers are missing: Push code changes and redeploy
3. If headers work but app fails: Clear browser cache & hard refresh (Ctrl+Shift+R)
""")
print("=" * 80)
