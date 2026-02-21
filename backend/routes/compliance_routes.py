from flask import Blueprint, request, jsonify
from controllers.compliance_controller import ComplianceController
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from functools import wraps
from bson import ObjectId
from utils.db import get_db

compliance_bp = Blueprint('compliance', __name__)

# Middleware to verify sub-admin access
def subadmin_required(f):
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        try:
            # Get user email from JWT
            email = get_jwt_identity()
            claims = get_jwt()
            
            # Get user from database to check role and society_id
            db = get_db()
            users = db['users']
            user = users.find_one({'email': email})
            
            if not user:
                return jsonify({'success': False, 'message': 'User not found'}), 404
            
            # Check if user is sub-admin (society role)
            if user.get('role') not in ['society', 'subadmin']:
                return jsonify({'success': False, 'message': 'Sub-admin access required'}), 403
            
            # Get the society profile to use its _id (same as plot controller does)
            society_profiles = db['society_profiles']  # FIXED: Added 's' to match collection name
            user_id_str = str(user['_id'])
            print(f"[Compliance Auth] Looking for society_profile with user_id: {user_id_str}")
            
            society_profile = society_profiles.find_one({'user_id': user_id_str})
            
            if not society_profile:
                print(f"[Compliance Auth] Society profile not found for user_id: {user_id_str}")
                # Check what profiles exist
                all_profiles = list(society_profiles.find({}, {'user_id': 1, '_id': 1}))
                print(f"[Compliance Auth] All society profiles: {all_profiles[:3]}")
                return jsonify({'success': False, 'message': 'Society profile not found'}), 404
            
            print(f"[Compliance Auth] Found society_profile with _id: {society_profile['_id']}")
            
            # Store user_id and society_id in request for later use
            request.user_id = str(user['_id'])
            request.society_id = str(society_profile['_id'])  # Use society_profile's _id (matches plot.societyId)
            
        except Exception as e:
            print(f"[Compliance Auth] Error: {str(e)}")
            return jsonify({'success': False, 'message': 'Authentication failed'}), 401
        
        return f(*args, **kwargs)
    
    return decorated_function


@compliance_bp.route('/create', methods=['POST'])
@subadmin_required
def create_compliance():
    """Create compliance rules for a plot size (Sub-admin only)"""
    try:
        data = request.get_json()
        
        if not data.get('marla_size'):
            return jsonify({
                'success': False,
                'message': 'Marla size is required'
            }), 400
        
        # Use society_id from token
        society_id = request.society_id
        user_id = request.user_id
        
        print(f"[Compliance Create] user_id: {user_id}, society_id: {society_id}, marla_size: {data.get('marla_size')}")
        
        compliance_id, message = ComplianceController.create_compliance(
            user_id, society_id, data
        )
        
        print(f"[Compliance Create] Result: compliance_id={compliance_id}, message={message}")
        
        if compliance_id:
            return jsonify({
                'success': True,
                'message': message,
                'compliance_id': compliance_id
            }), 201
        else:
            return jsonify({
                'success': False,
                'message': message
            }), 400
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error creating compliance: {str(e)}'
        }), 500


@compliance_bp.route('/society/<society_id>', methods=['GET'])
def get_society_compliances(society_id):
    """Get all compliance rules for a society"""
    try:
        print(f"[Compliance Get] Fetching compliances for society_id: {society_id}")
        compliances = ComplianceController.get_society_compliances(society_id)
        print(f"[Compliance Get] Found {len(compliances)} compliance rules")
        
        return jsonify({
            'success': True,
            'data': compliances,
            'count': len(compliances)
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching compliances: {str(e)}'
        }), 500


@compliance_bp.route('/society/<society_id>/marla/<marla_size>', methods=['GET'])
def get_compliance_by_plot_size(society_id, marla_size):
    """Get compliance rules for a specific plot size"""
    try:
        compliance = ComplianceController.get_compliance_by_plot_size(society_id, marla_size)
        
        if compliance:
            return jsonify({
                'success': True,
                'data': compliance
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'No compliance rules found for this plot size'
            }), 404
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching compliance: {str(e)}'
        }), 500


@compliance_bp.route('/plot/<plot_id>', methods=['GET'])
def get_compliance_for_plot(plot_id):
    """Get applicable compliance rules for a plot (used during floor plan generation)"""
    try:
        compliance, message = ComplianceController.get_compliance_for_floorplan(plot_id)
        
        if compliance:
            return jsonify({
                'success': True,
                'data': compliance,
                'message': message
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': message
            }), 404
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching compliance: {str(e)}'
        }), 500


@compliance_bp.route('/update/<compliance_id>', methods=['PUT'])
@subadmin_required
def update_compliance(compliance_id):
    """Update compliance rules (Sub-admin only)"""
    try:
        data = request.get_json()
        
        success, message = ComplianceController.update_compliance(compliance_id, data)
        
        if success:
            return jsonify({
                'success': True,
                'message': message
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': message
            }), 400
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error updating compliance: {str(e)}'
        }), 500


@compliance_bp.route('/marla-dimensions/<marla_size>', methods=['GET'])
def get_marla_dimensions(marla_size):
    """Get plot dimensions for marla size (for auto-filling compliance form)"""
    try:
        # Decode URL encoded marla size
        import urllib.parse
        marla_size = urllib.parse.unquote(marla_size)
        
        # Get dimensions from compliance model
        from models.compliance import Compliance
        dimensions = Compliance.get_marla_dimensions(marla_size)
        
        return jsonify({
            'success': True,
            'marla_size': marla_size,
            'dimensions': dimensions,
            'form_data': {
                'plot_dimension_x': dimensions['x'],
                'plot_dimension_y': dimensions['y'],
                'total_plot_area': dimensions['area'],
                'readonly_fields': ['plot_dimension_x', 'plot_dimension_y', 'total_plot_area']
            },
            'message': f'Dimensions retrieved for {marla_size}'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error getting dimensions: {str(e)}'
        }), 500


@compliance_bp.route('/available-marla-sizes', methods=['GET'])
def get_available_marla_sizes():
    """Get available marla sizes from society profile"""
    try:
        # Get society_id from query parameter
        society_id = request.args.get('society_id')
        
        if not society_id:
            return jsonify({
                'success': False,
                'message': 'Society ID is required'
            }), 400
        
        # Get society profile
        db = get_db()
        society_profiles = db['society_profiles']
        society_profile = society_profiles.find_one({'_id': ObjectId(society_id)})
        
        if not society_profile:
            return jsonify({
                'success': False,
                'message': 'Society profile not found'
            }), 404
        
        # Get available plots
        available_plots = society_profile.get('available_plots', [])
        
        if not available_plots:
            return jsonify({
                'success': False,
                'message': 'No marla sizes configured in society profile'
            }), 400
        
        return jsonify({
            'success': True,
            'available_plots': available_plots,
            'society_name': society_profile.get('name', 'Unknown'),
            'message': f'Available marla sizes for {society_profile.get("name", "society")}'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error getting available marla sizes: {str(e)}'
        }), 500


@compliance_bp.route('/delete/<compliance_id>', methods=['DELETE'])
@subadmin_required
def delete_compliance(compliance_id):
    """Delete compliance rules (Sub-admin only)"""
    try:
        success, message = ComplianceController.delete_compliance(compliance_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': message
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': message
            }), 404
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error deleting compliance: {str(e)}'
        }), 500
