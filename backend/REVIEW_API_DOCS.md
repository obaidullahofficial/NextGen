# Review API Documentation

## Overview
Complete CRUD API for managing reviews in the NextGenArchitect platform. Users can create, read, update, and delete reviews for plots.

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. CREATE Review
**POST** `/reviews`

Create a new review for a plot.

**Authentication:** Required

**Request Body:**
```json
{
  "plot_id": "string",
  "rating": 4.5,
  "comment": "Great plot with excellent amenities!"
}
```

**Validation:**
- `plot_id`: Required
- `rating`: Required, must be between 1 and 5
- `comment`: Required
- Users can only have one review per plot

**Response (201):**
```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "plot_id": "plot_123",
    "user_email": "user@example.com",
    "rating": 4.5,
    "comment": "Great plot with excellent amenities!",
    "created_at": "2025-09-09T10:30:00Z"
  }
}
```

### 2. GET All Reviews
**GET** `/reviews`

Retrieve all reviews with pagination and filtering.

**Authentication:** Not required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 10, max: 100)
- `plot_id` (optional): Filter by plot ID
- `user_email` (optional): Filter by user email
- `min_rating` (optional): Minimum rating filter
- `max_rating` (optional): Maximum rating filter

**Example:** `/reviews?page=1&per_page=10&plot_id=plot_123&min_rating=4`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "plot_id": "plot_123",
      "user_email": "user@example.com",
      "rating": 4.5,
      "comment": "Great plot!",
      "created_at": "2025-09-09T10:30:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total_pages": 5,
    "total_items": 45,
    "has_next": true,
    "has_prev": false
  },
  "message": "Retrieved 10 reviews"
}
```

### 3. GET Review by ID
**GET** `/reviews/<review_id>`

Retrieve a specific review by its ID.

**Authentication:** Not required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "plot_id": "plot_123",
    "user_email": "user@example.com",
    "rating": 4.5,
    "comment": "Great plot!",
    "created_at": "2025-09-09T10:30:00Z",
    "updated_at": "2025-09-09T11:00:00Z"
  },
  "message": "Review retrieved successfully"
}
```

### 4. GET Reviews by Plot
**GET** `/plots/<plot_id>/reviews`

Get all reviews for a specific plot with pagination.

**Authentication:** Not required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "plot_id": "plot_123",
      "user_email": "user1@example.com",
      "rating": 4.5,
      "comment": "Great plot!",
      "created_at": "2025-09-09T10:30:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total_pages": 2,
    "total_items": 15,
    "has_next": true,
    "has_prev": false
  },
  "message": "Retrieved 10 reviews for plot plot_123"
}
```

### 5. GET Reviews by User
**GET** `/users/<user_email>/reviews`

Get all reviews by a specific user with pagination.

**Authentication:** Not required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 10)

**Response (200):** Similar to above endpoints

### 6. UPDATE Review
**PUT** `/reviews/<review_id>`

Update an existing review. Only the author or admin can update.

**Authentication:** Required

**Request Body:**
```json
{
  "rating": 5.0,
  "comment": "Updated comment - even better than I thought!"
}
```

**Notes:**
- Both `rating` and `comment` are optional
- At least one field must be provided
- `rating` must be between 1 and 5 if provided

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "plot_id": "plot_123",
    "user_email": "user@example.com",
    "rating": 5.0,
    "comment": "Updated comment - even better than I thought!",
    "created_at": "2025-09-09T10:30:00Z",
    "updated_at": "2025-09-09T12:00:00Z"
  },
  "message": "Review updated successfully"
}
```

### 7. DELETE Review
**DELETE** `/reviews/<review_id>`

Delete a review. Only the author or admin can delete.

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

### 8. GET Plot Review Statistics
**GET** `/plots/<plot_id>/reviews/stats`

Get review statistics for a specific plot.

**Authentication:** Not required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "plot_id": "plot_123",
    "total_reviews": 25,
    "average_rating": 4.2,
    "rating_distribution": {
      "1": 1,
      "2": 2,
      "3": 5,
      "4": 10,
      "5": 7
    }
  },
  "message": "Review statistics retrieved successfully"
}
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "error": "rating must be between 1 and 5"
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "error": "Authorization token is required"
}
```

### Forbidden (403)
```json
{
  "success": false,
  "error": "Permission denied. You can only update your own reviews."
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": "Review not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": "Internal server error: <error_details>"
}
```

## Testing

Use the provided test script to verify all endpoints:

```bash
cd backend
python test_reviews_api.py
```

**Prerequisites for testing:**
1. Flask server running on http://localhost:5000
2. MongoDB connection available
3. Test user account (or modify the test script)

## Database Schema

**Collection:** `reviews`

```json
{
  "_id": "ObjectId",
  "plot_id": "string",
  "user_email": "string",
  "rating": "number (1-5)",
  "comment": "string",
  "created_at": "datetime",
  "updated_at": "datetime (optional)"
}
```

## Features

✅ **Complete CRUD Operations**
✅ **JWT Authentication & Authorization**
✅ **Input Validation**
✅ **Pagination Support**
✅ **Advanced Filtering**
✅ **Review Statistics**
✅ **Duplicate Prevention**
✅ **Permission Control (author/admin only)**
✅ **Error Handling**
✅ **Comprehensive Testing**

## Usage Examples

### Create a Review
```bash
curl -X POST http://localhost:5000/api/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "plot_id": "plot_123",
    "rating": 4.5,
    "comment": "Excellent plot with great amenities!"
  }'
```

### Get Reviews with Filtering
```bash
curl "http://localhost:5000/api/reviews?plot_id=plot_123&min_rating=4&page=1&per_page=5"
```

### Update a Review
```bash
curl -X PUT http://localhost:5000/api/reviews/REVIEW_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "rating": 5.0,
    "comment": "Updated: Absolutely fantastic!"
  }'
```

### Get Plot Statistics
```bash
curl "http://localhost:5000/api/plots/plot_123/reviews/stats"
```
