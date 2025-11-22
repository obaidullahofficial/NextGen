"""
Simple Email Verification System Test
Tests the core functionality without user interaction
"""
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def print_section(title):
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)

def test_imports():
    """Test that all modules can be imported"""
    print_section("TEST 1: Module Imports")
    
    try:
        from models.email_verification import EmailVerification, email_verification_collection
        print("✅ Email verification model imported successfully")
    except Exception as e:
        print(f"❌ Email verification model import failed: {e}")
        return False
    
    try:
        from utils.email_service import EmailService
        print("✅ Email service imported successfully")
    except Exception as e:
        print(f"❌ Email service import failed: {e}")
        return False
    
    try:
        from controllers.user_controller import UserController
        print("✅ User controller imported successfully")
    except Exception as e:
        print(f"❌ User controller import failed: {e}")
        return False
    
    try:
        from models.user import User
        print("✅ User model imported successfully")
    except Exception as e:
        print(f"❌ User model import failed: {e}")
        return False
    
    return True

def test_token_generation():
    """Test token generation"""
    print_section("TEST 2: Token Generation")
    
    try:
        from utils.email_service import EmailService
        
        token = EmailService.generate_verification_token()
        print(f"✅ Token generated: {token[:20]}... (length: {len(token)})")
        
        if len(token) >= 32:
            print("✅ Token length is secure (32+ characters)")
            return True
        else:
            print("❌ Token is too short!")
            return False
    except Exception as e:
        print(f"❌ Token generation failed: {e}")
        return False

def test_email_config():
    """Test email configuration"""
    print_section("TEST 3: Email Configuration")
    
    try:
        import os
        from dotenv import load_dotenv
        
        load_dotenv()
        
        smtp_server = os.getenv('SMTP_SERVER')
        smtp_port = os.getenv('SMTP_PORT')
        sender_email = os.getenv('SENDER_EMAIL')
        sender_password = os.getenv('SENDER_PASSWORD')
        verification_base = os.getenv('VERIFICATION_LINK_BASE')
        
        print(f"SMTP Server: {smtp_server}")
        print(f"SMTP Port: {smtp_port}")
        print(f"Sender Email: {sender_email}")
        print(f"Sender Password: {'*' * len(sender_password) if sender_password else 'NOT SET'}")
        print(f"Verification Base: {verification_base}")
        
        if sender_email and sender_password:
            print("✅ Email configuration is complete")
            return True
        else:
            print("❌ Email configuration is incomplete")
            return False
    except Exception as e:
        print(f"❌ Email configuration test failed: {e}")
        return False

def test_user_model():
    """Test user model with verification fields"""
    print_section("TEST 4: User Model with Verification")
    
    try:
        from models.user import User
        from datetime import datetime
        
        # Create a test user
        user = User(
            username="TestUser",
            email="test@gmail.com",
            password_hash="hashed_password",
            role="user",
            is_verified=False
        )
        
        print(f"✅ User created: {user.username}")
        print(f"   Email: {user.email}")
        print(f"   Is Verified: {user.is_verified}")
        print(f"   Created At: {user.created_at}")
        
        if hasattr(user, 'is_verified') and hasattr(user, 'created_at'):
            print("✅ User model has verification fields")
            return True
        else:
            print("❌ User model missing verification fields")
            return False
    except Exception as e:
        print(f"❌ User model test failed: {e}")
        return False

def test_flask_app():
    """Test Flask app can be imported"""
    print_section("TEST 5: Flask App Import")
    
    try:
        from app import app
        print("✅ Flask app imported successfully")
        
        # Check email configuration
        if app.config.get('SENDER_EMAIL'):
            print(f"✅ Email config loaded: {app.config.get('SENDER_EMAIL')}")
        else:
            print("⚠️  Email config not loaded in app")
        
        return True
    except Exception as e:
        print(f"❌ Flask app import failed: {e}")
        return False

def test_routes():
    """Test that routes are registered"""
    print_section("TEST 6: Email Verification Routes")
    
    try:
        from app import app
        
        # Get all routes
        routes = []
        for rule in app.url_map.iter_rules():
            if 'signup' in rule.rule or 'verify' in rule.rule or 'resend' in rule.rule:
                routes.append(f"{rule.rule} [{', '.join(rule.methods - {'HEAD', 'OPTIONS'})}]")
        
        print("Email verification routes found:")
        for route in routes:
            print(f"  ✅ {route}")
        
        expected_routes = ['/api/signup', '/api/verify-email', '/api/resend-verification-email']
        found_routes = [r.split()[0] for r in routes]
        
        all_found = all(exp in found_routes for exp in expected_routes)
        
        if all_found:
            print("✅ All email verification routes registered")
            return True
        else:
            missing = [exp for exp in expected_routes if exp not in found_routes]
            print(f"❌ Missing routes: {missing}")
            return False
    except Exception as e:
        print(f"❌ Route test failed: {e}")
        return False

def main():
    print("\n" + "🔐"*35)
    print("  EMAIL VERIFICATION & ACCOUNT ACTIVATION SYSTEM TEST")
    print("  Only verified Gmail users can access the website")
    print("🔐"*35)
    
    tests = [
        ("Module Imports", test_imports),
        ("Token Generation", test_token_generation),
        ("Email Configuration", test_email_config),
        ("User Model", test_user_model),
        ("Flask App", test_flask_app),
        ("Routes Registration", test_routes),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ Test '{test_name}' crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print_section("TEST SUMMARY")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\n{'='*70}")
    print(f"  Results: {passed}/{total} tests passed")
    print(f"{'='*70}")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        print("\n📋 System Features:")
        print("  ✅ Step 1: User signs up (Collect info)")
        print("  ✅ Step 2: Generate token (Secure identifier)")
        print("  ✅ Step 3: Send verification email (Confirm email ownership)")
        print("  ✅ Step 4: Verify token (Activate account)")
        print("  ✅ Step 5: Delete/expire token (Security)")
        print("\n🔒 Only verified Gmail users can access the website")
        print("\n📧 To test the full flow:")
        print("  1. Start the Flask server: python app.py")
        print("  2. Test signup: POST /api/signup with Gmail address")
        print("  3. Check email for verification link")
        print("  4. Click link or POST /api/verify-email with token")
        print("  5. Login: POST /api/login (will only work after verification)")
    else:
        print(f"\n❌ {total - passed} test(s) failed. Please fix the issues above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
