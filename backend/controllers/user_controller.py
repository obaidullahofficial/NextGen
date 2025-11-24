from werkzeug.security import generate_password_hash, check_password_hash
from utils.db import get_db
from models.user import user_collection
from utils.email_service import EmailService
from datetime import datetime

class UserController:
    @staticmethod
    def create_user(username, email, password, role='user'):
        db = get_db()
        users = user_collection(db)
        
        if users.find_one({'email': email}):
            return None, "Email already exists"
            
        password_hash = generate_password_hash(password)
        user_data = {
            'username': username,
            'email': email,
            'password_hash': password_hash,
            'role': role
        }
        
        result = users.insert_one(user_data)
        return str(result.inserted_id), "User created successfully"

    @staticmethod
    def signup_user(username, email, password, role='user'):
        """
        Create a new user account with email verification
        
        Step 1: User signs up (Collect info)
        Step 2: Generate token (Secure identifier)
        Step 3: Send verification email (Confirm email ownership)
        
        Returns:
            tuple: (success: bool, message/user_id: str, additional_info: dict)
        """
        try:
            # Restrict to Gmail addresses only
            if not email.lower().endswith('@gmail.com'):
                return False, "Only Gmail addresses (@gmail.com) are allowed", {}
            
            db = get_db()
            users = user_collection(db)
            
            # Check if email already exists
            existing_user = users.find_one({'email': email})
            if existing_user:
                if existing_user.get('is_verified', False):
                    return False, "This email is already registered. Please login or use a different email address.", {}
                else:
                    # Email exists but not verified - allow re-registration
                    users.delete_one({'email': email})
                    EmailService.delete_user_tokens(email)
            
            # Create user with unverified status
            password_hash = generate_password_hash(password)
            user_data = {
                'username': username,
                'email': email,
                'password_hash': password_hash,
                'role': role,
                'is_verified': False,  # User must verify email
                'created_at': datetime.utcnow()
            }
            
            result = users.insert_one(user_data)
            user_id = str(result.inserted_id)
            
            # Step 2: Generate verification code
            code, code_doc = EmailService.create_verification_code(email)
            
            if not code:
                # Rollback user creation if code generation fails
                users.delete_one({'_id': result.inserted_id})
                return False, f"Failed to create verification code: {code_doc}", {}
            
            # Step 3: Send verification email
            email_sent, email_message = EmailService.send_verification_email(email, username, code)
            
            if not email_sent:
                print(f"[SIGNUP WARNING] User created but email failed: {email_message}")
                return True, "Account created but verification email failed. Please request a new verification email.", {
                    'user_id': user_id,
                    'email_sent': False,
                    'error': email_message
                }
            
            print(f"[SIGNUP] ✅ User {username} ({email}) created successfully. Verification email sent.")
            return True, "Account created successfully! Please check your email to verify your account.", {
                'user_id': user_id,
                'email_sent': True
            }
            
        except Exception as e:
            print(f"[SIGNUP ERROR] {str(e)}")
            return False, f"Signup failed: {str(e)}", {}
    
    @staticmethod
    def verify_email(code):
        """
        Verify user's email using 6-digit code
        
        Step 4: Verify code (Activate account)
        Step 5: Delete/expire code (Security)
        
        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            # Step 4: Verify the code
            code_valid, email_or_error = EmailService.verify_code(code)
            
            if not code_valid:
                return False, email_or_error
            
            email = email_or_error
            
            # Activate the user account
            db = get_db()
            users = user_collection(db)
            
            result = users.update_one(
                {'email': email},
                {'$set': {'is_verified': True}}
            )
            
            if result.modified_count == 0:
                return False, "User not found or already verified"
            
            # Step 5: Clean up old codes (code already marked as used in verify_code)
            print(f"[VERIFY EMAIL] ✅ Email {email} verified successfully")
            return True, "Email verified successfully! You can now log in."
            
        except Exception as e:
            print(f"[VERIFY EMAIL ERROR] {str(e)}")
            return False, f"Verification failed: {str(e)}"
    
    @staticmethod
    def resend_verification_email(email):
        """
        Resend verification email to user
        
        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            db = get_db()
            users = user_collection(db)
            
            # Check if user exists
            user = users.find_one({'email': email})
            
            if not user:
                return False, "No account found with this email address"
            
            # Check if already verified
            if user.get('is_verified', False):
                return False, "This email is already verified. Please log in."
            
            # Delete old codes/tokens
            EmailService.delete_user_tokens(email)
            
            # Generate new verification code
            code, code_doc = EmailService.create_verification_code(email)
            
            if not code:
                return False, f"Failed to create verification code: {code_doc}"
            
            # Send new verification email
            email_sent, email_message = EmailService.send_verification_email(
                email, 
                user.get('username', 'User'), 
                code
            )
            
            if not email_sent:
                return False, f"Failed to send email: {email_message}"
            
            print(f"[RESEND] ✅ Verification email resent to {email}")
            return True, "Verification email sent! Please check your inbox."
            
        except Exception as e:
            print(f"[RESEND ERROR] {str(e)}")
            return False, f"Failed to resend email: {str(e)}"
    
    @staticmethod
    def verify_user(email, password):
        """
        Fast user verification with minimal database queries
        NOW REQUIRES EMAIL VERIFICATION - Only verified Gmail users can log in
        """
        db = get_db()
        users = user_collection(db)
        
        # Single optimized query with only required fields including is_verified
        user = users.find_one(
            {'email': email},
            {'email': 1, 'username': 1, 'password_hash': 1, 'role': 1, 'is_verified': 1}
        )
        
        if not user:
            return None
        
        # Check if email is verified
        if not user.get('is_verified', False):
            print(f"[LOGIN BLOCKED] User {email} attempted login without email verification")
            return {'error': 'email_not_verified', 'message': 'Please verify your email before logging in'}
            
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
