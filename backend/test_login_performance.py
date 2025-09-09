"""
Login Performance Test
======================

This script tests the login endpoint performance to measure 
improvements made to the authentication process.
"""

import requests
import time
from statistics import mean, median

BASE_URL = "http://localhost:5000/api"

def test_login_performance(email="admin@example.com", password="Admin#123", num_tests=10):
    """Test login performance multiple times and calculate statistics"""
    
    print(f"🚀 Testing login performance for {email}")
    print(f"Running {num_tests} login attempts...")
    print("-" * 50)
    
    times = []
    successful_logins = 0
    
    for i in range(num_tests):
        start_time = time.time()
        
        try:
            response = requests.post(f"{BASE_URL}/login", json={
                "email": email,
                "password": password
            })
            
            end_time = time.time()
            response_time = end_time - start_time
            times.append(response_time)
            
            if response.status_code == 200:
                successful_logins += 1
                status = "✅ SUCCESS"
            else:
                status = f"❌ FAILED ({response.status_code})"
            
            print(f"Test {i+1:2d}: {response_time:.3f}s - {status}")
            
        except Exception as e:
            end_time = time.time()
            response_time = end_time - start_time
            times.append(response_time)
            print(f"Test {i+1:2d}: {response_time:.3f}s - ❌ ERROR: {str(e)}")
        
        # Small delay between requests
        time.sleep(0.1)
    
    print("-" * 50)
    print(f"📊 PERFORMANCE STATISTICS")
    print(f"Successful logins: {successful_logins}/{num_tests}")
    print(f"Success rate: {(successful_logins/num_tests)*100:.1f}%")
    
    if times:
        print(f"Average time: {mean(times):.3f}s")
        print(f"Median time: {median(times):.3f}s")
        print(f"Fastest: {min(times):.3f}s")
        print(f"Slowest: {max(times):.3f}s")
        
        # Performance rating
        avg_time = mean(times)
        if avg_time < 0.1:
            rating = "🟢 EXCELLENT"
        elif avg_time < 0.3:
            rating = "🟡 GOOD"
        elif avg_time < 0.5:
            rating = "🟠 ACCEPTABLE"
        else:
            rating = "🔴 SLOW"
        
        print(f"Performance: {rating}")
    else:
        print("❌ No response times recorded")

def test_invalid_login_performance():
    """Test performance with invalid credentials"""
    print("\n🔒 Testing invalid login performance...")
    
    start_time = time.time()
    try:
        response = requests.post(f"{BASE_URL}/login", json={
            "email": "invalid@example.com",
            "password": "wrongpassword"
        })
        end_time = time.time()
        response_time = end_time - start_time
        
        print(f"Invalid login response time: {response_time:.3f}s")
        print(f"Status: {response.status_code}")
        
        if response_time < 0.2:
            print("✅ Good - Fast rejection of invalid credentials")
        else:
            print("⚠️ Slow - Consider optimizing invalid login handling")
            
    except Exception as e:
        print(f"❌ Error testing invalid login: {e}")

def main():
    print("Login Performance Test Suite")
    print("=" * 50)
    print("Testing optimized login endpoint performance")
    print("Make sure backend server is running on http://localhost:5000")
    print()
    
    # Test valid login performance
    test_login_performance()
    
    # Test invalid login performance
    test_invalid_login_performance()
    
    print("\n🎯 OPTIMIZATION TIPS:")
    print("- Target: <100ms for excellent performance")
    print("- <300ms is good for web applications")
    print("- Consider caching for frequently accessed data")
    print("- Use database indexes for email lookups")
    print("- Minimize database queries per request")

if __name__ == "__main__":
    main()
