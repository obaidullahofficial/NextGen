# Advertisement & Subscription System API Documentation

## Overview

The updated advertisement system now includes a subscription-based model where:

1. **Subadmins** subscribe to different plans (Basic, Premium, Enterprise)
2. **Subadmins** create advertisement requests (with ad pictures)
3. **Admins** review and approve/reject advertisement requests
4. **Admins** control which ads are displayed to users

---

## Subscription Plans

### Data Structure

```javascript
{
  "_id": "ObjectId",
  "name": "Premium Plan",
  "description": "Premium subscription with 10 ads per month",
  "plan_type": "premium", // basic, premium, enterprise
  "price": 2999.99,
  "duration_days": 30,
  "ad_limit": 10,
  "features": ["Priority placement", "Analytics dashboard"],
  "status": "active",
  "created_by": "admin@example.com",
  "created_at": "2025-12-03T...",
  "updated_at": "2025-12-03T..."
}
```

### API Endpoints

#### 1. Create Subscription Plan (Admin Only)

```
POST /api/plans
Authorization: Bearer <admin_token>

Body:
{
  "name": "Basic Plan",
  "description": "Starter plan for small businesses",
  "plan_type": "basic",
  "price": 999.99,
  "duration_days": 30,
  "ad_limit": 3,
  "features": ["Basic placement", "Email support"]
}

Response: 201 Created
{
  "success": true,
  "data": { ... plan object ... },
  "message": "Subscription plan created successfully"
}
```

#### 2. Get All Subscription Plans (Public)

```
GET /api/plans?status=active

Response: 200 OK
{
  "success": true,
  "data": [ ... array of plans ... ]
}
```

#### 3. Get Specific Plan

```
GET /api/plans/:plan_id

Response: 200 OK
{
  "success": true,
  "data": { ... plan object ... }
}
```

#### 4. Update Plan (Admin Only)

```
PUT /api/plans/:plan_id
Authorization: Bearer <admin_token>

Body:
{
  "price": 1499.99,
  "ad_limit": 5
}

Response: 200 OK
{
  "success": true,
  "data": { ... updated plan ... },
  "message": "Subscription plan updated successfully"
}
```

#### 5. Delete Plan (Admin Only)

```
DELETE /api/plans/:plan_id
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "success": true,
  "message": "Subscription plan deleted successfully"
}
```

---

## Subscriptions

### Data Structure

```javascript
{
  "_id": "ObjectId",
  "user_email": "subadmin@example.com",
  "plan_id": "ObjectId",
  "plan_name": "Premium Plan",
  "price": 2999.99,
  "duration_days": 30,
  "ad_limit": 10,
  "ads_used": 3,
  "status": "active", // active, cancelled, expired
  "subscribed_at": "2025-12-03T...",
  "expiry_date": "2026-01-03T...",
  "updated_at": "2025-12-03T...",
  "plan_details": { ... full plan object ... }
}
```

### API Endpoints

#### 1. Subscribe to a Plan (Subadmin)

```
POST /api/subscribe/:plan_id
Authorization: Bearer <subadmin_token>

Response: 201 Created
{
  "success": true,
  "data": { ... subscription object ... },
  "message": "Successfully subscribed to plan"
}

Error Response (if already subscribed):
{
  "success": false,
  "error": "User already has an active subscription"
}
```

#### 2. Get My Subscription (Subadmin)

```
GET /api/my-subscription
Authorization: Bearer <subadmin_token>

Response: 200 OK
{
  "success": true,
  "data": {
    "_id": "...",
    "plan_name": "Premium Plan",
    "ad_limit": 10,
    "ads_used": 3,
    "expiry_date": "2026-01-03T...",
    "plan_details": { ... }
  }
}
```

#### 3. Get All Subscriptions (Admin Only)

```
GET /api/subscriptions?status=active&user_email=user@example.com
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "success": true,
  "data": [ ... array of subscriptions ... ]
}
```

#### 4. Cancel Subscription (Subadmin)

```
POST /api/subscriptions/:subscription_id/cancel
Authorization: Bearer <subadmin_token>

Response: 200 OK
{
  "success": true,
  "message": "Subscription cancelled successfully"
}
```

#### 5. Get Subscription Stats (Admin Only)

```
GET /api/subscriptions/stats
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "success": true,
  "data": {
    "total_subscriptions": 50,
    "active_subscriptions": 35,
    "cancelled_subscriptions": 10,
    "expired_subscriptions": 5
  }
}
```

---

## Advertisements

### Data Structure

```javascript
{
  "_id": "ObjectId",
  "subscription_id": "ObjectId",
  "plan_name": "Premium Plan",
  "title": "Grand Sale - 50% Off!",
  "description": "Limited time offer on all plots",
  "ad_picture": "/uploads/ads/ad_123.jpg", // REQUIRED
  "created_by": "subadmin@example.com",
  "approval_status": "pending", // pending, approved, rejected
  "approved_by": "admin@example.com",
  "approved_at": "2025-12-03T...",
  "rejection_reason": "Image quality too low",
  "status": "inactive", // active, inactive, expired
  "is_displayed": false,
  "is_featured": false,
  "view_count": 0,
  "contact_count": 0,
  "created_at": "2025-12-03T...",
  "updated_at": "2025-12-03T..."
}
```

### API Endpoints

#### 1. Create Advertisement Request (Subadmin)

```
POST /api/advertisements
Authorization: Bearer <subadmin_token>

Body:
{
  "title": "Grand Sale - 50% Off!",
  "description": "Limited time offer",
  "ad_picture": "/uploads/ads/ad_123.jpg" // REQUIRED
}

Response: 201 Created
{
  "success": true,
  "data": { ... advertisement object ... },
  "message": "Advertisement request submitted successfully and is pending admin approval"
}

Error Response (no subscription):
{
  "success": false,
  "error": "You need an active subscription to create advertisements"
}

Error Response (limit reached):
{
  "success": false,
  "error": "You have reached your ad limit (10 ads). Please upgrade your subscription."
}
```

#### 2. Get All Advertisements

```
GET /api/advertisements?page=1&per_page=10&status=active

Response: 200 OK
{
  "success": true,
  "data": [ ... array of advertisements ... ],
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total_pages": 5,
    "total_count": 45
  }
}
```

#### 3. Get Pending Advertisements (Admin Only)

```
GET /api/advertisements/pending?page=1&per_page=10
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "success": true,
  "data": [ ... pending advertisements ... ],
  "pagination": { ... }
}
```

#### 4. Get Displayed Advertisements (Public)

```
GET /api/advertisements/displayed?page=1&per_page=10

Response: 200 OK
{
  "success": true,
  "data": [ ... currently displayed ads ... ],
  "pagination": { ... }
}
```

#### 5. Approve Advertisement (Admin Only)

```
POST /api/advertisements/:ad_id/approve
Authorization: Bearer <admin_token>

Body:
{
  "is_displayed": true // Set to false to approve but not display
}

Response: 200 OK
{
  "success": true,
  "message": "Advertisement approved and displayed"
}
```

#### 6. Reject Advertisement (Admin Only)

```
POST /api/advertisements/:ad_id/reject
Authorization: Bearer <admin_token>

Body:
{
  "rejection_reason": "Image quality is too low. Please upload a higher resolution image."
}

Response: 200 OK
{
  "success": true,
  "message": "Advertisement rejected"
}
```

#### 7. Toggle Display Status (Admin Only)

```
POST /api/advertisements/:ad_id/toggle-display
Authorization: Bearer <admin_token>

Body:
{
  "is_displayed": false // Hide the ad
}

Response: 200 OK
{
  "success": true,
  "message": "Advertisement hidden successfully"
}
```

---

## Workflow

### For Subadmins:

1. **Subscribe to a Plan**

   - Choose a plan (Basic, Premium, Enterprise)
   - Call `POST /api/subscribe/:plan_id`
   - Plan determines how many ads they can create

2. **Create Advertisement Requests**

   - Upload an ad picture
   - Call `POST /api/advertisements` with title and ad_picture
   - System checks subscription and ad limit
   - Ad is created with `approval_status: "pending"`

3. **Check My Subscription**
   - Call `GET /api/my-subscription` to see:
     - How many ads used vs. limit
     - Subscription expiry date
     - Plan details

### For Admins:

1. **Manage Subscription Plans**

   - Create plans: `POST /api/plans`
   - Update plans: `PUT /api/plans/:plan_id`
   - View all plans: `GET /api/plans`

2. **Review Advertisement Requests**

   - View pending ads: `GET /api/advertisements/pending`
   - Approve ads: `POST /api/advertisements/:ad_id/approve`
   - Reject ads: `POST /api/advertisements/:ad_id/reject`

3. **Control Ad Display**

   - Toggle display: `POST /api/advertisements/:ad_id/toggle-display`
   - View displayed ads: `GET /api/advertisements/displayed`

4. **Monitor System**
   - View subscription stats: `GET /api/subscriptions/stats`
   - View all subscriptions: `GET /api/subscriptions`
   - View advertisement stats: `GET /api/advertisements/stats`

---

## Key Features

✅ **Subscription-Based**: Subadmins must subscribe to create ads
✅ **Ad Limits**: Each plan has a limit on number of ads
✅ **Admin Approval**: All ads require admin approval before display
✅ **Display Control**: Admins can toggle ad visibility
✅ **Picture-Based**: Ads are primarily pictures uploaded by subadmins
✅ **Tracking**: Track ads used vs. limit, view counts, etc.

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - Successful operation
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

Error response format:

```javascript
{
  "success": false,
  "error": "Error message here"
}
```
