# backend/controllers/advertisement_plan_controller.py
from models.advertisement_plan import AdvertisementPlan
from bson import ObjectId

class AdvertisementPlanController:
    
    @staticmethod
    def create_plan(plan_data):
        """Create advertisement plan (admin only)"""
        try:
            # Validate required fields
            if 'name' not in plan_data or not plan_data['name']:
                return {"success": False, "error": "Plan name is required"}
            if 'duration_days' not in plan_data or not plan_data['duration_days']:
                return {"success": False, "error": "Duration is required"}
            if 'price' not in plan_data or plan_data['price'] is None:
                return {"success": False, "error": "Price is required"}
            
            # Validate data types
            try:
                plan_data['duration_days'] = int(plan_data['duration_days'])
                plan_data['price'] = float(plan_data['price'])
            except ValueError:
                return {"success": False, "error": "Invalid duration or price format"}
            
            plan_model = AdvertisementPlan()
            plan_id = plan_model.create_plan(plan_data)
            
            return {
                "success": True,
                "message": "Plan created successfully",
                "plan_id": plan_id
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_all_plans(active_only=False):
        """Get all advertisement plans"""
        try:
            plan_model = AdvertisementPlan()
            plans = plan_model.get_all_plans(active_only)
            return {"success": True, "data": plans}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_plan_by_id(plan_id):
        """Get plan by ID"""
        try:
            if not ObjectId.is_valid(plan_id):
                return {"success": False, "error": "Invalid plan ID"}
            
            plan_model = AdvertisementPlan()
            plan = plan_model.get_plan_by_id(plan_id)
            
            if not plan:
                return {"success": False, "error": "Plan not found"}
            
            return {"success": True, "data": plan}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def update_plan(plan_id, update_data):
        """Update advertisement plan (admin only)"""
        try:
            if not ObjectId.is_valid(plan_id):
                return {"success": False, "error": "Invalid plan ID"}
            
            # Validate data types if provided
            if 'duration_days' in update_data:
                try:
                    update_data['duration_days'] = int(update_data['duration_days'])
                except ValueError:
                    return {"success": False, "error": "Invalid duration format"}
            
            if 'price' in update_data:
                try:
                    update_data['price'] = float(update_data['price'])
                except ValueError:
                    return {"success": False, "error": "Invalid price format"}
            
            plan_model = AdvertisementPlan()
            success = plan_model.update_plan(plan_id, update_data)
            
            if success:
                return {"success": True, "message": "Plan updated successfully"}
            return {"success": False, "error": "Failed to update plan"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def delete_plan(plan_id):
        """Delete advertisement plan (admin only)"""
        try:
            if not ObjectId.is_valid(plan_id):
                return {"success": False, "error": "Invalid plan ID"}
            
            plan_model = AdvertisementPlan()
            success = plan_model.delete_plan(plan_id)
            
            if success:
                return {"success": True, "message": "Plan deleted successfully"}
            return {"success": False, "error": "Failed to delete plan"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def toggle_active_status(plan_id):
        """Toggle plan active status (admin only)"""
        try:
            if not ObjectId.is_valid(plan_id):
                return {"success": False, "error": "Invalid plan ID"}
            
            plan_model = AdvertisementPlan()
            success = plan_model.toggle_active_status(plan_id)
            
            if success:
                return {"success": True, "message": "Plan status updated"}
            return {"success": False, "error": "Failed to update plan status"}
        except Exception as e:
            return {"success": False, "error": str(e)}
