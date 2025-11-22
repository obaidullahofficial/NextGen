from bson import ObjectId

class User:
    def __init__(self, username, email, password_hash, role='user', society_id=None):
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.role = role
        self.society_id = society_id

def user_collection(db):
    return db['users']