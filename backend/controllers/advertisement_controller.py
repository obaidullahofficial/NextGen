# backend/controllers/advertisement_controller.py
from datetime import datetime, timedelta
from models.advertisement import Advertisement
from models.advertisement_plan import AdvertisementPlan
from bson import ObjectId

class AdvertisementController:
    
    @staticmethod
    def create_advertisement(ad_data, user_email):
        """Create a new advertisement request"""
        try:
            print(f"[DEBUG] Received ad_data: {ad_data}")
            print(f"[DEBUG] Society ID in ad_data: {ad_data.get('society_id')}")
            print(f"[DEBUG] User email: {user_email}")
            
            # Validate required fields
            if 'title' not in ad_data or not ad_data['title']:
                return {"success": False, "error": "Title is required"}
            if 'featured_image' not in ad_data or not ad_data['featured_image']:
                return {"success": False, "error": "Featured image is required"}
            if 'plan_id' not in ad_data or not ad_data['plan_id']:
                return {"success": False, "error": "Plan selection is required"}
            
            # Get society_id from society_profile (same as plot controller)
            from utils.db import get_db
            from models.user import user_collection
            from models.society_profile import society_profile_collection
            
            db = get_db()
            users = user_collection(db)
            user = users.find_one({'email': user_email}, {'_id': 1, 'role': 1})
            
            if not user:
                return {"success": False, "error": "User not found"}
            
            # Get society_id from profile for society users
            if user.get('role') == 'society':
                user_id = str(user['_id'])
                profiles = society_profile_collection(db)
                profile = profiles.find_one({'user_id': user_id})
                
                if profile:
                    society_id = str(profile['_id'])
                    ad_data['society_id'] = ObjectId(society_id)
                    print(f"[DEBUG] Set society_id from profile: {society_id}")
                else:
                    print(f"[DEBUG] No society profile found for user {user_email}")
                    # Remove society_id if no profile exists
                    ad_data.pop('society_id', None)
            else:
                # Not a society user, remove society_id
                ad_data.pop('society_id', None)
            
            # Validate plan exists
            plan_model = AdvertisementPlan()
            plan = plan_model.get_plan_by_id(ad_data['plan_id'])
            if not plan:
                return {"success": False, "error": "Invalid plan selected"}
            if not plan.get('is_active', True):
                return {"success": False, "error": "Selected plan is not available"}
            
            # Calculate dates
            start_date = datetime.utcnow()
            end_date = start_date + timedelta(days=plan['duration_days'])
            
            # Prepare advertisement data
            ad_data['user_email'] = user_email
            ad_data['plan_id'] = ObjectId(ad_data['plan_id'])
            ad_data['plan_name'] = plan['name']
            ad_data['price'] = plan['price']
            ad_data['start_date'] = start_date
            ad_data['end_date'] = end_date
            
            # Remove the duplicate society_id conversion logic since we already set it above
            
            print(f"[DEBUG] Final ad_data before saving: {ad_data}")
            
            # Create advertisement
            advertisement_model = Advertisement()
            ad_id = advertisement_model.create_advertisement(ad_data)
            
            return {
                "success": True,
                "message": "Advertisement created successfully. Proceed to payment.",
                "advertisement_id": ad_id,
                "price": plan['price']
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_all_advertisements(filters=None, page=1, per_page=10):
        """Get all advertisements with pagination"""
        try:
            advertisement_model = Advertisement()
            result = advertisement_model.get_all_advertisements(filters, page, per_page)
            return {
                "success": True,
                "data": result['advertisements'],
                "pagination": {
                    "page": result['page'],
                    "per_page": result['per_page'],
                    "total_pages": result['total_pages'],
                    "total_count": result['total_count']
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_advertisement_by_id(ad_id):
        """Get advertisement by ID"""
        try:
            if not ObjectId.is_valid(ad_id):
                return {"success": False, "error": "Invalid advertisement ID"}
            
            advertisement_model = Advertisement()
            ad = advertisement_model.get_advertisement_by_id(ad_id)
            
            if not ad:
                return {"success": False, "error": "Advertisement not found"}
            
            return {"success": True, "data": ad}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_pending_advertisements(page=1, per_page=10):
        """Get pending advertisements for admin approval"""
        try:
            advertisement_model = Advertisement()
            result = advertisement_model.get_pending_advertisements(page, per_page)
            return {
                "success": True,
                "data": result['advertisements'],
                "pagination": {
                    "page": result['page'],
                    "per_page": result['per_page'],
                    "total_pages": result['total_pages'],
                    "total_count": result['total_count']
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def approve_advertisement(ad_id):
        """Approve advertisement (admin only)"""
        try:
            if not ObjectId.is_valid(ad_id):
                return {"success": False, "error": "Invalid advertisement ID"}
            
            advertisement_model = Advertisement()
            ad = advertisement_model.get_advertisement_by_id(ad_id)
            
            if not ad:
                return {"success": False, "error": "Advertisement not found"}
            
            if ad['status'] != 'pending':
                return {"success": False, "error": "Only pending advertisements can be approved"}
            
            # Check if payment is completed
            if ad.get('payment_status') != 'paid':
                return {"success": False, "error": "Only paid advertisements can be approved"}
            
            # Approve with dates from the ad itself
            success = advertisement_model.approve_advertisement(
                ad_id,
                ad['start_date'],
                ad['end_date']
            )
            
            if success:
                # Send approval notification email
                try:
                    from utils.email_service import EmailService
                    user_email = ad.get('user_email')
                    ad_title = ad.get('title', 'Your advertisement')
                    
                    if user_email:
                        EmailService.send_advertisement_approval_email(
                            user_email, 
                            ad_title
                        )
                except Exception as email_error:
                    print(f"Failed to send approval email: {str(email_error)}")
                    # Don't fail the approval if email fails
                
                return {"success": True, "message": "Advertisement approved successfully and notification sent"}
            return {"success": False, "error": "Failed to approve advertisement"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def reject_advertisement(ad_id, admin_notes):
        """Reject advertisement (admin only)"""
        try:
            if not ObjectId.is_valid(ad_id):
                return {"success": False, "error": "Invalid advertisement ID"}
            
            if not admin_notes:
                return {"success": False, "error": "Rejection reason is required"}
            
            advertisement_model = Advertisement()
            ad = advertisement_model.get_advertisement_by_id(ad_id)
            
            if not ad:
                return {"success": False, "error": "Advertisement not found"}
            
            # Allow rejection of any advertisement regardless of status
            success = advertisement_model.reject_advertisement(ad_id, admin_notes)
            
            if success:
                # Send rejection notification email
                try:
                    from utils.email_service import EmailService
                    user_email = ad.get('user_email')
                    ad_title = ad.get('title', 'Your advertisement')
                    
                    if user_email:
                        EmailService.send_advertisement_rejection_email(
                            user_email, 
                            ad_title, 
                            admin_notes
                        )
                except Exception as email_error:
                    print(f"Failed to send rejection email: {str(email_error)}")
                    # Don't fail the rejection if email fails
                
                return {"success": True, "message": "Advertisement rejected and notification sent"}
            return {"success": False, "error": "Failed to reject advertisement"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_active_advertisements():
        """Get active advertisements for public display"""
        try:
            advertisement_model = Advertisement()
            ads = advertisement_model.get_active_advertisements()
            return {"success": True, "data": ads}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def increment_impressions(ad_id):
        """Track impression of advertisement"""
        try:
            advertisement_model = Advertisement()
            advertisement_model.increment_impressions(ad_id)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def check_expired_advertisements():
        """Mark expired advertisements (cron job)"""
        try:
            advertisement_model = Advertisement()
            count = advertisement_model.check_expired_advertisements()
            return {"success": True, "expired_count": count}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def update_advertisement(ad_id, update_data):
        """Update advertisement details (admin only - cannot update payment_status)"""
        try:
            if not ObjectId.is_valid(ad_id):
                return {"success": False, "error": "Invalid advertisement ID"}
            
            advertisement_model = Advertisement()
            ad = advertisement_model.get_advertisement_by_id(ad_id)
            
            if not ad:
                return {"success": False, "error": "Advertisement not found"}
            
            # Don't allow updating payment_status (handled by Stripe)
            if 'payment_status' in update_data:
                return {"success": False, "error": "Payment status cannot be updated directly"}
            
            # Convert ObjectIds if needed
            if 'plan_id' in update_data and isinstance(update_data['plan_id'], str):
                update_data['plan_id'] = ObjectId(update_data['plan_id'])
            if 'society_id' in update_data and isinstance(update_data['society_id'], str):
                update_data['society_id'] = ObjectId(update_data['society_id'])
            
            success = advertisement_model.update_advertisement(ad_id, update_data)
            
            if success:
                return {"success": True, "message": "Advertisement updated successfully"}
            return {"success": False, "error": "Failed to update advertisement"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def delete_advertisement(ad_id):
        """Delete advertisement (admin only)"""
        try:
            if not ObjectId.is_valid(ad_id):
                return {"success": False, "error": "Invalid advertisement ID"}
            
            advertisement_model = Advertisement()
            ad = advertisement_model.get_advertisement_by_id(ad_id)
            
            if not ad:
                return {"success": False, "error": "Advertisement not found"}
            
            success = advertisement_model.delete_advertisement(ad_id)
            
            if success:
                return {"success": True, "message": "Advertisement deleted successfully"}
            return {"success": False, "error": "Failed to delete advertisement"}
        except Exception as e:
            return {"success": False, "error": str(e)}


