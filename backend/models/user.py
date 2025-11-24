from bson import ObjectId

class User:
    def __init__(self, username, email, password_hash, role='user'):
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.role = role

def user_collection(db):
    return db['users']