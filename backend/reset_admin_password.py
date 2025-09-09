from utils.db import get_db
from models.user import user_collection
from werkzeug.security import generate_password_hash, check_password_hash

def reset_admin_password():
    print("=== RESETTING ADMIN PASSWORD ===")
    
    db = get_db()
    users = user_collection(db)
    
    # Find admin user
    admin_user = users.find_one({'email': 'admin@example.com'})
    
    if admin_user:
        print(f"Found admin user: {admin_user['username']}")
        
        # Check current password hash
        current_hash = admin_user.get('password_hash', '')
        print(f"Current hash exists: {bool(current_hash)}")
        
        # Test with the password you mentioned
        test_password = "Admin#123"
        if current_hash:
            password_match = check_password_hash(current_hash, test_password)
            print(f"Password 'Admin#123' matches: {password_match}")
        
        # Reset password to Admin#123
        new_hash = generate_password_hash(test_password)
        result = users.update_one(
            {'email': 'admin@example.com'},
            {'$set': {'password_hash': new_hash}}
        )
        
        if result.modified_count > 0:
            print("✅ Admin password reset to 'Admin#123' successfully")
        else:
            print("❌ Failed to reset password")
            
        # Test login after reset
        updated_user = users.find_one({'email': 'admin@example.com'})
        if updated_user:
            new_hash = updated_user.get('password_hash', '')
            if new_hash:
                password_match = check_password_hash(new_hash, test_password)
                print(f"✅ Password verification after reset: {password_match}")
            
    else:
        print("❌ Admin user not found")

if __name__ == '__main__':
    reset_admin_password()
