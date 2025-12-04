# backend/models/advertisement_plan.py
from datetime import datetime
from bson import ObjectId
from utils.db import get_db

class AdvertisementPlan:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.advertisement_plans

    def create_plan(self, plan_data):
        """Create a new advertisement plan (admin only)"""
        try:
            plan_data['created_at'] = datetime.utcnow()
            plan_data['updated_at'] = datetime.utcnow()
            
            if 'is_active' not in plan_data:
                plan_data['is_active'] = True
            
            result = self.collection.insert_one(plan_data)
            return str(result.inserted_id)
        except Exception as e:
            raise Exception(f"Error creating plan: {str(e)}")

    def get_plan_by_id(self, plan_id):
        """Get plan by ID"""
        try:
            plan = self.collection.find_one({"_id": ObjectId(plan_id)})
            if plan:
                plan['_id'] = str(plan['_id'])
            return plan
        except Exception as e:
            raise Exception(f"Error fetching plan: {str(e)}")

    def get_all_plans(self, active_only=False):
        """Get all advertisement plans"""
        try:
            query = {}
            if active_only:
                query['is_active'] = True
            
            plans = []
            for plan in self.collection.find(query).sort("price", 1):
                plan['_id'] = str(plan['_id'])
                plans.append(plan)
            return plans
        except Exception as e:
            raise Exception(f"Error fetching plans: {str(e)}")

    def update_plan(self, plan_id, update_data):
        """Update an advertisement plan"""
        try:
            update_data['updated_at'] = datetime.utcnow()
            result = self.collection.update_one(
                {"_id": ObjectId(plan_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Error updating plan: {str(e)}")

    def delete_plan(self, plan_id):
        """Delete an advertisement plan"""
        try:
            result = self.collection.delete_one({"_id": ObjectId(plan_id)})
            return result.deleted_count > 0
        except Exception as e:
            raise Exception(f"Error deleting plan: {str(e)}")

    def toggle_active_status(self, plan_id):
        """Toggle plan active status"""
        try:
            plan = self.get_plan_by_id(plan_id)
            if not plan:
                return False
            
            new_status = not plan.get('is_active', True)
            return self.update_plan(plan_id, {'is_active': new_status})
        except Exception as e:
            raise Exception(f"Error toggling plan status: {str(e)}")
