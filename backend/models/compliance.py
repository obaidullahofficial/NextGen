from datetime import datetime
from bson import ObjectId

class Compliance:
    """
    Compliance model for storing Pakistan building regulations based on plot size.
    Sub-admins can set compliance rules for their society's plots.
    """
    
    def __init__(self, society_id, marla_size, **kwargs):
        self.society_id = ObjectId(society_id) if isinstance(society_id, str) else society_id
        self.marla_size = marla_size  # e.g., "5 Marla", "7 Marla", "10 Marla"
        
        # Auto-calculated plot dimensions (unchangeable) - same as in plot management
        marla_dimensions = self.get_marla_dimensions(marla_size)
        self.plot_dimension_x = kwargs.get('plot_dimension_x', marla_dimensions['x'])  # feet
        self.plot_dimension_y = kwargs.get('plot_dimension_y', marla_dimensions['y'])  # feet  
        self.total_plot_area = kwargs.get('total_plot_area', marla_dimensions['area'])  # sq ft
        
        # Building regulations (Ground floor only - Pakistan Building Code)
        self.max_ground_coverage = kwargs.get('max_ground_coverage', 0)  # Percentage (e.g., 60%)
        
        # Mandatory setbacks (open space from house boundary)
        self.front_setback = kwargs.get('front_setback', 0)  # feet - MANDATORY space from front boundary
        self.rear_setback = kwargs.get('rear_setback', 0)  # feet - MANDATORY space from rear boundary
        self.side_setback_left = kwargs.get('side_setback_left', 0)  # feet - MANDATORY space from left boundary
        self.side_setback_right = kwargs.get('side_setback_right', 0)  # feet - MANDATORY space from right boundary
        
        # Open space requirement
        self.min_open_space = kwargs.get('min_open_space', 0)  # Percentage of total plot
        
        # Building specifications (ground floor only)
        self.max_building_height = kwargs.get('max_building_height', 12)  # feet - default single story height
        
        # Room count requirements (minimum requirements)
        self.bedrooms = kwargs.get('bedrooms', 0)  # minimum number of bedrooms required
        self.bathrooms = kwargs.get('bathrooms', 0)  # minimum number of bathrooms required
        self.livingRooms = kwargs.get('livingRooms', 0)  # minimum number of living rooms required
        self.kitchens = kwargs.get('kitchens', 0)  # minimum number of kitchens required
        self.drawingrooms = kwargs.get('drawingrooms', 0)  # minimum number of drawing rooms required
        self.carporches = kwargs.get('carporches', 0)  # minimum number of car porches required
        self.gardens = kwargs.get('gardens', 0)  # minimum number of gardens required
        
        # Room area requirements (minimum area allocation per room type)
        self.bedroom_area = kwargs.get('bedroom_area', 0)  # minimum area per bedroom (sq ft)
        self.bathroom_area = kwargs.get('bathroom_area', 0)  # minimum area per bathroom (sq ft)
        self.livingroom_area = kwargs.get('livingroom_area', 0)  # minimum area per living room (sq ft)
        self.kitchen_area = kwargs.get('kitchen_area', 0)  # minimum area per kitchen (sq ft)
        self.drawingroom_area = kwargs.get('drawingroom_area', 0)  # minimum area per drawing room (sq ft)
        self.carporch_area = kwargs.get('carporch_area', 0)  # minimum area per car porch (sq ft)
        self.garden_area = kwargs.get('garden_area', 0)  # minimum area per garden (sq ft)
        
        # Room connections (array of {from: room_type, to: room_type} objects)
        self.roomConnections = kwargs.get('roomConnections', [])  # Room connectivity requirements
        
        # Additional rules (specific to Pakistan/society)
        self.additional_rules = kwargs.get('additional_rules', [])  # Array of text rules
        self.building_type_allowed = kwargs.get('building_type_allowed', 'Residential')  # Residential/Commercial/Mixed
        
        # Metadata
        self.created_by = kwargs.get('created_by')  # Sub-admin user_id
        self.is_active = kwargs.get('is_active', True)
        self.created_at = kwargs.get('created_at', datetime.utcnow())
        self.updated_at = kwargs.get('updated_at', datetime.utcnow())
        
        # Notes/Description
        self.notes = kwargs.get('notes', '')
    
    @staticmethod
    def get_marla_dimensions(marla_size):
        """Get plot dimensions for marla size (same as frontend MARLA_DIMENSIONS)"""
        marla_dimensions = {
            '5 Marla': {'x': 30, 'y': 50},
            '6 Marla': {'x': 30, 'y': 60},
            '7 Marla': {'x': 35, 'y': 60},
            '8 Marla': {'x': 40, 'y': 60},
            '9 Marla': {'x': 45, 'y': 60},
            '10 Marla': {'x': 50, 'y': 60},
            '11 Marla': {'x': 44, 'y': 75},
            '12 Marla': {'x': 48, 'y': 75},
            '13 Marla': {'x': 52, 'y': 75},
            '14 Marla': {'x': 56, 'y': 75},
            '15 Marla': {'x': 60, 'y': 75},
            '16 Marla': {'x': 64, 'y': 75},
            '17 Marla': {'x': 68, 'y': 75},
            '18 Marla': {'x': 72, 'y': 75},
            '19 Marla': {'x': 76, 'y': 75},
            '20 Marla (1 Kanal)': {'x': 80, 'y': 75}
        }
        
        dimensions = marla_dimensions.get(marla_size, {'x': 30, 'y': 50})
        return {
            'x': dimensions['x'],
            'y': dimensions['y'], 
            'area': dimensions['x'] * dimensions['y']
        }
    
    def to_dict(self):
        """Convert compliance to dictionary for MongoDB storage"""
        return {
            'society_id': self.society_id,
            'marla_size': self.marla_size,
            'plot_dimension_x': self.plot_dimension_x,
            'plot_dimension_y': self.plot_dimension_y,
            'total_plot_area': self.total_plot_area,
            'max_ground_coverage': self.max_ground_coverage,
            'front_setback': self.front_setback,
            'rear_setback': self.rear_setback,
            'side_setback_left': self.side_setback_left,
            'side_setback_right': self.side_setback_right,
            'min_open_space': self.min_open_space,
            'max_building_height': self.max_building_height,
            # Room count requirements
            'bedrooms': self.bedrooms,
            'bathrooms': self.bathrooms,
            'livingRooms': self.livingRooms,
            'kitchens': self.kitchens,
            'drawingrooms': self.drawingrooms,
            'carporches': self.carporches,
            'gardens': self.gardens,
            # Room area requirements
            'bedroom_area': self.bedroom_area,
            'bathroom_area': self.bathroom_area,
            'livingroom_area': self.livingroom_area,
            'kitchen_area': self.kitchen_area,
            'drawingroom_area': self.drawingroom_area,
            'carporch_area': self.carporch_area,
            'garden_area': self.garden_area,
            'roomConnections': self.roomConnections,
            'additional_rules': self.additional_rules,
            'building_type_allowed': self.building_type_allowed,
            'created_by': self.created_by,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
            'updated_at': self.updated_at.isoformat() if isinstance(self.updated_at, datetime) else self.updated_at,
            'notes': self.notes
        }
    
    def validate(self):
        """Validate compliance data"""
        if not self.society_id or not self.marla_size:
            return False, "Society ID and Marla Size are required"
        
        if self.max_ground_coverage < 0 or self.max_ground_coverage > 100:
            return False, "Ground coverage must be between 0-100%"
        
        # Validate setbacks (mandatory open space from boundaries)
        if self.front_setback < 0 or self.rear_setback < 0:
            return False, "Front and rear setbacks must be positive"
        
        if self.side_setback_left < 0 or self.side_setback_right < 0:
            return False, "Side setbacks must be positive"
        
        # Validate room counts (must be non-negative integers)
        room_counts = [self.bedrooms, self.bathrooms, self.livingRooms, self.kitchens, 
                      self.drawingrooms, self.carporches, self.gardens]
        if any(count < 0 for count in room_counts):
            return False, "Room counts must be non-negative"
        
        # Validate room connections format
        if self.roomConnections:
            for conn in self.roomConnections:
                if not isinstance(conn, dict) or 'from' not in conn or 'to' not in conn:
                    return False, "Room connections must be objects with 'from' and 'to' fields"
        
        return True, "Valid"

def compliance_collection(db):
    """Get the compliance collection"""
    return db['compliances']
