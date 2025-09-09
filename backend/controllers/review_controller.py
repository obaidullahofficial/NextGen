# backend/controllers/review_controller.py
from utils.db import get_db
from models.review import Review, review_collection
from bson import ObjectId
from datetime import datetime
import math

class ReviewController:
    @staticmethod
    def create_review(plot_id, user_email, rating, comment):
        """Create a new review for a plot"""
        try:
            db = get_db()
            reviews = review_collection(db)
            
            # Check if user has already reviewed this plot
            existing_review = reviews.find_one({
                'plot_id': plot_id,
                'user_email': user_email
            })
            
            if existing_review:
                return {
                    "success": False,
                    "error": "You have already reviewed this plot. Use PUT to update your review."
                }
            
            # Create a new review object
            new_review = Review(
                plot_id=plot_id,
                user_email=user_email,
                rating=rating,
                comment=comment
            )
            
            # Insert the review into the database
            result = reviews.insert_one(new_review.to_dict())
            
            # Get the created review
            created_review = reviews.find_one({'_id': result.inserted_id})
            created_review['_id'] = str(created_review['_id'])
            
            return {
                "success": True,
                "message": "Review created successfully",
                "data": created_review
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Error creating review: {str(e)}"
            }
    
    @staticmethod
    def get_all_reviews(page=1, per_page=10, plot_id=None, user_email=None, min_rating=None, max_rating=None):
        """Get all reviews with optional filtering and pagination"""
        try:
            db = get_db()
            reviews = review_collection(db)
            
            # Build filter query
            filter_query = {}
            if plot_id:
                filter_query['plot_id'] = plot_id
            if user_email:
                filter_query['user_email'] = user_email
            if min_rating is not None or max_rating is not None:
                rating_filter = {}
                if min_rating is not None:
                    rating_filter['$gte'] = min_rating
                if max_rating is not None:
                    rating_filter['$lte'] = max_rating
                filter_query['rating'] = rating_filter
            
            # Calculate pagination
            skip = (page - 1) * per_page
            
            # Get total count
            total_count = reviews.count_documents(filter_query)
            total_pages = math.ceil(total_count / per_page)
            
            # Get paginated results
            found_reviews = list(reviews.find(filter_query)
                                .sort('created_at', -1)
                                .skip(skip)
                                .limit(per_page))
            
            # Convert ObjectId to string for JSON serialization
            for review in found_reviews:
                review['_id'] = str(review['_id'])
                
            return {
                "success": True,
                "data": found_reviews,
                "pagination": {
                    "current_page": page,
                    "per_page": per_page,
                    "total_pages": total_pages,
                    "total_items": total_count,
                    "has_next": page < total_pages,
                    "has_prev": page > 1
                },
                "message": f"Retrieved {len(found_reviews)} reviews"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Error retrieving reviews: {str(e)}"
            }
    
    @staticmethod
    def get_review_by_id(review_id):
        """Get a specific review by its ID"""
        try:
            db = get_db()
            reviews = review_collection(db)
            
            # Validate ObjectId
            if not ObjectId.is_valid(review_id):
                return {
                    "success": False,
                    "error": "Invalid review ID format"
                }
            
            # Find the review
            review = reviews.find_one({'_id': ObjectId(review_id)})
            
            if not review:
                return {
                    "success": False,
                    "error": "Review not found"
                }
            
            # Convert ObjectId to string
            review['_id'] = str(review['_id'])
            
            return {
                "success": True,
                "data": review,
                "message": "Review retrieved successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Error retrieving review: {str(e)}"
            }
    
    @staticmethod
    def get_reviews_by_plot(plot_id, page=1, per_page=10):
        """Get all reviews for a specific plot with pagination"""
        try:
            db = get_db()
            reviews = review_collection(db)
            
            # Calculate pagination
            skip = (page - 1) * per_page
            
            # Get total count for this plot
            total_count = reviews.count_documents({'plot_id': plot_id})
            total_pages = math.ceil(total_count / per_page)
            
            # Find all reviews for the given plot_id
            found_reviews = list(reviews.find({'plot_id': plot_id})
                               .sort('created_at', -1)
                               .skip(skip)
                               .limit(per_page))
            
            # Convert ObjectId to string for JSON serialization
            for review in found_reviews:
                review['_id'] = str(review['_id'])
                
            return {
                "success": True,
                "data": found_reviews,
                "pagination": {
                    "current_page": page,
                    "per_page": per_page,
                    "total_pages": total_pages,
                    "total_items": total_count,
                    "has_next": page < total_pages,
                    "has_prev": page > 1
                },
                "message": f"Retrieved {len(found_reviews)} reviews for plot {plot_id}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Error retrieving reviews: {str(e)}"
            }
    
    @staticmethod
    def get_reviews_by_user(user_email, page=1, per_page=10):
        """Get all reviews by a specific user with pagination"""
        try:
            db = get_db()
            reviews = review_collection(db)
            
            # Calculate pagination
            skip = (page - 1) * per_page
            
            # Get total count for this user
            total_count = reviews.count_documents({'user_email': user_email})
            total_pages = math.ceil(total_count / per_page)
            
            # Find all reviews by the user
            found_reviews = list(reviews.find({'user_email': user_email})
                               .sort('created_at', -1)
                               .skip(skip)
                               .limit(per_page))
            
            # Convert ObjectId to string for JSON serialization
            for review in found_reviews:
                review['_id'] = str(review['_id'])
                
            return {
                "success": True,
                "data": found_reviews,
                "pagination": {
                    "current_page": page,
                    "per_page": per_page,
                    "total_pages": total_pages,
                    "total_items": total_count,
                    "has_next": page < total_pages,
                    "has_prev": page > 1
                },
                "message": f"Retrieved {len(found_reviews)} reviews by user {user_email}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Error retrieving user reviews: {str(e)}"
            }
    
    @staticmethod
    def update_review(review_id, user_email, rating=None, comment=None):
        """Update a review (only by the author or admin)"""
        try:
            db = get_db()
            reviews = review_collection(db)
            users = db['users']  # Assuming users collection exists
            
            # Validate ObjectId
            if not ObjectId.is_valid(review_id):
                return {
                    "success": False,
                    "error": "Invalid review ID format"
                }
            
            # Find the review
            review = reviews.find_one({'_id': ObjectId(review_id)})
            
            if not review:
                return {
                    "success": False,
                    "error": "Review not found"
                }
            
            # Check if user is the author or admin
            user = users.find_one({'email': user_email})
            is_admin = user and user.get('role') == 'admin'
            is_author = review.get('user_email') == user_email
            
            if not (is_author or is_admin):
                return {
                    "success": False,
                    "error": "Permission denied. You can only update your own reviews."
                }
            
            # Build update query
            update_data = {
                'updated_at': datetime.utcnow()
            }
            
            if rating is not None:
                update_data['rating'] = rating
            if comment is not None:
                update_data['comment'] = comment
            
            if len(update_data) == 1:  # Only updated_at
                return {
                    "success": False,
                    "error": "No fields to update"
                }
            
            # Update the review
            result = reviews.update_one(
                {'_id': ObjectId(review_id)},
                {'$set': update_data}
            )
            
            if result.modified_count == 0:
                return {
                    "success": False,
                    "error": "No changes made to the review"
                }
            
            # Get the updated review
            updated_review = reviews.find_one({'_id': ObjectId(review_id)})
            updated_review['_id'] = str(updated_review['_id'])
            
            return {
                "success": True,
                "data": updated_review,
                "message": "Review updated successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Error updating review: {str(e)}"
            }
    
    @staticmethod
    def delete_review(review_id, user_email):
        """Delete a review (only by the author or admin)"""
        try:
            db = get_db()
            reviews = review_collection(db)
            users = db['users']  # Assuming users collection exists
            
            # Validate ObjectId
            if not ObjectId.is_valid(review_id):
                return {
                    "success": False,
                    "error": "Invalid review ID format"
                }
            
            # Find the review
            review = reviews.find_one({'_id': ObjectId(review_id)})
            
            if not review:
                return {
                    "success": False,
                    "error": "Review not found"
                }
            
            # Check if user is the author or admin
            user = users.find_one({'email': user_email})
            is_admin = user and user.get('role') == 'admin'
            is_author = review.get('user_email') == user_email
            
            if not (is_author or is_admin):
                return {
                    "success": False,
                    "error": "Permission denied. You can only delete your own reviews."
                }
            
            # Delete the review
            result = reviews.delete_one({'_id': ObjectId(review_id)})
            
            if result.deleted_count == 0:
                return {
                    "success": False,
                    "error": "Failed to delete review"
                }
            
            return {
                "success": True,
                "message": "Review deleted successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Error deleting review: {str(e)}"
            }
    
    @staticmethod
    def get_plot_review_stats(plot_id):
        """Get review statistics for a specific plot"""
        try:
            db = get_db()
            reviews = review_collection(db)
            
            # Aggregation pipeline to calculate statistics
            pipeline = [
                {'$match': {'plot_id': plot_id}},
                {'$group': {
                    '_id': None,
                    'total_reviews': {'$sum': 1},
                    'average_rating': {'$avg': '$rating'},
                    'rating_distribution': {
                        '$push': '$rating'
                    }
                }}
            ]
            
            result = list(reviews.aggregate(pipeline))
            
            if not result:
                return {
                    "success": True,
                    "data": {
                        "plot_id": plot_id,
                        "total_reviews": 0,
                        "average_rating": 0,
                        "rating_distribution": {
                            "1": 0, "2": 0, "3": 0, "4": 0, "5": 0
                        }
                    },
                    "message": "No reviews found for this plot"
                }
            
            stats = result[0]
            
            # Calculate rating distribution
            rating_dist = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
            for rating in stats['rating_distribution']:
                rating_dist[str(int(rating))] += 1
            
            return {
                "success": True,
                "data": {
                    "plot_id": plot_id,
                    "total_reviews": stats['total_reviews'],
                    "average_rating": round(stats['average_rating'], 2) if stats['average_rating'] else 0,
                    "rating_distribution": rating_dist
                },
                "message": "Review statistics retrieved successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Error retrieving review statistics: {str(e)}"
            }