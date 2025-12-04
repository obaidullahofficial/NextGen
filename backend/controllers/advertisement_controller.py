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
            # Validate required fields
            if 'title' not in ad_data or not ad_data['title']:
                return {"success": False, "error": "Title is required"}
            if 'featured_image' not in ad_data or not ad_data['featured_image']:
                return {"success": False, "error": "Featured image is required"}
            if 'plan_id' not in ad_data or not ad_data['plan_id']:
                return {"success": False, "error": "Plan selection is required"}
            
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
    def approve_advertisement(ad_id, admin_notes=None):
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
            
            # Approve with dates from the ad itself
            success = advertisement_model.approve_advertisement(
                ad_id,
                ad['start_date'],
                ad['end_date'],
                admin_notes
            )
            
            if success:
                return {"success": True, "message": "Advertisement approved successfully"}
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
            
            if ad['status'] != 'pending':
                return {"success": False, "error": "Only pending advertisements can be rejected"}
            
            success = advertisement_model.reject_advertisement(ad_id, admin_notes)
            
            if success:
                return {"success": True, "message": "Advertisement rejected"}
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
    def increment_clicks(ad_id):
        """Track click on advertisement"""
        try:
            advertisement_model = Advertisement()
            advertisement_model.increment_clicks(ad_id)
            return {"success": True}
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

