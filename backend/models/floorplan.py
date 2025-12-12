from datetime import datetime
from bson.objectid import ObjectId

def floorplan_collection(db):
    """Get the floorplans collection from database"""
    return db['floorplans']

# Floor plan schema definition
floorplan_schema = {
    '_id': ObjectId,
    'user_id': str,  # ID of the user who created this floor plan
    'project_name': str,  # Name of the project/floor plan
    'floor_plan_data': list,  # Generated floor plan data (walls, doors, labels)
    'room_data': list,  # Room coordinate and dimension data
    'constraints': dict,  # Input constraints used for generation
    'dimensions': {
        'width': int,  # Plot width
        'height': int  # Plot height
    },
    'room_requirements': {
        'rooms': list,  # List of required rooms
        'connections': list,  # Room connectivity requirements
        'proportions': dict,  # Room aspect ratio requirements
        'percentages': dict  # Room area percentage requirements
    },
    'generation_parameters': {
        'algorithm': str,  # Algorithm used (GA, etc.)
        'generations': int,  # Number of GA generations
        'population_size': int,  # GA population size
        'fitness_score': float  # Best fitness score achieved
    },
    'created_at': datetime,
    'updated_at': datetime,
    'is_favorite': bool,  # User favorite flag
    'tags': list,  # User-defined tags for categorization
    'status': str,  # 'active', 'archived', 'draft'
    'version': int,  # Version number for tracking changes
    # Template fields
    'is_template': bool,  # Whether this is marked as a template
    'is_approved': bool,  # Whether template is approved by society admin
    'template_name': str,  # Display name for the template
    'template_description': str,  # Description like "Perfect for families", "Modern design"
    'plot_size': str,  # Plot size (5 Marla, 6 Marla, etc.) for filtering
    'society_id': str  # Society that approved this template
}

def create_floorplan_document(user_id, project_name, floor_plan_data, **kwargs):
    """Create a new floor plan document with proper structure"""
    return {
        'user_id': user_id,
        'project_name': project_name,
        'floor_plan_data': floor_plan_data,
        'room_data': kwargs.get('room_data', []),
        'constraints': kwargs.get('constraints', {}),
        'dimensions': kwargs.get('dimensions', {'width': 1000, 'height': 1000}),
        'room_requirements': kwargs.get('room_requirements', {}),
        'generation_parameters': kwargs.get('generation_parameters', {}),
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
        'is_favorite': kwargs.get('is_favorite', False),
        'tags': kwargs.get('tags', []),
        'status': kwargs.get('status', 'active'),
        'version': kwargs.get('version', 1),
        # Template fields
        'is_template': kwargs.get('is_template', False),
        'is_approved': kwargs.get('is_approved', False),
        'template_name': kwargs.get('template_name', ''),
        'template_description': kwargs.get('template_description', ''),
        'plot_size': kwargs.get('plot_size', ''),
        'society_id': kwargs.get('society_id', '')
    }

def validate_floorplan_data(data):
    """Validate floor plan data structure"""
    required_fields = ['user_id', 'project_name', 'floor_plan_data']
    
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
    
    # Validate floor plan data structure
    if not isinstance(data['floor_plan_data'], list):
        return False, "floor_plan_data must be a list"
    
    # Validate user_id format
    if not isinstance(data['user_id'], str) or len(data['user_id']) == 0:
        return False, "user_id must be a non-empty string"
    
    # Validate project_name
    if not isinstance(data['project_name'], str) or len(data['project_name']) == 0:
        return False, "project_name must be a non-empty string"
    
    return True, "Valid"

# Index definitions for better query performance
floorplan_indexes = [
    [('user_id', 1)],  # For user-based queries
    [('created_at', -1)],  # For chronological sorting
    [('is_favorite', 1), ('user_id', 1)],  # For favorite queries
    [('tags', 1), ('user_id', 1)],  # For tag-based searches
    [('status', 1), ('user_id', 1)]  # For status filtering
]
