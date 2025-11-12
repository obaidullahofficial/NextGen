import os
import uuid
from datetime import datetime
from flask import current_app
from werkzeug.utils import secure_filename
from bson import ObjectId
from utils.db import get_db
from models.user_profile import (
    UserProfile, user_profile_collection,
    ApprovalRequest, approval_request_collection,
    UserActivity, user_activity_collection
)

class UserProfileController:
    """Controller for handling user profile operations"""
    
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}
    UPLOAD_FOLDER = 'uploads/user_profiles'
    
    @staticmethod
    def _allowed_file(filename):
        """Check if the file has an allowed extension"""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in UserProfileController.ALLOWED_EXTENSIONS
    
    @staticmethod
    def _save_file(file, folder_name):
        """Save uploaded file and return the file path"""
        if file and UserProfileController._allowed_file(file.filename):
            # Create upload directory if it doesn't exist
            upload_path = os.path.join(UserProfileController.UPLOAD_FOLDER, folder_name)
            os.makedirs(upload_path, exist_ok=True)
            
            # Generate unique filename
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            file_path = os.path.join(upload_path, unique_filename)
            
            # Save file
            file.save(file_path)
            return file_path
        return None
    
    @staticmethod
    def create_or_update_profile(user_id, profile_data, files=None):
        """Create or update user profile"""
        try:
            db = get_db()
            profiles = user_profile_collection(db)
            
            # Handle file uploads
            if files:
                if 'profile_image' in files and files['profile_image']:
                    profile_image_path = UserProfileController._save_file(
                        files['profile_image'], f"user_{user_id}/profile"
                    )
                    if profile_image_path:
                        profile_data['profile_image_url'] = profile_image_path
                
                if 'cnic_front' in files and files['cnic_front']:
                    cnic_front_path = UserProfileController._save_file(
                        files['cnic_front'], f"user_{user_id}/documents"
                    )
                    if cnic_front_path:
                        profile_data['cnic_front_url'] = cnic_front_path
                
                if 'cnic_back' in files and files['cnic_back']:
                    cnic_back_path = UserProfileController._save_file(
                        files['cnic_back'], f"user_{user_id}/documents"
                    )
                    if cnic_back_path:
                        profile_data['cnic_back_url'] = cnic_back_path
            
            # Update timestamp
            profile_data['updated_at'] = datetime.utcnow()
            
            # Update or insert profile
            result = profiles.update_one(
                {'user_id': ObjectId(user_id)},
                {'$set': profile_data},
                upsert=True
            )
            
            # Log activity
            UserProfileController._log_activity(
                user_id, 
                'profile_update', 
                'User profile information updated',
                {'fields_updated': list(profile_data.keys())}
            )
            
            return True, "Profile updated successfully"
        
        except Exception as e:
            return False, f"Error updating profile: {str(e)}"
    
    @staticmethod
    def get_profile(user_id):
        """Get user profile by user ID"""
        try:
            db = get_db()
            profiles = user_profile_collection(db)
            
            profile = profiles.find_one({'user_id': ObjectId(user_id)})
            if profile:
                profile['_id'] = str(profile['_id'])
                profile['user_id'] = str(profile['user_id'])
                return profile
            
            return None
        
        except Exception as e:
            print(f"Error getting profile: {str(e)}")
            return None
    
    @staticmethod
    def delete_profile(user_id):
        """Delete user profile"""
        try:
            db = get_db()
            profiles = user_profile_collection(db)
            
            result = profiles.delete_one({'user_id': ObjectId(user_id)})
            
            if result.deleted_count > 0:
                # Log activity
                UserProfileController._log_activity(
                    user_id, 
                    'profile_deleted', 
                    'User profile deleted'
                )
                return True, "Profile deleted successfully"
            else:
                return False, "Profile not found"
        
        except Exception as e:
            return False, f"Error deleting profile: {str(e)}"

class ApprovalRequestController:
    """Controller for handling approval requests"""
    
    @staticmethod
    def create_approval_request(user_id, request_data, files=None):
        """Create a new approval request"""
        try:
            db = get_db()
            requests = approval_request_collection(db)
            
            # Handle floor plan file upload
            if files and 'floor_plan_file' in files and files['floor_plan_file']:
                floor_plan_path = UserProfileController._save_file(
                    files['floor_plan_file'], f"user_{user_id}/floor_plans"
                )
                if floor_plan_path:
                    request_data['floor_plan_file_url'] = floor_plan_path
            
            # Create approval request object
            approval_request = ApprovalRequest(user_id, **request_data)
            
            # Insert into database
            result = requests.insert_one(approval_request.to_dict())
            
            # Log activity
            UserProfileController._log_activity(
                user_id, 
                'approval_request_submitted', 
                f'Approval request submitted for plot {request_data.get("plot_id", "N/A")}',
                {'request_id': str(result.inserted_id)}
            )
            
            return str(result.inserted_id), "Approval request submitted successfully"
        
        except Exception as e:
            return None, f"Error creating approval request: {str(e)}"
    
    @staticmethod
    def get_user_approval_requests(user_id):
        """Get all approval requests for a user"""
        try:
            db = get_db()
            requests = approval_request_collection(db)
            
            user_requests = list(requests.find(
                {'user_id': ObjectId(user_id)}
            ).sort('created_at', -1))
            
            # Convert ObjectIds to strings
            for request in user_requests:
                request['_id'] = str(request['_id'])
                request['user_id'] = str(request['user_id'])
                if request.get('reviewed_by'):
                    request['reviewed_by'] = str(request['reviewed_by'])
            
            return user_requests
        
        except Exception as e:
            print(f"Error getting approval requests: {str(e)}")
            return []
    
    @staticmethod
    def get_approval_request(request_id):
        """Get a specific approval request"""
        try:
            db = get_db()
            requests = approval_request_collection(db)
            
            request = requests.find_one({'_id': ObjectId(request_id)})
            if request:
                request['_id'] = str(request['_id'])
                request['user_id'] = str(request['user_id'])
                if request.get('reviewed_by'):
                    request['reviewed_by'] = str(request['reviewed_by'])
                return request
            
            return None
        
        except Exception as e:
            print(f"Error getting approval request: {str(e)}")
            return None
    
    @staticmethod
    def update_approval_request(request_id, update_data):
        """Update an approval request"""
        try:
            db = get_db()
            requests = approval_request_collection(db)
            
            update_data['updated_at'] = datetime.utcnow()
            
            result = requests.update_one(
                {'_id': ObjectId(request_id)},
                {'$set': update_data}
            )
            
            if result.modified_count > 0:
                return True, "Approval request updated successfully"
            else:
                return False, "Approval request not found"
        
        except Exception as e:
            return False, f"Error updating approval request: {str(e)}"
    
    @staticmethod
    def delete_approval_request(request_id, user_id):
        """Delete an approval request"""
        try:
            db = get_db()
            requests = approval_request_collection(db)
            
            result = requests.delete_one({
                '_id': ObjectId(request_id),
                'user_id': ObjectId(user_id)
            })
            
            if result.deleted_count > 0:
                # Log activity
                UserProfileController._log_activity(
                    user_id, 
                    'approval_request_deleted', 
                    f'Approval request {request_id} deleted'
                )
                return True, "Approval request deleted successfully"
            else:
                return False, "Approval request not found"
        
        except Exception as e:
            return False, f"Error deleting approval request: {str(e)}"

class UserActivityController:
    """Controller for handling user activities"""
    
    @staticmethod
    def get_user_activities(user_id, limit=50, offset=0):
        """Get user activities with pagination"""
        try:
            db = get_db()
            activities = user_activity_collection(db)
            
            user_activities = list(activities.find(
                {'user_id': ObjectId(user_id)}
            ).sort('timestamp', -1).skip(offset).limit(limit))
            
            # Convert ObjectIds to strings
            for activity in user_activities:
                activity['_id'] = str(activity['_id'])
                activity['user_id'] = str(activity['user_id'])
            
            return user_activities
        
        except Exception as e:
            print(f"Error getting user activities: {str(e)}")
            return []
    
    @staticmethod
    def get_user_progress_summary(user_id):
        """Get user progress summary"""
        try:
            db = get_db()
            profiles = user_profile_collection(db)
            requests = approval_request_collection(db)
            activities = user_activity_collection(db)
            
            # Get profile completion status
            profile = profiles.find_one({'user_id': ObjectId(user_id)})
            profile_completed = bool(profile and profile.get('cnic') and profile.get('first_name'))
            
            # Get approval request stats
            total_requests = requests.count_documents({'user_id': ObjectId(user_id)})
            approved_requests = requests.count_documents({
                'user_id': ObjectId(user_id),
                'status': 'Approved'
            })
            pending_requests = requests.count_documents({
                'user_id': ObjectId(user_id),
                'status': 'Pending'
            })
            
            # Get recent activities count
            recent_activities = activities.count_documents({
                'user_id': ObjectId(user_id),
                'timestamp': {'$gte': datetime.utcnow().replace(day=1)}  # This month
            })
            
            return {
                'profile_completed': profile_completed,
                'total_requests': total_requests,
                'approved_requests': approved_requests,
                'pending_requests': pending_requests,
                'recent_activities': recent_activities,
                'profile_verification_status': profile.get('is_verified', False) if profile else False
            }
        
        except Exception as e:
            print(f"Error getting user progress: {str(e)}")
            return {}

# Helper method for logging activities
def _log_activity(user_id, activity_type, description, metadata=None):
    """Log user activity"""
    try:
        db = get_db()
        activities = user_activity_collection(db)
        
        activity = UserActivity(user_id, 
            activity_type=activity_type,
            description=description,
            metadata=metadata or {}
        )
        
        activities.insert_one(activity.to_dict())
    except Exception as e:
        print(f"Error logging activity: {str(e)}")

# Add the helper method to UserProfileController
UserProfileController._log_activity = staticmethod(_log_activity)