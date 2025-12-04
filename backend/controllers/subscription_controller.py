# backend/controllers/subscription_controller.py
from models.subscription_plan import SubscriptionPlan
from bson import ObjectId
from datetime import datetime, timedelta

class SubscriptionController:
    
    @staticmethod
    def create_plan(plan_data, admin_email):
        """Create a new subscription plan (admin only)"""
        try:
            # Validate required fields
            required_fields = ['name', 'description', 'price', 'duration_days', 'ad_limit']
            for field in required_fields:
                if field not in plan_data or plan_data[field] is None:
                    return {
                        "success": False,
                        "error": f"{field.replace('_', ' ').title()} is required"
                    }
            
            # Validate plan type
            valid_types = ['basic', 'premium', 'enterprise']
            if 'plan_type' in plan_data and plan_data['plan_type'] not in valid_types:
                return {
                    "success": False,
                    "error": f"Invalid plan type. Must be one of: {', '.join(valid_types)}"
                }
            
            # Validate price
            if not isinstance(plan_data['price'], (int, float)) or plan_data['price'] < 0:
                return {
                    "success": False,
                    "error": "Price must be a non-negative number"
                }
            
            # Validate duration
            if not isinstance(plan_data['duration_days'], int) or plan_data['duration_days'] <= 0:
                return {
                    "success": False,
                    "error": "Duration must be a positive number of days"
                }
            
            # Validate ad limit
            if not isinstance(plan_data['ad_limit'], int) or plan_data['ad_limit'] <= 0:
                return {
                    "success": False,
                    "error": "Ad limit must be a positive number"
                }
            
            # Add creator information
            plan_data['created_by'] = admin_email
            
            # Create plan
            subscription_model = SubscriptionPlan()
            plan_id = subscription_model.create_plan(plan_data)
            
            # Get the created plan
            new_plan = subscription_model.get_plan_by_id(plan_id)
            
            return {
                "success": True,
                "data": new_plan,
                "message": "Subscription plan created successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to create subscription plan: {str(e)}"
            }

    @staticmethod
    def get_all_plans(status=None):
        """Get all subscription plans"""
        try:
            subscription_model = SubscriptionPlan()
            plans = subscription_model.get_all_plans(status=status)
            
            return {
                "success": True,
                "data": plans
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to fetch subscription plans: {str(e)}"
            }

    @staticmethod
    def get_plan_by_id(plan_id):
        """Get subscription plan by ID"""
        try:
            subscription_model = SubscriptionPlan()
            plan = subscription_model.get_plan_by_id(plan_id)
            
            if not plan:
                return {
                    "success": False,
                    "error": "Subscription plan not found"
                }
            
            return {
                "success": True,
                "data": plan
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to fetch subscription plan: {str(e)}"
            }

    @staticmethod
    def update_plan(plan_id, update_data, admin_email):
        """Update subscription plan (admin only)"""
        try:
            # Validate price if provided
            if 'price' in update_data:
                if not isinstance(update_data['price'], (int, float)) or update_data['price'] < 0:
                    return {
                        "success": False,
                        "error": "Price must be a non-negative number"
                    }
            
            # Validate duration if provided
            if 'duration_days' in update_data:
                if not isinstance(update_data['duration_days'], int) or update_data['duration_days'] <= 0:
                    return {
                        "success": False,
                        "error": "Duration must be a positive number of days"
                    }
            
            # Validate ad limit if provided
            if 'ad_limit' in update_data:
                if not isinstance(update_data['ad_limit'], int) or update_data['ad_limit'] <= 0:
                    return {
                        "success": False,
                        "error": "Ad limit must be a positive number"
                    }
            
            # Add updater information
            update_data['updated_by'] = admin_email
            
            subscription_model = SubscriptionPlan()
            updated_plan = subscription_model.update_plan(plan_id, update_data)
            
            if not updated_plan:
                return {
                    "success": False,
                    "error": "Subscription plan not found"
                }
            
            return {
                "success": True,
                "data": updated_plan,
                "message": "Subscription plan updated successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to update subscription plan: {str(e)}"
            }

    @staticmethod
    def delete_plan(plan_id):
        """Delete subscription plan (admin only)"""
        try:
            subscription_model = SubscriptionPlan()
            success = subscription_model.delete_plan(plan_id)
            
            if not success:
                return {
                    "success": False,
                    "error": "Subscription plan not found"
                }
            
            return {
                "success": True,
                "message": "Subscription plan deleted successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to delete subscription plan: {str(e)}"
            }

    @staticmethod
    def subscribe_to_plan(plan_id, user_email):
        """Subscribe user to a plan"""
        try:
            subscription_model = SubscriptionPlan()
            
            # Check if plan exists
            plan = subscription_model.get_plan_by_id(plan_id)
            if not plan:
                return {
                    "success": False,
                    "error": "Subscription plan not found"
                }
            
            # Check if plan is active
            if plan.get('status') != 'active':
                return {
                    "success": False,
                    "error": "This subscription plan is not currently available"
                }
            
            # Calculate expiry date
            expiry_date = datetime.utcnow() + timedelta(days=plan['duration_days'])
            
            # Create subscription data
            subscription_data = {
                'user_email': user_email,
                'plan_id': ObjectId(plan_id),
                'plan_name': plan['name'],
                'price': plan['price'],
                'duration_days': plan['duration_days'],
                'ad_limit': plan['ad_limit'],
                'ads_used': 0,
                'expiry_date': expiry_date,
                'status': 'active'
            }
            
            # Create subscription
            subscription_id = subscription_model.subscribe(subscription_data)
            
            # Get the created subscription
            new_subscription = subscription_model.get_subscription_by_id(subscription_id)
            
            return {
                "success": True,
                "data": new_subscription,
                "message": "Successfully subscribed to plan"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to subscribe to plan: {str(e)}"
            }

    @staticmethod
    def get_user_subscription(user_email):
        """Get user's active subscription"""
        try:
            subscription_model = SubscriptionPlan()
            subscription = subscription_model.get_user_subscription(user_email)
            
            if not subscription:
                return {
                    "success": True,
                    "data": None,
                    "message": "No active subscription found"
                }
            
            return {
                "success": True,
                "data": subscription
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to fetch subscription: {str(e)}"
            }

    @staticmethod
    def get_all_subscriptions(filters=None):
        """Get all subscriptions with optional filtering (admin only)"""
        try:
            subscription_model = SubscriptionPlan()
            subscriptions = subscription_model.get_all_subscriptions(filters=filters)
            
            return {
                "success": True,
                "data": subscriptions
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to fetch subscriptions: {str(e)}"
            }

    @staticmethod
    def cancel_subscription(subscription_id, user_email):
        """Cancel subscription"""
        try:
            subscription_model = SubscriptionPlan()
            
            # Get subscription to verify ownership
            subscription = subscription_model.get_subscription_by_id(subscription_id)
            if not subscription:
                return {
                    "success": False,
                    "error": "Subscription not found"
                }
            
            # Verify user owns this subscription
            if subscription['user_email'] != user_email:
                return {
                    "success": False,
                    "error": "You are not authorized to cancel this subscription"
                }
            
            # Cancel subscription
            success = subscription_model.cancel_subscription(subscription_id)
            
            if not success:
                return {
                    "success": False,
                    "error": "Failed to cancel subscription"
                }
            
            return {
                "success": True,
                "message": "Subscription cancelled successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to cancel subscription: {str(e)}"
            }

    @staticmethod
    def get_subscription_stats():
        """Get subscription statistics (admin only)"""
        try:
            subscription_model = SubscriptionPlan()
            stats = subscription_model.get_subscription_stats()
            
            return {
                "success": True,
                "data": stats
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to fetch subscription stats: {str(e)}"
            }
