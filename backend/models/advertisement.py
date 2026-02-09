# backend/models/advertisement.py
from datetime import datetime, timedelta
from bson import ObjectId
from utils.db import get_db

class Advertisement:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.advertisements
        self.society_profiles = self.db.society_profiles
    
    def _get_society_name(self, society_id):
        """Helper method to fetch society name by society_id"""
        try:
            if society_id:
                profile = self.society_profiles.find_one({"_id": ObjectId(society_id)}, {"name": 1})
                if profile:
                    return profile.get('name')
        except:
            pass
        return None

    def create_advertisement(self, ad_data):
        """Create a new advertisement request"""
        try:
            now = datetime.utcnow()
            ad_data['created_at'] = now
            ad_data['updated_at'] = now
            ad_data['status'] = 'pending'
            ad_data['impressions'] = 0
            ad_data['payment_status'] = 'pending'
            ad_data['payment_id'] = None
            ad_data['paid_at'] = None
            
            result = self.collection.insert_one(ad_data)
            return str(result.inserted_id)
        except Exception as e:
            raise Exception(f"Error creating advertisement: {str(e)}")

    def get_advertisement_by_id(self, ad_id):
        """Get advertisement by ID"""
        try:
            ad = self.collection.find_one({"_id": ObjectId(ad_id)})
            if ad:
                ad['_id'] = str(ad['_id'])
                if 'plan_id' in ad and isinstance(ad['plan_id'], ObjectId):
                    ad['plan_id'] = str(ad['plan_id'])
                if 'society_id' in ad and isinstance(ad['society_id'], ObjectId):
                    society_id = ad['society_id']
                    ad['society_id'] = str(society_id)
                    # Fetch and add society name
                    ad['society_name'] = self._get_society_name(society_id)
            return ad
        except Exception as e:
            raise Exception(f"Error fetching advertisement: {str(e)}")

    def get_all_advertisements(self, filters=None, page=1, per_page=10):
        """Get all advertisements with pagination"""
        try:
            query = {}
            if filters:
                if filters.get('status'):
                    query['status'] = filters['status']
                if filters.get('user_email'):
                    query['user_email'] = filters['user_email']

            skip = (page - 1) * per_page
            total_count = self.collection.count_documents(query)
            
            ads = []
            for ad in self.collection.find(query).sort("created_at", -1).skip(skip).limit(per_page):
                ad['_id'] = str(ad['_id'])
                if 'plan_id' in ad and isinstance(ad['plan_id'], ObjectId):
                    ad['plan_id'] = str(ad['plan_id'])
                if 'society_id' in ad and isinstance(ad['society_id'], ObjectId):
                    society_id = ad['society_id']
                    ad['society_id'] = str(society_id)
                    # Fetch and add society name
                    ad['society_name'] = self._get_society_name(society_id)
                ads.append(ad)
            
            return {
                'advertisements': ads,
                'total_count': total_count,
                'page': page,
                'per_page': per_page,
                'total_pages': (total_count + per_page - 1) // per_page
            }
        except Exception as e:
            raise Exception(f"Error fetching advertisements: {str(e)}")

    def update_advertisement(self, ad_id, update_data):
        """Update advertisement"""
        try:
            update_data['updated_at'] = datetime.utcnow()
            result = self.collection.update_one(
                {"_id": ObjectId(ad_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Error updating advertisement: {str(e)}")

    def delete_advertisement(self, ad_id):
        """Delete advertisement"""
        try:
            result = self.collection.delete_one({"_id": ObjectId(ad_id)})
            return result.deleted_count > 0
        except Exception as e:
            raise Exception(f"Error deleting advertisement: {str(e)}")

    def approve_advertisement(self, ad_id, start_date, end_date):
        """Approve advertisement and set active dates"""
        try:
            update_data = {
                'status': 'active',
                'start_date': start_date,
                'end_date': end_date,
                'updated_at': datetime.utcnow()
            }
            
            result = self.collection.update_one(
                {"_id": ObjectId(ad_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Error approving advertisement: {str(e)}")

    def reject_advertisement(self, ad_id, admin_notes):
        """Reject advertisement with reason"""
        try:
            update_data = {
                'status': 'rejected',
                'admin_notes': admin_notes,
                'updated_at': datetime.utcnow()
            }
            result = self.collection.update_one(
                {"_id": ObjectId(ad_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Error rejecting advertisement: {str(e)}")

    def increment_impressions(self, ad_id):
        """Increment impression count"""
        try:
            result = self.collection.update_one(
                {"_id": ObjectId(ad_id)},
                {"$inc": {"impressions": 1}}
            )
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Error incrementing impressions: {str(e)}")

    def get_pending_advertisements(self, page=1, per_page=10):
        """Get pending advertisements for admin review"""
        try:
            query = {"status": "pending"}
            skip = (page - 1) * per_page
            total_count = self.collection.count_documents(query)
            
            ads = []
            for ad in self.collection.find(query).sort("created_at", -1).skip(skip).limit(per_page):
                ad['_id'] = str(ad['_id'])
                if 'plan_id' in ad and isinstance(ad['plan_id'], ObjectId):
                    ad['plan_id'] = str(ad['plan_id'])
                if 'society_id' in ad and isinstance(ad['society_id'], ObjectId):
                    society_id = ad['society_id']
                    ad['society_id'] = str(society_id)
                    # Fetch and add society name
                    ad['society_name'] = self._get_society_name(society_id)
                ads.append(ad)
            
            return {
                'advertisements': ads,
                'total_count': total_count,
                'page': page,
                'per_page': per_page,
                'total_pages': (total_count + per_page - 1) // per_page
            }
        except Exception as e:
            raise Exception(f"Error fetching pending advertisements: {str(e)}")

    def get_active_advertisements(self):
        """Get active advertisements for display"""
        try:
            now = datetime.utcnow()
            query = {
                "status": "active",
                "start_date": {"$lte": now},
                "end_date": {"$gte": now}
            }
            
            ads = []
            for ad in self.collection.find(query).sort("created_at", -1):
                ad['_id'] = str(ad['_id'])
                if 'plan_id' in ad and isinstance(ad['plan_id'], ObjectId):
                    ad['plan_id'] = str(ad['plan_id'])
                if 'society_id' in ad and isinstance(ad['society_id'], ObjectId):
                    society_id = ad['society_id']
                    ad['society_id'] = str(society_id)
                    # Fetch and add society name
                    ad['society_name'] = self._get_society_name(society_id)
                ads.append(ad)
            return ads
        except Exception as e:
            raise Exception(f"Error fetching active advertisements: {str(e)}")

    def check_expired_advertisements(self):
        """Mark advertisements as expired if end_date passed"""
        try:
            now = datetime.utcnow()
            result = self.collection.update_many(
                {
                    "status": "active",
                    "end_date": {"$lt": now}
                },
                {"$set": {"status": "expired"}}
            )
            return result.modified_count
        except Exception as e:
            raise Exception(f"Error checking expired advertisements: {str(e)}")

    def update_payment_status(self, ad_id, payment_status, payment_id=None):
        """Update payment status for advertisement"""
        try:
            update_data = {
                'payment_status': payment_status,
                'updated_at': datetime.utcnow()
            }
            if payment_id:
                update_data['payment_id'] = payment_id
            if payment_status == 'paid':
                update_data['paid_at'] = datetime.utcnow()
            
            result = self.collection.update_one(
                {"_id": ObjectId(ad_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Error updating payment status: {str(e)}")


