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
            
            # Find the society profile for this user
            profiles = society_profile_collection(db)
            profile = profiles.find_one({'user_email': user_email})
            if not profile:
                return jsonify({'error': 'Society profile not found for this user'}), 400

            data = {}
            
            # Check the request content type to handle data correctly
            if request.content_type and 'multipart/form-data' in request.content_type:
                # Handle form data, converting it to the expected schema
                data = {
                    'plot_number': request.form.get('plot_number', ''),
                    'area': request.form.get('area', ''),
                    'type': request.form.get('type', 'Residential'),
                    'price': request.form.get('price', ''),
                    'status': request.form.get('status', 'Available'),
                    'location': request.form.get('location', ''),
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
                data['amenities'] = [request.form.get(f'amenities[{i}]') for i in range(len(request.form.getlist('amenities[]')))]
                
                # Handle nested object field from form data
                seller = {}
                for key in request.form.keys():
                    if key.startswith('seller['):
                        field = key[len('seller['):-1]
                        seller[field] = request.form.get(key)
                data['seller'] = seller
                
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

            # Use the society profile's _id as societyId
            data['societyId'] = str(profile['_id'])
            
            # Validate required fields
            if not data.get('plot_number') or not data['plot_number'].strip():
                return jsonify({'error': 'Plot number is required'}), 400
            
            plot_col = plot_collection(db)
            existing_plot = plot_col.find_one({
                'societyId': data['societyId'],
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
                dimension_x=data.get('dimension_x', 0),
                dimension_y=data.get('dimension_y', 0),
                location=data.get('location', ''),
                description=data.get('description', []),
                seller=data.get('seller', {}),
                amenities=data.get('amenities', [])
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
        Retrieves all plots associated with the current user's society.
        """
        db = get_db()
        user_email = get_jwt_identity()
        
        profiles = society_profile_collection(db)
        profile = profiles.find_one({'user_email': user_email})
        if not profile:
            return jsonify({'error': 'Society profile not found'}), 400
        
        society_id = str(profile['_id'])
        plot_col = plot_collection(db)
        
        plots = list(plot_col.find({'societyId': society_id}))
        
        for plot in plots:
            plot['_id'] = str(plot['_id'])
        
        return jsonify(plots)

    @staticmethod
    def get_plot(plot_id):
        """
        Retrieves a single plot by its ID.
        """
        db = get_db()
        plot_col = plot_collection(db)
        try:
            plot_data = plot_col.find_one({'_id': ObjectId(plot_id)})
            if not plot_data:
                return jsonify({'error': 'Plot not found'}), 404
                
            plot_data['_id'] = str(plot_data['_id'])
            plot_data['plot_id'] = plot_data['_id']
            
            return jsonify(plot_data)
        except Exception as e:
            return jsonify({'error': 'Invalid plot ID format'}), 400

    @staticmethod
    def get_plots_by_society_id(society_id):
        """
        Retrieves all plots for a specific society, given its ID.
        This endpoint is public and does not require authentication.
        """
        db = get_db()
        plot_col = plot_collection(db)
        
        # Find all plots belonging to the specified society ID
        plots = list(plot_col.find({'societyId': society_id}))
        
        if not plots:
            return jsonify({'message': f'No plots found for society ID: {society_id}'}), 404
            
        # Convert ObjectId to string for JSON serialization
        for plot in plots:
            plot['_id'] = str(plot['_id'])
            
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
                data['amenities'] = [request.form.get(f'amenities[{i}]') for i in range(len(request.form.getlist('amenities[]')))]
                seller = {}
                for key in request.form.keys():
                    if key.startswith('seller['):
                        field = key[len('seller['):-1]
                        seller[field] = request.form.get(key)
                data['seller'] = seller

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
