# backend/routes/advertisement_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from controllers.advertisement_controller import AdvertisementController
from controllers.advertisement_plan_controller import AdvertisementPlanController

advertisement_bp = Blueprint('advertisement', __name__)

# ===== ADVERTISEMENT PLAN ROUTES (Admin Only) =====

@advertisement_bp.route('/advertisement-plans', methods=['POST'])
@jwt_required()
def create_plan():
    """Create advertisement plan (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({"success": False, "error": "Admin access required"}), 403
        
        result = AdvertisementPlanController.create_plan(request.json)
        return jsonify(result), 201 if result['success'] else 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@advertisement_bp.route('/advertisement-plans', methods=['GET'])
def get_all_plans():
    """Get all advertisement plans"""
    try:
        active_only = request.args.get('active_only', 'false').lower() == 'true'
        result = AdvertisementPlanController.get_all_plans(active_only)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@advertisement_bp.route('/advertisement-plans/<plan_id>', methods=['GET'])
def get_plan(plan_id):
    """Get plan by ID"""
    try:
        result = AdvertisementPlanController.get_plan_by_id(plan_id)
        return jsonify(result), 200 if result['success'] else 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@advertisement_bp.route('/advertisement-plans/<plan_id>', methods=['PUT'])
@jwt_required()
def update_plan(plan_id):
    """Update advertisement plan (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({"success": False, "error": "Admin access required"}), 403
        
        result = AdvertisementPlanController.update_plan(plan_id, request.json)
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@advertisement_bp.route('/advertisement-plans/<plan_id>', methods=['DELETE'])
@jwt_required()
def delete_plan(plan_id):
    """Delete advertisement plan (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({"success": False, "error": "Admin access required"}), 403
        
        result = AdvertisementPlanController.delete_plan(plan_id)
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@advertisement_bp.route('/advertisement-plans/<plan_id>/toggle-status', methods=['POST'])
@jwt_required()
def toggle_plan_status(plan_id):
    """Toggle plan active status (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({"success": False, "error": "Admin access required"}), 403
        
        result = AdvertisementPlanController.toggle_active_status(plan_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ===== ADVERTISEMENT ROUTES =====

@advertisement_bp.route('/advertisements', methods=['POST'])
@jwt_required()
def create_advertisement():
    """Create advertisement request"""
    try:
        user_email = get_jwt_identity()
        result = AdvertisementController.create_advertisement(request.json, user_email)
        return jsonify(result), 201 if result['success'] else 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@advertisement_bp.route('/advertisements', methods=['GET'])
@jwt_required()
def get_all_advertisements():
    """Get all advertisements with pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 100)
        
        filters = {}
        if request.args.get('status'):
            filters['status'] = request.args.get('status')
        
        claims = get_jwt()
        if claims.get('role') != 'admin':
            # Regular users only see their own ads
            filters['user_email'] = get_jwt_identity()
        
        result = AdvertisementController.get_all_advertisements(filters, page, per_page)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@advertisement_bp.route('/advertisements/<ad_id>', methods=['GET'])
@jwt_required()
def get_advertisement(ad_id):
    """Get advertisement by ID"""
    try:
        result = AdvertisementController.get_advertisement_by_id(ad_id)
        return jsonify(result), 200 if result['success'] else 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@advertisement_bp.route('/advertisements/pending', methods=['GET'])
@jwt_required()
def get_pending_advertisements():
    """Get pending advertisements (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({"success": False, "error": "Admin access required"}), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 100)
        
        result = AdvertisementController.get_pending_advertisements(page, per_page)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@advertisement_bp.route('/advertisements/<ad_id>/approve', methods=['POST'])
@jwt_required()
def approve_advertisement(ad_id):
    """Approve advertisement (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({"success": False, "error": "Admin access required"}), 403
        
        result = AdvertisementController.approve_advertisement(ad_id)
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@advertisement_bp.route('/advertisements/<ad_id>/reject', methods=['POST'])
@jwt_required()
def reject_advertisement(ad_id):
    """Reject advertisement (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({"success": False, "error": "Admin access required"}), 403
        
        if not request.json or 'admin_notes' not in request.json:
            return jsonify({"success": False, "error": "Rejection reason required"}), 400
        
        result = AdvertisementController.reject_advertisement(
            ad_id, 
            request.json['admin_notes']
        )
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@advertisement_bp.route('/advertisements/active', methods=['GET'])
def get_active_advertisements():
    """Get active advertisements for public display"""
    try:
        result = AdvertisementController.get_active_advertisements()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@advertisement_bp.route('/advertisements/<ad_id>/impression', methods=['POST'])
def track_impression(ad_id):
    """Track advertisement impression"""
    try:
        result = AdvertisementController.increment_impressions(ad_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@advertisement_bp.route('/advertisements/<ad_id>', methods=['PUT'])
@jwt_required()
def update_advertisement(ad_id):
    """Update advertisement (admin only - can update status but not payment_status)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({"success": False, "error": "Admin access required"}), 403
        
        # Don't allow payment_status to be updated via this endpoint
        update_data = request.json.copy()
        if 'payment_status' in update_data:
            del update_data['payment_status']
        
        result = AdvertisementController.update_advertisement(ad_id, update_data)
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@advertisement_bp.route('/advertisements/<ad_id>', methods=['DELETE'])
@jwt_required()
def delete_advertisement(ad_id):
    """Delete advertisement (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({"success": False, "error": "Admin access required"}), 403
        
        result = AdvertisementController.delete_advertisement(ad_id)
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


