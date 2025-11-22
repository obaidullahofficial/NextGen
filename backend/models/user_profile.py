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
        self.email = kwargs.get('email', '')
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
            'user_id': str(self.user_id),
            'cnic': self.cnic,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'email': self.email,
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

class ApprovalRequest:
    """Approval Request model for floor plan submissions"""
    
    def __init__(self, user_id, **kwargs):
        self.user_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
        # Optional link to society that owns the plot
        self.society_id = kwargs.get('society_id', '')  # store as string
        self.society_name = kwargs.get('society_name', '')
        # Plot reference: database ID and human-friendly plot number
        self.plot_id = kwargs.get('plot_id', '')  # plot document _id
        self.plot_number = kwargs.get('plot_number', '')  # e.g. "PL-1001"
        self.plot_details = kwargs.get('plot_details', '')
        self.area = kwargs.get('area', '')
        self.design_type = kwargs.get('design_type', '')
        self.floor_plan_file_url = kwargs.get('floor_plan_file_url', '')
        self.notes = kwargs.get('notes', '')
        self.status = kwargs.get('status', 'Pending')  # Pending, Approved, Rejected, In Review
        self.request_date = kwargs.get('request_date', datetime.utcnow())
        self.admin_comments = kwargs.get('admin_comments', '')
        self.reviewed_by = kwargs.get('reviewed_by', None)
        self.reviewed_at = kwargs.get('reviewed_at', None)
        self.created_at = kwargs.get('created_at', datetime.utcnow())
        self.updated_at = kwargs.get('updated_at', datetime.utcnow())

    def to_dict(self):
        """Convert the approval request to a dictionary"""
        return {
            'user_id': str(self.user_id),
            'society_id': self.society_id,
            'society_name': self.society_name,
            'plot_id': self.plot_id,
            'plot_number': self.plot_number,
            'plot_details': self.plot_details,
            'area': self.area,
            'design_type': self.design_type,
            'floor_plan_file_url': self.floor_plan_file_url,
            'notes': self.notes,
            'status': self.status,
            'request_date': self.request_date.isoformat() if isinstance(self.request_date, datetime) else self.request_date,
            'admin_comments': self.admin_comments,
            'reviewed_by': str(self.reviewed_by) if self.reviewed_by else None,
            'reviewed_at': self.reviewed_at.isoformat() if isinstance(self.reviewed_at, datetime) and self.reviewed_at else None,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
            'updated_at': self.updated_at.isoformat() if isinstance(self.updated_at, datetime) else self.updated_at
        }

def approval_request_collection(db):
    """Get the approval requests collection"""
    return db['approval_requests']

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
            'user_id': str(self.user_id),
            'activity_type': self.activity_type,
            'description': self.description,
            'metadata': self.metadata,
            'timestamp': self.timestamp.isoformat() if isinstance(self.timestamp, datetime) else self.timestamp
        }

def user_activity_collection(db):
    """Get the user activities collection"""
    return db['user_activities']