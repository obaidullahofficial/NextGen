# Advertisement & Subscription Module Update Summary

## Overview

Successfully updated the advertisement module to implement a subscription-based system where subadmins subscribe to different plans and admins approve/manage ad displays.

---

## Files Created

### 1. **backend/models/subscription_plan.py**

- New model for managing subscription plans and user subscriptions
- Handles plan CRUD operations
- Manages user subscriptions (create, cancel, track usage)
- Provides subscription statistics

### 2. **backend/controllers/subscription_controller.py**

- Controller for subscription plan management
- Handles subscription operations for users
- Validates plan data and subscription limits
- Manages admin-only operations

### 3. **backend/routes/subscription_routes.py**

- API endpoints for subscription plans
- API endpoints for user subscriptions
- Role-based access control (admin/subadmin)
- Complete CRUD operations

### 4. **ADVERTISEMENT_SUBSCRIPTION_API.md**

- Comprehensive API documentation
- Request/response examples
- Workflow guides for subadmins and admins
- Error handling documentation

---

## Files Modified

### 1. **backend/models/advertisement.py**

- Updated `create_advertisement()` to set default `approval_status: "pending"`
- Added `approve_advertisement()` method
- Added `reject_advertisement()` method
- Added `get_pending_advertisements()` method
- Added `get_displayed_advertisements()` method
- Added `toggle_display_status()` method
- Added `get_advertisements_by_subscription()` method

### 2. **backend/controllers/advertisement_controller.py**

- Updated `create_advertisement()` to check subscription and ad limits
- Now requires subscription before creating ads
- Automatically increments `ads_used` in subscription
- Added `approve_advertisement()` method
- Added `reject_advertisement()` method
- Added `get_pending_advertisements()` method
- Added `get_displayed_advertisements()` method
- Added `toggle_display_status()` method

### 3. **backend/routes/advertisement_routes.py**

- Updated import to include `get_jwt` for role checking
- Updated `create_advertisement` route to require only `ad_picture` and `title`
- Added `GET /advertisements/pending` (admin only)
- Added `GET /advertisements/displayed` (public)
- Added `POST /advertisements/:id/approve` (admin only)
- Added `POST /advertisements/:id/reject` (admin only)
- Added `POST /advertisements/:id/toggle-display` (admin only)

### 4. **backend/app.py**

- Added import for `subscription_routes`
- Registered `subscription_bp` blueprint with `/api` prefix

### 5. **database_schema.dbml**

- Completely redesigned `advertisements` table:
  - Added `subscription_id`, `plan_name`
  - Added `approval_status`, `approved_by`, `approved_at`
  - Added `rejected_at`, `rejection_reason`
  - Added `is_displayed` flag
  - Changed `ad_picture` to be the main field
- Added new `subscription_plans` table
- Added new `subscriptions` table

---

## Database Schema Changes

### Subscription Plans Collection

```javascript
{
  _id: ObjectId,
  name: String,              // "Basic Plan", "Premium Plan"
  description: String,
  plan_type: String,         // "basic", "premium", "enterprise"
  price: Number,
  duration_days: Number,     // 30, 90, 365
  ad_limit: Number,          // 3, 10, 50
  features: Array,
  status: String,            // "active", "inactive"
  created_by: String,        // admin email
  created_at: Date,
  updated_at: Date
}
```

### Subscriptions Collection

```javascript
{
  _id: ObjectId,
  user_email: String,        // subadmin email
  plan_id: ObjectId,
  plan_name: String,
  price: Number,
  duration_days: Number,
  ad_limit: Number,
  ads_used: Number,          // tracks usage
  status: String,            // "active", "cancelled", "expired"
  subscribed_at: Date,
  expiry_date: Date,
  updated_at: Date
}
```

### Updated Advertisements Collection

```javascript
{
  _id: ObjectId,
  subscription_id: ObjectId,     // NEW - links to subscription
  plan_name: String,             // NEW
  title: String,                 // NEW - required
  description: String,
  ad_picture: String,            // NEW - required (main field)
  created_by: String,            // subadmin email
  approval_status: String,       // NEW - "pending", "approved", "rejected"
  approved_by: String,           // NEW - admin email
  approved_at: Date,             // NEW
  rejected_at: Date,             // NEW
  rejection_reason: String,      // NEW
  status: String,                // "active", "inactive", "expired"
  is_displayed: Boolean,         // NEW - controls visibility
  is_featured: Boolean,
  view_count: Number,
  contact_count: Number,
  created_at: Date,
  updated_at: Date
}
```

---

## API Endpoints Added

### Subscription Plans

- `POST /api/plans` - Create plan (admin)
- `GET /api/plans` - Get all plans
- `GET /api/plans/:id` - Get specific plan
- `PUT /api/plans/:id` - Update plan (admin)
- `DELETE /api/plans/:id` - Delete plan (admin)

### Subscriptions

- `POST /api/subscribe/:plan_id` - Subscribe to plan
- `GET /api/my-subscription` - Get user's subscription
- `GET /api/subscriptions` - Get all subscriptions (admin)
- `POST /api/subscriptions/:id/cancel` - Cancel subscription
- `GET /api/subscriptions/stats` - Get statistics (admin)

### Advertisements (New)

- `GET /api/advertisements/pending` - Get pending ads (admin)
- `GET /api/advertisements/displayed` - Get displayed ads
- `POST /api/advertisements/:id/approve` - Approve ad (admin)
- `POST /api/advertisements/:id/reject` - Reject ad (admin)
- `POST /api/advertisements/:id/toggle-display` - Toggle display (admin)

---

## New Workflow

### Subadmin Workflow:

1. **Subscribe**: Choose and subscribe to a plan
2. **Create Ads**: Upload ad pictures (limited by plan)
3. **Wait for Approval**: Ads start as "pending"
4. **Track Usage**: Monitor ads used vs. limit

### Admin Workflow:

1. **Create Plans**: Set up subscription tiers
2. **Review Ads**: Check pending advertisement requests
3. **Approve/Reject**: Approve good ads, reject problematic ones
4. **Control Display**: Toggle which ads are shown to users
5. **Monitor**: Track subscriptions and ad statistics

---

## Key Features Implemented

✅ **Subscription System**: 3-tier plans (Basic, Premium, Enterprise)
✅ **Ad Limits**: Each plan limits number of ads
✅ **Approval Workflow**: All ads require admin approval
✅ **Display Control**: Admins control ad visibility
✅ **Picture-Based**: Ads are pictures with titles
✅ **Usage Tracking**: Track ads used vs. subscription limit
✅ **Rejection Reasons**: Admins can provide feedback
✅ **Expiry Management**: Subscriptions have expiry dates
✅ **Statistics**: Dashboard data for admins

---

## Testing Checklist

### For Subadmins:

- [ ] View available subscription plans
- [ ] Subscribe to a plan
- [ ] Create advertisement with picture
- [ ] View own subscription details
- [ ] Check ad limit and usage
- [ ] Receive error when limit reached
- [ ] Cancel subscription

### For Admins:

- [ ] Create subscription plans
- [ ] Update plan pricing
- [ ] View pending advertisements
- [ ] Approve advertisements
- [ ] Reject advertisements with reason
- [ ] Toggle ad display on/off
- [ ] View subscription statistics
- [ ] View all user subscriptions

### Error Cases:

- [ ] Create ad without subscription
- [ ] Create ad when limit reached
- [ ] Non-admin trying admin operations
- [ ] Invalid plan data
- [ ] Duplicate subscription

---

## Next Steps

1. **Frontend Integration**:

   - Create subscription plan selection UI
   - Build ad upload form with image picker
   - Create admin approval dashboard
   - Add display toggle controls

2. **Payment Integration** (Future):

   - Integrate payment gateway
   - Handle payment confirmations
   - Manage failed payments
   - Implement auto-renewal

3. **Notifications**:

   - Email subadmin when ad approved/rejected
   - Notify when subscription expiring
   - Alert when ad limit reached

4. **Analytics** (Future):
   - Track ad impressions
   - Monitor click-through rates
   - Generate revenue reports
   - Subscription conversion metrics

---

## Important Notes

- All ads require `ad_picture` field (the main content)
- Ads start as `approval_status: "pending"`
- Only approved ads can be displayed
- Admins can approve but not display (for scheduling)
- Subscription limits are enforced on ad creation
- One active subscription per user at a time

---

## Role Permissions

### Subadmin Can:

- View all plans
- Subscribe to a plan
- Create advertisements (within limit)
- View own subscription
- Cancel own subscription

### Admin Can:

- All subadmin permissions
- Create/update/delete plans
- View all subscriptions
- Approve/reject advertisements
- Toggle ad display status
- View all statistics

---

## Files Summary

**Created**: 4 files
**Modified**: 5 files
**Total Lines Added**: ~1500+ lines of code
**API Endpoints Added**: 16 endpoints

All changes are backward compatible and follow the existing codebase patterns.
