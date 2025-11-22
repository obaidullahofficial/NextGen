# backend/models/review.py
from datetime import datetime
from bson import ObjectId

class Review:
    def __init__(self, plot_id, user_email, rating, comment, created_at=None, updated_at=None):
        self.plot_id = plot_id
        self.user_email = user_email  # Changed from user_id to user_email for consistency
        self.rating = rating
        self.comment = comment
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at

    def to_dict(self):
        review_dict = {
            "plot_id": self.plot_id,
            "user_email": self.user_email,
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at
        }
        
        # Only include updated_at if it exists
        if self.updated_at:
            review_dict["updated_at"] = self.updated_at
            
        return review_dict

    @classmethod
    def from_dict(cls, data):
        """Create a Review instance from a dictionary"""
        return cls(
            plot_id=data.get('plot_id'),
            user_email=data.get('user_email'),
            rating=data.get('rating'),
            comment=data.get('comment'),
            created_at=data.get('created_at'),
            updated_at=data.get('updated_at')
        )

def review_collection(db):
    """Get the reviews collection from database"""
    return db['reviews']