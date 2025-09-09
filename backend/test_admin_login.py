import requests
import json

def test_admin_login():
    print('=== Testing Admin Login ===')
    
    url = 'http://localhost:5000/api/login'
    data = {
        'email': 'admin@example.com',
        'password': 'Admin#123'
    }
    
    try:
        response = requests.post(url, 
            headers={'Content-Type': 'application/json'},
            json=data,
            timeout=10
        )
        
        print(f'Status Code: {response.status_code}')
        print(f'Response Headers: {dict(response.headers)}')
        
        if response.status_code == 200:
            result = response.json()
            print('\n=== SUCCESS RESPONSE ===')
            print(json.dumps(result, indent=2))
            
            # Check specific fields the frontend expects
            print('\n=== FRONTEND EXPECTED FIELDS ===')
            print(f'success: {result.get("success")}')
            print(f'access_token: {"YES" if result.get("access_token") else "NO"}')
            print(f'is_admin: {result.get("is_admin")}')
            print(f'role: {result.get("role")}')
            print(f'user.is_admin: {result.get("user", {}).get("is_admin")}')
            print(f'user.role: {result.get("user", {}).get("role")}')
            
        else:
            print('\n=== ERROR RESPONSE ===')
            print(f'Response Text: {response.text}')
            
    except Exception as e:
        print(f'Request failed: {e}')

if __name__ == '__main__':
    test_admin_login()
