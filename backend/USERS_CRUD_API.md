# Complete CRUD API Documentation for Users
**Base URL:** `http://localhost:5000/api`

## Authentication
All endpoints (except login/signup) require JWT authentication.
Include the token in headers: `Authorization: Bearer <token>`

---

## 🔐 Authentication Endpoints

### 1. Login
```http
POST /api/login
Content-Type: application/json

{
  "email": "admin@nextgen.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "email": "admin@nextgen.com",
    "role": "admin",
    "username": "admin"
  }
}
```

---

## 👥 User CRUD Operations

### 2. Create User (Admin Only)
```http
POST /api/register
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "user_id": "60f7b1234567890abcdef123"
}
```

### 3. Get All Users
```http
GET /api/users
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "_id": "60f7b1234567890abcdef123",
      "username": "admin",
      "email": "admin@nextgen.com",
      "role": "admin"
    },
    {
      "_id": "60f7b1234567890abcdef124",
      "username": "society1",
      "email": "society@example.com",
      "role": "society"
    }
  ],
  "total_count": 2,
  "message": "Retrieved 2 users successfully"
}
```

### 4. Get User by ID (Admin Only)
```http
GET /api/users/{user_id}
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "60f7b1234567890abcdef123",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user"
  },
  "message": "User retrieved successfully"
}
```

### 5. Update User (Admin Only)
```http
PUT /api/users/{user_id}
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "username": "updated_username",
  "email": "updated@example.com",
  "role": "society",
  "password": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "60f7b1234567890abcdef123",
    "username": "updated_username",
    "email": "updated@example.com",
    "role": "society"
  },
  "message": "User updated successfully"
}
```

### 6. Delete User (Admin Only)
```http
DELETE /api/users/{user_id}
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "User 'testuser' deleted successfully"
}
```

---

## 🔍 Search & Analytics

### 7. Search Users (Admin Only)
```http
GET /api/users/search?q=search_term&role=user&page=1&limit=10
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `q`: Search term (searches username and email)
- `role`: Filter by role (admin, society, user)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "_id": "60f7b1234567890abcdef123",
      "username": "searchuser",
      "email": "search@example.com",
      "role": "user"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total_items": 1,
    "total_pages": 1
  },
  "message": "Found 1 users"
}
```

### 8. Get User Statistics (Admin Only)
```http
GET /api/users/stats
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_users": 25,
    "admin_count": 2,
    "society_count": 8,
    "regular_user_count": 15,
    "recent_users_30_days": 5,
    "role_distribution": {
      "admin": 2,
      "society": 8,
      "user": 15
    }
  },
  "message": "User statistics retrieved successfully"
}
```

---

## 🗑️ Bulk Operations

### 9. Bulk Delete Users (Admin Only)
```http
DELETE /api/users/bulk-delete
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "user_ids": [
    "60f7b1234567890abcdef123",
    "60f7b1234567890abcdef124",
    "60f7b1234567890abcdef125"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "deleted_count": 3,
  "message": "Successfully deleted 3 users"
}
```

---

## 📝 Additional Endpoints

### 10. Check Email Availability
```http
POST /api/check-email
Content-Type: application/json

{
  "email": "test@example.com"
}
```

### 11. Public User Signup
```http
POST /api/signup
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "user"
}
```

### 12. Logout
```http
POST /api/logout
Authorization: Bearer <token>
```

---

## 🔒 Error Responses

### Authentication Errors
```json
{
  "success": false,
  "message": "Admin access required"
}
```

### Validation Errors
```json
{
  "success": false,
  "message": "All fields are required"
}
```

### Not Found Errors
```json
{
  "success": false,
  "message": "User not found"
}
```

### Server Errors
```json
{
  "success": false,
  "message": "Failed to retrieve users. Please try again."
}
```

---

## 📋 HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🧪 Testing

Run the complete test suite:
```bash
cd backend
python test_complete_crud.py
```

Or test individual endpoints using curl:

```bash
# Login to get token
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nextgen.com","password":"admin123"}'

# Get all users
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create user
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"username":"testuser","email":"test@example.com","password":"test123","role":"user"}'
```

---

## 🚀 Frontend Integration Example

```javascript
// Login and get token
const login = async () => {
  const response = await fetch('http://localhost:5000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@nextgen.com',
      password: 'admin123'
    })
  });
  const data = await response.json();
  localStorage.setItem('token', data.access_token);
};

// Get all users
const getUsers = async () => {
  const response = await fetch('http://localhost:5000/api/users', {
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
  });
  return await response.json();
};

// Create user
const createUser = async (userData) => {
  const response = await fetch('http://localhost:5000/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    },
    body: JSON.stringify(userData)
  });
  return await response.json();
};
```
