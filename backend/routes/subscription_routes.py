# backend/routes/subscription_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from controllers.subscription_controller import SubscriptionController

subscription_bp = Blueprint('subscription', __name__)

# ===== SUBSCRIPTION PLAN ROUTES (Admin) =====

# CREATE - Create a new subscription plan (Admin only)
@subscription_bp.route('/plans', methods=['POST'])
@jwt_required()
def create_plan():
    """Create a new subscription plan"""
    try:
        claims = get_jwt()
        user_role = claims.get('role', '')
        
        if user_role != 'admin':
            return jsonify({
                "success": False,
                "error": "Only admins can create subscription plans"
            }), 403
        
        data = request.json
        admin_email = get_jwt_identity()
        
        result = SubscriptionController.create_plan(data, admin_email)
        
        if result["success"]:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        }), 500

# READ - Get all subscription plans
@subscription_bp.route('/plans', methods=['GET'])
def get_all_plans():
    """Get all subscription plans"""
    try:
        status = request.args.get('status')
        
        result = SubscriptionController.get_all_plans(status=status)
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        }), 500

# READ - Get a specific subscription plan by ID
@subscription_bp.route('/plans/<plan_id>', methods=['GET'])
def get_plan_by_id(plan_id):
    """Get a specific subscription plan by its ID"""
    try:
        result = SubscriptionController.get_plan_by_id(plan_id)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        }), 500

# UPDATE - Update a subscription plan (Admin only)
@subscription_bp.route('/plans/<plan_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_plan(plan_id):
    """Update a subscription plan"""
    try:
        claims = get_jwt()
        user_role = claims.get('role', '')
        
        if user_role != 'admin':
            return jsonify({
                "success": False,
                "error": "Only admins can update subscription plans"
            }), 403
        
        data = request.json
        admin_email = get_jwt_identity()
        
        result = SubscriptionController.update_plan(plan_id, data, admin_email)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400 if "not found" not in result.get("error", "").lower() else 404
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        }), 500

# DELETE - Delete a subscription plan (Admin only)
@subscription_bp.route('/plans/<plan_id>', methods=['DELETE'])
@jwt_required()
def delete_plan(plan_id):
    """Delete a subscription plan"""
    try:
        claims = get_jwt()
        user_role = claims.get('role', '')
        
        if user_role != 'admin':
            return jsonify({
                "success": False,
                "error": "Only admins can delete subscription plans"
            }), 403
        
        result = SubscriptionController.delete_plan(plan_id)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        }), 500

# ===== SUBSCRIPTION ROUTES (User) =====

# CREATE - Subscribe to a plan
@subscription_bp.route('/subscribe/<plan_id>', methods=['POST'])
@jwt_required()
def subscribe_to_plan(plan_id):
    """Subscribe to a plan"""
    try:
        user_email = get_jwt_identity()
        
        result = SubscriptionController.subscribe_to_plan(plan_id, user_email)
        
        if result["success"]:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        }), 500

# READ - Get current user's subscription
@subscription_bp.route('/my-subscription', methods=['GET'])
@jwt_required()
def get_my_subscription():
    """Get current user's active subscription"""
    try:
        user_email = get_jwt_identity()
        
        result = SubscriptionController.get_user_subscription(user_email)
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        }), 500

# READ - Get all subscriptions (Admin only)
@subscription_bp.route('/subscriptions', methods=['GET'])
@jwt_required()
def get_all_subscriptions():
    """Get all subscriptions with optional filtering"""
    try:
        claims = get_jwt()
        user_role = claims.get('role', '')
        
        if user_role != 'admin':
            return jsonify({
                "success": False,
                "error": "Only admins can view all subscriptions"
            }), 403
        
        # Build filters
        filters = {}
        if request.args.get('status'):
            filters['status'] = request.args.get('status')
        if request.args.get('user_email'):
            filters['user_email'] = request.args.get('user_email')
        if request.args.get('plan_id'):
            filters['plan_id'] = request.args.get('plan_id')
        
        result = SubscriptionController.get_all_subscriptions(filters=filters if filters else None)
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        }), 500

# UPDATE - Cancel subscription
@subscription_bp.route('/subscriptions/<subscription_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_subscription(subscription_id):
    """Cancel a subscription"""
    try:
        user_email = get_jwt_identity()
        
        result = SubscriptionController.cancel_subscription(subscription_id, user_email)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400 if "not found" not in result.get("error", "").lower() else 404
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        }), 500

# READ - Get subscription statistics (Admin only)
@subscription_bp.route('/subscriptions/stats', methods=['GET'])
@jwt_required()
def get_subscription_stats():
    """Get subscription statistics"""
    try:
        claims = get_jwt()
        user_role = claims.get('role', '')
        
        if user_role != 'admin':
            return jsonify({
                "success": False,
                "error": "Only admins can view subscription statistics"
            }), 403
        
        result = SubscriptionController.get_subscription_stats()
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        }), 500
