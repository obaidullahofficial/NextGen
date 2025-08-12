from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from controllers.user_controller import UserController
from models.registration_form import registration_form_collection
from utils.db import get_db

user_bp = Blueprint('user', __name__)

@user_bp.route('/register-society', methods=['POST'])
def register_society():
    data = request.json
    required_fields = ['name', 'type', 'regNo', 'established', 'authority', 'contact', 'website', 'plots']
    if not all(field in data and data[field] for field in required_fields):
        return jsonify({"error": "All fields are required"}), 400
    data['status'] = "pending"
    db = get_db()
    reg_forms = registration_form_collection(db)
    reg_id = reg_forms.insert_one(data).inserted_id
    return jsonify({"message": "Society registration submitted", "registration_id": str(reg_id)}), 201

@user_bp.route('/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'user')

    if not all([username, email, password]):
        return jsonify({"error": "All fields are required"}), 400

    user_id, message = UserController.create_user(username, email, password, role)
    if not user_id:
        return jsonify({"error": message}), 400

    return jsonify({"message": message, "user_id": user_id}), 201

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({"error": "Email and password are required"}), 400

    user = UserController.verify_user(email, password)
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    access_token = create_access_token(identity={'email': email, 'role': user['role']})
    is_admin = user.get('role') == 'admin'
    return jsonify({"access_token": access_token, "is_admin": is_admin}), 200