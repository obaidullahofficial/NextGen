# Frontend Implementation Guide - Subscription & Advertisement System

## ✅ Completed Files

### 1. **src/services/subscriptionAPI.js**

- Complete API service for subscription plans and subscriptions
- All CRUD operations for plans (admin)
- Subscribe, cancel, view subscription methods
- Statistics endpoints

### 2. **src/services/advertisementAPI.js** (Updated)

- Added `getPendingAdvertisements()` - Get ads awaiting approval
- Added `getDisplayedAdvertisements()` - Get currently displayed ads
- Added `approveAdvertisement()` - Approve ad with display option
- Added `rejectAdvertisement()` - Reject ad with reason
- Added `toggleDisplayStatus()` - Show/hide approved ads
- Updated `formatAdvertisementForDisplay()` to include new fields

### 3. **src/pages/subadmin/SubscriptionPlans.jsx**

- View all available subscription plans
- Display current subscription with usage stats
- Subscribe to plans
- Cancel subscription
- Responsive card-based design

### 4. **src/pages/subadmin/SubscriptionPlans.css**

- Beautiful gradient designs
- Animated card hovers
- Color-coded plan types
- Mobile responsive

### 5. **src/pages/admin/SubscriptionManagement.jsx**

- Two tabs: Plans & Subscriptions
- Create/Edit/Delete subscription plans
- View all user subscriptions
- Subscription statistics dashboard
- Modal for plan creation/editing

---

## 📋 Remaining Frontend Tasks

### 1. **SubscriptionManagement.css** (Admin)

Create: `src/pages/admin/SubscriptionManagement.css`

**Key Styles Needed:**

```css
- .subscription-management-container
- .tabs (tab navigation)
- .plans-table, .subscriptions-table
- .stats-grid (for statistics cards)
- .modal-overlay, .modal-content
- .plan-form (form styling)
- .btn-icon (edit/delete buttons)
```

### 2. **Update Advertisement Creation Form** (Subadmin)

File: `src/pages/subadmin/Advertisement.jsx`

**Changes Needed:**

```javascript
// 1. Check subscription before allowing ad creation
useEffect(() => {
  checkSubscription();
}, []);

const checkSubscription = async () => {
  const result = await subscriptionAPI.getMySubscription();
  if (!result.data) {
    // Show "Subscribe first" message
  } else if (result.data.ads_used >= result.data.ad_limit) {
    // Show "Limit reached" message
  }
};

// 2. Simplify form to only require:
// - ad_picture (file upload) - REQUIRED
// - title - REQUIRED
// - description - optional

// 3. Add image upload preview
// 4. Show subscription info (X/Y ads used)
```

### 3. **Admin Ad Approval Page**

Create: `src/pages/admin/AdApprovalManagement.jsx`

**Features:**

```javascript
- Fetch pending ads with pagination
- Display ad image preview
- Show subadmin info and plan
- Approve button (with "Display now?" checkbox)
- Reject button (with reason textarea)
- Filter by plan type
- Search by subadmin email
```

**Example Structure:**

```jsx
<div className="ad-approval-container">
  {/* Stats */}
  <div className="stats">Pending: {pendingCount}</div>

  {/* Pending Ads Grid */}
  {pendingAds.map((ad) => (
    <div className="ad-card">
      <img src={ad.ad_picture} />
      <h3>{ad.title}</h3>
      <p>By: {ad.created_by}</p>
      <p>Plan: {ad.plan_name}</p>

      <div className="actions">
        <button onClick={() => handleApprove(ad._id)}>✓ Approve</button>
        <button onClick={() => handleReject(ad._id)}>✗ Reject</button>
      </div>
    </div>
  ))}
</div>
```

### 4. **Subscription Status Widget** (Subadmin)

Create: `src/components/subadmin/SubscriptionStatus.jsx`

**Purpose:** Show in dashboard/sidebar

```jsx
const SubscriptionStatus = () => {
  const [subscription, setSubscription] = useState(null);

  return (
    <div className="subscription-widget">
      {subscription ? (
        <>
          <div className="plan-badge">{subscription.plan_name}</div>
          <div className="usage">
            {subscription.ads_used} / {subscription.ad_limit} ads used
          </div>
          <div className="progress-bar">
            <div
              style={{
                width: `${
                  (subscription.ads_used / subscription.ad_limit) * 100
                }%`,
              }}
            />
          </div>
          <div className="expiry">
            Expires: {formatDate(subscription.expiry_date)}
          </div>
        </>
      ) : (
        <Link to="/subscriptions">Subscribe Now</Link>
      )}
    </div>
  );
};
```

### 5. **Update Displayed Ads Page** (Public)

File: `src/pages/public/Advertisements.jsx` or similar

**Use the new endpoint:**

```javascript
// Instead of getAllAdvertisements()
const result = await advertisementAPI.getDisplayedAdvertisements(page, perPage);
// This shows only approved & displayed ads
```

---

## 🔄 Integration Steps

### Step 1: Update Router

Add new routes in your router configuration:

```javascript
// Subadmin Routes
<Route path="/subscription-plans" element={<SubscriptionPlans />} />
<Route path="/create-ad" element={<Advertisement />} />

// Admin Routes
<Route path="/admin/subscriptions" element={<SubscriptionManagement />} />
<Route path="/admin/ad-approvals" element={<AdApprovalManagement />} />
```

### Step 2: Update Navigation

Add links to sidebar/navigation:

**Subadmin Menu:**

```jsx
<Link to="/subscription-plans">My Subscription</Link>
<Link to="/create-ad">Create Advertisement</Link>
```

**Admin Menu:**

```jsx
<Link to="/admin/subscriptions">Subscription Plans</Link>
<Link to="/admin/ad-approvals">Approve Ads</Link>
```

### Step 3: Add Subscription Check

In `Advertisement.jsx` (ad creation form):

```javascript
import subscriptionAPI from "../../services/subscriptionAPI";

// At component top
const [subscription, setSubscription] = useState(null);
const [canCreateAd, setCanCreateAd] = useState(false);

useEffect(() => {
  checkSubscriptionStatus();
}, []);

const checkSubscriptionStatus = async () => {
  const result = await subscriptionAPI.getMySubscription();
  if (result.success && result.data) {
    setSubscription(result.data);
    setCanCreateAd(result.data.ads_used < result.data.ad_limit);
  }
};

// In render
if (!subscription) {
  return (
    <div className="no-subscription">
      <h2>No Active Subscription</h2>
      <p>You need to subscribe to a plan before creating advertisements.</p>
      <Link to="/subscription-plans">
        <button>View Plans</button>
      </Link>
    </div>
  );
}

if (!canCreateAd) {
  return (
    <div className="limit-reached">
      <h2>Ad Limit Reached</h2>
      <p>
        You've used {subscription.ads_used} of {subscription.ad_limit} ads.
      </p>
      <Link to="/subscription-plans">
        <button>Upgrade Plan</button>
      </Link>
    </div>
  );
}
```

---

## 📝 Form Updates

### Old Advertisement Form Fields:

```
- society_name (required)
- location (required)
- plot_sizes (required)
- price_start (required)
- contact_number (required)
- description
- facilities
```

### New Advertisement Form Fields:

```
- ad_picture (required) - FILE UPLOAD
- title (required) - TEXT
- description (optional) - TEXTAREA
```

**Updated Form:**

```jsx
<form onSubmit={handleSubmit}>
  <div className="subscription-info">
    Plan: {subscription.plan_name} | Ads Used: {subscription.ads_used}/
    {subscription.ad_limit}
  </div>

  <div className="form-group">
    <label>Advertisement Picture *</label>
    <input type="file" accept="image/*" onChange={handleImageUpload} required />
    {preview && <img src={preview} alt="Preview" className="preview" />}
  </div>

  <div className="form-group">
    <label>Title *</label>
    <input
      type="text"
      value={formData.title}
      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      required
      placeholder="e.g., Grand Opening Sale!"
    />
  </div>

  <div className="form-group">
    <label>Description</label>
    <textarea
      value={formData.description}
      onChange={(e) =>
        setFormData({ ...formData, description: e.target.value })
      }
      rows="4"
      placeholder="Optional description..."
    />
  </div>

  <button type="submit" disabled={submitting}>
    {submitting ? "Submitting..." : "Submit for Approval"}
  </button>
</form>
```

---

## 🎨 Design Guidelines

### Color Scheme:

- **Primary:** `#667eea` → `#764ba2` (Gradient)
- **Success:** `#10b981`
- **Error:** `#ef4444`
- **Warning:** `#fbbf24`
- **Info:** `#3b82f6`

### Plan Types:

- **Basic:** Blue tones (`#3b82f6`)
- **Premium:** Purple tones (`#8b5cf6`)
- **Enterprise:** Gold tones (`#fbbf24`)

### Status Badges:

- **Active:** Green (`#10b981`)
- **Pending:** Yellow (`#fbbf24`)
- **Rejected:** Red (`#ef4444`)
- **Approved:** Blue (`#3b82f6`)
- **Cancelled:** Gray (`#6b7280`)

---

## 🧪 Testing Workflow

### As Subadmin:

1. Navigate to `/subscription-plans`
2. View available plans
3. Click "Subscribe Now" on a plan
4. Verify subscription appears
5. Go to create advertisement
6. Upload image, add title
7. Submit and verify "Pending approval" message
8. Check ads used count increased
9. Try creating ads until limit reached
10. Verify error message when limit hit

### As Admin:

1. Navigate to `/admin/subscriptions`
2. Create a new subscription plan
3. View all user subscriptions
4. Go to `/admin/ad-approvals`
5. See pending advertisements
6. Approve an ad (check "Display now")
7. Reject an ad with reason
8. Toggle display status of approved ads
9. Verify stats update correctly

---

## 🔌 API Integration Quick Reference

```javascript
// Subscribe to plan
await subscriptionAPI.subscribeToPlan(planId);

// Check my subscription
await subscriptionAPI.getMySubscription();

// Create ad (with subscription check in backend)
await advertisementAPI.createAdvertisement({
  title: "...",
  ad_picture: "/uploads/...",
  description: "...",
});

// Get pending ads (admin)
await advertisementAPI.getPendingAdvertisements(page, perPage);

// Approve ad (admin)
await advertisementAPI.approveAdvertisement(adId, isDisplayed);

// Reject ad (admin)
await advertisementAPI.rejectAdvertisement(adId, reason);

// Toggle display (admin)
await advertisementAPI.toggleDisplayStatus(adId, isDisplayed);
```

---

## ✨ Key Features Summary

✅ Subscription management for subadmins
✅ Plan creation/editing for admins
✅ Image-based advertisements
✅ Approval workflow
✅ Usage tracking
✅ Display control
✅ Statistics dashboard
✅ Responsive design
✅ Error handling
✅ Success notifications

---

## 📂 File Structure

```
frontend/src/
├── services/
│   ├── subscriptionAPI.js ✅
│   └── advertisementAPI.js ✅ (updated)
├── pages/
│   ├── subadmin/
│   │   ├── SubscriptionPlans.jsx ✅
│   │   ├── SubscriptionPlans.css ✅
│   │   └── Advertisement.jsx ⚠️ (needs update)
│   └── admin/
│       ├── SubscriptionManagement.jsx ✅
│       ├── SubscriptionManagement.css ⏳ (to create)
│       └── AdApprovalManagement.jsx ⏳ (to create)
└── components/
    └── subadmin/
        └── SubscriptionStatus.jsx ⏳ (to create)
```

**Legend:**

- ✅ Complete
- ⚠️ Needs updates
- ⏳ To be created

---

## 🚀 Next Steps

1. Create `SubscriptionManagement.css` for admin page styling
2. Create `AdApprovalManagement.jsx` for admin ad approval
3. Update `Advertisement.jsx` to check subscription and simplify form
4. Create `SubscriptionStatus.jsx` widget for dashboard
5. Add routes to router configuration
6. Add navigation links
7. Test complete workflow
8. Deploy and verify!

All backend APIs are ready and functional! 🎉
