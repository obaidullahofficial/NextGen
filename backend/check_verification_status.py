"""
Check email verification status for a user
"""
import sys
sys.path.insert(0, 'd:/fyp2/NextGenArchitect/backend')

from utils.db import get_db
from models.user import user_collection
from models.email_verification import email_verification_collection

def check_user_status(email):
    """Check if user exists and their verification status"""
    try:
        db = get_db()
        
        # Check user
        users = user_collection(db)
        user = users.find_one({'email': email})
        
        if not user:
            print(f"❌ User not found: {email}")
            return
        
        print(f"\n{'='*60}")
        print(f"USER STATUS for: {email}")
        print(f"{'='*60}")
        print(f"Username: {user.get('username')}")
        print(f"Email: {user.get('email')}")
        print(f"Is Verified: {user.get('is_verified', False)}")
        print(f"Created At: {user.get('created_at')}")
        print(f"Role: {user.get('role')}")
        
        # Check verification tokens
        verifications = email_verification_collection(db)
        tokens = list(verifications.find({'email': email}))
        
        print(f"\n{'='*60}")
        print(f"VERIFICATION TOKENS ({len(tokens)} found)")
        print(f"{'='*60}")
        
        if tokens:
            for idx, token_doc in enumerate(tokens, 1):
                print(f"\nToken #{idx}:")
                print(f"  Token: {token_doc.get('token')}")
                print(f"  Created: {token_doc.get('created_at')}")
                print(f"  Expires: {token_doc.get('expires_at')}")
                print(f"  Is Used: {token_doc.get('is_used', False)}")
                
                from datetime import datetime
                if datetime.utcnow() > token_doc.get('expires_at'):
                    print(f"  Status: ⏰ EXPIRED")
                elif token_doc.get('is_used'):
                    print(f"  Status: ✅ USED")
                else:
                    print(f"  Status: 🟢 VALID - Use this token!")
                    print(f"\n  Verification URL:")
                    print(f"  http://localhost:5173/verify-email?token={token_doc.get('token')}")
        else:
            print("❌ No verification tokens found!")
            print("\nPossible reasons:")
            print("1. Email was not sent successfully")
            print("2. Tokens expired and were deleted")
            print("3. User signed up without email verification")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    email = "aliyasaqib20@gmail.com"
    check_user_status(email)
