from flask import Blueprint
from controllers.floorplan_controller import (
    generate_floorplan,
    save_floorplan,
    get_user_floorplans,
    get_floorplan_details,
    delete_floorplan,
    update_floorplan
)

# Create blueprint
floorplan_bp = Blueprint('floorplan', __name__)

# Floor plan generation routes
@floorplan_bp.route('/floorplan/generate', methods=['POST'])
def generate_floorplan_route():
    """Generate AI-powered floor plan"""
    return generate_floorplan()

@floorplan_bp.route('/floorplan/save', methods=['POST'])
def save_floorplan_route():
    """Save generated floor plan"""
    return save_floorplan()

@floorplan_bp.route('/floorplan/user/<user_id>', methods=['GET'])
def get_user_floorplans_route(user_id):
    """Get all floor plans for a user"""
    from flask import request
    request.args = request.args.copy()
    request.args['user_id'] = user_id
    return get_user_floorplans()

@floorplan_bp.route('/floorplan/<floorplan_id>', methods=['GET'])
def get_floorplan_details_route(floorplan_id):
    """Get detailed floor plan data"""
    from flask import request
    request.args = request.args.copy()
    request.args['floorplan_id'] = floorplan_id
    return get_floorplan_details()

@floorplan_bp.route('/floorplan/<floorplan_id>', methods=['DELETE'])
def delete_floorplan_route(floorplan_id):
    """Delete a floor plan"""
    from flask import request
    request.args = request.args.copy()
    request.args['floorplan_id'] = floorplan_id
    return delete_floorplan()

@floorplan_bp.route('/floorplan/update', methods=['PUT'])
def update_floorplan_route():
    """Update floor plan details"""
    return update_floorplan()

@floorplan_bp.route('/floorplan/update', methods=['POST'])
def update_floorplan_ga_route():
    """Update floor plan with genetic algorithm optimization"""
    from controllers.floorplan_controller import update_floorplan_with_ga
    return update_floorplan_with_ga()

@floorplan_bp.route('/floorplan/variations', methods=['POST'])
def generate_variations_route():
    """Generate variations using genetic algorithm"""
    from controllers.floorplan_controller import generate_floorplan_variations
    return generate_floorplan_variations()

# Health check route for floor plan service
@floorplan_bp.route('/floorplan/health', methods=['GET'])
def floorplan_health():
    """Health check for floor plan service"""
    from flask import jsonify
    return jsonify({
        'success': True,
        'service': 'Floor Plan Generation',
        'status': 'healthy',
        'message': 'Floor plan service is running'
    })