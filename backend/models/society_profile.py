from datetime import datetime
from bson import ObjectId

class SocietyProfile:
    def __init__(self, user_id, name, description, location, 
                 available_plots, price_range, society_logo=None, amenities=None,
                 contact_number=None, contact_name=None, head_office_address=None,
                 is_complete=False, created_at=None, updated_at=None):
        
        self.user_id = user_id
        
        # Basic Information
        self.name = name
        self.description = description
        self.location = location
        self.available_plots = available_plots
        self.price_range = price_range
        
        # Contact Information
        self.contact_number = contact_number
        self.contact_name = contact_name
        self.head_office_address = head_office_address
        
        # Media
        self.society_logo = society_logo
        
        # Amenities
        self.amenities = amenities or []
        
        # Status
        self.is_complete = is_complete
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()
    
    def to_dict(self):
        return {
            "user_id": self.user_id,
            "name": self.name,
            "description": self.description,
            "location": self.location,
            "available_plots": self.available_plots,
            "price_range": self.price_range,
            "contact_number": self.contact_number,
            "contact_name": self.contact_name,
            "head_office_address": self.head_office_address,
            "society_logo": self.society_logo,
            "amenities": self.amenities,
            "is_complete": self.is_complete,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
    
    def validate_completeness(self):
        """Check if all required fields are filled"""
        required_fields = [
            self.name, self.description, self.location, 
            self.available_plots, self.price_range
        ]
        
        # Check if all required fields have values
        is_complete = all(field and str(field).strip() for field in required_fields)
        
        # Society logo is also required (check for valid base64 data URL or non-empty string)
        logo_valid = (self.society_logo is not None and 
                     str(self.society_logo).strip() != '' and
                     (str(self.society_logo).startswith('data:image/') or len(str(self.society_logo)) > 0))
        
        is_complete = is_complete and logo_valid
        
        return is_complete
    
    @staticmethod
    def create_from_registration(registration_data, user_id, user_email):
        """Create initial society profile from registration form data"""
        return SocietyProfile(
            user_id=user_id,
            user_email=user_email,
            name=registration_data.get('name', ''),
            description='',  # To be filled later
            location=registration_data.get('city', ''),  # Hardcoded from registration form
            available_plots='',  # To be filled later
            price_range='',  # To be filled later
            society_logo=None,  # To be uploaded later
            is_complete=False
        )


def society_profile_collection(db):
    return db['society_profiles']
