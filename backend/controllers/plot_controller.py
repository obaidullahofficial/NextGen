# Plot Controller
from utils.db import get_db
from models.plot import plot_collection, Plot
from flask import jsonify, request
from bson import ObjectId
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.society_profile import society_profile_collection
import base64
import json
from datetime import datetime

class PlotController:
    """
    Controller class to handle all business logic related to plots.
    This includes creating, retrieving, updating, and deleting plots.
    """

    @staticmethod
    @jwt_required()
    def create_plot():
        """
        Handles the creation of a new plot.
        It processes both form-data (for file uploads) and JSON data.
        """
        try:
            db = get_db()
            user_email = get_jwt_identity()
            
            # Get user_id from email
            from models.user import user_collection
            users = user_collection(db)
            user = users.find_one({'email': user_email}, {'_id': 1})
            if not user:
                return jsonify({'error': 'User not found'}), 400
            
            user_id = str(user['_id'])
            
            # Find the society profile for this user
            profiles = society_profile_collection(db)
            profile = profiles.find_one({'user_id': user_id})
            if not profile:
                return jsonify({'error': 'Society profile not found for this user'}), 400

            data = {}
            
            # Check the request content type to handle data correctly
            if request.content_type and 'multipart/form-data' in request.content_type:
                # Handle form data, converting it to the expected schema
                data = {
                    'plot_number': request.form.get('plot_number', ''),
                    'area': request.form.get('area', ''),
                    'marla_size': request.form.get('marla_size', ''),
                    'type': request.form.get('type', 'Residential'),
                    'price': request.form.get('price', ''),
                    'status': request.form.get('status', 'Available'),
                }
                
                # Convert dimensions to integers
                try:
                    data['dimension_x'] = int(request.form.get('dimension_x', '0')) if request.form.get('dimension_x') else 0
                    data['dimension_y'] = int(request.form.get('dimension_y', '0')) if request.form.get('dimension_y') else 0
                except ValueError:
                    data['dimension_x'] = 0
                    data['dimension_y'] = 0
                
                # Handle nested array fields from form data
                data['description'] = [request.form.get(f'description[{i}]') for i in range(len(request.form.getlist('description[]')))]
                
                # Process image file upload, convert to base64
                if 'plot_image' in request.files:
                    image_file = request.files['plot_image']
                    if image_file and image_file.filename:
                        filename = image_file.filename.lower()
                        if not any(filename.endswith(ext) for ext in ['.png', '.jpg', '.jpeg']):
                            return jsonify({'error': 'Only PNG, JPG, JPEG files allowed'}), 400
                        
                        image_content = image_file.read()
                        if len(image_content) > 5 * 1024 * 1024:  # 5MB limit
                            return jsonify({'error': 'File too large (max 5MB)'}), 400
                        
                        image_b64 = base64.b64encode(image_content).decode('utf-8')
                        mime_type = 'image/png' if filename.endswith('.png') else 'image/jpeg'
                        data['image'] = f"data:{mime_type};base64,{image_b64}"
                    else:
                        return jsonify({'error': 'Plot image is required for creating a new plot'}), 400
                else:
                    return jsonify({'error': 'Plot image is required for creating a new plot'}), 400
                        
            elif request.is_json and request.json:
                # Handle JSON data for legacy or API-only requests
                data = request.json.copy()
            else:
                return jsonify({'error': 'Invalid request format. Expected form data or JSON.'}), 400

            # Use the society profile's _id as societyId (store as ObjectId for foreign key)
            society_id = profile['_id'] if isinstance(profile['_id'], ObjectId) else ObjectId(profile['_id'])
            data['societyId'] = society_id
            
            # Validate required fields
            if not data.get('plot_number') or not data['plot_number'].strip():
                return jsonify({'error': 'Plot number is required'}), 400
            
            plot_col = plot_collection(db)
            existing_plot = plot_col.find_one({
                'societyId': society_id,
                'plot_number': data['plot_number'].strip()
            })
            
            if existing_plot:
                return jsonify({'error': f'Plot number "{data["plot_number"]}" already exists in this society. Please choose a different plot number.'}), 400
            
            # Create a Plot object using the data
            plot = Plot(
                plot_number=data['plot_number'],
                societyId=data['societyId'],
                image=data.get('image'),
                price=data.get('price', ''),
                status=data.get('status', 'Available'),
                type=data.get('type', 'Residential Plot'),
                area=data.get('area', ''),
                marla_size=data.get('marla_size', ''),
                dimension_x=data.get('dimension_x', 0),
                dimension_y=data.get('dimension_y', 0),
                description=data.get('description', [])
            )
            
            plot_dict = plot.to_dict()
            if 'plot_id' in plot_dict:
                plot_dict.pop('plot_id')
                
            plot_id = plot_col.insert_one(plot_dict).inserted_id
            
            return jsonify({'plot_id': str(plot_id)}), 201
            
        except Exception as e:
            return jsonify({'error': f'Plot creation failed: {str(e)}'}), 500

    @staticmethod
    @jwt_required()
    def get_all_plots():
        """
        Retrieves all plots.
        - For admin users: returns all plots from all societies
        - For society users: returns plots associated with their society
        """
        db = get_db()
        user_email = get_jwt_identity()
        
        # Get user_id from email
        from models.user import user_collection
        users = user_collection(db)
        user = users.find_one({'email': user_email}, {'_id': 1, 'role': 1})
        if not user:
            return jsonify({'error': 'User not found'}), 400
        
        user_id = str(user['_id'])
        user_role = user.get('role', 'user')
        
        plot_col = plot_collection(db)
        
        # If admin, return all plots
        if user_role == 'admin':
            plots = list(plot_col.find({}))
        else:
            # For non-admin users, check for society profile
            profiles = society_profile_collection(db)
            profile = profiles.find_one({'user_id': user_id})
            if not profile:
                return jsonify({'error': 'Society profile not found'}), 400
            
            # Use ObjectId to match the foreign key format stored in plots
            society_id = profile['_id'] if isinstance(profile['_id'], ObjectId) else ObjectId(profile['_id'])
            plots = list(plot_col.find({'societyId': society_id}))
        
        for plot in plots:
            plot['_id'] = str(plot['_id'])
            # Convert societyId ObjectId to string for JSON serialization
            if 'societyId' in plot and isinstance(plot['societyId'], ObjectId):
                plot['societyId'] = str(plot['societyId'])
        
        return jsonify(plots)

    @staticmethod
    def get_plot(plot_id):
        """
        Retrieves a single plot by its ID.
        """
        db = get_db()
        plot_col = plot_collection(db)
        try:
            print(f"[get_plot] Fetching plot with ID: {plot_id}")
            plot_data = plot_col.find_one({'_id': ObjectId(plot_id)})
            if not plot_data:
                print(f"[get_plot] Plot not found: {plot_id}")
                return jsonify({'error': 'Plot not found'}), 404
                
            plot_data['_id'] = str(plot_data['_id'])
            plot_data['plot_id'] = plot_data['_id']
            
            # Convert societyId ObjectId to string for JSON serialization
            if 'societyId' in plot_data and isinstance(plot_data['societyId'], ObjectId):
                plot_data['societyId'] = str(plot_data['societyId'])
            
            print(f"[get_plot] Successfully fetched plot: {plot_data.get('plot_number')}")
            return jsonify(plot_data)
        except Exception as e:
            print(f"[get_plot] Error: {str(e)}")
            return jsonify({'error': f'Invalid plot ID format: {str(e)}'}), 400

    @staticmethod
    def get_plots_by_society_id(society_id):
        """
        Retrieves all plots for a specific society, given its ID.
        This endpoint is public and does not require authentication.
        """
        db = get_db()
        plot_col = plot_collection(db)
        
        # Convert society_id string to ObjectId for querying (societyId stored as ObjectId FK)
        try:
            society_id_obj = ObjectId(society_id) if isinstance(society_id, str) else society_id
        except Exception as e:
            return jsonify({'error': f'Invalid society ID format: {str(e)}'}), 400
        
        print(f"[get_plots_by_society_id] Searching for societyId: {society_id_obj}")
        
        # Find all plots belonging to the specified society ID
        plots = list(plot_col.find({'societyId': society_id_obj}))
        
        print(f"[get_plots_by_society_id] Found {len(plots)} plots")
        
        # If no plots, let's check what societyIds exist in the database
        if not plots:
            all_plots = list(plot_col.find({}, {'societyId': 1, 'plot_number': 1}))
            print(f"[get_plots_by_society_id] Total plots in DB: {len(all_plots)}")
            for p in all_plots[:5]:  # Show first 5
                print(f"  - Plot {p.get('plot_number')}: societyId = {p.get('societyId')} (type: {type(p.get('societyId'))})")
            return jsonify([]), 200
            
        # Convert ObjectId to string for JSON serialization
        for plot in plots:
            plot['_id'] = str(plot['_id'])
            # Convert societyId ObjectId to string for JSON response
            if 'societyId' in plot:
                plot['societyId'] = str(plot['societyId'])
            
        return jsonify(plots)

    @staticmethod
    def update_plot(plot_id):
        """
        Updates an existing plot based on its ID.
        Handles both form-data and JSON data for updates.
        """
        try:
            db = get_db()
            data = {}
            
            if request.content_type and 'multipart/form-data' in request.content_type:
                data = request.form.to_dict()
                
                # Handle nested array and object fields
                data['description'] = [request.form.get(f'description[{i}]') for i in range(len(request.form.getlist('description[]')))]

                # Handle image file upload for update
                if 'plot_image' in request.files:
                    image_file = request.files['plot_image']
                    if image_file and image_file.filename:
                        filename = image_file.filename.lower()
                        if not any(filename.endswith(ext) for ext in ['.png', '.jpg', '.jpeg']):
                            return jsonify({'error': 'Only PNG, JPG, JPEG files allowed'}), 400
                        
                        image_content = image_file.read()
                        if len(image_content) > 5 * 1024 * 1024:
                            return jsonify({'error': 'File too large (max 5MB)'}), 400
                        
                        image_b64 = base64.b64encode(image_content).decode('utf-8')
                        mime_type = 'image/png' if filename.endswith('.png') else 'image/jpeg'
                        data['image'] = f"data:{mime_type};base64,{image_b64}"

            elif request.is_json and request.json:
                data = request.json.copy()
            else:
                return jsonify({'error': 'Invalid request format. Expected form data or JSON.'}), 400
            
            data = {k: v for k, v in data.items() if v is not None and v != ''}
            
            plot_col = plot_collection(db)
            
            # If plot_number is being updated, check for duplicates
            if 'plot_number' in data and data['plot_number']:
                current_plot = plot_col.find_one({'_id': ObjectId(plot_id)})
                if not current_plot:
                    return jsonify({'error': 'Plot not found'}), 404
                
                if current_plot.get('plot_number') != data['plot_number'].strip():
                    existing_plot = plot_col.find_one({
                        'societyId': current_plot.get('societyId'),
                        'plot_number': data['plot_number'].strip(),
                        '_id': {'$ne': ObjectId(plot_id)}
                    })
                    
                    if existing_plot:
                        return jsonify({'error': f'Plot number "{data["plot_number"]}" already exists in this society.'}), 400
            
            current_plot = plot_col.find_one({'_id': ObjectId(plot_id)})
            if not current_plot:
                return jsonify({'error': 'Plot not found'}), 404
            
            data['updated_at'] = datetime.utcnow()
            
            result = plot_col.update_one({'_id': ObjectId(plot_id)}, {'$set': data})
            
            if result.matched_count == 0:
                return jsonify({'error': 'Plot not found'}), 404
                
            return jsonify({'message': 'Plot updated'})
            
        except Exception as e:
            return jsonify({'error': f'Plot update failed: {str(e)}'}), 500

    @staticmethod
    def delete_plot(plot_id):
        """
        Deletes a plot by its ID.
        """
        try:
            db = get_db()
            plot_col = plot_collection(db)
            result = plot_col.delete_one({'_id': ObjectId(plot_id)})
            if result.deleted_count == 0:
                return jsonify({'error': 'Plot not found'}), 404
            
            return jsonify({'message': 'Plot deleted'})
        except Exception as e:
            return jsonify({'error': 'Invalid plot ID format'}), 400
