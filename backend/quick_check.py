import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from utils.db import get_db
from models.user_profile import approval_request_collection

db = get_db()
collection = approval_request_collection(db)

# Get one approval request with a JSON file
req = collection.find_one({
    'floor_plan_file_url': {'$exists': True, '$ne': None},
    'floor_plan_file_url': {'$regex': r'\.json$'}
})

if req:
    path_in_db = req.get('floor_plan_file_url', '')
    print(f"Path in DB: {path_in_db}")
    print(f"Has backslash: {'\\' in path_in_db}")
    print(f"Has forward slash: {'/' in path_in_db}")
    
    # Check if file exists
    full_path = os.path.join(os.getcwd(), path_in_db.replace('/', os.sep))
    print(f"\nFull path: {full_path}")
    print(f"File exists: {os.path.exists(full_path)}")
    
    if not os.path.exists(full_path):
        # Try alternate path
        alt_path = os.path.join(os.getcwd(), path_in_db.replace('\\', os.sep))
        print(f"\nAlternate path: {alt_path}")
        print(f"Alternate exists: {os.path.exists(alt_path)}")
else:
    print("No JSON approval request found in database")

# List actual files
print("\n--- Actual files in uploads ---")
uploads_dir = os.path.join(os.getcwd(), 'uploads')
if os.path.exists(uploads_dir):
    for root, dirs, files in os.walk(uploads_dir):
        for file in files:
            if file.endswith('.json'):
                full = os.path.join(root, file)
                rel = full.replace(os.getcwd() + os.sep, '')
                print(f"Found: {rel}")
else:
    print("uploads directory does not exist!")
