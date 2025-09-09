"""
Complete CRUD Test Suite for Users API
======================================

This script tests all CRUD operations for the /api/users endpoint:
- CREATE: POST /api/register (admin only)
- READ: GET /api/users (get all)
- READ: GET /api/users/<id> (get specific user)
- UPDATE: PUT /api/users/<id> (update user)
- DELETE: DELETE /api/users/<id> (delete user)
- SEARCH: GET /api/users/search (search users)
- STATS: GET /api/users/stats (get statistics)
- BULK DELETE: DELETE /api/users/bulk-delete (delete multiple)

Prerequisites:
- Backend server running on http://localhost:5000
- Admin user credentials for authentication
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5000/api"

class UserCRUDTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.headers = {
            'Content-Type': 'application/json'
        }
        
    def login_admin(self, email="admin@example.com", password="Admin#123"):
        """Login as admin to get authentication token"""
        print("\n🔐 === ADMIN LOGIN ===")
        
        login_data = {
            "email": email,
            "password": password
        }
        
        response = requests.post(f"{self.base_url}/login", 
                               json=login_data, 
                               headers=self.headers)
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get('access_token')
            self.headers['Authorization'] = f'Bearer {self.token}'
            print(f"✅ Admin login successful!")
            print(f"Token: {self.token[:50]}...")
            return True
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    
    def test_create_user(self):
        """Test CREATE operation - POST /api/register"""
        print("\n📝 === CREATE USER TEST ===")
        
        user_data = {
            "username": f"testuser_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "email": f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com",
            "password": "testpass123",
            "role": "user"
        }
        
        response = requests.post(f"{self.base_url}/register", 
                               json=user_data, 
                               headers=self.headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ User created successfully: {data.get('user_id')}")
            return data.get('user_id')
        else:
            print(f"❌ Failed to create user")
            return None
    
    def test_get_all_users(self):
        """Test READ operation - GET /api/users"""
        print("\n📋 === GET ALL USERS TEST ===")
        
        response = requests.get(f"{self.base_url}/users", 
                              headers=self.headers)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Retrieved {data.get('total_count')} users")
            print(f"Sample users: {json.dumps(data.get('users', [])[:2], indent=2)}")
            return data.get('users', [])
        else:
            print(f"❌ Failed to get users: {response.text}")
            return []
    
    def test_get_user_by_id(self, user_id):
        """Test READ operation - GET /api/users/<id>"""
        print(f"\n👤 === GET USER BY ID TEST ({user_id}) ===")
        
        response = requests.get(f"{self.base_url}/users/{user_id}", 
                              headers=self.headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print(f"✅ User retrieved successfully")
            return response.json().get('user')
        else:
            print(f"❌ Failed to get user")
            return None
    
    def test_update_user(self, user_id):
        """Test UPDATE operation - PUT /api/users/<id>"""
        print(f"\n✏️ === UPDATE USER TEST ({user_id}) ===")
        
        update_data = {
            "username": f"updated_user_{datetime.now().strftime('%H%M%S')}",
            "role": "society"
        }
        
        response = requests.put(f"{self.base_url}/users/{user_id}", 
                              json=update_data, 
                              headers=self.headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print(f"✅ User updated successfully")
            return True
        else:
            print(f"❌ Failed to update user")
            return False
    
    def test_search_users(self):
        """Test SEARCH operation - GET /api/users/search"""
        print("\n🔍 === SEARCH USERS TEST ===")
        
        # Test search by username
        response = requests.get(f"{self.base_url}/users/search?q=test&page=1&limit=5", 
                              headers=self.headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Search successful: Found {len(data.get('users', []))} users")
            return True
        else:
            print(f"❌ Search failed")
            return False
    
    def test_user_stats(self):
        """Test STATS operation - GET /api/users/stats"""
        print("\n📊 === USER STATISTICS TEST ===")
        
        response = requests.get(f"{self.base_url}/users/stats", 
                              headers=self.headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print(f"✅ Statistics retrieved successfully")
            return True
        else:
            print(f"❌ Failed to get statistics")
            return False
    
    def test_delete_user(self, user_id):
        """Test DELETE operation - DELETE /api/users/<id>"""
        print(f"\n🗑️ === DELETE USER TEST ({user_id}) ===")
        
        response = requests.delete(f"{self.base_url}/users/{user_id}", 
                                 headers=self.headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print(f"✅ User deleted successfully")
            return True
        else:
            print(f"❌ Failed to delete user")
            return False
    
    def test_bulk_delete(self, user_ids):
        """Test BULK DELETE operation - DELETE /api/users/bulk-delete"""
        print(f"\n🗑️ === BULK DELETE TEST ===")
        
        delete_data = {
            "user_ids": user_ids[:2]  # Only delete first 2 for safety
        }
        
        response = requests.delete(f"{self.base_url}/users/bulk-delete", 
                                 json=delete_data,
                                 headers=self.headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Bulk delete successful: {data.get('deleted_count')} users deleted")
            return True
        else:
            print(f"❌ Bulk delete failed")
            return False
    
    def run_complete_test_suite(self):
        """Run all CRUD tests in sequence"""
        print("🚀 === STARTING COMPLETE CRUD TEST SUITE ===")
        print(f"Base URL: {self.base_url}")
        print(f"Time: {datetime.now()}")
        
        # Step 1: Login as admin
        if not self.login_admin():
            print("❌ Cannot proceed without admin login")
            return
        
        # Step 2: Get initial user list
        initial_users = self.test_get_all_users()
        initial_user_ids = [user['_id'] for user in initial_users]
        
        # Step 3: Create a new user
        new_user_id = self.test_create_user()
        
        # Step 4: Get user by ID
        if new_user_id:
            self.test_get_user_by_id(new_user_id)
        
        # Step 5: Update the user
        if new_user_id:
            self.test_update_user(new_user_id)
        
        # Step 6: Search users
        self.test_search_users()
        
        # Step 7: Get user statistics
        self.test_user_stats()
        
        # Step 8: Get updated user list
        updated_users = self.test_get_all_users()
        
        # Step 9: Test individual delete
        if new_user_id:
            self.test_delete_user(new_user_id)
        
        # Step 10: Test bulk delete (only if there are users to delete safely)
        if len(initial_user_ids) > 3:  # Only if we have enough users
            print("\n⚠️ Skipping bulk delete test for safety (requires manual confirmation)")
            # self.test_bulk_delete(initial_user_ids)
        
        print("\n✅ === COMPLETE CRUD TEST SUITE FINISHED ===")
        print(f"Time: {datetime.now()}")

def main():
    """Main function to run the tests"""
    tester = UserCRUDTester()
    
    print("CRUD API Test Suite for Users")
    print("=" * 50)
    print("This will test all CRUD operations for the users API.")
    print("Make sure the backend server is running on http://localhost:5000")
    print()
    
    # Ask for confirmation
    proceed = input("Do you want to proceed with the tests? (y/n): ").lower().strip()
    
    if proceed == 'y':
        tester.run_complete_test_suite()
    else:
        print("Tests cancelled.")

if __name__ == "__main__":
    main()
