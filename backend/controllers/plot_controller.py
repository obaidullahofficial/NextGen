# Plot Controller
from utils.db import get_db
from models.plot import plot_collection
from flask import jsonify, request
from bson import ObjectId
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.society_profile import society_profile_collection
import base64
import json

class PlotController:
    @staticmethod
    @jwt_required()
    def create_plot():
        try:
            db = get_db()
            user_email = get_jwt_identity()
            
            print(f"[DEBUG] Creating plot for user: {user_email}")
            print(f"[DEBUG] Request content type: {request.content_type}")

            # Find the society profile for this user
            profiles = society_profile_collection(db)
            profile = profiles.find_one({'user_email': user_email})
            if not profile:
                return jsonify({'error': 'Society profile not found for this user'}), 400

            # Initialize plot data
            data = {}
            
            # Handle different content types
            if request.content_type and 'multipart/form-data' in request.content_type:
                print(f"[DEBUG] Processing FormData for plot creation")
                print(f"[DEBUG] Form fields: {list(request.form.keys())}")
                print(f"[DEBUG] File fields: {list(request.files.keys())}")
                
                # Handle form data (with file upload) - Map to database schema
                data = {
                    'plot_number': request.form.get('plot_number', ''),  # Match database schema
                    'area': request.form.get('area', ''),
                    'type': request.form.get('type', 'Residential'),
                    'price': request.form.get('price', ''),
                    'status': request.form.get('status', 'Available'),
                    'location': request.form.get('location', ''),
                }
                
                # Handle dimensions - convert to int as per schema
                try:
                    data['dimension_x'] = int(request.form.get('dimension_x', '0')) if request.form.get('dimension_x') else 0
                    data['dimension_y'] = int(request.form.get('dimension_y', '0')) if request.form.get('dimension_y') else 0
                except ValueError:
                    data['dimension_x'] = 0
                    data['dimension_y'] = 0
                
                # Handle description array from FormData format (description[0], description[1], etc.)
                descriptions = []
                for key in request.form.keys():
                    if key.startswith('description[') and key.endswith(']'):
                        index = key[len('description['):-1]
                        try:
                            idx = int(index)
                            desc_value = request.form.get(key, '').strip()
                            if desc_value:
                                descriptions.append((idx, desc_value))
                        except ValueError:
                            pass
                
                # Sort by index and extract values
                descriptions.sort(key=lambda x: x[0])
                data['description'] = [desc[1] for desc in descriptions]
                
                # Handle seller object from FormData format (seller[name], seller[phone])
                seller = {}
                for key in request.form.keys():
                    if key.startswith('seller[') and key.endswith(']'):
                        field = key[len('seller['):-1]
                        value = request.form.get(key, '').strip()
                        if value:
                            seller[field] = value
                data['seller'] = seller
                
                # Handle amenities array from FormData format (amenities[0], amenities[1], etc.)
                amenities = []
                for key in request.form.keys():
                    if key.startswith('amenities[') and key.endswith(']'):
                        index = key[len('amenities['):-1]
                        try:
                            idx = int(index)
                            amenity_value = request.form.get(key, '').strip()
                            if amenity_value:
                                amenities.append((idx, amenity_value))
                        except ValueError:
                            pass
                
                # Sort by index and extract values
                amenities.sort(key=lambda x: x[0])
                data['amenities'] = [amenity[1] for amenity in amenities]
                
                print(f"[DEBUG] Processed descriptions: {data['description']}")
                print(f"[DEBUG] Processed seller: {data['seller']}")
                print(f"[DEBUG] Processed amenities: {data['amenities']}")
                
                # Handle plot image upload - MANDATORY for creation
                if 'plot_image' in request.files:
                    image_file = request.files['plot_image']
                    if image_file and image_file.filename:
                        print(f"[DEBUG] Processing plot image: {image_file.filename}")
                        
                        # Validate file type
                        filename = image_file.filename.lower()
                        if not any(filename.endswith(ext) for ext in ['.png', '.jpg', '.jpeg']):
                            return jsonify({'error': 'Only PNG, JPG, JPEG files allowed'}), 400
                        
                        # Read and validate file size
                        image_content = image_file.read()
                        if len(image_content) > 5 * 1024 * 1024:  # 5MB limit
                            return jsonify({'error': 'File too large (max 5MB)'}), 400
                        
                        # Create base64 string and store as 'image' to match schema
                        image_b64 = base64.b64encode(image_content).decode('utf-8')
                        mime_type = 'image/png' if filename.endswith('.png') else 'image/jpeg'
                        data['image'] = f"data:{mime_type};base64,{image_b64}"  # Use 'image' field as per schema
                        print(f"[DEBUG] Plot image processed successfully")
                    else:
                        return jsonify({'error': 'Plot image is required for creating a new plot'}), 400
                else:
                    return jsonify({'error': 'Plot image is required for creating a new plot'}), 400
                        
            elif request.is_json and request.json:
                print(f"[DEBUG] Processing JSON data for plot creation")
                # Handle JSON data (legacy support)
                data = request.json.copy()
                
            else:
                return jsonify({'error': 'Invalid request format. Expected form data or JSON.'}), 400

            # Use the society profile's _id as societyId
            data['societyId'] = str(profile['_id'])
            
            # Validate plot number is provided
            if not data.get('plot_number') or not data['plot_number'].strip():
                return jsonify({'error': 'Plot number is required'}), 400
            
            # Check for duplicate plot number within the same society
            plot_col = plot_collection(db)
            existing_plot = plot_col.find_one({
                'societyId': data['societyId'],
                'plot_number': data['plot_number'].strip()
            })
            
            if existing_plot:
                return jsonify({
                    'error': f'Plot number "{data["plot_number"]}" already exists in this society. Please choose a different plot number.'
                }), 400
            
            print(f"[DEBUG] Plot data prepared: {list(data.keys())}")
            print(f"[DEBUG] Plot number validation passed: {data['plot_number']}")

            plot_id = plot_col.insert_one(data).inserted_id
            
            print(f"[DEBUG] Plot created successfully with ID: {plot_id}")
            return jsonify({'plot_id': str(plot_id)}), 201
            
        except Exception as e:
            print(f"[ERROR] Plot creation failed: {type(e).__name__}: {str(e)}")
            import traceback
            print(f"[ERROR] Traceback:\n{traceback.format_exc()}")
            return jsonify({'error': f'Plot creation failed: {str(e)}'}), 500

    @staticmethod
    @jwt_required()
    def get_all_plots():
        db = get_db()
        user_email = get_jwt_identity()
        
        # First get the society profile to get societyId
        profiles = society_profile_collection(db)
        profile = profiles.find_one({'user_email': user_email})
        if not profile:
            print(f"No society profile found for user {user_email}")
            return jsonify({'error': 'Society profile not found'}), 400
        
        society_id = str(profile['_id'])
        plot_col = plot_collection(db)
        
        # Get plots filtered by societyId (both possible field names)
        plots = list(plot_col.find({
            '$or': [
                {'societyId': society_id}
            ]
        }))
        
        # Add debug prints
        print(f"Society ID we're looking for: {society_id}")
        print(f"Total plots found: {len(plots)}")
        
        for plot in plots:
            plot['_id'] = str(plot['_id'])
            # Debug print for each plot
            print(f"Plot data: societyId={plot.get('societyId')} or societyid={plot.get('societyid')}")
        
        return jsonify(plots)

    @staticmethod
    def get_plot(plot_id):
        db = get_db()
        plot_col = plot_collection(db)
        plot = plot_col.find_one({'_id': ObjectId(plot_id)})
        if not plot:
            return jsonify({'error': 'Plot not found'}), 404
        plot['_id'] = str(plot['_id'])
        return jsonify(plot)

    @staticmethod
    def update_plot(plot_id):
        try:
            db = get_db()
            
            print(f"[DEBUG] Updating plot ID: {plot_id}")
            print(f"[DEBUG] Request content type: {request.content_type}")
            
            # Initialize plot data
            data = {}
            
            # Handle different content types
            if request.content_type and 'multipart/form-data' in request.content_type:
                print(f"[DEBUG] Processing FormData for plot update")
                print(f"[DEBUG] Form fields: {list(request.form.keys())}")
                print(f"[DEBUG] File fields: {list(request.files.keys())}")
                
                # Handle form data (with file upload) - Map to database schema
                data = {
                    'plot_number': request.form.get('plot_number', ''),  # Match database schema
                    'area': request.form.get('area', ''),
                    'type': request.form.get('type', 'Residential'),
                    'price': request.form.get('price', ''),
                    'status': request.form.get('status', 'Available'),
                    'location': request.form.get('location', ''),
                }
                
                # Handle dimensions - convert to int as per schema
                try:
                    if request.form.get('dimension_x'):
                        data['dimension_x'] = int(request.form.get('dimension_x', '0'))
                    if request.form.get('dimension_y'):
                        data['dimension_y'] = int(request.form.get('dimension_y', '0'))
                except ValueError:
                    pass  # Skip invalid dimensions in updates
                
                # Handle description array from FormData format (description[0], description[1], etc.)
                descriptions = []
                for key in request.form.keys():
                    if key.startswith('description[') and key.endswith(']'):
                        index = key[len('description['):-1]
                        try:
                            idx = int(index)
                            desc_value = request.form.get(key, '').strip()
                            if desc_value:
                                descriptions.append((idx, desc_value))
                        except ValueError:
                            pass
                
                if descriptions:
                    descriptions.sort(key=lambda x: x[0])
                    data['description'] = [desc[1] for desc in descriptions]
                
                # Handle seller object from FormData format (seller[name], seller[phone])
                seller = {}
                for key in request.form.keys():
                    if key.startswith('seller[') and key.endswith(']'):
                        field = key[len('seller['):-1]
                        value = request.form.get(key, '').strip()
                        if value:
                            seller[field] = value
                
                if seller:
                    data['seller'] = seller
                
                # Handle amenities array from FormData format (amenities[0], amenities[1], etc.)
                amenities = []
                for key in request.form.keys():
                    if key.startswith('amenities[') and key.endswith(']'):
                        index = key[len('amenities['):-1]
                        try:
                            idx = int(index)
                            amenity_value = request.form.get(key, '').strip()
                            if amenity_value:
                                amenities.append((idx, amenity_value))
                        except ValueError:
                            pass
                
                if amenities:
                    amenities.sort(key=lambda x: x[0])
                    data['amenities'] = [amenity[1] for amenity in amenities]
                
                print(f"[DEBUG] Processed descriptions: {data.get('description', 'No change')}")
                print(f"[DEBUG] Processed seller: {data.get('seller', 'No change')}")
                print(f"[DEBUG] Processed amenities: {data.get('amenities', 'No change')}")
                
                # Handle plot image upload if present
                if 'plot_image' in request.files:
                    image_file = request.files['plot_image']
                    if image_file and image_file.filename:
                        print(f"[DEBUG] Processing plot image update: {image_file.filename}")
                        
                        # Validate file type
                        filename = image_file.filename.lower()
                        if not any(filename.endswith(ext) for ext in ['.png', '.jpg', '.jpeg']):
                            return jsonify({'error': 'Only PNG, JPG, JPEG files allowed'}), 400
                        
                        # Read and validate file size
                        image_content = image_file.read()
                        if len(image_content) > 5 * 1024 * 1024:  # 5MB limit
                            return jsonify({'error': 'File too large (max 5MB)'}), 400
                        
                        # Create base64 string and store as 'image' to match schema
                        image_b64 = base64.b64encode(image_content).decode('utf-8')
                        mime_type = 'image/png' if filename.endswith('.png') else 'image/jpeg'
                        data['image'] = f"data:{mime_type};base64,{image_b64}"  # Use 'image' field as per schema
                        print(f"[DEBUG] Plot image updated successfully")
                        
            elif request.is_json and request.json:
                print(f"[DEBUG] Processing JSON data for plot update")
                # Handle JSON data (legacy support)
                data = request.json.copy()
                
            else:
                return jsonify({'error': 'Invalid request format. Expected form data or JSON.'}), 400
            
            # Remove empty fields to avoid overwriting with empty values
            data = {k: v for k, v in data.items() if v is not None and v != ''}
            
            plot_col = plot_collection(db)
            
            # If plot_number is being updated, check for duplicates
            if 'plot_number' in data and data['plot_number']:
                # Get the current plot to find its societyId and current plot_number
                current_plot = plot_col.find_one({'_id': ObjectId(plot_id)})
                if not current_plot:
                    return jsonify({'error': 'Plot not found'}), 404
                
                # Only check for duplicates if the plot number is actually changing
                if current_plot.get('plot_number') != data['plot_number'].strip():
                    # Check for duplicate plot number within the same society
                    existing_plot = plot_col.find_one({
                        'societyId': current_plot.get('societyId'),
                        'plot_number': data['plot_number'].strip(),
                        '_id': {'$ne': ObjectId(plot_id)}  # Exclude current plot
                    })
                    
                    if existing_plot:
                        return jsonify({
                            'error': f'Plot number "{data["plot_number"]}" already exists in this society. Please choose a different plot number.'
                        }), 400
                    
                    print(f"[DEBUG] Plot number validation passed for update: {data['plot_number']}")
            
            print(f"[DEBUG] Plot update data prepared: {list(data.keys())}")
            
            result = plot_col.update_one({'_id': ObjectId(plot_id)}, {'$set': data})
            
            if result.matched_count == 0:
                return jsonify({'error': 'Plot not found'}), 404
                
            print(f"[DEBUG] Plot updated successfully: modified={result.modified_count}")
            return jsonify({'message': 'Plot updated'})
            
        except Exception as e:
            print(f"[ERROR] Plot update failed: {type(e).__name__}: {str(e)}")
            import traceback
            print(f"[ERROR] Traceback:\n{traceback.format_exc()}")
            return jsonify({'error': f'Plot update failed: {str(e)}'}), 500

    @staticmethod
    def delete_plot(plot_id):
        db = get_db()
        plot_col = plot_collection(db)
        result = plot_col.delete_one({'_id': ObjectId(plot_id)})
        if result.deleted_count == 0:
            return jsonify({'error': 'Plot not found'}), 404
        return jsonify({'message': 'Plot deleted'})
