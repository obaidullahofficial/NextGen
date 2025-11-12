# backend/routes/review_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from controllers.review_controller import ReviewController
from bson import ObjectId

review_bp = Blueprint('review', __name__)

# CREATE - Create a new review
@review_bp.route('/reviews', methods=['POST'])
@jwt_required()
def create_review():
    """Create a new review"""
    try:
        data = request.json
        plot_id = data.get('plot_id')
        rating = data.get('rating')
        comment = data.get('comment')
        
        # Get user email from JWT token
        user_email = get_jwt_identity()
        
        # Validate required fields
        if not plot_id:
            return jsonify({"success": False, "error": "plot_id is required"}), 400
        if not rating:
            return jsonify({"success": False, "error": "rating is required"}), 400
        if not comment:
            return jsonify({"success": False, "error": "comment is required"}), 400
        
        # Validate rating range
        if not isinstance(rating, (int, float)) or rating < 1 or rating > 5:
            return jsonify({"success": False, "error": "rating must be between 1 and 5"}), 400
            
        result = ReviewController.create_review(plot_id, user_email, rating, comment)
        
        if result["success"]:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Internal server error: {str(e)}"}), 500

# READ - Get all reviews (with optional pagination and filtering)
@review_bp.route('/reviews', methods=['GET'])
def get_all_reviews():
    """Get all reviews with optional filtering and pagination"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        plot_id = request.args.get('plot_id')
        user_email = request.args.get('user_email')
        min_rating = request.args.get('min_rating', type=float)
        max_rating = request.args.get('max_rating', type=float)
        
        # Validate pagination parameters
        if per_page > 100:
            per_page = 100
        if page < 1:
            page = 1
            
        result = ReviewController.get_all_reviews(
            page=page, 
            per_page=per_page,
            plot_id=plot_id,
            user_email=user_email,
            min_rating=min_rating,
            max_rating=max_rating
        )
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"success": False, "error": f"Internal server error: {str(e)}"}), 500

# READ - Get a specific review by ID
@review_bp.route('/reviews/<review_id>', methods=['GET'])
def get_review_by_id(review_id):
    """Get a specific review by its ID"""
    try:
        result = ReviewController.get_review_by_id(review_id)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
    except Exception as e:
        return jsonify({"success": False, "error": f"Internal server error: {str(e)}"}), 500

# READ - Get reviews by plot ID
@review_bp.route('/plots/<plot_id>/reviews', methods=['GET'])
def get_reviews_by_plot(plot_id):
    """Get all reviews for a specific plot"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        result = ReviewController.get_reviews_by_plot(plot_id, page=page, per_page=per_page)
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"success": False, "error": f"Internal server error: {str(e)}"}), 500

# READ - Get reviews by user
@review_bp.route('/users/<user_email>/reviews', methods=['GET'])
def get_reviews_by_user(user_email):
    """Get all reviews by a specific user"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        result = ReviewController.get_reviews_by_user(user_email, page=page, per_page=per_page)
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"success": False, "error": f"Internal server error: {str(e)}"}), 500

# UPDATE - Update a review (only by the author or admin)
@review_bp.route('/reviews/<review_id>', methods=['PUT'])
@jwt_required()
def update_review(review_id):
    """Update a review (only by the author or admin)"""
    try:
        data = request.json
        user_email = get_jwt_identity()
        
        # Get the fields to update
        rating = data.get('rating')
        comment = data.get('comment')
        
        # Validate rating if provided
        if rating is not None and (not isinstance(rating, (int, float)) or rating < 1 or rating > 5):
            return jsonify({"success": False, "error": "rating must be between 1 and 5"}), 400
        
        result = ReviewController.update_review(review_id, user_email, rating, comment)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 403 if "permission" in result.get("error", "").lower() else 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Internal server error: {str(e)}"}), 500

# DELETE - Delete a review (only by the author or admin)
@review_bp.route('/reviews/<review_id>', methods=['DELETE'])
@jwt_required()
def delete_review(review_id):
    """Delete a review (only by the author or admin)"""
    try:
        user_email = get_jwt_identity()
        
        result = ReviewController.delete_review(review_id, user_email)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 403 if "permission" in result.get("error", "").lower() else 404
    except Exception as e:
        return jsonify({"success": False, "error": f"Internal server error: {str(e)}"}), 500

# ANALYTICS - Get review statistics for a plot
@review_bp.route('/plots/<plot_id>/reviews/stats', methods=['GET'])
def get_plot_review_stats(plot_id):
    """Get review statistics for a specific plot"""
    try:
        result = ReviewController.get_plot_review_stats(plot_id)
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"success": False, "error": f"Internal server error: {str(e)}"}), 500