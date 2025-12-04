# backend/models/subscription_plan.py
from datetime import datetime
from bson import ObjectId
from utils.db import get_db

class SubscriptionPlan:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.subscription_plans
        self.subscriptions_collection = self.db.subscriptions

    def create_plan(self, plan_data):
        """Create a new subscription plan"""
        try:
            # Add timestamps
            plan_data['created_at'] = datetime.utcnow()
            plan_data['updated_at'] = datetime.utcnow()
            
            # Set default status if not provided
            if 'status' not in plan_data:
                plan_data['status'] = 'active'
            
            result = self.collection.insert_one(plan_data)
            return str(result.inserted_id)
        except Exception as e:
            raise Exception(f"Error creating subscription plan: {str(e)}")

    def get_plan_by_id(self, plan_id):
        """Get subscription plan by ID"""
        try:
            plan = self.collection.find_one({"_id": ObjectId(plan_id)})
            if plan:
                plan['_id'] = str(plan['_id'])
            return plan
        except Exception as e:
            raise Exception(f"Error fetching subscription plan: {str(e)}")

    def get_all_plans(self, status=None):
        """Get all subscription plans"""
        try:
            query = {}
            if status:
                query['status'] = status
            
            cursor = self.collection.find(query).sort("price", 1)
            
            plans = []
            for plan in cursor:
                plan['_id'] = str(plan['_id'])
                plans.append(plan)
            
            return plans
        except Exception as e:
            raise Exception(f"Error fetching subscription plans: {str(e)}")

    def update_plan(self, plan_id, update_data):
        """Update subscription plan"""
        try:
            # Add updated timestamp
            update_data['updated_at'] = datetime.utcnow()
            
            result = self.collection.update_one(
                {"_id": ObjectId(plan_id)},
                {"$set": update_data}
            )
            
            if result.matched_count == 0:
                return None
            
            return self.get_plan_by_id(plan_id)
        except Exception as e:
            raise Exception(f"Error updating subscription plan: {str(e)}")

    def delete_plan(self, plan_id):
        """Delete subscription plan"""
        try:
            result = self.collection.delete_one({"_id": ObjectId(plan_id)})
            return result.deleted_count > 0
        except Exception as e:
            raise Exception(f"Error deleting subscription plan: {str(e)}")

    def subscribe(self, subscription_data):
        """Create a new subscription"""
        try:
            # Add timestamps
            subscription_data['subscribed_at'] = datetime.utcnow()
            subscription_data['updated_at'] = datetime.utcnow()
            
            # Set default status if not provided
            if 'status' not in subscription_data:
                subscription_data['status'] = 'active'
            
            # Check if user already has an active subscription
            existing_subscription = self.subscriptions_collection.find_one({
                'user_email': subscription_data['user_email'],
                'status': 'active'
            })
            
            if existing_subscription:
                raise Exception("User already has an active subscription")
            
            result = self.subscriptions_collection.insert_one(subscription_data)
            return str(result.inserted_id)
        except Exception as e:
            raise Exception(f"Error creating subscription: {str(e)}")

    def get_subscription_by_id(self, subscription_id):
        """Get subscription by ID"""
        try:
            subscription = self.subscriptions_collection.find_one({"_id": ObjectId(subscription_id)})
            if subscription:
                subscription['_id'] = str(subscription['_id'])
                if 'plan_id' in subscription and subscription['plan_id']:
                    subscription['plan_id'] = str(subscription['plan_id'])
            return subscription
        except Exception as e:
            raise Exception(f"Error fetching subscription: {str(e)}")

    def get_user_subscription(self, user_email):
        """Get user's active subscription"""
        try:
            subscription = self.subscriptions_collection.find_one({
                'user_email': user_email,
                'status': 'active'
            })
            
            if subscription:
                subscription['_id'] = str(subscription['_id'])
                if 'plan_id' in subscription and subscription['plan_id']:
                    # Get plan details
                    plan = self.get_plan_by_id(str(subscription['plan_id']))
                    subscription['plan_details'] = plan
                    subscription['plan_id'] = str(subscription['plan_id'])
            
            return subscription
        except Exception as e:
            raise Exception(f"Error fetching user subscription: {str(e)}")

    def get_all_subscriptions(self, filters=None):
        """Get all subscriptions with optional filtering"""
        try:
            query = {}
            if filters:
                if filters.get('status'):
                    query['status'] = filters['status']
                if filters.get('user_email'):
                    query['user_email'] = filters['user_email']
                if filters.get('plan_id'):
                    query['plan_id'] = ObjectId(filters['plan_id'])
            
            cursor = self.subscriptions_collection.find(query).sort("subscribed_at", -1)
            
            subscriptions = []
            for subscription in cursor:
                subscription['_id'] = str(subscription['_id'])
                if 'plan_id' in subscription and subscription['plan_id']:
                    # Get plan details
                    plan = self.get_plan_by_id(str(subscription['plan_id']))
                    subscription['plan_details'] = plan
                    subscription['plan_id'] = str(subscription['plan_id'])
                subscriptions.append(subscription)
            
            return subscriptions
        except Exception as e:
            raise Exception(f"Error fetching subscriptions: {str(e)}")

    def update_subscription(self, subscription_id, update_data):
        """Update subscription"""
        try:
            # Add updated timestamp
            update_data['updated_at'] = datetime.utcnow()
            
            result = self.subscriptions_collection.update_one(
                {"_id": ObjectId(subscription_id)},
                {"$set": update_data}
            )
            
            if result.matched_count == 0:
                return None
            
            return self.get_subscription_by_id(subscription_id)
        except Exception as e:
            raise Exception(f"Error updating subscription: {str(e)}")

    def cancel_subscription(self, subscription_id):
        """Cancel subscription"""
        try:
            result = self.subscriptions_collection.update_one(
                {"_id": ObjectId(subscription_id)},
                {"$set": {"status": "cancelled", "updated_at": datetime.utcnow()}}
            )
            
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Error cancelling subscription: {str(e)}")

    def get_subscription_stats(self):
        """Get subscription statistics"""
        try:
            pipeline = [
                {
                    "$group": {
                        "_id": "$status",
                        "count": {"$sum": 1}
                    }
                }
            ]
            
            result = list(self.subscriptions_collection.aggregate(pipeline))
            
            stats = {
                'total_subscriptions': 0,
                'active_subscriptions': 0,
                'cancelled_subscriptions': 0,
                'expired_subscriptions': 0
            }
            
            for item in result:
                status = item['_id']
                count = item['count']
                stats['total_subscriptions'] += count
                
                if status == 'active':
                    stats['active_subscriptions'] = count
                elif status == 'cancelled':
                    stats['cancelled_subscriptions'] = count
                elif status == 'expired':
                    stats['expired_subscriptions'] = count
            
            return stats
        except Exception as e:
            raise Exception(f"Error fetching subscription stats: {str(e)}")
