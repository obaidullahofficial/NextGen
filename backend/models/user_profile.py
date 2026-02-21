from bson import ObjectId
from datetime import datetime

class UserProfile:
    """User Profile model for storing detailed user information"""
    
    def __init__(self, user_id, **kwargs):
        self.user_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
        self.cnic = kwargs.get('cnic', '')
        self.first_name = kwargs.get('first_name', '')
        self.last_name = kwargs.get('last_name', '')
        self.phone = kwargs.get('phone', '')
        self.profile_image_url = kwargs.get('profile_image_url', '')
        self.cnic_front_url = kwargs.get('cnic_front_url', '')
        self.cnic_back_url = kwargs.get('cnic_back_url', '')
        self.address = kwargs.get('address', {})
        self.created_at = kwargs.get('created_at', datetime.utcnow())
        self.updated_at = kwargs.get('updated_at', datetime.utcnow())
        self.is_verified = kwargs.get('is_verified', False)

    def to_dict(self):
        """Convert the profile to a dictionary"""
        return {
            'user_id': self.user_id,
            'cnic': self.cnic,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'profile_image_url': self.profile_image_url,
            'cnic_front_url': self.cnic_front_url,
            'cnic_back_url': self.cnic_back_url,
            'address': self.address,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
            'updated_at': self.updated_at.isoformat() if isinstance(self.updated_at, datetime) else self.updated_at,
            'is_verified': self.is_verified
        }

def user_profile_collection(db):
    """Get the user profiles collection"""
    return db['user_profiles']

class UserActivity:
    """User Activity model for tracking user actions"""
    
    def __init__(self, user_id, **kwargs):
        self.user_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
        self.activity_type = kwargs.get('activity_type', '')  # profile_update, request_submitted, etc.
        self.description = kwargs.get('description', '')
        self.metadata = kwargs.get('metadata', {})  # Additional activity data
        self.timestamp = kwargs.get('timestamp', datetime.utcnow())

    def to_dict(self):
        """Convert the activity to a dictionary"""
        return {
            'user_id': self.user_id,
            'activity_type': self.activity_type,
            'description': self.description,
            'metadata': self.metadata,
            'timestamp': self.timestamp.isoformat() if isinstance(self.timestamp, datetime) else self.timestamp
        }

def user_activity_collection(db):
    """Get the user activities collection"""
    return db['user_activities']