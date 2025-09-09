"""
Manual CRUD Testing Guide for Users API
=======================================

Use this script to manually test individual CRUD operations.
Backend server must be running on http://localhost:5000

Admin Credentials:
- Email: admin@example.com
- Password: Admin#123
"""

import requests
import json

BASE_URL = "http://localhost:5000/api"

def get_admin_token():
    """Get admin authentication token"""
    print("🔐 Getting admin token...")
    
    login_data = {
        "email": "admin@example.com",
        "password": "Admin#123"
    }
    
    response = requests.post(f"{BASE_URL}/login", json=login_data)
    
    if response.status_code == 200:
        token = response.json().get('access_token')
        print(f"✅ Token obtained: {token[:50]}...")
        return token
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(f"Response: {response.text}")
        return None

def test_individual_operations():
    """Test individual CRUD operations one by one"""
    
    # Get admin token
    token = get_admin_token()
    if not token:
        print("Cannot proceed without admin token")
        return
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    
    print("\n" + "="*50)
    print("MANUAL CRUD TESTING MENU")
    print("="*50)
    
    while True:
        print("\nChoose an operation:")
        print("1. 📋 GET all users")
        print("2. 👤 GET user by ID")
        print("3. 📝 CREATE new user")
        print("4. ✏️  UPDATE user")
        print("5. 🗑️  DELETE user")
        print("6. 🔍 SEARCH users")
        print("7. 📊 GET user statistics")
        print("8. 🔄 BULK DELETE users")
        print("0. ❌ Exit")
        
        choice = input("\nEnter choice (0-8): ").strip()
        
        if choice == "0":
            print("Goodbye!")
            break
        elif choice == "1":
            test_get_all_users(headers)
        elif choice == "2":
            test_get_user_by_id(headers)
        elif choice == "3":
            test_create_user(headers)
        elif choice == "4":
            test_update_user(headers)
        elif choice == "5":
            test_delete_user(headers)
        elif choice == "6":
            test_search_users(headers)
        elif choice == "7":
            test_user_stats(headers)
        elif choice == "8":
            test_bulk_delete(headers)
        else:
            print("Invalid choice. Please try again.")

def test_get_all_users(headers):
    """Test GET /api/users"""
    print("\n📋 Testing GET all users...")
    
    response = requests.get(f"{BASE_URL}/users", headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Found {data.get('total_count')} users")
        
        # Show first 3 users
        users = data.get('users', [])[:3]
        for user in users:
            print(f"  - {user['username']} ({user['email']}) - {user['role']}")
    else:
        print(f"❌ Error: {response.text}")

def test_get_user_by_id(headers):
    """Test GET /api/users/<id>"""
    print("\n👤 Testing GET user by ID...")
    
    user_id = input("Enter user ID: ").strip()
    if not user_id:
        print("❌ User ID required")
        return
    
    response = requests.get(f"{BASE_URL}/users/{user_id}", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_create_user(headers):
    """Test POST /api/register"""
    print("\n📝 Testing CREATE user...")
    
    username = input("Enter username: ").strip()
    email = input("Enter email: ").strip()
    password = input("Enter password: ").strip()
    role = input("Enter role (user/society/admin): ").strip() or "user"
    
    if not all([username, email, password]):
        print("❌ All fields required")
        return
    
    user_data = {
        "username": username,
        "email": email,
        "password": password,
        "role": role
    }
    
    response = requests.post(f"{BASE_URL}/register", json=user_data, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_update_user(headers):
    """Test PUT /api/users/<id>"""
    print("\n✏️ Testing UPDATE user...")
    
    user_id = input("Enter user ID to update: ").strip()
    if not user_id:
        print("❌ User ID required")
        return
    
    print("Enter new values (press Enter to skip):")
    username = input("New username: ").strip()
    email = input("New email: ").strip()
    password = input("New password: ").strip()
    role = input("New role (user/society/admin): ").strip()
    
    update_data = {}
    if username: update_data['username'] = username
    if email: update_data['email'] = email
    if password: update_data['password'] = password
    if role: update_data['role'] = role
    
    if not update_data:
        print("❌ No fields to update")
        return
    
    response = requests.put(f"{BASE_URL}/users/{user_id}", json=update_data, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_delete_user(headers):
    """Test DELETE /api/users/<id>"""
    print("\n🗑️ Testing DELETE user...")
    
    user_id = input("Enter user ID to delete: ").strip()
    if not user_id:
        print("❌ User ID required")
        return
    
    confirm = input(f"Are you sure you want to delete user {user_id}? (yes/no): ").strip().lower()
    if confirm != 'yes':
        print("Delete cancelled")
        return
    
    response = requests.delete(f"{BASE_URL}/users/{user_id}", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_search_users(headers):
    """Test GET /api/users/search"""
    print("\n🔍 Testing SEARCH users...")
    
    query = input("Enter search term (username/email): ").strip()
    role = input("Filter by role (admin/society/user, or Enter for all): ").strip()
    page = input("Page number (default 1): ").strip() or "1"
    limit = input("Results per page (default 10): ").strip() or "10"
    
    params = {
        'page': page,
        'limit': limit
    }
    if query: params['q'] = query
    if role: params['role'] = role
    
    response = requests.get(f"{BASE_URL}/users/search", params=params, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_user_stats(headers):
    """Test GET /api/users/stats"""
    print("\n📊 Testing GET user statistics...")
    
    response = requests.get(f"{BASE_URL}/users/stats", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_bulk_delete(headers):
    """Test DELETE /api/users/bulk-delete"""
    print("\n🔄 Testing BULK DELETE users...")
    
    user_ids = input("Enter user IDs (comma-separated): ").strip()
    if not user_ids:
        print("❌ User IDs required")
        return
    
    user_id_list = [uid.strip() for uid in user_ids.split(',')]
    
    confirm = input(f"Are you sure you want to delete {len(user_id_list)} users? (yes/no): ").strip().lower()
    if confirm != 'yes':
        print("Bulk delete cancelled")
        return
    
    delete_data = {"user_ids": user_id_list}
    
    response = requests.delete(f"{BASE_URL}/users/bulk-delete", json=delete_data, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

if __name__ == "__main__":
    print("Manual CRUD Testing Tool")
    print("Make sure backend server is running on http://localhost:5000")
    print()
    
    test_individual_operations()
