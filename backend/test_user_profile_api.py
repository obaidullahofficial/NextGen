#!/usr/bin/env python3
"""
Test script for User Profile API endpoints
Run this script to test all the user profile CRUD operations
"""

import requests
import json
import os
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:5000/api"
TEST_USER_EMAIL = "test@example.com"  # Replace with a valid user email
TEST_USER_PASSWORD = "password123"    # Replace with the actual password

class UserProfileAPITest:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.user_id = None
        
    def authenticate(self):
        """Authenticate user and get JWT token"""
        print("🔐 Authenticating user...")
        
        # First, try to login (assuming login endpoint exists)
        login_data = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        
        try:
            response = self.session.post(f"{API_BASE_URL}/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data:
                    self.token = data['access_token']
                    self.session.headers.update({'Authorization': f'Bearer {self.token}'})
                    print("✅ Authentication successful!")
                    return True
                else:
                    print("❌ No access token in response")
                    return False
            else:
                print(f"❌ Login failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Authentication error: {str(e)}")
            return False
    
    def test_get_profile(self):
        """Test GET /profile endpoint"""
        print("\n📋 Testing GET /profile...")
        
        try:
            response = self.session.get(f"{API_BASE_URL}/profile")
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Profile retrieved successfully!")
                print(json.dumps(data, indent=2))
                return data
            else:
                print(f"❌ Failed to get profile: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Error getting profile: {str(e)}")
            return None
    
    def test_create_profile(self):
        """Test POST /profile endpoint"""
        print("\n📝 Testing POST /profile...")
        
        try:
            # Prepare test data
            profile_data = {
                'firstName': 'Test',
                'lastName': 'User',
                'cnic': '1234567890123',
                'phone': '+92 300 1234567',
                'email': TEST_USER_EMAIL
            }
            
            response = self.session.post(f"{API_BASE_URL}/profile", data=profile_data)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Profile created/updated successfully!")
                print(json.dumps(data, indent=2))
                return data
            else:
                print(f"❌ Failed to create profile: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Error creating profile: {str(e)}")
            return None
    
    def test_approval_request(self):
        """Test POST /approval-requests endpoint"""
        print("\n📤 Testing POST /approval-requests...")
        
        try:
            # Prepare test data
            request_data = {
                'plotId': 'PL-TEST-001',
                'plotDetails': 'Test Plot for API Testing',
                'area': '10 Marla',
                'designType': 'Modern 3-Bedroom',
                'notes': 'This is a test approval request'
            }
            
            response = self.session.post(f"{API_BASE_URL}/approval-requests", data=request_data)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 201:
                data = response.json()
                print("✅ Approval request created successfully!")
                print(json.dumps(data, indent=2))
                return data
            else:
                print(f"❌ Failed to create approval request: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Error creating approval request: {str(e)}")
            return None
    
    def test_get_approval_requests(self):
        """Test GET /approval-requests endpoint"""
        print("\n📋 Testing GET /approval-requests...")
        
        try:
            response = self.session.get(f"{API_BASE_URL}/approval-requests")
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Approval requests retrieved successfully!")
                print(f"Total requests: {data.get('total', 0)}")
                print(json.dumps(data, indent=2))
                return data
            else:
                print(f"❌ Failed to get approval requests: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Error getting approval requests: {str(e)}")
            return None
    
    def test_get_activities(self):
        """Test GET /activities endpoint"""
        print("\n📊 Testing GET /activities...")
        
        try:
            response = self.session.get(f"{API_BASE_URL}/activities?limit=10")
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Activities retrieved successfully!")
                print(f"Total activities: {data.get('total', 0)}")
                print(json.dumps(data, indent=2))
                return data
            else:
                print(f"❌ Failed to get activities: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Error getting activities: {str(e)}")
            return None
    
    def test_get_progress(self):
        """Test GET /progress endpoint"""
        print("\n📈 Testing GET /progress...")
        
        try:
            response = self.session.get(f"{API_BASE_URL}/progress")
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Progress retrieved successfully!")
                print(json.dumps(data, indent=2))
                return data
            else:
                print(f"❌ Failed to get progress: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Error getting progress: {str(e)}")
            return None
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting User Profile API Tests")
        print("=" * 50)
        
        # Authenticate first
        if not self.authenticate():
            print("❌ Authentication failed. Cannot continue with tests.")
            return
        
        # Run all tests
        tests = [
            self.test_get_profile,
            self.test_create_profile,
            self.test_get_profile,  # Get profile again to see updates
            self.test_approval_request,
            self.test_get_approval_requests,
            self.test_get_activities,
            self.test_get_progress
        ]
        
        results = []
        for test in tests:
            try:
                result = test()
                results.append(result is not None)
            except Exception as e:
                print(f"❌ Test failed with exception: {str(e)}")
                results.append(False)
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 Test Summary:")
        passed = sum(results)
        total = len(results)
        print(f"✅ Passed: {passed}/{total}")
        print(f"❌ Failed: {total - passed}/{total}")
        
        if passed == total:
            print("🎉 All tests passed!")
        else:
            print("⚠️  Some tests failed. Check the output above for details.")

def main():
    """Main function"""
    print("User Profile API Test Script")
    print("Make sure the backend server is running on http://localhost:5000")
    print(f"Using test user: {TEST_USER_EMAIL}")
    
    input("Press Enter to continue...")
    
    tester = UserProfileAPITest()
    tester.run_all_tests()

if __name__ == "__main__":
    main()