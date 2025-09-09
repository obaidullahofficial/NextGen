import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:5000/api"

# Test credentials (you'll need to login first to get a token)
def get_admin_token():
    """Login as admin to get JWT token"""
    login_url = f"{BASE_URL}/login"
    login_data = {
        "email": "admin@example.com",  # Replace with actual admin email
        "password": "Admin#123"  # Replace with actual admin password
    }
    
    try:
        response = requests.post(login_url, json=login_data)
        if response.status_code == 200:
            result = response.json()
            return result.get('access_token')
        else:
            print(f"Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def test_crud_operations():
    """Test all CRUD operations for society profiles"""
    
    print("=" * 60)
    print("TESTING SOCIETY PROFILES CRUD OPERATIONS")
    print("=" * 60)
    
    # Get admin token
    print("\n1. Getting admin token...")
    token = get_admin_token()
    if not token:
        print("Failed to get admin token. Cannot proceed with CRUD tests.")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Test 1: READ - Get all society profiles
    print("\n2. Testing READ - Get all society profiles...")
    try:
        response = requests.get(f"{BASE_URL}/society-profiles")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"Success: Found {result.get('count', 0)} society profiles")
                # Print first profile as sample
                if result.get('data') and len(result['data']) > 0:
                    sample_profile = result['data'][0]
                    print(f"Sample Profile: {sample_profile.get('name')} - {sample_profile.get('_id')}")
            else:
                print(f"API returned error: {result}")
        else:
            print(f"Failed to get profiles: {response.text}")
    except Exception as e:
        print(f"Error getting profiles: {e}")
    
    # Test 2: CREATE - Create a new society profile
    print("\n3. Testing CREATE - Create new society profile...")
    new_society_data = {
        "name": "Test Housing Society",
        "user_email": "society@example.com",  # Replace with existing user email
        "description": "A test housing society for CRUD operations",
        "location": "Test City",
        "available_plots": "50",
        "price_range": "5-10 Lac",
        "society_logo": ""
    }
    
    try:
        response = requests.post(f"{BASE_URL}/society-profiles", json=new_society_data, headers=headers)
        print(f"Status Code: {response.status_code}")
        created_society = None
        
        if response.status_code == 201:
            result = response.json()
            if result.get('success'):
                created_society = result.get('data')
                print(f"Success: Created society with ID: {created_society.get('_id')}")
                print(f"Society Name: {created_society.get('name')}")
            else:
                print(f"API returned error: {result}")
        else:
            print(f"Failed to create society: {response.text}")
            return
    except Exception as e:
        print(f"Error creating society: {e}")
        return
    
    if not created_society:
        print("Failed to create society. Cannot proceed with UPDATE and DELETE tests.")
        return
    
    society_id = created_society.get('_id')
    
    # Test 3: READ - Get single society profile by ID
    print(f"\n4. Testing READ - Get society profile by ID ({society_id})...")
    try:
        response = requests.get(f"{BASE_URL}/society-profiles/{society_id}")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                profile = result.get('data')
                print(f"Success: Retrieved society '{profile.get('name')}'")
                print(f"Location: {profile.get('location')}")
                print(f"Total Plots: {profile.get('totalPlots', 0)}")
                print(f"Available Plots: {profile.get('availablePlots', 0)}")
            else:
                print(f"API returned error: {result}")
        else:
            print(f"Failed to get society: {response.text}")
    except Exception as e:
        print(f"Error getting society: {e}")
    
    # Test 4: UPDATE - Update the society profile
    print(f"\n5. Testing UPDATE - Update society profile ({society_id})...")
    update_data = {
        "description": "Updated description for test housing society",
        "location": "Updated Test City",
        "price_range": "10-15 Lac",
        "available_plots": "75"
    }
    
    try:
        response = requests.put(f"{BASE_URL}/society-profiles/{society_id}", json=update_data, headers=headers)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                updated_society = result.get('data')
                print(f"Success: Updated society '{updated_society.get('name')}'")
                print(f"New Location: {updated_society.get('location')}")
                print(f"New Price Range: {updated_society.get('price_range')}")
                print(f"Is Complete: {updated_society.get('is_complete')}")
            else:
                print(f"API returned error: {result}")
        else:
            print(f"Failed to update society: {response.text}")
    except Exception as e:
        print(f"Error updating society: {e}")
    
    # Test 5: DELETE - Delete the society profile
    print(f"\n6. Testing DELETE - Delete society profile ({society_id})...")
    try:
        response = requests.delete(f"{BASE_URL}/society-profiles/{society_id}", headers=headers)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"Success: Deleted society")
                print(f"Deleted Profile: {result.get('deleted_profile')}")
            else:
                print(f"API returned error: {result}")
        else:
            print(f"Failed to delete society: {response.text}")
    except Exception as e:
        print(f"Error deleting society: {e}")
    
    # Test 6: Verify deletion - Try to get the deleted society
    print(f"\n7. Testing VERIFICATION - Verify society deletion...")
    try:
        response = requests.get(f"{BASE_URL}/society-profiles/{society_id}")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 404:
            print("Success: Society was successfully deleted (404 Not Found)")
        else:
            print(f"Unexpected result: {response.text}")
    except Exception as e:
        print(f"Error verifying deletion: {e}")
    
    print("\n" + "=" * 60)
    print("CRUD OPERATIONS TEST COMPLETED")
    print("=" * 60)

if __name__ == "__main__":
    test_crud_operations()
