# Registration Form Controller
from utils.db import get_db
from models.registration_form import registration_form_collection, RegistrationForm
from flask import jsonify, request
from bson import ObjectId
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import user_collection
from datetime import datetime

class RegistrationFormController:
    """
    Controller class to handle all business logic related to registration forms.
    This includes creating, retrieving, updating, and deleting registration forms.
    """

    @staticmethod
    def register_society(data):
        """
        Handles the registration of a new society.
        """
        try:
            required_fields = ['name', 'type', 'regNo', 'established', 'authority', 'contact', 'website', 'plots']
            if not all(field in data and data[field] for field in required_fields):
                return None, "All fields are required"
            
            data['status'] = "pending"
            db = get_db()
            reg_forms = registration_form_collection(db)
            reg_id = reg_forms.insert_one(data).inserted_id
            return str(reg_id), "Society registration submitted"
        except Exception as e:
            print(f"[REGISTER SOCIETY ERROR] {str(e)}")
            return None, f"Registration failed: {str(e)}"

    @staticmethod
    def signup_society(user_data, society_data):
        """
        Handles the signup of a new society with user account.
        """
        try:
            # Create society registration form
            society_data['status'] = "pending"
            society_data['user_email'] = user_data['email']
            society_data['user_id'] = user_data['user_id']  # Link society to user ID
            
            db = get_db()
            reg_forms = registration_form_collection(db)
            reg_id = reg_forms.insert_one(society_data).inserted_id
            
            return str(reg_id), "Society signup successful! Your registration is pending admin approval."
        except Exception as e:
            print(f"[SIGNUP SOCIETY ERROR] {str(e)}")
            return None, f"Registration failed: {str(e)}"

    @staticmethod
    @jwt_required()
    def get_my_society():
        """
        Get society information for the logged-in user
        """
        try:
            user_email = get_jwt_identity()  # Now returns email directly
            
            db = get_db()
            reg_forms = registration_form_collection(db)
            
            # Find society by user email
            society = reg_forms.find_one({'user_email': user_email})
            
            if not society:
                return None, "No society found for this user"
            
            # Convert ObjectId to string for JSON serialization
            society['_id'] = str(society['_id'])
            
            return society, "Society information retrieved successfully"
        except Exception as e:
            print(f"[GET MY SOCIETY ERROR] {str(e)}")
            return None, f"Failed to retrieve society information: {str(e)}"
    
    @staticmethod
    def check_society_status(user_email):
        """
        Check the status of a society registration for a user
        """
        try:
            db = get_db()
            reg_forms = registration_form_collection(db)
            
            # Find society by user email with projection to get only status
            society = reg_forms.find_one({'user_email': user_email}, {'status': 1})
            
            if not society:
                return None
            
            return society.get('status', 'pending')
        except Exception as e:
            print(f"[CHECK SOCIETY STATUS ERROR] {str(e)}")
            return None

    @staticmethod
    @jwt_required()
    def get_registration_forms():
        """
        Get all registration forms (Admin only)
        """
        try:
            # Check if current user is admin
            current_user_email = get_jwt_identity()
            db = get_db()
            users = user_collection(db)
            
            current_user = users.find_one({'email': current_user_email})
            if not current_user or current_user.get('role') != 'admin':
                return None, "Admin access required"
            
            # Get all registration forms
            reg_forms = registration_form_collection(db)
            registration_list = list(reg_forms.find({}))
            
            # Convert ObjectId to string
            for registration in registration_list:
                registration['_id'] = str(registration['_id'])
                # Add created date if not present
                if 'created_at' not in registration:
                    registration['created_at'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            return registration_list, f"Retrieved {len(registration_list)} registration forms successfully"
        except Exception as e:
            print(f"[GET REGISTRATION FORMS ERROR] {str(e)}")
            return None, f"Failed to fetch registration forms: {str(e)}"

    @staticmethod
    @jwt_required()
    def get_registration_form(form_id):
        """
        Get a specific registration form by ID
        """
        try:
            # Check if current user is admin or the society owner
            current_user_email = get_jwt_identity()
            db = get_db()
            users = user_collection(db)
            
            current_user = users.find_one({'email': current_user_email})
            if not current_user:
                return None, "User not found"
            
            # Get the registration form
            reg_forms = registration_form_collection(db)
            
            try:
                form = reg_forms.find_one({'_id': ObjectId(form_id)})
            except Exception:
                return None, "Invalid registration form ID"
            
            if not form:
                return None, "Registration form not found"
            
            # Check if user has access (admin or form owner)
            is_admin = current_user.get('role') == 'admin'
            is_owner = form.get('user_email') == current_user_email
            
            if not (is_admin or is_owner):
                return None, "Access denied"
            
            # Convert ObjectId to string
            form['_id'] = str(form['_id'])
            
            return form, "Registration form retrieved successfully"
        except Exception as e:
            print(f"[GET REGISTRATION FORM ERROR] {str(e)}")
            return None, f"Failed to fetch registration form: {str(e)}"

    @staticmethod
    @jwt_required()
    def update_registration_status(form_id, status):
        """
        Update the status of a registration form (Admin only)
        """
        try:
            # Check if current user is admin
            current_user_email = get_jwt_identity()
            db = get_db()
            users = user_collection(db)
            
            current_user = users.find_one({'email': current_user_email})
            if not current_user or current_user.get('role') != 'admin':
                return False, "Admin access required"
            
            # Validate status
            if status not in ["approved", "rejected", "pending"]:
                return False, "Invalid status. Must be 'approved', 'rejected', or 'pending'"
            
            # Update the registration form
            reg_forms = registration_form_collection(db)
            
            try:
                result = reg_forms.update_one(
                    {'_id': ObjectId(form_id)},
                    {'$set': {'status': status, 'updated_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S")}}
                )
            except Exception:
                return False, "Invalid registration form ID"
            
            if result.matched_count == 0:
                return False, "Registration form not found"
            
            return True, f"Registration status updated to '{status}' successfully"
        except Exception as e:
            print(f"[UPDATE REGISTRATION STATUS ERROR] {str(e)}")
            return False, f"Failed to update registration status: {str(e)}"