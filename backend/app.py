from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from routes.user_routes import user_bp
from routes.society_profile_routes import society_profile_bp
from flask_cors import CORS  
from utils.db import test_connection
from routes.review_routes import review_bp
from routes.plot_routes import plot_bp  # Import the blueprint
from routes.advertisement_routes import advertisement_bp  # Import advertisement routes
from routes.registration_form_routes import registration_form_bp  # Import registration form routes
from datetime import timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure CORS - Allow all localhost ports for development
CORS(app, 
     origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"], 
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     expose_headers=["Content-Type", "Authorization"])

# JWT Configuration
app.config['JWT_SECRET_KEY'] = '6b30c0cdbdc749228ae16f07492b441310eac85611cbd607e1e110237218f89b'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)  # Increased to 1 hour
app.config['JWT_ALGORITHM'] = 'HS256'
app.config['JWT_DECODE_LEEWAY'] = 30
app.config['JWT_TOKEN_LOCATION'] = ['cookies', 'headers']
app.config['JWT_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['JWT_COOKIE_CSRF_PROTECT'] = False  # Set to True in production
app.config['JWT_COOKIE_SAMESITE'] = 'Lax'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# ============================================================
# EMAIL CONFIGURATION for Email Verification
# ============================================================
app.config['SMTP_SERVER'] = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
app.config['SMTP_PORT'] = int(os.getenv('SMTP_PORT', 587))
app.config['SENDER_EMAIL'] = os.getenv('SENDER_EMAIL', '')
app.config['SENDER_PASSWORD'] = os.getenv('SENDER_PASSWORD', '')
app.config['VERIFICATION_LINK_BASE'] = os.getenv('VERIFICATION_LINK_BASE', 'http://localhost:5173')

jwt = JWTManager(app)

# JWT Error Handlers
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has expired', 'message': 'Please log in again'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid token', 'message': 'Please log in again'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'error': 'Authorization token is required', 'message': 'Please log in'}), 401

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(society_profile_bp, url_prefix='/api')
app.register_blueprint(plot_bp, url_prefix='/api')
app.register_blueprint(review_bp, url_prefix='/api')
app.register_blueprint(advertisement_bp, url_prefix='/api')
app.register_blueprint(registration_form_bp, url_prefix='/api')

# Import and register user profile blueprint
from routes.user_profile_routes import user_profile_bp
app.register_blueprint(user_profile_bp, url_prefix='/api')

# Import and register floor plan blueprint
from routes.floorplan_routes import floorplan_bp
app.register_blueprint(floorplan_bp, url_prefix='/api')

# ============================================================
# Initialize Email Verification System
# ============================================================
@app.before_request
def initialize_email_verification():
    """Initialize email verification indexes on first request"""
    try:
        from utils.db import get_db
        db = get_db()
        if db is not None:
            from models.email_verification import create_verification_index
            create_verification_index(db)
    except Exception as e:
        print(f"[EMAIL VERIFICATION] Index initialization warning: {str(e)}")

@app.route('/api/email-config-test')
def email_config_test():
    """Test email configuration"""
    config_status = {
        "smtp_server": app.config.get('SMTP_SERVER'),
        "smtp_port": app.config.get('SMTP_PORT'),
        "sender_email": app.config.get('SENDER_EMAIL', 'NOT SET'),
        "sender_email_configured": bool(app.config.get('SENDER_EMAIL')),
        "sender_password_configured": bool(app.config.get('SENDER_PASSWORD')),
        "verification_link_base": app.config.get('VERIFICATION_LINK_BASE')
    }
    
    if not app.config.get('SENDER_EMAIL') or not app.config.get('SENDER_PASSWORD'):
        return jsonify({
            "success": False,
            "message": "Email credentials not configured. Please set SENDER_EMAIL and SENDER_PASSWORD in .env file",
            "config": config_status
        }), 400
    
    return jsonify({
        "success": True,
        "message": "Email configuration is ready",
        "config": config_status
    }), 200

@app.route('/api/db-test')
def db_test():
    result = test_connection()
    if isinstance(result, dict):
        return "MongoDB is connected"
    return f"MongoDB connection failed: {result}", 500

@app.route('/api/jwt-test')
def jwt_test():
    """Test JWT configuration"""
    from flask_jwt_extended import create_access_token
    from datetime import datetime, timezone
    import jwt as pyjwt
    
    try:
        # Create a test token
        test_identity = {'email': 'test@example.com', 'role': 'test'}
        current_time = datetime.now(timezone.utc)
        
        print(f"[JWT TEST] Creating token at: {current_time}")
        print(f"[JWT TEST] JWT_ACCESS_TOKEN_EXPIRES config: {app.config.get('JWT_ACCESS_TOKEN_EXPIRES')}")
        
        access_token = create_access_token(identity=test_identity)
        
        # Decode the token to check its contents
        decoded = pyjwt.decode(access_token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        
        token_exp = datetime.fromtimestamp(decoded['exp'], timezone.utc)
        time_diff = (token_exp - current_time).total_seconds()
        
        return jsonify({
            "success": True,
            "message": "JWT configuration test",
            "token_created_at": current_time.isoformat(),
            "token_expires_at": token_exp.isoformat(),
            "seconds_until_expiry": time_diff,
            "minutes_until_expiry": time_diff / 60,
            "jwt_config": str(app.config.get('JWT_ACCESS_TOKEN_EXPIRES')),
            "decoded_payload": decoded
        }), 200
        
    except Exception as e:
        print(f"[JWT TEST ERROR] {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)

