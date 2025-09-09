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
        """Fast user verification with minimal database queries"""
        db = get_db()
        users = user_collection(db)
        
        # Single optimized query with only required fields
        user = users.find_one(
            {'email': email},
            {'email': 1, 'username': 1, 'password_hash': 1, 'role': 1, 'society_id': 1}
        )
        
        if not user:
            return None
            
        # Fast password verification
        try:
            if check_password_hash(user['password_hash'], password):
                # Remove password hash for security
                user.pop('password_hash', None)
                user['_id'] = str(user['_id'])
                return user
        except Exception:
            pass
                
        return None
