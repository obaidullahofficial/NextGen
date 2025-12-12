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
        
        # Building regulations (Ground floor only - Pakistan Building Code)
        self.max_ground_coverage = kwargs.get('max_ground_coverage', 0)  # Percentage (e.g., 60%)
        
        # Mandatory setbacks (open space from house boundary)
        self.front_setback = kwargs.get('front_setback', 0)  # feet - MANDATORY space from front boundary
        self.rear_setback = kwargs.get('rear_setback', 0)  # feet - MANDATORY space from rear boundary
        self.side_setback_left = kwargs.get('side_setback_left', 0)  # feet - MANDATORY space from left boundary
        self.side_setback_right = kwargs.get('side_setback_right', 0)  # feet - MANDATORY space from right boundary
        
        # Room requirements
        self.min_room_height = kwargs.get('min_room_height', 10)  # feet
        self.min_bathroom_size = kwargs.get('min_bathroom_size', 0)  # sq ft
        self.min_kitchen_size = kwargs.get('min_kitchen_size', 0)  # sq ft
        self.min_bedroom_size = kwargs.get('min_bedroom_size', 0)  # sq ft
        self.min_living_room_size = kwargs.get('min_living_room_size', 0)  # sq ft
        
        # Fixed area requirements (MANDATORY in society)
        self.fixed_garden_area = kwargs.get('fixed_garden_area', 0)  # sq ft - MANDATORY garden area
        self.fixed_carporch_area = kwargs.get('fixed_carporch_area', 0)  # sq ft - MANDATORY car porch/parking area
        
        # Open space requirement
        self.min_open_space = kwargs.get('min_open_space', 0)  # Percentage of total plot
        
        # Building specifications (ground floor only)
        self.max_building_height = kwargs.get('max_building_height', 12)  # feet - default single story height
        
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
    
    def to_dict(self):
        """Convert compliance to dictionary for MongoDB storage"""
        return {
            'society_id': self.society_id,
            'marla_size': self.marla_size,
            'max_ground_coverage': self.max_ground_coverage,
            'front_setback': self.front_setback,
            'rear_setback': self.rear_setback,
            'side_setback_left': self.side_setback_left,
            'side_setback_right': self.side_setback_right,
            'min_room_height': self.min_room_height,
            'min_bathroom_size': self.min_bathroom_size,
            'min_kitchen_size': self.min_kitchen_size,
            'min_bedroom_size': self.min_bedroom_size,
            'min_living_room_size': self.min_living_room_size,
            'fixed_garden_area': self.fixed_garden_area,
            'fixed_carporch_area': self.fixed_carporch_area,
            'min_open_space': self.min_open_space,
            'max_building_height': self.max_building_height,
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
        
        # Validate fixed areas
        if self.fixed_garden_area < 0:
            return False, "Fixed garden area must be positive"
        
        if self.fixed_carporch_area < 0:
            return False, "Fixed car porch area must be positive"
        
        return True, "Valid"

def compliance_collection(db):
    """Get the compliance collection"""
    return db['compliances']
