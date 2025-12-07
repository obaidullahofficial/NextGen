from datetime import datetime

from bson import ObjectId

from utils.db import get_db
from models.approval_request import ApprovalRequest, approval_request_collection
from controllers.user_profile_controller import UserProfileController


class ApprovalRequestController:
    """Controller for handling approval requests"""

    @staticmethod
    def create_approval_request(user_id, request_data, files=None):
        """Create a new approval request"""
        try:
            db = get_db()
            requests = approval_request_collection(db)

            # Handle floor plan file upload - store JSON content directly in database
            if files and 'floor_plan_file' in files and files['floor_plan_file']:
                floor_plan_file = files['floor_plan_file']
                try:
                    # Read the JSON content from the uploaded file
                    import json
                    floor_plan_content = floor_plan_file.read().decode('utf-8')
                    floor_plan_json = json.loads(floor_plan_content)
                    # Store the JSON content directly in the database
                    request_data['floor_plan_data'] = floor_plan_json
                except Exception as json_err:
                    print(f"Error parsing floor plan JSON: {json_err}")
                    # Fallback: save as file if JSON parsing fails
                    floor_plan_path = UserProfileController._save_file(
                        floor_plan_file, f"user_{user_id}/floor_plans"
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
                f"Approval request submitted for plot {request_data.get('plot_id', 'N/A')}",
                {'request_id': str(result.inserted_id)},
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

            user_requests = list(
                requests.find({'user_id': ObjectId(user_id)}).sort('created_at', -1)
            )

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
                {'$set': update_data},
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

            result = requests.delete_one(
                {
                    '_id': ObjectId(request_id),
                    'user_id': ObjectId(user_id),
                }
            )

            if result.deleted_count > 0:
                # Log activity
                UserProfileController._log_activity(
                    user_id,
                    'approval_request_deleted',
                    f'Approval request {request_id} deleted',
                )
                return True, "Approval request deleted successfully"
            else:
                return False, "Approval request not found"

        except Exception as e:
            return False, f"Error deleting approval request: {str(e)}"
