# backend/models/advertisement.py
from datetime import datetime
from bson import ObjectId
from utils.db import get_db

class Advertisement:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.advertisements

    def create_advertisement(self, advertisement_data):
        """Create a new advertisement"""
        try:
            # Add timestamps
            advertisement_data['created_at'] = datetime.utcnow()
            advertisement_data['updated_at'] = datetime.utcnow()
            
            # Set default status if not provided
            if 'status' not in advertisement_data:
                advertisement_data['status'] = 'active'
            
            # Set default visibility if not provided
            if 'is_featured' not in advertisement_data:
                advertisement_data['is_featured'] = False
                
            # Set default view count
            advertisement_data['view_count'] = 0
            advertisement_data['contact_count'] = 0
            
            result = self.collection.insert_one(advertisement_data)
            return str(result.inserted_id)
        except Exception as e:
            raise Exception(f"Error creating advertisement: {str(e)}")

    def get_advertisement_by_id(self, advertisement_id):
        """Get advertisement by ID"""
        try:
            advertisement = self.collection.find_one({"_id": ObjectId(advertisement_id)})
            if advertisement:
                advertisement['_id'] = str(advertisement['_id'])
            return advertisement
        except Exception as e:
            raise Exception(f"Error fetching advertisement: {str(e)}")

    def get_all_advertisements(self, filters=None, page=1, per_page=10, sort_by="created_at", sort_order=-1):
        """Get all advertisements with pagination and filtering"""
        try:
            # Build filter query
            query = {}
            if filters:
                if filters.get('status'):
                    query['status'] = filters['status']
                if filters.get('society_name'):
                    query['society_name'] = {"$regex": filters['society_name'], "$options": "i"}
                if filters.get('location'):
                    query['location'] = {"$regex": filters['location'], "$options": "i"}
                if filters.get('is_featured') is not None:
                    query['is_featured'] = filters['is_featured']
                if filters.get('min_price'):
                    query['price_start'] = {"$gte": filters['min_price']}
                if filters.get('max_price'):
                    if 'price_start' in query:
                        query['price_start']['$lte'] = filters['max_price']
                    else:
                        query['price_start'] = {"$lte": filters['max_price']}
                if filters.get('plot_sizes'):
                    query['plot_sizes'] = {"$in": filters['plot_sizes']}

            # Calculate pagination
            skip = (page - 1) * per_page
            
            # Get total count
            total_count = self.collection.count_documents(query)
            
            # Get advertisements with pagination and sorting
            cursor = self.collection.find(query).sort(sort_by, sort_order).skip(skip).limit(per_page)
            
            advertisements = []
            for ad in cursor:
                ad['_id'] = str(ad['_id'])
                advertisements.append(ad)
            
            return {
                'advertisements': advertisements,
                'total_count': total_count,
                'page': page,
                'per_page': per_page,
                'total_pages': (total_count + per_page - 1) // per_page
            }
        except Exception as e:
            raise Exception(f"Error fetching advertisements: {str(e)}")

    def update_advertisement(self, advertisement_id, update_data):
        """Update advertisement"""
        try:
            # Add updated timestamp
            update_data['updated_at'] = datetime.utcnow()
            
            result = self.collection.update_one(
                {"_id": ObjectId(advertisement_id)},
                {"$set": update_data}
            )
            
            if result.matched_count == 0:
                return None
            
            return self.get_advertisement_by_id(advertisement_id)
        except Exception as e:
            raise Exception(f"Error updating advertisement: {str(e)}")

    def delete_advertisement(self, advertisement_id):
        """Delete advertisement"""
        try:
            result = self.collection.delete_one({"_id": ObjectId(advertisement_id)})
            return result.deleted_count > 0
        except Exception as e:
            raise Exception(f"Error deleting advertisement: {str(e)}")

    def increment_view_count(self, advertisement_id):
        """Increment view count for advertisement"""
        try:
            result = self.collection.update_one(
                {"_id": ObjectId(advertisement_id)},
                {"$inc": {"view_count": 1}}
            )
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Error incrementing view count: {str(e)}")

    def increment_contact_count(self, advertisement_id):
        """Increment contact count for advertisement"""
        try:
            result = self.collection.update_one(
                {"_id": ObjectId(advertisement_id)},
                {"$inc": {"contact_count": 1}}
            )
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Error incrementing contact count: {str(e)}")

    def get_advertisements_by_user(self, user_email, page=1, per_page=10):
        """Get advertisements created by a specific user"""
        try:
            query = {"created_by": user_email}
            
            skip = (page - 1) * per_page
            total_count = self.collection.count_documents(query)
            
            cursor = self.collection.find(query).sort("created_at", -1).skip(skip).limit(per_page)
            
            advertisements = []
            for ad in cursor:
                ad['_id'] = str(ad['_id'])
                advertisements.append(ad)
            
            return {
                'advertisements': advertisements,
                'total_count': total_count,
                'page': page,
                'per_page': per_page,
                'total_pages': (total_count + per_page - 1) // per_page
            }
        except Exception as e:
            raise Exception(f"Error fetching user advertisements: {str(e)}")

    def search_advertisements(self, search_term, page=1, per_page=10):
        """Search advertisements by text"""
        try:
            query = {
                "$or": [
                    {"society_name": {"$regex": search_term, "$options": "i"}},
                    {"location": {"$regex": search_term, "$options": "i"}},
                    {"description": {"$regex": search_term, "$options": "i"}},
                    {"facilities": {"$regex": search_term, "$options": "i"}}
                ]
            }
            
            skip = (page - 1) * per_page
            total_count = self.collection.count_documents(query)
            
            cursor = self.collection.find(query).sort("created_at", -1).skip(skip).limit(per_page)
            
            advertisements = []
            for ad in cursor:
                ad['_id'] = str(ad['_id'])
                advertisements.append(ad)
            
            return {
                'advertisements': advertisements,
                'total_count': total_count,
                'page': page,
                'per_page': per_page,
                'total_pages': (total_count + per_page - 1) // per_page
            }
        except Exception as e:
            raise Exception(f"Error searching advertisements: {str(e)}")

    def get_featured_advertisements(self, limit=5):
        """Get featured advertisements"""
        try:
            cursor = self.collection.find({"is_featured": True, "status": "active"}).sort("created_at", -1).limit(limit)
            
            advertisements = []
            for ad in cursor:
                ad['_id'] = str(ad['_id'])
                advertisements.append(ad)
            
            return advertisements
        except Exception as e:
            raise Exception(f"Error fetching featured advertisements: {str(e)}")

    def get_advertisement_stats(self):
        """Get advertisement statistics"""
        try:
            pipeline = [
                {
                    "$group": {
                        "_id": None,
                        "total_advertisements": {"$sum": 1},
                        "active_advertisements": {
                            "$sum": {"$cond": [{"$eq": ["$status", "active"]}, 1, 0]}
                        },
                        "featured_advertisements": {
                            "$sum": {"$cond": [{"$eq": ["$is_featured", True]}, 1, 0]}
                        },
                        "total_views": {"$sum": "$view_count"},
                        "total_contacts": {"$sum": "$contact_count"}
                    }
                }
            ]
            
            result = list(self.collection.aggregate(pipeline))
            
            if result:
                stats = result[0]
                del stats['_id']
                return stats
            else:
                return {
                    'total_advertisements': 0,
                    'active_advertisements': 0,
                    'featured_advertisements': 0,
                    'total_views': 0,
                    'total_contacts': 0
                }
        except Exception as e:
            raise Exception(f"Error fetching advertisement stats: {str(e)}")
