"""
Email Verification Model
Stores verification tokens with automatic expiration using MongoDB TTL indexes
"""
from datetime import datetime, timedelta

class EmailVerification:
    """
    Email verification token model
    
    Fields:
        email: User's email address
        token: Unique verification token
        created_at: Token creation timestamp
        expires_at: Token expiration timestamp (24 hours default)
        is_used: Whether the token has been used
    """
    def __init__(self, email, token, expires_at=None, is_used=False):
        self.email = email
        self.token = token
        self.created_at = datetime.utcnow()
        self.expires_at = expires_at or (self.created_at + timedelta(hours=24))
        self.is_used = is_used

def email_verification_collection(db):
    """Get the email_verifications collection"""
    return db['email_verifications']

def create_verification_index(db):
    """
    Create indexes for email verification collection (with duplicate check)
    - TTL index on expires_at for automatic token cleanup
    - Unique index on token for fast lookups
    - Index on email for querying user's verification tokens
    """
    try:
        collection = email_verification_collection(db)
        
        # Get existing indexes to avoid recreation errors
        existing_indexes = collection.index_information()
        
        # TTL index - automatically delete expired tokens
        if 'expires_at_1' not in existing_indexes:
            collection.create_index("expires_at", expireAfterSeconds=0)
            print("[EMAIL VERIFICATION] Created TTL index on expires_at")
        
        # Unique index on token for fast, unique lookups
        if 'token_1' not in existing_indexes:
            collection.create_index("token", unique=True)
            print("[EMAIL VERIFICATION] Created unique index on token")
        
        # Index on email for querying user's verification tokens
        if 'email_1' not in existing_indexes:
            collection.create_index("email")
            print("[EMAIL VERIFICATION] Created index on email")
        
    except Exception as e:
        # Silently handle index creation errors (they're not critical)
        print(f"[EMAIL VERIFICATION] Index setup note: {str(e)}")
