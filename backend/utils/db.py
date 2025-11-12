from pymongo import MongoClient

# MongoDB Atlas connection string
MONGO_URI = "mongodb+srv://AashfaNoor:NextGenIT22-A@cluster0.otiywgx.mongodb.net/?retryWrites=true&w=majority"

# Local MongoDB fallback
LOCAL_MONGO_URI = "mongodb://localhost:27017/"

def get_db():
    """
    Get database connection with automatic fallback to local MongoDB
    """
    # Try MongoDB Atlas first
    try:
        print("[DB] Attempting to connect to MongoDB Atlas...")
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)  # 5 second timeout
        # Test the connection
        client.admin.command('ping')
        print("[DB] ✅ Connected to MongoDB Atlas")
        return client['NextGenArchitect']
    except Exception as atlas_error:
        print(f"[DB] ❌ Atlas connection failed: {atlas_error}")
        
        # Fallback to local MongoDB
        try:
            print("[DB] Attempting to connect to local MongoDB...")
            client = MongoClient(LOCAL_MONGO_URI, serverSelectionTimeoutMS=3000)  # 3 second timeout
            # Test the connection
            client.admin.command('ping')
            print("[DB] ✅ Connected to local MongoDB")
            return client['NextGenArchitect']
        except Exception as local_error:
            print(f"[DB] ❌ Local MongoDB connection failed: {local_error}")
            print("[DB] Both Atlas and local connections failed!")
            raise Exception("Database connection failed. Please ensure MongoDB is running locally or Atlas is accessible.")

def test_connection():
    """
    Test database connection and return status
    """
    try:
        # Try Atlas first
        print("Testing MongoDB Atlas connection...")
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        result = client.admin.command('ping')
        print("✅ MongoDB Atlas connection successful")
        return {"status": "Atlas", "result": result}
    except Exception as atlas_error:
        print(f"❌ Atlas failed: {atlas_error}")
        
        # Try local MongoDB
        try:
            print("Testing local MongoDB connection...")
            client = MongoClient(LOCAL_MONGO_URI, serverSelectionTimeoutMS=3000)
            result = client.admin.command('ping')
            print("✅ Local MongoDB connection successful")
            return {"status": "Local", "result": result}
        except Exception as local_error:
            print(f"❌ Local MongoDB failed: {local_error}")
            return {"status": "Failed", "atlas_error": str(atlas_error), "local_error": str(local_error)}
    

