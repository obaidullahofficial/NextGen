from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, unset_jwt_cookies
from controllers.user_controller import UserController
from models.registration_form import registration_form_collection
from models.user import user_collection
from models.society_profile import society_profile_collection
from utils.db import get_db

user_bp = Blueprint('user', __name__)

@user_bp.route('/register-society', methods=['POST'])
def register_society():
    data = request.json
    required_fields = ['name', 'type', 'regNo', 'established', 'authority', 'contact', 'website', 'plots']
    if not all(field in data and data[field] for field in required_fields):
        return jsonify({"error": "All fields are required"}), 400
    data['status'] = "pending"
    db = get_db()
    reg_forms = registration_form_collection(db)
    reg_id = reg_forms.insert_one(data).inserted_id
    return jsonify({"message": "Society registration submitted", "registration_id": str(reg_id)}), 201

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

@user_bp.route('/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'user')

    if not all([username, email, password]):
        return jsonify({"error": "All fields are required"}), 400

    user_id, message = UserController.create_user(username, email, password, role)
    if not user_id:
        return jsonify({"error": message}), 400

    return jsonify({"message": message, "user_id": user_id}), 201

@user_bp.route('/signup-society', methods=['POST'])
def signup_society():
    data = request.json
    
    # Extract user data
    user_name = data.get('userName')
    user_email = data.get('userEmail')
    user_password = data.get('userPassword')
    
    # Extract society data
    society_data = {
        'name': data.get('name'),
        'type': data.get('type'),
        'regNo': data.get('regNo'),
        'established': data.get('established'),
        'authority': data.get('authority'),
        'contact': data.get('contact'),
        'website': data.get('website'),
        'plots': data.get('plots'),
        'user_email': user_email  # Link society to user email
    }
    
    # Validate required fields
    user_required = [user_name, user_email, user_password]
    society_required = [society_data['name'], society_data['type'], society_data['regNo'], 
                       society_data['established'], society_data['authority'], 
                       society_data['contact'], society_data['website'], society_data['plots']]
    
    if not all(user_required):
        return jsonify({"error": "User information is incomplete"}), 400
    
    if not all(society_required):
        return jsonify({"error": "Society information is incomplete"}), 400
    
    try:
        # Create user account with society role
        user_id, user_message = UserController.create_user(user_name, user_email, user_password, 'society')
        if not user_id:
            return jsonify({"error": user_message}), 400
        
        # Create society registration form
        society_data['status'] = "pending"
        society_data['user_id'] = user_id  # Link society to user ID
        
        db = get_db()
        reg_forms = registration_form_collection(db)
        reg_id = reg_forms.insert_one(society_data).inserted_id
        
        return jsonify({
            "message": "Society signup successful! Your registration is pending admin approval.",
            "user_id": user_id,
            "registration_id": str(reg_id)
        }), 201
        
    except Exception as e:
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500

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

    # Quick society status check only for society users (optimized)
    if user['role'] == 'society':
        db = get_db()
        reg_forms = registration_form_collection(db)
        
        # Single query with projection to get only status field
        society = reg_forms.find_one({'user_email': email}, {'status': 1})
        
        if society:
            society_status = society.get('status', 'pending')
            
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
    
    # Simplified response
    response_data = {
        "success": True,
        "access_token": access_token, 
        "user": {
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

@user_bp.route('/my-society', methods=['GET'])
@jwt_required()
def get_my_society():
    """Get society information for the logged-in user"""
    user_email = get_jwt_identity()  # Now returns email directly
    
    db = get_db()
    reg_forms = registration_form_collection(db)
    
    # Find society by user email
    society = reg_forms.find_one({'user_email': user_email})
    
    if not society:
        return jsonify({"error": "No society found for this user"}), 404
    
    # Convert ObjectId to string for JSON serialization
    society['_id'] = str(society['_id'])
    
    return jsonify({"society": society}), 200

@user_bp.route('/logout', methods=['POST'])
def logout():
    response = jsonify({'msg': 'Logout successful'})
    unset_jwt_cookies(response)
    return response, 200

@user_bp.route('/users', methods=['GET'])
def get_all_users():
    """Get all users from the database"""
    try:
        db = get_db()
        users = user_collection(db)
        
        # Get all users from database
        all_users = list(users.find())
        
        # Remove sensitive information (password hash) and convert ObjectId to string
        for user in all_users:
            user['_id'] = str(user['_id'])
            user.pop('password_hash', None)  # Remove password hash for security
            
        return jsonify({
            "success": True,
            "users": all_users,
            "total_count": len(all_users),
            "message": f"Retrieved {len(all_users)} users successfully"
        }), 200
        
    except Exception as e:
        print(f"[GET USERS ERROR] {str(e)}")
        return jsonify({"error": "Failed to retrieve users. Please try again."}), 500

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

@user_bp.route('/users/stats', methods=['GET'])
@jwt_required()
def get_user_stats():
    """Get user statistics (Admin only)"""
    try:
        # Check if current user is admin
        current_user_email = get_jwt_identity()
        db = get_db()
        users = user_collection(db)
        
        current_user = users.find_one({'email': current_user_email})
        if not current_user or current_user.get('role') != 'admin':
            return jsonify({"success": False, "message": "Admin access required"}), 403
        
        # Get role-based counts
        total_users = users.count_documents({})
        admin_count = users.count_documents({'role': 'admin'})
        society_count = users.count_documents({'role': 'society'})
        regular_user_count = users.count_documents({'role': 'user'})
        
        # Get recent users (last 30 days) - simplified version
        from datetime import datetime, timedelta
        thirty_days_ago = datetime.now() - timedelta(days=30)
        
        # Note: This assumes you have a 'created_at' field in your user documents
        # If not, you can remove this or add the field when creating users
        recent_users = 0
        try:
            recent_users = users.count_documents({
                'created_at': {'$gte': thirty_days_ago}
            })
        except:
            # If created_at field doesn't exist, skip this stat
            pass
        
        return jsonify({
            "success": True,
            "stats": {
                "total_users": total_users,
                "admin_count": admin_count,
                "society_count": society_count,
                "regular_user_count": regular_user_count,
                "recent_users_30_days": recent_users,
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
        return jsonify({"success": False, "message": "Failed to retrieve user statistics"}), 500

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
