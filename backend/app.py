from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from routes.user_routes import user_bp
from routes.society_profile_routes import society_profile_bp
from flask_cors import CORS  
from utils.db import test_connection
from routes.review_routes import review_bp
from routes.plot_routes import plot_bp  # Import the blueprint
from routes.advertisement_routes import advertisement_bp  # Import advertisement routes
from datetime import timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure CORS
CORS(app, 
     origins=["http://localhost:5173", "http://localhost:5174"], 
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

