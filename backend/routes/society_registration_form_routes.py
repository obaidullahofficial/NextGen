from flask import Blueprint, jsonify, request
from controllers.society_registration_form_controller import SocietyRegistrationFormController
from controllers.user_controller import UserController
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_db
from models.user import user_collection

society_registration_form_bp = Blueprint('society_registration_form_bp', __name__)

@society_registration_form_bp.route('/register-society', methods=['POST'])
def register_society():
    data = request.json
    reg_id, message = SocietyRegistrationFormController.register_society(data)
    
    if not reg_id:
        return jsonify({"error": message}), 400
    
    return jsonify({"message": message, "registration_id": reg_id}), 201

@society_registration_form_bp.route('/my-society', methods=['GET'])
@jwt_required()
def get_my_society():
    society, message = SocietyRegistrationFormController.get_my_society()
    
    if not society:
        return jsonify({"error": message}), 404
    
    return jsonify({"society": society, "message": message}), 200

@society_registration_form_bp.route('/registration-forms', methods=['GET'])
@jwt_required()
def get_registration_forms():
    forms, message = SocietyRegistrationFormController.get_registration_forms()
    
    if not forms:
        return jsonify({"error": message}), 403 if "Admin access" in message else 500
    
    return jsonify({
        "success": True,
        "registration_forms": forms,
        "message": message
    }), 200

@society_registration_form_bp.route('/registration-forms/<form_id>', methods=['GET'])
@jwt_required()
def get_registration_form(form_id):
    form, message = SocietyRegistrationFormController.get_registration_form(form_id)
    
    if not form:
        return jsonify({"error": message}), 404
    
    return jsonify({"registration_form": form, "message": message}), 200

@society_registration_form_bp.route('/signup-society', methods=['POST'])
def signup_society():
    """
    Submit society registration form
    - User account should already exist with 'society' role
    - This endpoint registers the society details for an existing user
    """
    data = request.json
    
    # Extract user data (for linking to existing account)
    user_email = data.get('userEmail')
    
    # Extract society data (no user_email stored)
    society_data = {
        'name': data.get('name'),
        'type': data.get('type'),
        'regNo': data.get('regNo'),
        'established': data.get('established'),
        'authority': data.get('authority'),
        'contact': data.get('contact'),
        'website': data.get('website'),
        'plots': data.get('plots')
    }
    
    # Validate required fields
    if not user_email:
        return jsonify({"error": "User email is required"}), 400
    
    society_required = [
        society_data['name'], 
        society_data['type'], 
        society_data['regNo'], 
        society_data['established'], 
        society_data['authority'], 
        society_data['contact'], 
        society_data['website'], 
        society_data['plots']
    ]
    
    if not all(society_required):
        return jsonify({"error": "Society information is incomplete"}), 400
    
    try:
        # Get user from database by email
        db = get_db()
        users = user_collection(db)
        user = users.find_one({'email': user_email})
        
        if not user:
            return jsonify({"error": "User account not found. Please sign up first."}), 404
        
        # Verify user has society role
        if user.get('role') != 'society':
            return jsonify({"error": "Only users with society role can submit this form"}), 403
        
        user_id = str(user['_id'])
        
        # Check if user already has a registration form submitted (by user_id)
        from models.society_registration_form import society_registration_form_collection
        reg_forms = society_registration_form_collection(db)
        existing_form = reg_forms.find_one({'user_id': user_id})
        
        if existing_form:
            return jsonify({"error": "You have already submitted a registration form. Please wait for admin approval."}), 400
        
        # Add user_id to society data (no user_email)
        society_data['user_id'] = user_id
        
        # Register society using controller
        reg_id, message = SocietyRegistrationFormController.signup_society(
            {'email': user_email, 'user_id': user_id, 'role': user.get('role')}, 
            society_data
        )
        
        if not reg_id:
            return jsonify({"error": message}), 400
        
        return jsonify({
            "success": True,
            "message": message,
            "registration_id": reg_id
        }), 201
        
    except Exception as e:
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500

@society_registration_form_bp.route('/registration-forms/<form_id>/status', methods=['PUT'])
@jwt_required()
def update_registration_status(form_id):
    data = request.json
    status = data.get('status')
    
    if not status:
        return jsonify({"error": "Status is required"}), 400
    
    success, message = SocietyRegistrationFormController.update_registration_status(form_id, status)
    
    if not success:
        return jsonify({"error": message}), 403 if "Admin access" in message else 400
    
    return jsonify({"message": message}), 200

@society_registration_form_bp.route('/registration-forms/<form_id>', methods=['DELETE'])
@jwt_required()
def delete_registration_form(form_id):
    """Delete a registration form by ID (Admin only)"""
    success, message = SocietyRegistrationFormController.delete_registration_form(form_id)
    
    if not success:
        return jsonify({
            "success": False,
            "error": message
        }), 403 if "Admin access" in message else 400
    
    return jsonify({
        "success": True,
        "message": message
    }), 200

# Society registration endpoints for frontend API compatibility
@society_registration_form_bp.route('/society-registrations', methods=['GET'])
@jwt_required()
def get_society_registrations():
    """Get all society registrations (Admin only) - Frontend API compatibility"""
    forms, message = SocietyRegistrationFormController.get_registration_forms()
    
    if not forms:
        return jsonify({"error": message}), 403 if "Admin access" in message else 500
    
    return jsonify({
        "success": True,
        "societies": forms,  # Use 'societies' key for frontend compatibility
        "count": len(forms),
        "message": message
    }), 200

@society_registration_form_bp.route('/society-registrations/pending', methods=['GET'])
@jwt_required()
def get_pending_society_registrations():
    """Get pending society registrations (Admin only) - Frontend API compatibility"""
    forms, message = SocietyRegistrationFormController.get_registration_forms()
    
    if not forms:
        return jsonify({"error": message}), 403 if "Admin access" in message else 500
    
    # Filter only pending registrations
    pending_forms = [form for form in forms if form.get('status', 'pending') == 'pending']
    
    return jsonify({
        "success": True,
        "societies": pending_forms,  # Use 'societies' key for frontend compatibility
        "count": len(pending_forms),
        "message": f"Retrieved {len(pending_forms)} pending society registrations"
    }), 200
