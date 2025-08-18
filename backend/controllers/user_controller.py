from werkzeug.security import generate_password_hash, check_password_hash
from utils.db import get_db
from models.user import user_collection

class UserController:
    @staticmethod
    def create_user(username, email, password, role='user', society_id=None):
        db = get_db()
        users = user_collection(db)
        
        if users.find_one({'email': email}):
            return None, "Email already exists"
            
        password_hash = generate_password_hash(password)
        user_data = {
            'username': username,
            'email': email,
            'password_hash': password_hash,
            'role': role,
            'society_id': society_id
        }
        
        result = users.insert_one(user_data)
        return str(result.inserted_id), "User created successfully"

    @staticmethod
    def verify_user(email, password):
        db = get_db()
        users = user_collection(db)
        user = users.find_one({'email': email})
        
        print(f"[DEBUG] Found user: {user is not None}")
        if user:
            print(f"[DEBUG] User details: email={user['email']}, role={user.get('role')}")
            print(f"[DEBUG] Stored password hash: {user.get('password_hash', 'NO_HASH_FOUND')}")
            
            # Try password verification
            try:
                is_valid = check_password_hash(user['password_hash'], password)
                print(f"[DEBUG] Password verification result: {is_valid}")
                
                if is_valid:
                    user['_id'] = str(user['_id'])
                    print(f"[DEBUG] Login successful for user: {user['email']}, role: {user['role']}")
                    return user
                else:
                    print(f"[DEBUG] Password verification failed for email: {email}")
                    
            except Exception as e:
                print(f"[DEBUG] Error during password verification: {str(e)}")
                return None
                
        return None
