from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from controllers.user_profile_controller import (
    UserProfileController, 
    ApprovalRequestController, 
    UserActivityController
)
from models.user import user_collection
from utils.db import get_db
from bson import ObjectId
from datetime import datetime
from models.society_profile import society_profile_collection

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
            return jsonify({
                "success": True,
                "data": profile,
                "message": "Profile retrieved successfully"
            }), 200
        else:
            return jsonify({
                "success": True,
                "data": None,
                "message": "Profile not found"
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
        
        # Get form data
        profile_data = {
            'cnic': request.form.get('cnic', ''),
            'first_name': request.form.get('firstName', ''),
            'last_name': request.form.get('lastName', ''),
            'phone': request.form.get('phone', ''),
            'email': request.form.get('email', current_user_email),
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

# ============= APPROVAL REQUEST ROUTES =============

@user_profile_bp.route('/approval-requests', methods=['GET'])
@jwt_required()
def get_approval_requests():
    """Get all approval requests for current user"""
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
        requests = ApprovalRequestController.get_user_approval_requests(user_id)
        
        return jsonify({
            "success": True,
            "data": requests,
            "total": len(requests),
            "message": "Approval requests retrieved successfully"
        }), 200
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to get approval requests: {str(e)}"
        }), 500

@user_profile_bp.route('/approval-requests', methods=['POST'])
@jwt_required()
def create_approval_request():
    """Create a new approval request"""
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
        
        # Get form data
        request_data = {
            # Society info comes from the user form (optional but useful for filtering by society)
            'society_id': request.form.get('societyId', ''),
            'society_name': request.form.get('societyName', ''),
            'plot_id': request.form.get('plotId', ''),
            # Store human-readable plot number alongside the plot document ID
            'plot_number': request.form.get('plotNumber', ''),
            'plot_details': request.form.get('plotDetails', ''),
            'area': request.form.get('area', ''),
            'design_type': request.form.get('designType', ''),
            'notes': request.form.get('notes', ''),
            'status': 'Pending'
        }
        
        # Handle floor plan file upload
        files = {}
        if 'floorPlanFile' in request.files:
            files['floor_plan_file'] = request.files['floorPlanFile']
        
        request_id, message = ApprovalRequestController.create_approval_request(
            user_id, request_data, files
        )
        
        if request_id:
            created_request = ApprovalRequestController.get_approval_request(request_id)
            return jsonify({
                "success": True,
                "data": created_request,
                "message": message
            }), 201
        else:
            return jsonify({
                "success": False,
                "error": message
            }), 400
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to create approval request: {str(e)}"
        }), 500

@user_profile_bp.route('/approval-requests/<request_id>', methods=['GET'])
@jwt_required()
def get_approval_request(request_id):
    """Get a specific approval request"""
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
        
        # Get the approval request
        approval_request = ApprovalRequestController.get_approval_request(request_id)
        
        if not approval_request:
            return jsonify({
                "success": False,
                "message": "Approval request not found"
            }), 404
        
        # Check if the request belongs to the current user
        if approval_request['user_id'] != user_id:
            return jsonify({
                "success": False,
                "message": "Access denied"
            }), 403
        
        return jsonify({
            "success": True,
            "data": approval_request,
            "message": "Approval request retrieved successfully"
        }), 200
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to get approval request: {str(e)}"
        }), 500

@user_profile_bp.route('/approval-requests/<request_id>', methods=['PUT'])
@jwt_required()
def update_approval_request(request_id):
    """Update an approval request (only if status is Pending)"""
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
        
        # Get the approval request to verify ownership and status
        approval_request = ApprovalRequestController.get_approval_request(request_id)
        
        if not approval_request:
            return jsonify({
                "success": False,
                "message": "Approval request not found"
            }), 404
        
        # Check if the request belongs to the current user
        if approval_request['user_id'] != user_id:
            return jsonify({
                "success": False,
                "message": "Access denied"
            }), 403
        
        # Check if request can be updated (only pending requests)
        if approval_request['status'] != 'Pending':
            return jsonify({
                "success": False,
                "message": "Only pending requests can be updated"
            }), 400
        
        # Get update data
        update_data = {}
        if request.json:
            update_data = request.json
        else:
            # Handle form data
            update_data = {
                'plot_id': request.form.get('plotId'),
                'plot_details': request.form.get('plotDetails'),
                'area': request.form.get('area'),
                'design_type': request.form.get('designType'),
                'notes': request.form.get('notes')
            }
        
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        success, message = ApprovalRequestController.update_approval_request(
            request_id, update_data
        )
        
        if success:
            updated_request = ApprovalRequestController.get_approval_request(request_id)
            return jsonify({
                "success": True,
                "data": updated_request,
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
            "error": f"Failed to update approval request: {str(e)}"
        }), 500

@user_profile_bp.route('/approval-requests/<request_id>', methods=['DELETE'])
@jwt_required()
def delete_approval_request(request_id):
    """Delete an approval request"""
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
        
        success, message = ApprovalRequestController.delete_approval_request(
            request_id, user_id
        )
        
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
            "error": f"Failed to delete approval request: {str(e)}"
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

# ============= ADMIN ROUTES (for managing approval requests) =============

@user_profile_bp.route('/admin/approval-requests', methods=['GET'])
@jwt_required()
def get_all_approval_requests():
    """Get all approval requests (admin only)"""
    try:
        current_user_email = get_jwt_identity()
        
        # Check if current user is admin
        db = get_db()
        users = user_collection(db)
        current_user = users.find_one({'email': current_user_email})
        
        # Allow both admin and society (subadmin) roles to view approval requests
        if not current_user or current_user.get('role') not in ['admin', 'society']:
            return jsonify({
                "success": False,
                "message": "Admin access required"
            }), 403
        
        # Get all approval requests
        from controllers.user_profile_controller import approval_request_collection
        requests_collection = approval_request_collection(db)

        # If the current user is a society (subadmin), restrict approval
        # requests to that society only, using the society profile's _id.
        query = {}
        if current_user.get('role') == 'society':
            profiles = society_profile_collection(db)
            profile = profiles.find_one({'user_email': current_user_email})
            if profile:
                society_id = str(profile['_id'])
                query['society_id'] = society_id

        all_requests = list(requests_collection.find(query).sort('created_at', -1))

        # Build a map from user_id -> username/email so we can show
        # the requester name in the admin/subadmin approvals panel.
        # Note: in approval_requests, user_id is stored as a STRING, not ObjectId,
        # so we need to convert it back to ObjectId for the users collection.
        user_id_strs = set()
        for req in all_requests:
            uid = req.get('user_id')
            if isinstance(uid, str) and uid:
                user_id_strs.add(uid)

        users_map = {}
        if user_id_strs:
            object_ids = []
            for uid_str in user_id_strs:
                try:
                    object_ids.append(ObjectId(uid_str))
                except Exception:
                    # Skip invalid ids
                    continue

            if object_ids:
                users_cursor = users.find({'_id': {'$in': object_ids}})
                for u in users_cursor:
                    users_map[str(u['_id'])] = u.get('username') or u.get('email') or ''
        
        # Convert ObjectIds to strings and attach requester name
        for req in all_requests:
            uid = req.get('user_id')
            uid_str = str(uid) if uid is not None else ''
            req['requested_by_name'] = users_map.get(uid_str, '')
            req['user_id'] = uid_str

            req['_id'] = str(req['_id'])
            if req.get('reviewed_by'):
                req['reviewed_by'] = str(req['reviewed_by'])
        
        return jsonify({
            "success": True,
            "data": all_requests,
            "total": len(all_requests),
            "message": "All approval requests retrieved successfully"
        }), 200
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to get approval requests: {str(e)}"
        }), 500

@user_profile_bp.route('/admin/approval-requests/<request_id>/status', methods=['PUT'])
@jwt_required()
def update_approval_request_status(request_id):
    """Update approval request status (admin only)"""
    try:
        current_user_email = get_jwt_identity()
        
        # Check if current user is admin
        db = get_db()
        users = user_collection(db)
        current_user = users.find_one({'email': current_user_email})
        
        # Allow both admin and society (subadmin) roles to change approval request status
        if not current_user or current_user.get('role') not in ['admin', 'society']:
            return jsonify({
                "success": False,
                "message": "Admin access required"
            }), 403
        
        data = request.get_json()
        status = data.get('status')
        admin_comments = data.get('admin_comments', '')
        
        if status not in ['Pending', 'Approved', 'Rejected', 'In Review']:
            return jsonify({
                "success": False,
                "error": "Invalid status"
            }), 400
        
        # Store the action time (when admin/subadmin approves or rejects)
        # as an ISO string so it can be safely returned in JSON and used on the frontend
        update_data = {
            'status': status,
            'admin_comments': admin_comments,
            'reviewed_by': ObjectId(current_user['_id']),
            'reviewed_at': datetime.utcnow().isoformat(),
        }
        
        success, message = ApprovalRequestController.update_approval_request(
            request_id, update_data
        )
        
        if success:
            updated_request = ApprovalRequestController.get_approval_request(request_id)
            return jsonify({
                "success": True,
                "data": updated_request,
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
            "error": f"Failed to update approval request status: {str(e)}"
        }), 500