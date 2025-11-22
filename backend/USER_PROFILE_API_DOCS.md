# User Profile API Documentation

This document describes the API endpoints for the user profile functionality in NextGenArchitect.

## Base URL
All endpoints are prefixed with: `http://localhost:5000/api`

## Authentication
All endpoints require JWT authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. User Profile Management

#### GET /profile
Get current user's profile information.

**Response:**
```json
{
    "success": true,
    "data": {
        "user_id": "user_id_string",
        "cnic": "1234567890123",
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+92 300 1234567",
        "email": "john@example.com",
        "profile_image_url": "/uploads/user_profiles/profile.jpg",
        "cnic_front_url": "/uploads/user_profiles/cnic_front.jpg",
        "cnic_back_url": "/uploads/user_profiles/cnic_back.jpg",
        "address": {},
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00",
        "is_verified": false
    },
    "message": "Profile retrieved successfully"
}
```

#### POST/PUT /profile
Create or update user profile. Supports multipart/form-data for file uploads.

**Form Data:**
- `cnic`: CNIC number (13 digits)
- `firstName`: First name
- `lastName`: Last name
- `phone`: Phone number
- `email`: Email address
- `profileImage`: Profile image file (optional)
- `cnicFront`: CNIC front image (optional)
- `cnicBack`: CNIC back image (optional)

**Response:**
```json
{
    "success": true,
    "data": { /* updated profile data */ },
    "message": "Profile updated successfully"
}
```

#### DELETE /profile
Delete current user's profile.

**Response:**
```json
{
    "success": true,
    "message": "Profile deleted successfully"
}
```

### 2. Approval Requests Management

#### GET /approval-requests
Get all approval requests for the current user.

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "_id": "request_id",
            "user_id": "user_id",
            "plot_id": "PL-1001",
            "plot_details": "Commercial Plot A, 10 Marla",
            "area": "10 Marla",
            "design_type": "3-Bedroom Modern",
            "floor_plan_file_url": "/uploads/floor_plans/plan.pdf",
            "notes": "Request notes",
            "status": "Pending",
            "request_date": "2024-01-01T00:00:00",
            "admin_comments": "",
            "reviewed_by": null,
            "reviewed_at": null,
            "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-01T00:00:00"
        }
    ],
    "total": 1,
    "message": "Approval requests retrieved successfully"
}
```

#### POST /approval-requests
Create a new approval request. Supports multipart/form-data for file uploads.

**Form Data:**
- `plotId`: Plot ID
- `plotDetails`: Plot details
- `area`: Plot area
- `designType`: Design type
- `notes`: Additional notes (optional)
- `floorPlanFile`: Floor plan file

**Response:**
```json
{
    "success": true,
    "data": { /* created request data */ },
    "message": "Approval request submitted successfully"
}
```

#### GET /approval-requests/{request_id}
Get a specific approval request.

**Response:**
```json
{
    "success": true,
    "data": { /* approval request data */ },
    "message": "Approval request retrieved successfully"
}
```

#### PUT /approval-requests/{request_id}
Update an approval request (only if status is Pending).

**JSON Body:**
```json
{
    "plot_id": "PL-1002",
    "plot_details": "Updated plot details",
    "area": "8 Marla",
    "design_type": "Updated design type",
    "notes": "Updated notes"
}
```

**Response:**
```json
{
    "success": true,
    "data": { /* updated request data */ },
    "message": "Approval request updated successfully"
}
```

#### DELETE /approval-requests/{request_id}
Delete an approval request.

**Response:**
```json
{
    "success": true,
    "message": "Approval request deleted successfully"
}
```

### 3. User Activities & Progress

#### GET /activities
Get user activities with pagination.

**Query Parameters:**
- `limit`: Number of activities to retrieve (default: 50)
- `offset`: Number of activities to skip (default: 0)

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "_id": "activity_id",
            "user_id": "user_id",
            "activity_type": "profile_update",
            "description": "User profile information updated",
            "metadata": {
                "fields_updated": ["first_name", "last_name"]
            },
            "timestamp": "2024-01-01T00:00:00"
        }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0,
    "message": "Activities retrieved successfully"
}
```

#### GET /progress
Get user progress summary.

**Response:**
```json
{
    "success": true,
    "data": {
        "profile_completed": true,
        "total_requests": 5,
        "approved_requests": 2,
        "pending_requests": 2,
        "recent_activities": 10,
        "profile_verification_status": false
    },
    "message": "Progress summary retrieved successfully"
}
```

### 4. Admin Endpoints

#### GET /admin/approval-requests
Get all approval requests (admin only).

**Response:**
```json
{
    "success": true,
    "data": [ /* array of all approval requests */ ],
    "total": 10,
    "message": "All approval requests retrieved successfully"
}
```

#### PUT /admin/approval-requests/{request_id}/status
Update approval request status (admin only).

**JSON Body:**
```json
{
    "status": "Approved",
    "admin_comments": "Design meets all requirements"
}
```

**Response:**
```json
{
    "success": true,
    "data": { /* updated request data */ },
    "message": "Approval request updated successfully"
}
```

## Status Codes

- `200 OK`: Success
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## File Upload Notes

1. **Supported file types:**
   - Images: PNG, JPG, JPEG
   - Documents: PDF

2. **File size limit:** 16MB per file

3. **Upload locations:**
   - Profile images: `/uploads/user_profiles/user_{user_id}/profile/`
   - CNIC documents: `/uploads/user_profiles/user_{user_id}/documents/`
   - Floor plans: `/uploads/user_profiles/user_{user_id}/floor_plans/`

## Error Handling

All endpoints return standardized error responses:

```json
{
    "success": false,
    "error": "Error message here"
}
```

## Usage Examples

### Frontend Integration for Personal Info Form

```javascript
// Update profile with form data
const formData = new FormData();
formData.append('firstName', 'John');
formData.append('lastName', 'Doe');
formData.append('cnic', '1234567890123');
formData.append('phone', '+92 300 1234567');
formData.append('email', 'john@example.com');

if (profileImageFile) {
    formData.append('profileImage', profileImageFile);
}

const response = await fetch('/api/profile', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: formData
});

const result = await response.json();
```

### Frontend Integration for Approval Request Form

```javascript
// Submit approval request
const formData = new FormData();
formData.append('plotId', 'PL-1001');
formData.append('plotDetails', 'Commercial Plot A, 10 Marla');
formData.append('area', '10 Marla');
formData.append('designType', '3-Bedroom Modern');
formData.append('notes', 'Additional requirements');

if (floorPlanFile) {
    formData.append('floorPlanFile', floorPlanFile);
}

const response = await fetch('/api/approval-requests', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: formData
});

const result = await response.json();
```