from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from controllers.user_profile_controller import (
    UserProfileController,
    UserActivityController,
)
from models.user import user_collection
from utils.db import get_db

user_profile_bp = Blueprint('user_profile', __name__)

# ============= USER PROFILE ROUTES =============

@user_profile_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    """Get current user's profile"""
    try:
        current_user_email = get_jwt_identity()
        
        # Get user ID from email
        db = get_db()
        users = user_collection(db)
        user = users.find_one({'email': current_user_email})
        
        if not user:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404
        
        user_id = str(user['_id'])
        profile = UserProfileController.get_profile(user_id)
        
        if profile:
            # Add email from user table to response (not stored in profile)
            profile['email'] = current_user_email
            # Add verification status from user table
            profile['is_verified'] = user.get('is_verified', False)
            profile['verified'] = user.get('verified', False)
            profile['email_verified'] = user.get('email_verified', False)
            return jsonify({
                "success": True,
                "data": profile,
                "message": "Profile retrieved successfully"
            }), 200
        else:
            # No profile exists yet, but return basic user info with verification status
            basic_profile = {
                'email': current_user_email,
                'is_verified': user.get('is_verified', False),
                'verified': user.get('verified', False), 
                'email_verified': user.get('email_verified', False)
            }
            return jsonify({
                "success": True,
                "data": basic_profile,
                "message": "No profile found, but user data available"
            }), 200
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to get profile: {str(e)}"
        }), 500

@user_profile_bp.route('/profile', methods=['POST', 'PUT'])
@jwt_required()
def create_or_update_profile():
    """Create or update user profile"""
    try:
        current_user_email = get_jwt_identity()
        
        # Get user ID from email
        db = get_db()
        users = user_collection(db)
        user = users.find_one({'email': current_user_email})
        
        if not user:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404
        
        user_id = str(user['_id'])
        
        # Get form data (email is never stored - always fetched from user_id)
        # Even if email is sent in request, it's ignored
        profile_data = {
            'cnic': request.form.get('cnic', ''),
            'first_name': request.form.get('firstName', ''),
            'last_name': request.form.get('lastName', ''),
            'phone': request.form.get('phone', ''),
        }
        
        # Remove empty values
        profile_data = {k: v for k, v in profile_data.items() if v}
        
        # Handle file uploads
        files = {}
        if 'profileImage' in request.files:
            files['profile_image'] = request.files['profileImage']
        if 'cnicFront' in request.files:
            files['cnic_front'] = request.files['cnicFront']
        if 'cnicBack' in request.files:
            files['cnic_back'] = request.files['cnicBack']
        
        success, message = UserProfileController.create_or_update_profile(
            user_id, profile_data, files
        )
        
        if success:
            updated_profile = UserProfileController.get_profile(user_id)
            # Add email from user table to response (not stored in profile)
            if updated_profile:
                updated_profile['email'] = current_user_email
            return jsonify({
                "success": True,
                "data": updated_profile,
                "message": message
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": message
            }), 400
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to update profile: {str(e)}"
        }), 500

@user_profile_bp.route('/profile', methods=['DELETE'])
@jwt_required()
def delete_user_profile():
    """Delete user profile"""
    try:
        current_user_email = get_jwt_identity()
        
        # Get user ID from email
        db = get_db()
        users = user_collection(db)
        user = users.find_one({'email': current_user_email})
        
        if not user:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404
        
        user_id = str(user['_id'])
        success, message = UserProfileController.delete_profile(user_id)
        
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
        return jsonify({
            "success": False,
            "error": f"Failed to delete profile: {str(e)}"
        }), 500

# ============= USER ACTIVITY & PROGRESS ROUTES =============
@user_profile_bp.route('/activities', methods=['GET'])
@jwt_required()
def get_user_activities():
    """Get user activities with pagination"""
    try:
        current_user_email = get_jwt_identity()
        
        # Get user ID from email
        db = get_db()
        users = user_collection(db)
        user = users.find_one({'email': current_user_email})
        
        if not user:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404
        
        user_id = str(user['_id'])
        
        # Get pagination parameters
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        activities = UserActivityController.get_user_activities(user_id, limit, offset)
        
        return jsonify({
            "success": True,
            "data": activities,
            "total": len(activities),
            "limit": limit,
            "offset": offset,
            "message": "Activities retrieved successfully"
        }), 200
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to get activities: {str(e)}"
        }), 500

@user_profile_bp.route('/progress', methods=['GET'])
@jwt_required()
def get_user_progress():
    """Get user progress summary"""
    try:
        current_user_email = get_jwt_identity()
        
        # Get user ID from email
        db = get_db()
        users = user_collection(db)
        user = users.find_one({'email': current_user_email})
        
        if not user:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404
        
        user_id = str(user['_id'])
        
        progress = UserActivityController.get_user_progress_summary(user_id)
        
        return jsonify({
            "success": True,
            "data": progress,
            "message": "Progress summary retrieved successfully"
        }), 200
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to get progress: {str(e)}"
        }), 500
