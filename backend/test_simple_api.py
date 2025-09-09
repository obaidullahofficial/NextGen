import requests
import json

def test_society_profiles_api():
    """Simple test to check if the society profiles API is working"""
    
    base_url = "http://localhost:5000/api"
    
    print("Testing Society Profiles API...")
    print("=" * 50)
    
    # Test GET all society profiles (public endpoint)
    print("\n1. Testing GET /api/society-profiles")
    try:
        response = requests.get(f"{base_url}/society-profiles")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("Response structure:")
            print(f"- Success: {result.get('success', 'N/A')}")
            print(f"- Count: {result.get('count', 'N/A')}")
            print(f"- Data type: {type(result.get('data', []))}")
            
            if result.get('data'):
                print(f"- First society sample:")
                first_society = result['data'][0] if result['data'] else {}
                print(f"  - ID: {first_society.get('_id', 'N/A')}")
                print(f"  - Name: {first_society.get('name', 'N/A')}")
                print(f"  - Location: {first_society.get('location', 'N/A')}")
                print(f"  - Total Plots: {first_society.get('totalPlots', 'N/A')}")
                print(f"  - Available Plots: {first_society.get('availablePlots', 'N/A')}")
                print(f"  - Is Complete: {first_society.get('is_complete', 'N/A')}")
            else:
                print("- No societies found")
        else:
            print(f"Error: {response.text}")
    
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to server. Is the Flask app running?")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n" + "=" * 50)
    print("API Test Completed")

if __name__ == "__main__":
    test_society_profiles_api()
