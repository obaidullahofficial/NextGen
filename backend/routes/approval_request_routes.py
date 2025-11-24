from datetime import datetime

from bson import ObjectId
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from controllers.approval_request_controller import ApprovalRequestController
from models.society_profile import society_profile_collection
from models.user import user_collection
from models.plot import plot_collection
from utils.db import get_db

approval_request_bp = Blueprint('approval_request', __name__)


# ============= APPROVAL REQUEST ROUTES (USER) =============


@approval_request_bp.route('/approval-requests', methods=['GET'])
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
                'success': False,
                'message': 'User not found',
            }), 404

        user_id = str(user['_id'])
        requests = ApprovalRequestController.get_user_approval_requests(user_id)

        return jsonify({
            'success': True,
            'data': requests,
            'total': len(requests),
            'message': 'Approval requests retrieved successfully',
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get approval requests: {str(e)}',
        }), 500


@approval_request_bp.route('/approval-requests', methods=['POST'])
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
                'success': False,
                'message': 'User not found',
            }), 404

        user_id = str(user['_id'])

        # Get form data
        request_data = {
            # Society info comes from the user form (optional but useful for filtering by society)
            'society_id': request.form.get('societyId', ''),
            'plot_id': request.form.get('plotId', ''),
            'design_type': request.form.get('designType', ''),
            'notes': request.form.get('notes', ''),
            'status': 'Pending',
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
                'success': True,
                'data': created_request,
                'message': message,
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': message,
            }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to create approval request: {str(e)}',
        }), 500


@approval_request_bp.route('/approval-requests/<request_id>', methods=['GET'])
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
                'success': False,
                'message': 'User not found',
            }), 404

        user_id = str(user['_id'])

        # Get the approval request
        approval_request = ApprovalRequestController.get_approval_request(request_id)

        if not approval_request:
            return jsonify({
                'success': False,
                'message': 'Approval request not found',
            }), 404

        # Check if the request belongs to the current user
        if approval_request['user_id'] != user_id:
            return jsonify({
                'success': False,
                'message': 'Access denied',
            }), 403

        return jsonify({
            'success': True,
            'data': approval_request,
            'message': 'Approval request retrieved successfully',
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get approval request: {str(e)}',
        }), 500


@approval_request_bp.route('/approval-requests/<request_id>', methods=['PUT'])
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
                'success': False,
                'message': 'User not found',
            }), 404

        user_id = str(user['_id'])

        # Get the approval request to verify ownership and status
        approval_request = ApprovalRequestController.get_approval_request(request_id)

        if not approval_request:
            return jsonify({
                'success': False,
                'message': 'Approval request not found',
            }), 404

        # Check if the request belongs to the current user
        if approval_request['user_id'] != user_id:
            return jsonify({
                'success': False,
                'message': 'Access denied',
            }), 403

        # Check if request can be updated (only pending requests)
        if approval_request['status'] != 'Pending':
            return jsonify({
                'success': False,
                'message': 'Only pending requests can be updated',
            }), 400

        # Get update data
        update_data = {}
        if request.json:
            update_data = request.json
            # Ensure legacy 'area' field is not updated anymore
            update_data.pop('area', None)
        else:
            # Handle form data
            update_data = {
                'plot_id': request.form.get('plotId'),
                'design_type': request.form.get('designType'),
                'notes': request.form.get('notes'),
            }

        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}

        success, message = ApprovalRequestController.update_approval_request(
            request_id, update_data
        )

        if success:
            updated_request = ApprovalRequestController.get_approval_request(request_id)
            return jsonify({
                'success': True,
                'data': updated_request,
                'message': message,
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': message,
            }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to update approval request: {str(e)}',
        }), 500


@approval_request_bp.route('/approval-requests/<request_id>', methods=['DELETE'])
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
                'success': False,
                'message': 'User not found',
            }), 404

        user_id = str(user['_id'])

        success, message = ApprovalRequestController.delete_approval_request(
            request_id, user_id
        )

        if success:
            return jsonify({
                'success': True,
                'message': message,
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': message,
            }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to delete approval request: {str(e)}',
        }), 500


# ============= ADMIN ROUTES (for managing approval requests) =============


@approval_request_bp.route('/admin/approval-requests', methods=['GET'])
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
                'success': False,
                'message': 'Admin access required',
            }), 403

        # Get all approval requests
        from models.approval_request import approval_request_collection

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
                    users_map[str(u['_id'])] = (
                        u.get('username') or u.get('email') or ''
                    )

        # Build a map from plot_id -> plot_number so subadmin panel can show plot numbers
        plot_id_strs = set()
        for req in all_requests:
            pid = req.get('plot_id')
            if isinstance(pid, str) and pid:
                plot_id_strs.add(pid)

        plots_map = {}
        if plot_id_strs:
            plot_object_ids = []
            for pid_str in plot_id_strs:
                try:
                    plot_object_ids.append(ObjectId(pid_str))
                except Exception:
                    # Skip invalid ids
                    continue

            if plot_object_ids:
                plots_collection = plot_collection(db)
                plots_cursor = plots_collection.find({'_id': {'$in': plot_object_ids}})
                for p in plots_cursor:
                    plots_map[str(p['_id'])] = p.get('plot_number') or ''

        # Convert ObjectIds to strings and attach requester name and derived plot number
        for req in all_requests:
            uid = req.get('user_id')
            uid_str = str(uid) if uid is not None else ''
            req['requested_by_name'] = users_map.get(uid_str, '')
            req['user_id'] = uid_str

            pid = req.get('plot_id')
            pid_str = str(pid) if pid is not None else ''
            req['plot_id'] = pid_str
            req['plot_number'] = plots_map.get(pid_str, '')

            req['_id'] = str(req['_id'])
            if req.get('reviewed_by'):
                req['reviewed_by'] = str(req['reviewed_by'])

        return jsonify({
            'success': True,
            'data': all_requests,
            'total': len(all_requests),
            'message': 'All approval requests retrieved successfully',
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get approval requests: {str(e)}',
        }), 500


@approval_request_bp.route('/admin/approval-requests/<request_id>/status', methods=['PUT'])
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
                'success': False,
                'message': 'Admin access required',
            }), 403

        data = request.get_json()
        status = data.get('status')
        admin_comments = data.get('admin_comments', '')

        if status not in ['Pending', 'Approved', 'Rejected', 'In Review']:
            return jsonify({
                'success': False,
                'error': 'Invalid status',
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
            updated_request = ApprovalRequestController.get_approval_request(
                request_id
            )
            return jsonify({
                'success': True,
                'data': updated_request,
                'message': message,
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': message,
            }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to update approval request status: {str(e)}',
        }), 500
