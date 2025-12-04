# Quick Start Guide - Advertisement & Subscription System

## 🚀 Quick Setup

### 1. Start the Backend

```bash
cd backend
python app.py
```

The subscription routes are now automatically registered at `/api`.

---

## 📋 Quick Test Commands

### Step 1: Create Subscription Plans (Admin)

```bash
# Basic Plan
curl -X POST http://localhost:5000/api/plans \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Basic Plan",
    "description": "Perfect for small businesses",
    "plan_type": "basic",
    "price": 999,
    "duration_days": 30,
    "ad_limit": 3,
    "features": ["3 ads per month", "Email support"]
  }'

# Premium Plan
curl -X POST http://localhost:5000/api/plans \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Plan",
    "description": "Most popular choice",
    "plan_type": "premium",
    "price": 2999,
    "duration_days": 30,
    "ad_limit": 10,
    "features": ["10 ads per month", "Priority support", "Analytics"]
  }'

# Enterprise Plan
curl -X POST http://localhost:5000/api/plans \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Enterprise Plan",
    "description": "For large organizations",
    "plan_type": "enterprise",
    "price": 9999,
    "duration_days": 30,
    "ad_limit": 50,
    "features": ["50 ads per month", "Dedicated support", "Advanced analytics", "Custom placement"]
  }'
```

### Step 2: View Available Plans (Public)

```bash
curl http://localhost:5000/api/plans
```

### Step 3: Subscribe to a Plan (Subadmin)

```bash
curl -X POST http://localhost:5000/api/subscribe/<PLAN_ID> \
  -H "Authorization: Bearer <SUBADMIN_TOKEN>"
```

### Step 4: Check My Subscription (Subadmin)

```bash
curl http://localhost:5000/api/my-subscription \
  -H "Authorization: Bearer <SUBADMIN_TOKEN>"
```

### Step 5: Create Advertisement (Subadmin)

```bash
curl -X POST http://localhost:5000/api/advertisements \
  -H "Authorization: Bearer <SUBADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Grand Opening Sale!",
    "description": "50% off on all plots",
    "ad_picture": "/uploads/ads/grand_opening.jpg"
  }'
```

### Step 6: View Pending Ads (Admin)

```bash
curl http://localhost:5000/api/advertisements/pending \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Step 7: Approve Advertisement (Admin)

```bash
curl -X POST http://localhost:5000/api/advertisements/<AD_ID>/approve \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "is_displayed": true
  }'
```

### Step 8: View Displayed Ads (Public)

```bash
curl http://localhost:5000/api/advertisements/displayed
```

---

## 🔑 Key Points to Remember

### Advertisement Creation:

- ✅ **Required**: `ad_picture` (the main content)
- ✅ **Required**: `title`
- ⚠️ **Must have**: Active subscription
- ⚠️ **Check**: Ad limit not reached

### Approval Flow:

1. Subadmin creates ad → Status: `pending`
2. Admin reviews → Approves or Rejects
3. If approved → Can be displayed
4. Admin controls visibility with `is_displayed` flag

### Subscription Management:

- One active subscription per user
- Tracks `ads_used` vs `ad_limit`
- Automatically checks limits on ad creation
- Can be cancelled by user

---

## 📊 Database Collections

### subscription_plans

```javascript
{
  name,
    description,
    plan_type,
    price,
    duration_days,
    ad_limit,
    features,
    status;
}
```

### subscriptions

```javascript
{
  user_email,
    plan_id,
    plan_name,
    price,
    duration_days,
    ad_limit,
    ads_used,
    status,
    subscribed_at,
    expiry_date;
}
```

### advertisements (Updated)

```javascript
{
  subscription_id,
    plan_name,
    title,
    description,
    ad_picture, // MAIN FIELD - the ad image
    created_by,
    approval_status,
    approved_by,
    is_displayed,
    status;
}
```

---

## 🎯 Common Operations

### For Subadmins:

```javascript
// 1. Get my subscription
GET /api/my-subscription

// 2. Create ad (with picture)
POST /api/advertisements
Body: { title, ad_picture, description }

// 3. View my ads
GET /api/users/<my_email>/advertisements
```

### For Admins:

```javascript
// 1. Create plans
POST /api/plans

// 2. View pending ads
GET /api/advertisements/pending

// 3. Approve ad
POST /api/advertisements/:id/approve
Body: { is_displayed: true }

// 4. Reject ad
POST /api/advertisements/:id/reject
Body: { rejection_reason: "..." }

// 5. Toggle display
POST /api/advertisements/:id/toggle-display
Body: { is_displayed: false }

// 6. View stats
GET /api/subscriptions/stats
```

---

## ⚠️ Error Messages

| Error                                     | Meaning                | Solution                                |
| ----------------------------------------- | ---------------------- | --------------------------------------- |
| "You need an active subscription"         | No subscription        | Subscribe to a plan first               |
| "You have reached your ad limit"          | Limit reached          | Upgrade plan or wait for renewal        |
| "User already has an active subscription" | Duplicate subscription | Cancel current before subscribing again |
| "Only admins can..."                      | Permission denied      | Need admin role                         |

---

## 🔧 Troubleshooting

### Can't create ad?

1. Check if subscribed: `GET /api/my-subscription`
2. Check ads used vs limit in response
3. Verify `ad_picture` field is present

### Ad not showing?

1. Check `approval_status` - must be "approved"
2. Check `is_displayed` - must be `true`
3. Check `status` - must be "active"

### Subscription issues?

1. Check expiry_date - may have expired
2. Check status - must be "active"
3. One subscription per user - cancel old first

---

## 📁 File Structure

```
backend/
├── models/
│   ├── subscription_plan.py     ← NEW
│   └── advertisement.py          ← UPDATED
├── controllers/
│   ├── subscription_controller.py  ← NEW
│   └── advertisement_controller.py ← UPDATED
└── routes/
    ├── subscription_routes.py    ← NEW
    └── advertisement_routes.py   ← UPDATED

Documentation/
├── ADVERTISEMENT_SUBSCRIPTION_API.md  ← Full API docs
└── ADVERTISEMENT_UPDATE_SUMMARY.md    ← Change summary
```

---

## 🎨 Frontend Integration Tips

### Display Subscription Plans:

```javascript
// Fetch plans
const plans = await fetch("/api/plans?status=active");
// Show pricing cards with features
```

### Subscribe Button:

```javascript
// On click
await fetch(`/api/subscribe/${planId}`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
});
```

### Create Ad Form:

```javascript
// Form with image upload
<input type="file" accept="image/*" />
<input type="text" name="title" required />
<textarea name="description" />

// On submit
const formData = new FormData()
formData.append('ad_picture', file)
formData.append('title', title)
```

### Admin Dashboard:

```javascript
// Fetch pending ads
const pending = await fetch("/api/advertisements/pending");

// Approve button
await fetch(`/api/advertisements/${adId}/approve`, {
  method: "POST",
  body: JSON.stringify({ is_displayed: true }),
});
```

---

## ✅ Testing Checklist

- [ ] Create 3 subscription plans
- [ ] Subscribe as subadmin
- [ ] Create 1 advertisement
- [ ] View pending ads as admin
- [ ] Approve the ad
- [ ] See it in displayed ads
- [ ] Create ads until limit reached
- [ ] Verify error when limit hit
- [ ] Toggle display off
- [ ] Verify ad not shown
- [ ] Reject an ad
- [ ] Cancel subscription

---

## 🚀 Ready to Use!

All routes are registered and ready. The system is fully functional with:

- ✅ Subscription management
- ✅ Ad creation with limits
- ✅ Admin approval workflow
- ✅ Display control
- ✅ Usage tracking

**Next**: Integrate with your frontend!
