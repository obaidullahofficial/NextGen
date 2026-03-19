from flask import Flask, jsonify, send_file, abort, request
from flask_compress import Compress  # <--- Added for Compression
from flask_jwt_extended import JWTManager
from routes.user_routes import user_bp
from routes.society_profile_routes import society_profile_bp
from flask_cors import CORS  
from utils.db import test_connection, close_db
from routes.review_routes import review_bp
from routes.plot_routes import plot_bp  # Import the blueprint
from routes.advertisement_routes import advertisement_bp  # Import advertisement routes
from routes.society_registration_form_routes import society_registration_form_bp  # Import society registration form routes
from datetime import timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Apply GZIP Compression for Admin performance optimizations
Compress(app)

# Configure CORS - Allow frontend domains for development and production
allowed_origins = [
    "http://localhost:5173", 
    "http://localhost:5174", 
    "http://localhost:5175", 
    "http://localhost:5176",
    "https://next-gen-silk.vercel.app",
    "https://next-gen-rosy.vercel.app",
    "https://nextgen-ta95.onrender.com"
]

# Add environment-configured frontend URL if provided
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url and frontend_url not in allowed_origins:
    allowed_origins.append(frontend_url)

# Add any additional URLs from env variable (comma-separated)
extra_urls = os.getenv("EXTRA_CORS_ORIGINS", "")
if extra_urls:
    for url in extra_urls.split(","):
        url = url.strip()
        if url and url not in allowed_origins:
            allowed_origins.append(url)

CORS(app, 
     origins=allowed_origins,
     supports_credentials=True,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"],
     expose_headers=["Content-Type", "Authorization"])

# JWT Configuration
app.config['JWT_SECRET_KEY'] = '6b30c0cdbdc749228ae16f07492b441310eac85611cbd607e1e110237218f89b'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=2)  # Session timeout: 2 hours
app.config['JWT_ALGORITHM'] = 'HS256'
app.config['JWT_DECODE_LEEWAY'] = 30
app.config['JWT_TOKEN_LOCATION'] = ['cookies', 'headers']
app.config['JWT_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['JWT_COOKIE_CSRF_PROTECT'] = False  # Set to True in production
app.config['JWT_COOKIE_SAMESITE'] = 'Lax'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
jwt = JWTManager(app)

# Request logging middleware
@app.before_request
def log_request():
    print(f"[REQUEST] {request.method} {request.path}")
    if request.args:
        print(f"[ARGS] {dict(request.args)}")

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
app.register_blueprint(society_registration_form_bp, url_prefix='/api')

# Import and register user profile blueprint
from routes.user_profile_routes import user_profile_bp
app.register_blueprint(user_profile_bp, url_prefix='/api')

# Import and register approval request blueprint
from routes.approval_request_routes import approval_request_bp
app.register_blueprint(approval_request_bp, url_prefix='/api')

# Import and register floor plan blueprint
from routes.floorplan_routes import floorplan_bp
app.register_blueprint(floorplan_bp, url_prefix='/api')

# Import and register payment blueprint
from routes.payment_routes import payment_bp
app.register_blueprint(payment_bp, url_prefix='/api/payment')

# Import and register compliance blueprint
from routes.compliance_routes import compliance_bp
app.register_blueprint(compliance_bp, url_prefix='/api/compliance')

# Import and register template blueprint
from routes.template_routes import template_bp
app.register_blueprint(template_bp, url_prefix='/api/templates')


# ========== FILE SERVING ROUTES (for uploaded user documents) ==========

UPLOAD_ROOT = os.path.join(os.getcwd(), 'uploads')

@app.route('/api/file/<path:filepath>', methods=['GET'])
def serve_uploaded_file(filepath):
    """Serve uploaded files (e.g., floor plan PDFs/JSON) in a safe way.

    The `filepath` is stored in the database, typically starting with
    "uploads/" (e.g., "uploads/user_profiles/user_<id>/floor_plans/file.json").
    This endpoint ensures we only serve files from the `uploads` directory.
    """
    print(f"[FILE SERVE] Requested: {filepath}")
    
    # Normalize path separators for cross-platform compatibility
    # Replace forward slashes with OS-specific separator
    filepath = filepath.replace('/', os.sep)
    
    # Normalize path and ensure it stays within the uploads directory
    normalized = os.path.normpath(filepath)
    full_path = os.path.normpath(os.path.join(os.getcwd(), normalized))
    
    print(f"[FILE SERVE] Full path: {full_path}")

    # Security check: file must be inside the UPLOAD_ROOT directory
    # Use case-insensitive comparison for Windows
    if not os.path.normcase(full_path).startswith(os.path.normcase(UPLOAD_ROOT)):
        print(f"[FILE SERVE] Security error - path outside uploads")
        abort(403)

    if not os.path.exists(full_path):
        print(f"[FILE SERVE] File not found! Path in DB but file missing on disk.")
        abort(404)
        
    if not os.path.isfile(full_path):
        print(f"[FILE SERVE] Path is not a file")
        abort(404)

    # Determine MIME type based on file extension
    _, ext = os.path.splitext(full_path)
    mimetype = None
    if ext.lower() == '.json':
        mimetype = 'application/json'
    elif ext.lower() == '.pdf':
        mimetype = 'application/pdf'
    elif ext.lower() in ['.jpg', '.jpeg']:
        mimetype = 'image/jpeg'
    elif ext.lower() == '.png':
        mimetype = 'image/png'
    
    # Serve file with explicit MIME type
    return send_file(full_path, mimetype=mimetype, as_attachment=False)


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

# Graceful shutdown: close MongoDB connection only on app termination
import atexit

def shutdown_handler():
    """Close MongoDB connection when app truly shuts down"""
    close_db()

# Register shutdown handler for actual app exit (CTRL+C)
atexit.register(shutdown_handler)

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    # Python 3.14 + Werkzeug on Windows has a WinError 10038 (socket selector bug).
    # use_reloader=False + threaded=False avoids the broken selector paths.
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False, threaded=False)

