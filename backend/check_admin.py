from utils.db import get_db
from models.user import user_collection
from controllers.user_controller import UserController

def check_and_create_admin():
    print("=== CHECKING DATABASE USERS ===")
    
    db = get_db()
    users = user_collection(db)
    
    # Get all users
    all_users = list(users.find({}, {'username': 1, 'email': 1, 'role': 1}))
    print(f"Total users in database: {len(all_users)}")
    
    for user in all_users:
        print(f"User: {user['username']} | Email: {user['email']} | Role: {user['role']}")
    
    # Check for admin@example.com
    admin_user = users.find_one({'email': 'admin@example.com'})
    
    if admin_user:
        print("✅ admin@example.com EXISTS")
        print(f"Role: {admin_user.get('role')}")
    else:
        print("❌ admin@example.com NOT FOUND")
        print("Creating admin user...")
        
        # Create admin user
        try:
            user_id, message = UserController.create_user(
                username="admin",
                email="admin@example.com", 
                password="admin123",
                role="admin"
            )
            
            if user_id:
                print(f"✅ Admin user created successfully: {user_id}")
            else:
                print(f"❌ Failed to create admin: {message}")
                
        except Exception as e:
            print(f"❌ Error creating admin: {e}")

if __name__ == "__main__":
    check_and_create_admin()
