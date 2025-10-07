from flask import Blueprint, jsonify, request
from controllers.registration_form_controller import RegistrationFormController
from controllers.user_controller import UserController
from flask_jwt_extended import jwt_required, get_jwt_identity

registration_form_bp = Blueprint('registration_form_bp', __name__)

@registration_form_bp.route('/register-society', methods=['POST'])
def register_society():
    data = request.json
    reg_id, message = RegistrationFormController.register_society(data)
    
    if not reg_id:
        return jsonify({"error": message}), 400
    
    return jsonify({"message": message, "registration_id": reg_id}), 201

@registration_form_bp.route('/my-society', methods=['GET'])
@jwt_required()
def get_my_society():
    society, message = RegistrationFormController.get_my_society()
    
    if not society:
        return jsonify({"error": message}), 404
    
    return jsonify({"society": society, "message": message}), 200

@registration_form_bp.route('/registration-forms', methods=['GET'])
@jwt_required()
def get_registration_forms():
    forms, message = RegistrationFormController.get_registration_forms()
    
    if not forms:
        return jsonify({"error": message}), 403 if "Admin access" in message else 500
    
    return jsonify({
        "success": True,
        "registration_forms": forms,
        "message": message
    }), 200

@registration_form_bp.route('/registration-forms/<form_id>', methods=['GET'])
@jwt_required()
def get_registration_form(form_id):
    form, message = RegistrationFormController.get_registration_form(form_id)
    
    if not form:
        return jsonify({"error": message}), 404
    
    return jsonify({"registration_form": form, "message": message}), 200

@registration_form_bp.route('/signup-society', methods=['POST'])
def signup_society():
    data = request.json
    
    # Extract user data
    user_name = data.get('userName')
    user_email = data.get('userEmail')
    user_password = data.get('userPassword')
    
    # Extract society data
    society_data = {
        'name': data.get('name'),
        'type': data.get('type'),
        'regNo': data.get('regNo'),
        'established': data.get('established'),
        'authority': data.get('authority'),
        'contact': data.get('contact'),
        'website': data.get('website'),
        'plots': data.get('plots'),
        'user_email': user_email  # Link society to user email
    }
    
    # Validate required fields
    user_required = [user_name, user_email, user_password]
    society_required = [society_data['name'], society_data['type'], society_data['regNo'], 
                       society_data['established'], society_data['authority'], 
                       society_data['contact'], society_data['website'], society_data['plots']]
    
    if not all(user_required):
        return jsonify({"error": "User information is incomplete"}), 400
    
    if not all(society_required):
        return jsonify({"error": "Society information is incomplete"}), 400
    
    try:
        # Create user account with society role
        user_id, user_message = UserController.create_user(user_name, user_email, user_password, 'society')
        if not user_id:
            return jsonify({"error": user_message}), 400
        
        # Create society data with user ID
        society_data['user_id'] = user_id
        
        # Register society using controller
        reg_id, message = RegistrationFormController.signup_society(
            {'email': user_email, 'user_id': user_id}, 
            society_data
        )
        
        if not reg_id:
            return jsonify({"error": message}), 400
        
        return jsonify({
            "message": message,
            "user_id": user_id,
            "registration_id": reg_id
        }), 201
        
    except Exception as e:
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500

@registration_form_bp.route('/registration-forms/<form_id>/status', methods=['PUT'])
@jwt_required()
def update_registration_status(form_id):
    data = request.json
    status = data.get('status')
    
    if not status:
        return jsonify({"error": "Status is required"}), 400
    
    success, message = RegistrationFormController.update_registration_status(form_id, status)
    
    if not success:
        return jsonify({"error": message}), 403 if "Admin access" in message else 400
    
    return jsonify({"message": message}), 200

# Society registration endpoints for frontend API compatibility
@registration_form_bp.route('/society-registrations', methods=['GET'])
@jwt_required()
def get_society_registrations():
    """Get all society registrations (Admin only) - Frontend API compatibility"""
    forms, message = RegistrationFormController.get_registration_forms()
    
    if not forms:
        return jsonify({"error": message}), 403 if "Admin access" in message else 500
    
    return jsonify({
        "success": True,
        "societies": forms,  # Use 'societies' key for frontend compatibility
        "count": len(forms),
        "message": message
    }), 200

@registration_form_bp.route('/society-registrations/pending', methods=['GET'])
@jwt_required()
def get_pending_society_registrations():
    """Get pending society registrations (Admin only) - Frontend API compatibility"""
    forms, message = RegistrationFormController.get_registration_forms()
    
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