from flask import request, jsonify
from models.floorplan import floorplan_collection
from utils.db import get_db
from datetime import datetime
from bson.objectid import ObjectId
import traceback


def approve_as_template():
    """Approve a floor plan as a society template (Sub-admin only)"""
    try:
        data = request.get_json()
        floorplan_id = data.get('floorplan_id')
        template_name = data.get('template_name', '').strip()
        template_description = data.get('template_description', '').strip()
        plot_size = data.get('plot_size', '').strip()
        society_id = data.get('society_id')
        
        if not floorplan_id:
            return jsonify({'success': False, 'error': 'Floor plan ID is required'}), 400
        
        if not template_name:
            return jsonify({'success': False, 'error': 'Template name is required'}), 400
            
        if not plot_size:
            return jsonify({'success': False, 'error': 'Plot size is required'}), 400
        
        if not society_id:
            return jsonify({'success': False, 'error': 'Society ID is required'}), 400
        
        db = get_db()
        floorplans = floorplan_collection(db)
        
        # Update the floor plan to mark as approved template
        result = floorplans.update_one(
            {'_id': ObjectId(floorplan_id)},
            {
                '$set': {
                    'is_template': True,
                    'is_approved': True,
                    'template_name': template_name,
                    'template_description': template_description,
                    'plot_size': plot_size,
                    'society_id': society_id,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            return jsonify({'success': False, 'error': 'Floor plan not found or already approved'}), 404
        
        return jsonify({
            'success': True,
            'message': f'Floor plan approved as template: {template_name}'
        }), 200
        
    except Exception as e:
        print(f"Error approving template: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


def unapprove_template():
    """Remove template approval from a floor plan (Sub-admin only)"""
    try:
        floorplan_id = request.args.get('floorplan_id')
        
        if not floorplan_id:
            return jsonify({'success': False, 'error': 'Floor plan ID is required'}), 400
        
        db = get_db()
        floorplans = floorplan_collection(db)
        
        # Remove template status
        result = floorplans.update_one(
            {'_id': ObjectId(floorplan_id)},
            {
                '$set': {
                    'is_template': False,
                    'is_approved': False,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            return jsonify({'success': False, 'error': 'Floor plan not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Template approval removed'
        }), 200
        
    except Exception as e:
        print(f"Error unapproving template: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


def get_society_templates():
    """Get all approved templates for a society"""
    try:
        society_id = request.args.get('society_id')
        plot_size = request.args.get('plot_size')  # Optional filter
        
        if not society_id:
            return jsonify({'success': False, 'error': 'Society ID is required'}), 400
        
        db = get_db()
        floorplans = floorplan_collection(db)
        
        # Build query
        query = {
            'society_id': society_id,
            'is_template': True,
            'is_approved': True
        }
        
        # Add plot size filter if provided
        if plot_size:
            query['plot_size'] = plot_size
        
        templates = list(floorplans.find(query).sort('created_at', -1))
        
        # Convert ObjectId to string
        for template in templates:
            template['_id'] = str(template['_id'])
        
        return jsonify({
            'success': True,
            'templates': templates,
            'count': len(templates)
        }), 200
        
    except Exception as e:
        print(f"Error fetching templates: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


def get_all_society_floorplans():
    """Get all floor plans for a society (for sub-admin to approve templates)"""
    try:
        society_id = request.args.get('society_id')
        
        if not society_id:
            return jsonify({'success': False, 'error': 'Society ID is required'}), 400
        
        db = get_db()
        floorplans = floorplan_collection(db)
        
        # Get all floor plans created by users in this society
        # For now, we'll get all floor plans and filter by society_id if set
        all_plans = list(floorplans.find({}).sort('created_at', -1))
        
        # Convert ObjectId to string
        for plan in all_plans:
            plan['_id'] = str(plan['_id'])
        
        return jsonify({
            'success': True,
            'floorplans': all_plans,
            'count': len(all_plans)
        }), 200
        
    except Exception as e:
        print(f"Error fetching floor plans: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
