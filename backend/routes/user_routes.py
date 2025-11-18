from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, unset_jwt_cookies
from controllers.user_controller import UserController
from models.user import user_collection
from models.society_profile import society_profile_collection
from utils.db import get_db
from datetime import datetime, timedelta
from bson import ObjectId
from google.oauth2 import id_token
from google.auth.transport import requests
import os

user_bp = Blueprint('user', __name__)

# Get all users (for admin dashboard)
@user_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    try:
        db = get_db()
        users = user_collection(db)
        
        # Get all users except passwords
        user_list = list(users.find({}, {'password': 0}))
        
        # Convert ObjectId to string
        for user in user_list:
            user['_id'] = str(user['_id'])
            # Add created date if not present
            if 'created_at' not in user:
                user['created_at'] = datetime.now().isoformat()
        
        return jsonify({
            "success": True,
            "data": user_list,
            "users": user_list,  # Keep both for backward compatibility
            "total": len(user_list),
            "total_count": len(user_list),
            "message": f"Retrieved {len(user_list)} users successfully"
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to fetch users: {str(e)}"
        }), 500

# Get user statistics (consolidated route)
@user_bp.route('/users/stats', methods=['GET'])
@jwt_required()
def get_user_stats():
    try:
        # Check if current user is admin
        current_user_email = get_jwt_identity()
        db = get_db()
        users = user_collection(db)
        
        current_user = users.find_one({'email': current_user_email})
        if not current_user or current_user.get('role') != 'admin':
            return jsonify({"success": False, "message": "Admin access required"}), 403
        
        total_users = users.count_documents({})
        
        # Calculate users from last month
        last_month = datetime.now() - timedelta(days=30)
        new_users_this_month = users.count_documents({
            'created_at': {'$gte': last_month.isoformat()}
        })
        
        # Estimate active users (could be improved with actual activity tracking)
        active_users = int(total_users * 0.7)  # Rough estimate
        
        # Calculate growth rate
        last_month_start = datetime.now() - timedelta(days=60)
        last_month_end = datetime.now() - timedelta(days=30)
        users_previous_month = users.count_documents({
            'created_at': {
                '$gte': last_month_start.isoformat(),
                '$lt': last_month_end.isoformat()
            }
        })
        
        growth_rate = 0
        if users_previous_month > 0:
            growth_rate = ((new_users_this_month - users_previous_month) / users_previous_month) * 100
        
        # Get role-based counts
        admin_count = users.count_documents({'role': 'admin'})
        society_count = users.count_documents({'role': 'society'})
        regular_user_count = users.count_documents({'role': 'user'})
        
        return jsonify({
            "success": True,
            "data": {
                "total_users": total_users,
                "active_users": active_users,
                "new_users_this_month": new_users_this_month,
                "user_growth_rate": round(growth_rate, 2),
                "admin_count": admin_count,
                "society_count": society_count,
                "regular_user_count": regular_user_count,
                "role_distribution": {
                    "admin": admin_count,
                    "society": society_count,
                    "user": regular_user_count
                }
            },
            "stats": {
                "total_users": total_users,
                "admin_count": admin_count,
                "society_count": society_count,
                "regular_user_count": regular_user_count,
                "recent_users_30_days": new_users_this_month,
                "role_distribution": {
                    "admin": admin_count,
                    "society": society_count,
                    "user": regular_user_count
                }
            },
            "message": "User statistics retrieved successfully"
        }), 200
        
    except Exception as e:
        print(f"[USER STATS ERROR] {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Failed to fetch user statistics: {str(e)}"
        }), 500

# Get user analytics
@user_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_user_analytics():
    try:
        date_range = request.args.get('range', '7days')
        db = get_db()
        users = user_collection(db)
        
        # Calculate date range
        if date_range == '7days':
            start_date = datetime.now() - timedelta(days=7)
        elif date_range == '30days':
            start_date = datetime.now() - timedelta(days=30)
        elif date_range == '90days':
            start_date = datetime.now() - timedelta(days=90)
        else:
            start_date = datetime.now() - timedelta(days=365)
        
        # Get registrations over time
        registrations_pipeline = [
            {
                '$match': {
                    'created_at': {'$gte': start_date.isoformat()}
                }
            },
            {
                '$group': {
                    '_id': {
                        '$dateToString': {
                            'format': '%Y-%m-%d',
                            'date': {'$dateFromString': {'dateString': '$created_at'}}
                        }
                    },
                    'count': {'$sum': 1}
                }
            },
            {'$sort': {'_id': 1}}
        ]
        
        registrations_over_time = list(users.aggregate(registrations_pipeline))
        
        # Get user types
        user_types_pipeline = [
            {
                '$group': {
                    '_id': '$role',
                    'count': {'$sum': 1}
                }
            }
        ]
        
        user_types = list(users.aggregate(user_types_pipeline))
        
        return jsonify({
            "success": True,
            "data": {
                "registrations_over_time": registrations_over_time,
                "user_types": user_types,
                "activity_metrics": {
                    "total_users": users.count_documents({}),
                    "active_in_range": users.count_documents({
                        'created_at': {'$gte': start_date.isoformat()}
                    })
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to fetch user analytics: {str(e)}"
        }), 500

# Society registration routes have been moved to registration_form_routes.py

@user_bp.route('/check-email', methods=['POST'])
def check_email():
    """Check if an email already exists in the system"""
    data = request.json
    email = data.get('email')
    
    if not email:
        return jsonify({"error": "Email is required"}), 400
    
    try:
        db = get_db()
        users = user_collection(db)
        
        existing_user = users.find_one({'email': email})
        
        if existing_user:
            return jsonify({"exists": True, "message": "Email already exists"}), 200
        else:
            return jsonify({"exists": False, "message": "Email is available"}), 200
            
    except Exception as e:
        return jsonify({"error": f"Failed to check email: {str(e)}"}), 500

# Society signup route has been moved to registration_form_routes.py

# ============================================================
# EMAIL VERIFICATION ROUTES
# ============================================================

@user_bp.route('/signup', methods=['POST'])
def signup():
    """
    User signup with email verification
    Step 1: User signs up (Collect info)
    Step 2: Generate token (Secure identifier) 
    Step 3: Send verification email (Confirm email ownership)
    """
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                "success": False,
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400
        
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'user')
        society_id = data.get('society_id')
        
        # Validate email domain (only Gmail for this requirement)
        if not email.lower().endswith('@gmail.com'):
            return jsonify({
                "success": False,
                "error": "Only Gmail addresses are allowed for registration"
            }), 400
        
        print(f"[SIGNUP API] Processing signup for {email}")
        
        # Call controller to create user and send verification email
        success, message, info = UserController.signup_user(
            username, email, password, role, society_id
        )
        
        if success:
            return jsonify({
                "success": True,
                "message": message,
                "user_id": info.get('user_id'),
                "email_sent": info.get('email_sent', False)
            }), 201
        else:
            return jsonify({
                "success": False,
                "error": message
            }), 400
            
    except Exception as e:
        print(f"[SIGNUP API ERROR] {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Signup failed: {str(e)}"
        }), 500

@user_bp.route('/verify-email', methods=['POST', 'GET'])
def verify_email_route():
    """
    Verify user's email using 6-digit code
    Step 4: Verify code (Activate account)
    Step 5: Delete/expire code (Security)
    
    Supports both:
    - POST with code in body
    - GET with code in query parameter
    """
    try:
        # Get code from either POST body or GET query parameter
        if request.method == 'POST':
            data = request.json or {}
            code = data.get('code')
        else:  # GET
            code = request.args.get('code')
        
        if not code:
            return jsonify({
                "success": False,
                "error": "Verification code is required",
                "message": "Please provide a valid 6-digit verification code"
            }), 400
        
        print(f"[VERIFY EMAIL API] Processing verification for code: {code}")
        
        # Call controller to verify email
        success, message = UserController.verify_email(code)
        
        if success:
            return jsonify({
                "success": True,
                "message": message
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": message
            }), 400
            
    except Exception as e:
        print(f"[VERIFY EMAIL API ERROR] {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Verification failed: {str(e)}"
        }), 500

@user_bp.route('/resend-verification-email', methods=['POST'])
def resend_verification_email_route():
    """
    Resend verification email to user
    """
    try:
        data = request.json
        email = data.get('email')
        
        if not email:
            return jsonify({
                "success": False,
                "error": "Email is required"
            }), 400
        
        print(f"[RESEND API] Processing resend for {email}")
        
        # Call controller to resend verification email
        success, message = UserController.resend_verification_email(email)
        
        if success:
            return jsonify({
                "success": True,
                "message": message
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": message
            }), 400
            
    except Exception as e:
        print(f"[RESEND API ERROR] {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Failed to resend email: {str(e)}"
        }), 500

@user_bp.route('/check-verification-status', methods=['POST'])
def check_verification_status():
    """
    Check if a user's email is verified
    """
    try:
        data = request.json
        email = data.get('email')
        
        if not email:
            return jsonify({
                "success": False,
                "error": "Email is required"
            }), 400
        
        db = get_db()
        users = user_collection(db)
        user = users.find_one({'email': email})
        
        if not user:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        return jsonify({
            "success": True,
            "email": email,
            "is_verified": user.get('is_verified', False),
            "username": user.get('username'),
            "message": "Verified" if user.get('is_verified') else "Not verified"
        }), 200
        
    except Exception as e:
        print(f"[CHECK STATUS ERROR] {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Failed to check status: {str(e)}"
        }), 500

@user_bp.route('/manual-verify-email', methods=['POST'])
def manual_verify_email():
    """
    Manually verify a user's email (useful for testing or admin purposes)
    This can be used if email system fails or for quick verification
    """
    try:
        data = request.json
        email = data.get('email')
        
        if not email:
            return jsonify({
                "success": False,
                "error": "Email is required"
            }), 400
        
        db = get_db()
        users = user_collection(db)
        
        # Find user
        user = users.find_one({'email': email})
        if not user:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        # Check if already verified
        if user.get('is_verified', False):
            return jsonify({
                "success": True,
                "message": "Email is already verified",
                "already_verified": True
            }), 200
        
        # Verify the user
        result = users.update_one(
            {'email': email},
            {'$set': {'is_verified': True}}
        )
        
        if result.modified_count > 0:
            # Clean up verification tokens
            from models.email_verification import email_verification_collection
            email_verification_collection(db).delete_many({'email': email})
            
            print(f"[MANUAL VERIFY] ✅ Email {email} verified manually")
            return jsonify({
                "success": True,
                "message": f"Email verified successfully! You can now log in.",
                "email": email
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": "Failed to verify email"
            }), 500
            
    except Exception as e:
        print(f"[MANUAL VERIFY ERROR] {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Verification failed: {str(e)}"
        }), 500

# ============================================================
# LOGIN ROUTE (NOW REQUIRES EMAIL VERIFICATION)
# ============================================================

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    print(f"[LOGIN] Attempting login for email: {email}")

    if not email or not password:
        print("[LOGIN] Missing email or password")
        return jsonify({"error": "Email and password are required"}), 400

    # Single database query to get user and verify credentials
    user = UserController.verify_user(email, password)
    print(f"[LOGIN] Verify user result: {user is not None}")
    
    if not user:
        print(f"[LOGIN] Authentication failed for email: {email}")
        return jsonify({"error": "Invalid email or password"}), 401
    
    # Check if user is blocked due to unverified email
    if isinstance(user, dict) and user.get('error') == 'email_not_verified':
        print(f"[LOGIN] Email not verified for: {email}")
        return jsonify({
            "success": False,
            "error": "email_not_verified",
            "message": user.get('message', 'Please verify your email before logging in')
        }), 403

    # Quick society status check only for society users (optimized)
    if user['role'] == 'society':
        from controllers.registration_form_controller import RegistrationFormController
        
        # Use the controller to check society status
        society_status = RegistrationFormController.check_society_status(email)
        
        if society_status == 'pending':
            return jsonify({
                "error": "registration_pending",
                "message": "Your society registration is pending admin approval."
            }), 403
        elif society_status == 'rejected':
            return jsonify({
                "error": "registration_rejected", 
                "message": "Your registration has been rejected. Contact admin."
            }), 403
        elif society_status != 'approved':
            return jsonify({
                "error": "registration_invalid",
                "message": "Invalid registration status. Contact admin."
            }), 403

    # Fast token generation without debug overhead
    access_token = create_access_token(
        identity=email,
        additional_claims={'role': user['role']}
    )
    
    print(f"[LOGIN] Success for {email} with role {user['role']}")
    
    # Simplified response with user_id
    response_data = {
        "success": True,
        "access_token": access_token, 
        "user": {
            "id": user.get('_id'),  # Include user ID
            "email": email,
            "role": user['role'],
            "username": user.get('username', ''),
            "is_admin": user.get('role') == 'admin'
        }
    }
    
    # Lightweight profile check for society users (async-friendly)
    if user['role'] == 'society':
        try:
            db = get_db()
            profiles = society_profile_collection(db)
            
            # Quick check if profile exists (only _id field)
            profile_exists = profiles.find_one({'user_email': email}, {'_id': 1}) is not None
            
            response_data.update({
                "profile_exists": profile_exists,
                "profile_complete": profile_exists  # Simplified check
            })
            
        except Exception as e:
            print(f"Profile check error: {str(e)}")
            # Don't fail login for profile issues
            response_data.update({
                "profile_exists": False,
                "profile_complete": False
            })
    
    return jsonify(response_data), 200
    
    return jsonify(response_data), 200

@user_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Handle forgot password request"""
    try:
        data = request.json
        email = data.get('email')
        
        if not email:
            return jsonify({"error": "Email is required"}), 400
        
        print(f"[FORGOT PASSWORD] Request for email: {email}")
        
        db = get_db()
        users = user_collection(db)
        
        # Check if user exists
        user = users.find_one({'email': email})
        
        if not user:
            # Don't reveal whether email exists or not for security
            return jsonify({
                "success": True,
                "message": "If an account with this email exists, a password reset link has been sent."
            }), 200
        
        # Generate a temporary reset token (in production, use a more secure method)
        import secrets
        import hashlib
        reset_token = secrets.token_urlsafe(32)
        reset_token_hash = hashlib.sha256(reset_token.encode()).hexdigest()
        
        # Store reset token in database with expiration
        from datetime import datetime, timedelta
        expiration = datetime.now() + timedelta(hours=1)  # Token expires in 1 hour
        
        users.update_one(
            {'email': email},
            {
                '$set': {
                    'reset_token': reset_token_hash,
                    'reset_token_expires': expiration.isoformat()
                }
            }
        )
        
        print(f"[FORGOT PASSWORD] Reset token generated for: {email}")
        
        # In a real application, you would send an email here
        # For now, we'll return the token (REMOVE THIS IN PRODUCTION)
        return jsonify({
            "success": True,
            "message": "If an account with this email exists, a password reset link has been sent.",
            "debug_token": reset_token  # REMOVE THIS IN PRODUCTION
        }), 200
        
    except Exception as e:
        print(f"[FORGOT PASSWORD] Error: {str(e)}")
        return jsonify({"error": "Failed to process password reset request"}), 500

@user_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Handle password reset with token"""
    try:
        data = request.json
        token = data.get('token')
        new_password = data.get('password')
        
        if not token or not new_password:
            return jsonify({"error": "Token and new password are required"}), 400
        
        if len(new_password) < 6:
            return jsonify({"error": "Password must be at least 6 characters long"}), 400
        
        print(f"[RESET PASSWORD] Attempting password reset with token")
        
        # Hash the provided token
        import hashlib
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        db = get_db()
        users = user_collection(db)
        
        # Find user with valid reset token
        from datetime import datetime
        current_time = datetime.now()
        
        user = users.find_one({
            'reset_token': token_hash,
            'reset_token_expires': {'$gt': current_time.isoformat()}
        })
        
        if not user:
            return jsonify({"error": "Invalid or expired reset token"}), 400
        
        # Update password and remove reset token
        from werkzeug.security import generate_password_hash
        password_hash = generate_password_hash(new_password)
        
        users.update_one(
            {'_id': user['_id']},
            {
                '$set': {'password_hash': password_hash},
                '$unset': {'reset_token': '', 'reset_token_expires': ''}
            }
        )
        
        print(f"[RESET PASSWORD] Password reset successful for: {user['email']}")
        
        return jsonify({
            "success": True,
            "message": "Password has been reset successfully. You can now login with your new password."
        }), 200
        
    except Exception as e:
        print(f"[RESET PASSWORD] Error: {str(e)}")
        return jsonify({"error": "Failed to reset password"}), 500

@user_bp.route('/test-google-config', methods=['GET'])
def test_google_config():
    """Test Google OAuth configuration"""
    try:
        GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', 'not-set')
        return jsonify({
            "success": True,
            "google_client_id_configured": GOOGLE_CLIENT_ID != 'not-set' and GOOGLE_CLIENT_ID != 'your-google-client-id-here',
            "client_id_preview": GOOGLE_CLIENT_ID[:20] + "..." if len(GOOGLE_CLIENT_ID) > 20 else GOOGLE_CLIENT_ID,
            "message": "Google configuration test"
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_bp.route('/google-login', methods=['POST'])
def google_login():
    """Handle Google OAuth login and signup"""
    try:
        data = request.json
        google_token = data.get('credential')
        intent = data.get('intent', 'login')  # 'login' or 'signup'
        
        print(f"[GOOGLE {intent.upper()}] Received request with data: {data}")
        
        if not google_token:
            print(f"[GOOGLE {intent.upper()}] No Google token provided")
            return jsonify({"error": "Google token is required"}), 400
        
        # Google Client ID
        GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', 'your-google-client-id-here')
        print(f"[GOOGLE {intent.upper()}] Using Google Client ID: {GOOGLE_CLIENT_ID[:20]}...")
        
        try:
            # Verify the Google token
            print(f"[GOOGLE {intent.upper()}] Verifying Google token...")
            idinfo = id_token.verify_oauth2_token(
                google_token, 
                requests.Request(), 
                GOOGLE_CLIENT_ID
            )
            
            print(f"[GOOGLE {intent.upper()}] Token verified. User info: {idinfo}")
            
            # Extract user information from Google
            google_email = idinfo.get('email')
            google_name = idinfo.get('name')
            google_picture = idinfo.get('picture')
            
            if not google_email:
                print(f"[GOOGLE {intent.upper()}] No email in Google token")
                return jsonify({"error": "Unable to get email from Google"}), 400
            
            print(f"[GOOGLE {intent.upper()}] Processing for email: {google_email}")
            
            db = get_db()
            users = user_collection(db)
            
            # Check if user already exists
            existing_user = users.find_one({'email': google_email})
            
            if existing_user:
                # User exists - log them in
                print(f"[GOOGLE {intent.upper()}] Existing user found: {google_email}")
                
                # Check society status if applicable
                if existing_user['role'] == 'society':
                    from controllers.registration_form_controller import RegistrationFormController
                    
                    # Use the controller to check society status
                    society_status = RegistrationFormController.check_society_status(google_email)
                    
                    if society_status == 'pending':
                        return jsonify({
                            "error": "registration_pending",
                            "message": "Your society registration is pending admin approval."
                        }), 403
                    elif society_status == 'rejected':
                        return jsonify({
                            "error": "registration_rejected", 
                            "message": "Your registration has been rejected. Contact admin."
                        }), 403
                    elif society_status != 'approved':
                        return jsonify({
                            "error": "registration_invalid",
                            "message": "Invalid registration status. Contact admin."
                        }), 403
                
                # Create access token
                access_token = create_access_token(
                    identity=google_email,
                    additional_claims={'role': existing_user['role']}
                )
                
                response_data = {
                    "success": True,
                    "access_token": access_token,
                    "user": {
                        "email": google_email,
                        "role": existing_user['role'],
                        "username": existing_user.get('username', google_name),
                        "is_admin": existing_user.get('role') == 'admin'
                    },
                    "auth_method": "google",
                    "new_user": False,
                    "message": f"Welcome back! Signed in successfully with Google."
                }
                
                # Add profile info for society users
                if existing_user['role'] == 'society':
                    try:
                        profiles = society_profile_collection(db)
                        profile_exists = profiles.find_one({'user_email': google_email}, {'_id': 1}) is not None
                        
                        response_data.update({
                            "profile_exists": profile_exists,
                            "profile_complete": profile_exists
                        })
                    except Exception as e:
                        print(f"Profile check error: {str(e)}")
                        response_data.update({
                            "profile_exists": False,
                            "profile_complete": False
                        })
                
                print(f"[GOOGLE {intent.upper()}] Login successful for existing user: {google_email}")
                return jsonify(response_data), 200
                
            else:
                # New user - create account with Google info
                print(f"[GOOGLE {intent.upper()}] Creating new user: {google_email}")
                
                # Use Google name or email as username
                username = google_name if google_name else google_email.split('@')[0]
                
                # Create user with Google authentication (no password needed)
                new_user_data = {
                    'username': username,
                    'email': google_email,
                    'role': 'user',  # Default role for Google sign-ups
                    'auth_method': 'google',
                    'google_picture': google_picture,
                    'created_at': datetime.now().isoformat(),
                    'verified': True  # Google accounts are pre-verified
                }
                
                # Insert user into database
                result = users.insert_one(new_user_data)
                user_id = str(result.inserted_id)
                
                # Create access token
                access_token = create_access_token(
                    identity=google_email,
                    additional_claims={'role': 'user'}
                )
                
                response_data = {
                    "success": True,
                    "access_token": access_token,
                    "user": {
                        "email": google_email,
                        "role": 'user',
                        "username": username,
                        "is_admin": False
                    },
                    "auth_method": "google",
                    "new_user": True,
                    "message": "Account created successfully with Google! Welcome to NextGenArchitect."
                }
                
                print(f"[GOOGLE {intent.upper()}] New user created successfully: {google_email}")
                return jsonify(response_data), 201
                
        except ValueError as e:
            # Invalid token
            print(f"[GOOGLE {intent.upper()}] Invalid token error: {str(e)}")
            return jsonify({"error": "Invalid Google token", "details": str(e)}), 401
            
    except Exception as e:
        print(f"[GOOGLE {intent.upper()}] General error: {str(e)}")
        return jsonify({"error": "Google authentication failed", "details": str(e)}), 500

# Society information route has been moved to registration_form_routes.py

@user_bp.route('/logout', methods=['POST'])
def logout():
    response = jsonify({'msg': 'Logout successful'})
    unset_jwt_cookies(response)
    return response, 200

@user_bp.route('/register', methods=['POST'])
@jwt_required()
def register_user():
    """Admin-only endpoint to create new users"""
    try:
        # Check if current user is admin
        current_user_email = get_jwt_identity()  # JWT identity is email
        db = get_db()
        users = user_collection(db)
        
        current_user = users.find_one({'email': current_user_email})
        if not current_user or current_user.get('role') != 'admin':
            return jsonify({"success": False, "message": "Admin access required"}), 403
        
        data = request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'user')

        if not all([username, email, password]):
            return jsonify({"success": False, "message": "All fields are required"}), 400

        # Validate role
        valid_roles = ['user', 'society', 'admin']
        if role not in valid_roles:
            return jsonify({"success": False, "message": "Invalid role specified"}), 400

        user_id, message = UserController.create_user(username, email, password, role)
        if not user_id:
            return jsonify({"success": False, "message": message}), 400

        return jsonify({"success": True, "message": f"User created successfully", "user_id": user_id}), 201
        
    except Exception as e:
        print(f"[REGISTER USER ERROR] {str(e)}")
        return jsonify({"success": False, "message": "Failed to create user. Please try again."}), 500

# 🔹 COMPLETE CRUD OPERATIONS FOR USERS API

@user_bp.route('/users/<user_id>', methods=['GET'])
@jwt_required()
def get_user_by_id(user_id):
    """Get a specific user by ID (Admin only)"""
    try:
        from bson import ObjectId
        
        # Check if current user is admin
        current_user_email = get_jwt_identity()
        db = get_db()
        users = user_collection(db)
        
        current_user = users.find_one({'email': current_user_email})
        if not current_user or current_user.get('role') != 'admin':
            return jsonify({"success": False, "message": "Admin access required"}), 403
        
        # Validate ObjectId format
        if not ObjectId.is_valid(user_id):
            return jsonify({"success": False, "message": "Invalid user ID format"}), 400
        
        # Find user by ID
        user = users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        # Remove sensitive information and convert ObjectId to string
        user['_id'] = str(user['_id'])
        user.pop('password_hash', None)
        
        return jsonify({
            "success": True,
            "user": user,
            "message": "User retrieved successfully"
        }), 200
        
    except Exception as e:
        print(f"[GET USER BY ID ERROR] {str(e)}")
        return jsonify({"success": False, "message": "Failed to retrieve user"}), 500

@user_bp.route('/users/<user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """Update a specific user by ID (Admin only)"""
    try:
        from bson import ObjectId
        from werkzeug.security import generate_password_hash
        
        # Check if current user is admin
        current_user_email = get_jwt_identity()
        db = get_db()
        users = user_collection(db)
        
        current_user = users.find_one({'email': current_user_email})
        if not current_user or current_user.get('role') != 'admin':
            return jsonify({"success": False, "message": "Admin access required"}), 403
        
        # Validate ObjectId format
        if not ObjectId.is_valid(user_id):
            return jsonify({"success": False, "message": "Invalid user ID format"}), 400
        
        # Check if user exists
        existing_user = users.find_one({'_id': ObjectId(user_id)})
        if not existing_user:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        data = request.json
        update_data = {}
        
        # Validate and prepare update data
        if 'username' in data and data['username'].strip():
            update_data['username'] = data['username'].strip()
        
        if 'email' in data and data['email'].strip():
            # Check if email is already taken by another user
            email_check = users.find_one({'email': data['email'].strip(), '_id': {'$ne': ObjectId(user_id)}})
            if email_check:
                return jsonify({"success": False, "message": "Email already exists"}), 400
            update_data['email'] = data['email'].strip()
        
        if 'role' in data:
            valid_roles = ['user', 'society', 'admin']
            if data['role'] not in valid_roles:
                return jsonify({"success": False, "message": "Invalid role specified"}), 400
            update_data['role'] = data['role']
        
        if 'password' in data and data['password']:
            if len(data['password']) < 6:
                return jsonify({"success": False, "message": "Password must be at least 6 characters"}), 400
            update_data['password_hash'] = generate_password_hash(data['password'])
        
        if not update_data:
            return jsonify({"success": False, "message": "No valid fields to update"}), 400
        
        # Update user
        result = users.update_one({'_id': ObjectId(user_id)}, {'$set': update_data})
        
        if result.modified_count == 0:
            return jsonify({"success": False, "message": "No changes made"}), 400
        
        # Get updated user
        updated_user = users.find_one({'_id': ObjectId(user_id)})
        updated_user['_id'] = str(updated_user['_id'])
        updated_user.pop('password_hash', None)
        
        return jsonify({
            "success": True,
            "user": updated_user,
            "message": "User updated successfully"
        }), 200
        
    except Exception as e:
        print(f"[UPDATE USER ERROR] {str(e)}")
        return jsonify({"success": False, "message": "Failed to update user"}), 500

@user_bp.route('/users/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """Delete a specific user by ID (Admin only)"""
    try:
        from bson import ObjectId
        
        # Check if current user is admin
        current_user_email = get_jwt_identity()
        db = get_db()
        users = user_collection(db)
        
        current_user = users.find_one({'email': current_user_email})
        if not current_user or current_user.get('role') != 'admin':
            return jsonify({"success": False, "message": "Admin access required"}), 403
        
        # Validate ObjectId format
        if not ObjectId.is_valid(user_id):
            return jsonify({"success": False, "message": "Invalid user ID format"}), 400
        
        # Check if user exists
        existing_user = users.find_one({'_id': ObjectId(user_id)})
        if not existing_user:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        # Prevent admin from deleting themselves
        if existing_user['email'] == current_user_email:
            return jsonify({"success": False, "message": "Cannot delete your own account"}), 400
        
        # Delete user
        result = users.delete_one({'_id': ObjectId(user_id)})
        
        if result.deleted_count == 0:
            return jsonify({"success": False, "message": "Failed to delete user"}), 500
        
        return jsonify({
            "success": True,
            "message": f"User '{existing_user['username']}' deleted successfully"
        }), 200
        
    except Exception as e:
        print(f"[DELETE USER ERROR] {str(e)}")
        return jsonify({"success": False, "message": "Failed to delete user"}), 500

@user_bp.route('/users/search', methods=['GET'])
@jwt_required()
def search_users():
    """Search users by username or email (Admin only)"""
    try:
        # Check if current user is admin
        current_user_email = get_jwt_identity()
        db = get_db()
        users = user_collection(db)
        
        current_user = users.find_one({'email': current_user_email})
        if not current_user or current_user.get('role') != 'admin':
            return jsonify({"success": False, "message": "Admin access required"}), 403
        
        # Get search parameters
        query = request.args.get('q', '').strip()
        role = request.args.get('role', '').strip()
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        if limit > 100:  # Prevent excessive queries
            limit = 100
        
        # Build search filter
        search_filter = {}
        
        if query:
            search_filter['$or'] = [
                {'username': {'$regex': query, '$options': 'i'}},
                {'email': {'$regex': query, '$options': 'i'}}
            ]
        
        if role:
            search_filter['role'] = role
        
        # Calculate skip value for pagination
        skip = (page - 1) * limit
        
        # Get users with search filter
        user_cursor = users.find(search_filter).skip(skip).limit(limit)
        found_users = list(user_cursor)
        
        # Get total count for pagination
        total_count = users.count_documents(search_filter)
        
        # Remove sensitive information and convert ObjectId to string
        for user in found_users:
            user['_id'] = str(user['_id'])
            user.pop('password_hash', None)
        
        return jsonify({
            "success": True,
            "users": found_users,
            "pagination": {
                "current_page": page,
                "per_page": limit,
                "total_items": total_count,
                "total_pages": (total_count + limit - 1) // limit
            },
            "message": f"Found {len(found_users)} users"
        }), 200
        
    except Exception as e:
        print(f"[SEARCH USERS ERROR] {str(e)}")
        return jsonify({"success": False, "message": "Failed to search users"}), 500



@user_bp.route('/users/bulk-delete', methods=['DELETE'])
@jwt_required()
def bulk_delete_users():
    """Delete multiple users by IDs (Admin only)"""
    try:
        from bson import ObjectId
        
        # Check if current user is admin
        current_user_email = get_jwt_identity()
        db = get_db()
        users = user_collection(db)
        
        current_user = users.find_one({'email': current_user_email})
        if not current_user or current_user.get('role') != 'admin':
            return jsonify({"success": False, "message": "Admin access required"}), 403
        
        data = request.json
        user_ids = data.get('user_ids', [])
        
        if not user_ids or not isinstance(user_ids, list):
            return jsonify({"success": False, "message": "user_ids array is required"}), 400
        
        # Validate all user IDs
        valid_ids = []
        for user_id in user_ids:
            if ObjectId.is_valid(user_id):
                valid_ids.append(ObjectId(user_id))
        
        if not valid_ids:
            return jsonify({"success": False, "message": "No valid user IDs provided"}), 400
        
        # Check if any of the users to delete is the current admin
        users_to_delete = list(users.find({'_id': {'$in': valid_ids}}))
        for user in users_to_delete:
            if user['email'] == current_user_email:
                return jsonify({"success": False, "message": "Cannot delete your own account"}), 400
        
        # Delete users
        result = users.delete_many({'_id': {'$in': valid_ids}})
        
        return jsonify({
            "success": True,
            "deleted_count": result.deleted_count,
            "message": f"Successfully deleted {result.deleted_count} users"
        }), 200
        
    except Exception as e:
        print(f"[BULK DELETE ERROR] {str(e)}")
        return jsonify({"success": False, "message": "Failed to delete users"}), 500

# Registration forms route has been moved to registration_form_routes.py
        
    except Exception as e:
        print(f"[GET REGISTRATION FORMS ERROR] {str(e)}")
        return jsonify({"success": False, "message": "Failed to fetch registration forms"}), 500
