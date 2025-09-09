#!/usr/bin/env python3
"""
Test script for Review CRUD API
Tests all review endpoints without requiring frontend
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000/api"
TEST_USER_EMAIL = "testuser@example.com"
TEST_USER_PASSWORD = "testpassword123"
TEST_PLOT_ID = "test_plot_123"

class ReviewAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.test_review_id = None
        
    def login(self):
        """Login to get JWT token"""
        print("🔐 Logging in...")
        url = f"{self.base_url}/login"
        data = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        
        try:
            response = requests.post(url, json=data)
            if response.status_code == 200:
                result = response.json()
                self.token = result.get('access_token')
                print(f"✅ Login successful! Token: {self.token[:20]}...")
                return True
            else:
                print(f"❌ Login failed: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return False
    
    def get_headers(self):
        """Get headers with authorization"""
        if not self.token:
            return {'Content-Type': 'application/json'}
        return {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.token}'
        }
    
    def test_create_review(self):
        """Test CREATE - POST /api/reviews"""
        print("\n📝 Testing CREATE Review...")
        url = f"{self.base_url}/reviews"
        data = {
            "plot_id": TEST_PLOT_ID,
            "rating": 4.5,
            "comment": "Great plot with excellent location and amenities!"
        }
        
        try:
            response = requests.post(url, json=data, headers=self.get_headers())
            print(f"Status Code: {response.status_code}")
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")
            
            if response.status_code == 201 and result.get('success'):
                self.test_review_id = result['data']['_id']
                print(f"✅ Review created successfully! ID: {self.test_review_id}")
                return True
            else:
                print(f"❌ Create review failed: {result}")
                return False
        except Exception as e:
            print(f"❌ Create review error: {str(e)}")
            return False
    
    def test_get_all_reviews(self):
        """Test READ - GET /api/reviews"""
        print("\n📖 Testing GET All Reviews...")
        url = f"{self.base_url}/reviews"
        params = {
            "page": 1,
            "per_page": 5
        }
        
        try:
            response = requests.get(url, params=params)
            print(f"Status Code: {response.status_code}")
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")
            
            if response.status_code == 200 and result.get('success'):
                print(f"✅ Retrieved {len(result['data'])} reviews")
                return True
            else:
                print(f"❌ Get all reviews failed: {result}")
                return False
        except Exception as e:
            print(f"❌ Get all reviews error: {str(e)}")
            return False
    
    def test_get_review_by_id(self):
        """Test READ - GET /api/reviews/<id>"""
        if not self.test_review_id:
            print("⚠️ Skipping get by ID test - no review ID available")
            return False
            
        print(f"\n🔍 Testing GET Review by ID: {self.test_review_id}")
        url = f"{self.base_url}/reviews/{self.test_review_id}"
        
        try:
            response = requests.get(url)
            print(f"Status Code: {response.status_code}")
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")
            
            if response.status_code == 200 and result.get('success'):
                print("✅ Review retrieved successfully!")
                return True
            else:
                print(f"❌ Get review by ID failed: {result}")
                return False
        except Exception as e:
            print(f"❌ Get review by ID error: {str(e)}")
            return False
    
    def test_get_reviews_by_plot(self):
        """Test READ - GET /api/plots/<plot_id>/reviews"""
        print(f"\n🏘️ Testing GET Reviews by Plot: {TEST_PLOT_ID}")
        url = f"{self.base_url}/plots/{TEST_PLOT_ID}/reviews"
        
        try:
            response = requests.get(url)
            print(f"Status Code: {response.status_code}")
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")
            
            if response.status_code == 200 and result.get('success'):
                print("✅ Plot reviews retrieved successfully!")
                return True
            else:
                print(f"❌ Get reviews by plot failed: {result}")
                return False
        except Exception as e:
            print(f"❌ Get reviews by plot error: {str(e)}")
            return False
    
    def test_get_reviews_by_user(self):
        """Test READ - GET /api/users/<user_email>/reviews"""
        print(f"\n👤 Testing GET Reviews by User: {TEST_USER_EMAIL}")
        url = f"{self.base_url}/users/{TEST_USER_EMAIL}/reviews"
        
        try:
            response = requests.get(url)
            print(f"Status Code: {response.status_code}")
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")
            
            if response.status_code == 200 and result.get('success'):
                print("✅ User reviews retrieved successfully!")
                return True
            else:
                print(f"❌ Get reviews by user failed: {result}")
                return False
        except Exception as e:
            print(f"❌ Get reviews by user error: {str(e)}")
            return False
    
    def test_update_review(self):
        """Test UPDATE - PUT /api/reviews/<id>"""
        if not self.test_review_id:
            print("⚠️ Skipping update test - no review ID available")
            return False
            
        print(f"\n✏️ Testing UPDATE Review: {self.test_review_id}")
        url = f"{self.base_url}/reviews/{self.test_review_id}"
        data = {
            "rating": 5.0,
            "comment": "Updated: Absolutely fantastic plot! Highly recommended!"
        }
        
        try:
            response = requests.put(url, json=data, headers=self.get_headers())
            print(f"Status Code: {response.status_code}")
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")
            
            if response.status_code == 200 and result.get('success'):
                print("✅ Review updated successfully!")
                return True
            else:
                print(f"❌ Update review failed: {result}")
                return False
        except Exception as e:
            print(f"❌ Update review error: {str(e)}")
            return False
    
    def test_get_plot_stats(self):
        """Test ANALYTICS - GET /api/plots/<plot_id>/reviews/stats"""
        print(f"\n📊 Testing GET Plot Review Stats: {TEST_PLOT_ID}")
        url = f"{self.base_url}/plots/{TEST_PLOT_ID}/reviews/stats"
        
        try:
            response = requests.get(url)
            print(f"Status Code: {response.status_code}")
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")
            
            if response.status_code == 200 and result.get('success'):
                print("✅ Plot review statistics retrieved successfully!")
                return True
            else:
                print(f"❌ Get plot stats failed: {result}")
                return False
        except Exception as e:
            print(f"❌ Get plot stats error: {str(e)}")
            return False
    
    def test_delete_review(self):
        """Test DELETE - DELETE /api/reviews/<id>"""
        if not self.test_review_id:
            print("⚠️ Skipping delete test - no review ID available")
            return False
            
        print(f"\n🗑️ Testing DELETE Review: {self.test_review_id}")
        url = f"{self.base_url}/reviews/{self.test_review_id}"
        
        try:
            response = requests.delete(url, headers=self.get_headers())
            print(f"Status Code: {response.status_code}")
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")
            
            if response.status_code == 200 and result.get('success'):
                print("✅ Review deleted successfully!")
                return True
            else:
                print(f"❌ Delete review failed: {result}")
                return False
        except Exception as e:
            print(f"❌ Delete review error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all CRUD tests"""
        print("🚀 Starting Review API CRUD Tests")
        print("=" * 50)
        
        # Note: Login might fail if user doesn't exist, but we'll continue with other tests
        login_success = self.login()
        
        results = []
        
        # Test all CRUD operations
        results.append(("CREATE Review", self.test_create_review()))
        results.append(("GET All Reviews", self.test_get_all_reviews()))
        results.append(("GET Review by ID", self.test_get_review_by_id()))
        results.append(("GET Reviews by Plot", self.test_get_reviews_by_plot()))
        results.append(("GET Reviews by User", self.test_get_reviews_by_user()))
        results.append(("UPDATE Review", self.test_update_review()))
        results.append(("GET Plot Stats", self.test_get_plot_stats()))
        results.append(("DELETE Review", self.test_delete_review()))
        
        # Print summary
        print("\n" + "=" * 50)
        print("📋 TEST SUMMARY")
        print("=" * 50)
        
        passed = 0
        total = len(results)
        
        for test_name, success in results:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"{test_name:<25} {status}")
            if success:
                passed += 1
        
        print("-" * 50)
        print(f"Total: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed!")
        else:
            print("⚠️ Some tests failed. Check the API implementation.")
        
        return passed == total

def main():
    """Main function"""
    print("Review API CRUD Tester")
    print("Make sure the Flask server is running on http://localhost:5000")
    print()
    
    tester = ReviewAPITester()
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
