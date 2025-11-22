from utils.db import get_db
from models.user_profile import approval_request_collection
import os

db = get_db()
collection = approval_request_collection(db)

# Get all approval requests with floor plan files
requests = collection.find({'floor_plan_file_url': {'$exists': True, '$ne': None}})

print("=" * 80)
print("CHECKING FLOOR PLAN FILE PATHS IN DATABASE")
print("=" * 80)

count = 0
for req in requests:
    count += 1
    file_url = req.get('floor_plan_file_url', '')
    plot_number = req.get('plot_number', 'N/A')
    status = req.get('status', 'N/A')
    
    print(f"\n{count}. Plot: {plot_number} | Status: {status}")
    print(f"   DB Path: {file_url}")
    print(f"   Has backslashes: {chr(92) in file_url}")
    print(f"   Has forward slashes: {'/' in file_url}")
    
    # Check if file exists
    full_path = os.path.normpath(os.path.join(os.getcwd(), file_url))
    exists = os.path.exists(full_path)
    print(f"   File exists: {exists}")
    if exists:
        print(f"   Full path: {full_path}")
    else:
        print(f"   Expected at: {full_path}")

if count == 0:
    print("No approval requests with floor plan files found!")

print("\n" + "=" * 80)
