from bson import ObjectId
from datetime import datetime


class ApprovalRequest:
    """Approval Request model for floor plan submissions"""

    def __init__(self, user_id, **kwargs):
        self.user_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
        # Optional link to society that owns the plot
        self.society_id = kwargs.get('society_id', '')  # store as string
        # Plot reference: database ID only; plot_number comes from plots collection
        self.plot_id = kwargs.get('plot_id', '')  # plot document _id (string)
        self.design_type = kwargs.get('design_type', '')
        self.floor_plan_file_url = kwargs.get('floor_plan_file_url', '')
        # Store floor plan JSON data directly in database instead of as file
        self.floor_plan_data = kwargs.get('floor_plan_data', None)
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
            'plot_id': self.plot_id,
            'design_type': self.design_type,
            'floor_plan_file_url': self.floor_plan_file_url,
            'floor_plan_data': self.floor_plan_data,
            'notes': self.notes,
            'status': self.status,
            'request_date': self.request_date.isoformat() if isinstance(self.request_date, datetime) else self.request_date,
            'admin_comments': self.admin_comments,
            'reviewed_by': str(self.reviewed_by) if self.reviewed_by else None,
            'reviewed_at': self.reviewed_at.isoformat() if isinstance(self.reviewed_at, datetime) and self.reviewed_at else None,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
            'updated_at': self.updated_at.isoformat() if isinstance(self.updated_at, datetime) else self.updated_at,
        }


def approval_request_collection(db):
    """Get the approval requests collection"""
    return db['approval_requests']
