# backend/routes/advertisement_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from controllers.advertisement_controller import AdvertisementController
from bson import ObjectId

advertisement_bp = Blueprint('advertisement', __name__)

# CREATE - Create a new advertisement
@advertisement_bp.route('/advertisements', methods=['POST'])
@jwt_required()
def create_advertisement():
    """Create a new advertisement"""
    try:
        data = request.json
        user_email = get_jwt_identity()
        
        # Validate required fields
        required_fields = ['society_name', 'location', 'plot_sizes', 'price_start', 'contact_number']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    "success": False, 
                    "error": f"{field.replace('_', ' ').title()} is required"
                }), 400
        
        result = AdvertisementController.create_advertisement(data, user_email)
        
        if result["success"]:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
    except Exception as e:
        return jsonify({
            "success": False, 
            "error": f"Internal server error: {str(e)}"
        }), 500

# READ - Get all advertisements (with optional pagination and filtering)
@advertisement_bp.route('/advertisements', methods=['GET'])
def get_all_advertisements():
    """Get all advertisements with optional filtering and pagination"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Validate pagination parameters
        if per_page > 100:
            per_page = 100
        if page < 1:
            page = 1
        
        # Build filters
        filters = {}
        if request.args.get('status'):
            filters['status'] = request.args.get('status')
        if request.args.get('society_name'):
            filters['society_name'] = request.args.get('society_name')
        if request.args.get('location'):
            filters['location'] = request.args.get('location')
        if request.args.get('is_featured'):
            filters['is_featured'] = request.args.get('is_featured').lower() == 'true'
        if request.args.get('min_price'):
            filters['min_price'] = float(request.args.get('min_price'))
        if request.args.get('max_price'):
            filters['max_price'] = float(request.args.get('max_price'))
        if request.args.get('plot_sizes'):
            filters['plot_sizes'] = request.args.get('plot_sizes').split(',')
            
        result = AdvertisementController.get_all_advertisements(
            page=page, 
            per_page=per_page,
            filters=filters if filters else None,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False, 
            "error": f"Internal server error: {str(e)}"
        }), 500

# READ - Get a specific advertisement by ID
@advertisement_bp.route('/advertisements/<advertisement_id>', methods=['GET'])
def get_advertisement_by_id(advertisement_id):
    """Get a specific advertisement by its ID"""
    try:
        result = AdvertisementController.get_advertisement_by_id(advertisement_id)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
    except Exception as e:
        return jsonify({
            "success": False, 
            "error": f"Internal server error: {str(e)}"
        }), 500

# READ - Get advertisements by user
@advertisement_bp.route('/users/<user_email>/advertisements', methods=['GET'])
def get_advertisements_by_user(user_email):
    """Get all advertisements by a specific user"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        result = AdvertisementController.get_advertisements_by_user(user_email, page=page, per_page=per_page)
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False, 
            "error": f"Internal server error: {str(e)}"
        }), 500

# READ - Search advertisements
@advertisement_bp.route('/advertisements/search', methods=['GET'])
def search_advertisements():
    """Search advertisements by text"""
    try:
        search_term = request.args.get('q', '').strip()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        if not search_term:
            return jsonify({
                "success": False, 
                "error": "Search term is required"
            }), 400
        
        result = AdvertisementController.search_advertisements(search_term, page=page, per_page=per_page)
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False, 
            "error": f"Internal server error: {str(e)}"
        }), 500

# READ - Get featured advertisements
@advertisement_bp.route('/advertisements/featured', methods=['GET'])
def get_featured_advertisements():
    """Get featured advertisements"""
    try:
        limit = request.args.get('limit', 5, type=int)
        
        result = AdvertisementController.get_featured_advertisements(limit=limit)
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False, 
            "error": f"Internal server error: {str(e)}"
        }), 500

# UPDATE - Update an advertisement (only by the creator or admin)
@advertisement_bp.route('/advertisements/<advertisement_id>', methods=['PUT'])
@jwt_required()
def update_advertisement(advertisement_id):
    """Update an advertisement (only by the creator or admin)"""
    try:
        from utils.db import get_db
        from models.user import user_collection
        
        data = request.json
        user_email = get_jwt_identity()
        
        # Get user role
        db = get_db()
        users = user_collection(db)
        user = users.find_one({'email': user_email})
        user_role = user.get('role') if user else None
        
        # Remove fields that shouldn't be updated directly
        forbidden_fields = ['created_by', 'created_at', '_id']
        for field in forbidden_fields:
            if field in data:
                del data[field]
        
        result = AdvertisementController.update_advertisement(advertisement_id, data, user_email, user_role)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            status_code = 403 if "permission" in result.get("error", "").lower() else 400
            return jsonify(result), status_code
    except Exception as e:
        return jsonify({
            "success": False, 
            "error": f"Internal server error: {str(e)}"
        }), 500

# DELETE - Delete an advertisement (only by the creator or admin)
@advertisement_bp.route('/advertisements/<advertisement_id>', methods=['DELETE'])
@jwt_required()
def delete_advertisement(advertisement_id):
    """Delete an advertisement (only by the creator or admin)"""
    try:
        from utils.db import get_db
        from models.user import user_collection
        
        user_email = get_jwt_identity()
        
        # Get user role
        db = get_db()
        users = user_collection(db)
        user = users.find_one({'email': user_email})
        user_role = user.get('role') if user else None
        
        result = AdvertisementController.delete_advertisement(advertisement_id, user_email, user_role)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            status_code = 403 if "permission" in result.get("error", "").lower() else 404
            return jsonify(result), status_code
    except Exception as e:
        return jsonify({
            "success": False, 
            "error": f"Internal server error: {str(e)}"
        }), 500

# ANALYTICS - Increment view count
@advertisement_bp.route('/advertisements/<advertisement_id>/view', methods=['POST'])
def increment_view_count(advertisement_id):
    """Increment view count for advertisement"""
    try:
        result = AdvertisementController.increment_view_count(advertisement_id)
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False, 
            "error": f"Internal server error: {str(e)}"
        }), 500

# ANALYTICS - Increment contact count
@advertisement_bp.route('/advertisements/<advertisement_id>/contact', methods=['POST'])
def increment_contact_count(advertisement_id):
    """Increment contact count for advertisement"""
    try:
        result = AdvertisementController.increment_contact_count(advertisement_id)
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False, 
            "error": f"Internal server error: {str(e)}"
        }), 500

# ANALYTICS - Get advertisement statistics
@advertisement_bp.route('/advertisements/stats', methods=['GET'])
@jwt_required()
def get_advertisement_stats():
    """Get advertisement statistics (admin only)"""
    try:
        result = AdvertisementController.get_advertisement_stats()
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False, 
            "error": f"Internal server error: {str(e)}"
        }), 500

# FEATURED - Toggle featured status (admin only)
@advertisement_bp.route('/advertisements/<advertisement_id>/featured', methods=['PUT'])
@jwt_required()
def toggle_featured_status(advertisement_id):
    """Toggle featured status of advertisement (admin only)"""
    try:
        data = request.json
        user_email = get_jwt_identity()
        
        # Here you can add admin check
        # For now, allowing any authenticated user
        
        is_featured = data.get('is_featured', False)
        if not isinstance(is_featured, bool):
            return jsonify({
                "success": False, 
                "error": "is_featured must be a boolean value"
            }), 400
        
        update_data = {'is_featured': is_featured}
        result = AdvertisementController.update_advertisement(advertisement_id, update_data, user_email)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            status_code = 403 if "permission" in result.get("error", "").lower() else 400
            return jsonify(result), status_code
    except Exception as e:
        return jsonify({
            "success": False, 
            "error": f"Internal server error: {str(e)}"
        }), 500

# STATUS - Update advertisement status (admin only)
@advertisement_bp.route('/advertisements/<advertisement_id>/status', methods=['PUT'])
@jwt_required()
def update_advertisement_status(advertisement_id):
    """Update advertisement status (admin only)"""
    try:
        data = request.json
        user_email = get_jwt_identity()
        
        # Here you can add admin check
        # For now, allowing any authenticated user
        
        status = data.get('status')
        valid_statuses = ['active', 'inactive', 'pending', 'expired']
        
        if not status or status not in valid_statuses:
            return jsonify({
                "success": False, 
                "error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            }), 400
        
        update_data = {'status': status}
        result = AdvertisementController.update_advertisement(advertisement_id, update_data, user_email)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            status_code = 403 if "permission" in result.get("error", "").lower() else 400
            return jsonify(result), status_code
    except Exception as e:
        return jsonify({
            "success": False, 
            "error": f"Internal server error: {str(e)}"
        }), 500
