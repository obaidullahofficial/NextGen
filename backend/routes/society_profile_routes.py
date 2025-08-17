from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_db
from models.society_profile import society_profile_collection
import base64
from datetime import datetime

society_profile_bp = Blueprint('society_profile', __name__)

@society_profile_bp.route('/society-profile', methods=['GET'])
@jwt_required()
def get_society_profile():
    """Get society profile for logged-in user"""
    try:
        user_email = get_jwt_identity()  # Now returns email directly
        print(f"[GET PROFILE] User email from JWT: {user_email}")
        
        db = get_db()
        profiles = society_profile_collection(db)
        
        profile = profiles.find_one({'user_email': user_email})
        
        if not profile:
            # If no profile exists, create one with society name from registration
            from models.registration_form import registration_form_collection
            reg_forms = registration_form_collection(db)
            registration = reg_forms.find_one({'user_email': user_email, 'status': 'approved'})
            
            if registration and registration.get('name'):
                # Create new profile with hardcoded society name from registration
                new_profile = {
                    'user_email': user_email,
                    'name': registration['name'],  # Hardcoded from registration
                    'registered_society_name': registration['name'],  # Store original registration name
                    'description': '',
                    'location': '',
                    'available_plots': '',
                    'price_range': '',
                    'society_logo': '',
                    'is_complete': False,
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
                
                result = profiles.insert_one(new_profile)
                new_profile['_id'] = str(result.inserted_id)
                
                print(f"[GET PROFILE] Created new profile with hardcoded name: {registration['name']}")
                
                return jsonify({
                    "success": True,
                    "profile": new_profile
                }), 200
            else:
                return jsonify({"error": "Registration not found or not approved"}), 404
        
        # If profile exists but doesn't have registered_society_name, add it from registration
        if not profile.get('registered_society_name'):
            from models.registration_form import registration_form_collection
            reg_forms = registration_form_collection(db)
            registration = reg_forms.find_one({'user_email': user_email, 'status': 'approved'})
            
            if registration and registration.get('name'):
                # Update profile to include registered society name and ensure name matches registration
                profiles.update_one(
                    {'user_email': user_email},
                    {'$set': {
                        'name': registration['name'],  # Hardcode from registration
                        'registered_society_name': registration['name'],
                        'updated_at': datetime.utcnow()
                    }}
                )
                profile['name'] = registration['name']
                profile['registered_society_name'] = registration['name']
                
                print(f"[GET PROFILE] Updated profile with hardcoded name: {registration['name']}")
        
        # Convert ObjectId to string for JSON
        profile['_id'] = str(profile['_id'])
        
        return jsonify({
            "success": True,
            "profile": profile
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to get profile: {str(e)}"}), 500

@society_profile_bp.route('/society-profile', methods=['POST', 'PUT'])
@jwt_required()
def create_or_update_society_profile():
    """Create or update society profile - Fixed version"""
    try:
        print(f"[JWT DEBUG] Request headers: {dict(request.headers)}")
        print(f"[JWT DEBUG] Authorization header: {request.headers.get('Authorization', 'MISSING')}")
        
        # Get current user from JWT (now returns email directly)
        user_email = get_jwt_identity()
        print(f"[JWT DEBUG] JWT identity (email): {user_email}")
        
        if not user_email:
            print(f"[JWT ERROR] No email in JWT identity")
            return jsonify({"error": "Invalid authentication"}), 401
        print(f"[DEBUG] Profile update for: {user_email}")
        print(f"[DEBUG] Request method: {request.method}")
        print(f"[DEBUG] Content type: {request.content_type}")
        
        # Get database connection
        db = get_db()
        profiles = society_profile_collection(db)
        
        # Initialize profile data
        profile_data = {}
        
        # Handle different content types
        try:
            if request.content_type and 'multipart/form-data' in request.content_type:
                print(f"[DEBUG] Processing form data")
                # Handle form data (with file upload)
                profile_data = {
                    'name': request.form.get('name', '').strip(),
                    'description': request.form.get('description', '').strip(),
                    'location': request.form.get('location', '').strip(),
                    'available_plots': request.form.get('available_plots', '').strip(),
                    'price_range': request.form.get('price_range', '').strip(),
                }
                
                # Handle logo upload if present
                if 'society_logo' in request.files:
                    logo_file = request.files['society_logo']
                    if logo_file and logo_file.filename:
                        print(f"[DEBUG] Processing logo file: {logo_file.filename}")
                        
                        # Validate file type
                        filename = logo_file.filename.lower()
                        if not any(filename.endswith(ext) for ext in ['.png', '.jpg', '.jpeg']):
                            return jsonify({"error": "Only PNG, JPG, JPEG files allowed"}), 400
                        
                        # Read and validate file size
                        logo_content = logo_file.read()
                        if len(logo_content) > 5 * 1024 * 1024:  # 5MB limit
                            return jsonify({"error": "File too large (max 5MB)"}), 400
                        
                        # Create base64 string
                        logo_b64 = base64.b64encode(logo_content).decode('utf-8')
                        mime_type = 'image/png' if filename.endswith('.png') else 'image/jpeg'
                        profile_data['society_logo'] = f"data:{mime_type};base64,{logo_b64}"
                        print(f"[DEBUG] Logo processed successfully")
                        
            elif request.is_json and request.json:
                print(f"[DEBUG] Processing JSON data")
                # Handle JSON data
                json_data = request.json
                profile_data = {
                    'name': json_data.get('name', '').strip(),
                    'description': json_data.get('description', '').strip(),
                    'location': json_data.get('location', '').strip(),
                    'available_plots': json_data.get('available_plots', '').strip(),
                    'price_range': json_data.get('price_range', '').strip(),
                }
                
                # Handle logo if provided in JSON
                if 'society_logo' in json_data and json_data['society_logo']:
                    profile_data['society_logo'] = json_data['society_logo']
                    
            else:
                return jsonify({"error": "Invalid request format. Expected form data or JSON."}), 400
                
        except Exception as parse_error:
            print(f"[ERROR] Request parsing failed: {parse_error}")
            return jsonify({"error": "Failed to parse request data"}), 400
        
        # Validate that we have some data
        if not any(profile_data.get(field, '').strip() for field in ['name', 'description', 'location', 'available_plots', 'price_range']):
            return jsonify({"error": "At least one field must be provided"}), 400
        
        # Prepare data for database
        update_data = {
            'user_email': user_email,
            'updated_at': datetime.utcnow()
        }
        
        # Get existing profile to check for registered society name
        existing_profile = profiles.find_one({'user_email': user_email})
        
        # Add non-empty fields but EXCLUDE name if it's already registered
        for field in ['name', 'description', 'location', 'available_plots', 'price_range', 'society_logo']:
            if field in profile_data and profile_data[field]:
                # Do not allow changing the society name if it's already set from registration
                if field == 'name' and existing_profile and existing_profile.get('registered_society_name'):
                    print(f"[DEBUG] Blocked attempt to change society name from '{existing_profile.get('name')}' to '{profile_data[field]}'")
                    continue  # Skip updating name field
                update_data[field] = profile_data[field]
        
        # Check completeness
        required_fields = ['name', 'description', 'location', 'available_plots', 'price_range']
        complete_fields = [f for f in required_fields if update_data.get(f)]
        has_logo = 'society_logo' in update_data and update_data['society_logo']
        
        is_complete = len(complete_fields) == len(required_fields) and has_logo
        update_data['is_complete'] = is_complete
        
        print(f"[DEBUG] Updating fields: {list(update_data.keys())}")
        print(f"[DEBUG] Profile complete: {is_complete}")
        
        # Update database
        result = profiles.update_one(
            {'user_email': user_email},
            {'$set': update_data},
            upsert=True
        )
        
        print(f"[DEBUG] Database update result: modified={result.modified_count}, matched={result.matched_count}")
        
        return jsonify({
            "success": True,
            "message": "Profile updated successfully",
            "is_complete": is_complete
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Profile update failed: {type(e).__name__}: {str(e)}")
        import traceback
        print(f"[ERROR] Traceback:\n{traceback.format_exc()}")
        return jsonify({"error": f"Profile update failed: {str(e)}"}), 500

@society_profile_bp.route('/society-profile/completeness', methods=['GET'])
@jwt_required()
def check_profile_completeness():
    """Check if society profile is complete"""
    try:
        user_email = get_jwt_identity()  # Now returns email directly
        
        db = get_db()
        profiles = society_profile_collection(db)
        
        profile = profiles.find_one({'user_email': user_email})
        
        if not profile:
            return jsonify({
                "success": True,
                "is_complete": False,
                "missing_fields": ['name', 'description', 'location', 'available_plots', 'price_range', 'society_logo'],
                "message": "Profile not found"
            }), 200
        
        # Check completeness
        required_fields = ['name', 'description', 'location', 'available_plots', 'price_range']
        missing_fields = [f for f in required_fields if not profile.get(f)]
        
        if not profile.get('society_logo'):
            missing_fields.append('society_logo')
        
        is_complete = len(missing_fields) == 0
        
        return jsonify({
            "success": True,
            "is_complete": is_complete,
            "missing_fields": missing_fields,
            "message": "Profile complete" if is_complete else "Profile incomplete"
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to check completeness: {str(e)}"}), 500

@society_profile_bp.route('/society-profile/initialize', methods=['POST'])
@jwt_required()
def initialize_society_profile():
    """Initialize society profile from registration data"""
    try:
        user_email = get_jwt_identity()  # Now returns email directly
        
        db = get_db()
        profiles = society_profile_collection(db)
        
        # Create basic profile structure
        profile_data = {
            'user_email': user_email,
            'name': '',
            'description': '',
            'location': '',
            'available_plots': '',
            'price_range': '',
            'society_logo': '',
            'is_complete': False,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = profiles.update_one(
            {'user_email': user_email},
            {'$setOnInsert': profile_data},
            upsert=True
        )
        
        return jsonify({
            "success": True,
            "profile_id": str(result.upserted_id) if result.upserted_id else "exists",
            "message": "Profile initialized successfully"
        }), 201
        
    except Exception as e:
        return jsonify({"error": f"Failed to initialize profile: {str(e)}"}), 500

@society_profile_bp.route('/society-profile/missing-fields', methods=['GET'])
@jwt_required()
def get_missing_fields():
    """Get list of missing required fields"""
    try:
        user_email = get_jwt_identity()  # Now returns email directly
        
        db = get_db()
        profiles = society_profile_collection(db)
        
        profile = profiles.find_one({'user_email': user_email})
        
        if not profile:
            missing_fields = ['name', 'description', 'location', 'available_plots', 'price_range', 'society_logo']
            message = "Profile not found - all fields missing"
        else:
            required_fields = ['name', 'description', 'location', 'available_plots', 'price_range']
            missing_fields = [f for f in required_fields if not profile.get(f)]
            
            if not profile.get('society_logo'):
                missing_fields.append('society_logo')
                
            message = "Missing fields identified" if missing_fields else "All fields complete"
        
        return jsonify({
            "success": True,
            "missing_fields": missing_fields,
            "count": len(missing_fields),
            "message": message
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to get missing fields: {str(e)}"}), 500

@society_profile_bp.route('/society-profile/test', methods=['POST'])
@jwt_required()
def test_society_profile_update():
    """Simple test endpoint for debugging profile updates"""
    try:
        user_email = get_jwt_identity()  # Now returns email directly
        
        print(f"[TEST] Testing profile update for {user_email}")
        
        # Simple test data
        test_data = {
            'name': 'Test Society',
            'description': 'Test description',
            'location': 'Test location',
            'available_plots': 'Test plots',
            'price_range': 'Test range'
        }
        
        print(f"[TEST] Test data: {test_data}")
        
        # Try updating with simple data first
        from utils.db import get_db
        from models.society_profile import society_profile_collection
        from datetime import datetime
        
        db = get_db()
        profiles = society_profile_collection(db)
        
        # Try direct database update
        test_data['updated_at'] = datetime.utcnow()
        test_data['is_complete'] = False
        
        print(f"[TEST] Attempting direct database update...")
        result = profiles.update_one(
            {'user_email': user_email},
            {'$set': test_data},
            upsert=True
        )
        
        print(f"[TEST] Database result: {result.modified_count}, {result.matched_count}, {result.upserted_id}")
        
        return jsonify({
            "success": True,
            "message": "Test update successful",
            "result": {
                "modified_count": result.modified_count,
                "matched_count": result.matched_count,
                "upserted_id": str(result.upserted_id) if result.upserted_id else None
            }
        }), 200
        
    except Exception as e:
        print(f"[TEST ERROR] Exception: {e}")
        print(f"[TEST ERROR] Exception type: {type(e)}")
        import traceback
        print(f"[TEST ERROR] Traceback: {traceback.format_exc()}")
        return jsonify({"error": f"Test failed: {str(e)}"}), 500

@society_profile_bp.route('/society-profile/simple-test', methods=['POST'])
@jwt_required()
def simple_test():
    """Very simple test endpoint to debug 422 errors"""
    try:
        user_email = get_jwt_identity()  # Now returns email directly
        print(f"[SIMPLE TEST] User email: {user_email}")
        print(f"[SIMPLE TEST] Request method: {request.method}")
        print(f"[SIMPLE TEST] Content type: {request.content_type}")
        print(f"[SIMPLE TEST] Headers: {dict(request.headers)}")
        
        return jsonify({
            "success": True,
            "message": "Simple test passed",
            "user_email": user_email,
            "content_type": request.content_type
        }), 200
        
    except Exception as e:
        print(f"[SIMPLE TEST ERROR] {e}")
        return jsonify({"error": str(e)}), 500

@society_profile_bp.route('/society-profile/debug', methods=['GET'])
@jwt_required()
def debug_society_profile():
    """Debug endpoint to check profile status and issues"""
    try:
        user_email = get_jwt_identity()  # Now returns email directly
        
        db = get_db()
        profiles = society_profile_collection(db)
        
        # Get profile directly
        profile = profiles.find_one({'user_email': user_email})
        
        # Get registration
        from models.registration_form import registration_form_collection
        reg_forms = registration_form_collection(db)
        registration = reg_forms.find_one({'user_email': user_email})
        
        debug_info = {
            "user_email": user_email,
            "profile_exists": profile is not None,
            "profile_message": "Profile found" if profile else "Profile not found",
            "registration_exists": registration is not None,
            "registration_status": registration.get('status') if registration else None
        }
        
        if profile:
            debug_info["profile_fields"] = {
                "name": profile.get('name', ''),
                "description": profile.get('description', ''),
                "location": profile.get('location', ''),
                "available_plots": profile.get('available_plots', ''),
                "price_range": profile.get('price_range', ''),
                "society_logo": bool(profile.get('society_logo')),
                "is_complete": profile.get('is_complete', False)
            }
            
            # Get missing fields directly
            required_fields = ['name', 'description', 'location', 'available_plots', 'price_range']
            missing_fields = [f for f in required_fields if not profile.get(f)]
            
            if not profile.get('society_logo'):
                missing_fields.append('society_logo')
                
            debug_info["missing_fields"] = missing_fields
        
        return jsonify({
            "success": True,
            "debug_info": debug_info
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Debug failed: {str(e)}"}), 500

@society_profile_bp.route('/society-profiles', methods=['GET'])
def get_all_society_profiles():
    """Get all society profiles with plot counts (public endpoint)"""
    try:
        db = get_db()
        profiles = society_profile_collection(db)
        
        # Get all society profiles
        all_profiles = list(profiles.find())
        
        # Import plot collection to count plots
        from models.plot import plot_collection
        plots = plot_collection(db)
        
        # Add plot counts to each profile
        for profile in all_profiles:
            profile['_id'] = str(profile['_id'])
            society_id = profile['_id']
            
            # Count total plots for this society
            total_plots = plots.count_documents({'societyId': society_id})
            
            # Count available plots (status = 'Available')
            available_plots = plots.count_documents({
                'societyId': society_id,
                'status': 'Available'
            })
            
            # Add plot counts to profile
            profile['totalPlots'] = total_plots
            profile['availablePlots'] = available_plots
            
        return jsonify(all_profiles), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get all profiles: {str(e)}"}), 500
