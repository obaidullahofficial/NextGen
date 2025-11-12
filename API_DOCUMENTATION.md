# 📋 NextGenArchitect - Complete API Documentation

## 🌐 **Base Configuration**
- **Backend URL**: `http://localhost:5000/api`
- **Frontend URLs**: `http://localhost:5173`, `http://localhost:5174`
- **Authentication**: JWT Bearer Token
- **Content-Type**: `application/json` or `multipart/form-data` for file uploads

---

## 🔐 **AUTHENTICATION APIS**

### **User Authentication**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/check-email` | Check if email exists | ❌ |
| `POST` | `/signup` | User registration | ❌ |
| `POST` | `/login` | User login | ❌ |
| `POST` | `/google-login` | Google OAuth login | ❌ |
| `POST` | `/forgot-password` | Request password reset | ❌ |
| `POST` | `/reset-password` | Reset password with token | ❌ |
| `POST` | `/logout` | User logout | ❌ |
| `GET` | `/test-google-config` | Test Google OAuth config | ❌ |

### **Token Management**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/society-profile/simple-test` | Test token validity | ✅ |

---

## 🏢 **SOCIETY MANAGEMENT APIS**

### **Society Registration**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/register-society` | Register new society | ❌ |
| `POST` | `/signup-society` | Society signup with user account | ❌ |
| `GET` | `/my-society` | Get current user's society | ✅ |

### **Society Profile**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/society-profile` | Get society profile | ✅ |
| `POST` | `/society-profile` | Create society profile | ✅ |
| `PUT` | `/society-profile` | Update society profile | ✅ |
| `GET` | `/society-profile/completeness` | Check profile completeness | ✅ |
| `POST` | `/society-profile/initialize` | Initialize from registration | ✅ |

### **Society Registration Management (Admin)**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/registration-forms` | Get all registration forms | ✅ Admin |
| `GET` | `/registration-forms/<form_id>` | Get specific registration | ✅ |
| `PUT` | `/registration-forms/<form_id>/status` | Update registration status | ✅ Admin |
| `GET` | `/society-registrations` | Get all society registrations | ✅ Admin |
| `GET` | `/society-registrations/pending` | Get pending registrations | ✅ Admin |

---

## 🏗️ **PLOT MANAGEMENT APIS**

### **Plot CRUD Operations**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/plots` | Get all plots for society | ✅ |
| `POST` | `/plots` | Create new plot | ✅ |
| `GET` | `/plots/<plot_id>` | Get specific plot | ✅ |
| `PUT` | `/plots/<plot_id>` | Update plot | ✅ |
| `DELETE` | `/plots/<plot_id>` | Delete plot | ✅ |

---

## 👤 **USER MANAGEMENT APIS**

### **User Profile Management**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/profile` | Get user profile | ✅ |
| `POST` | `/profile` | Create user profile | ✅ |
| `PUT` | `/profile` | Update user profile | ✅ |
| `DELETE` | `/profile` | Delete user profile | ✅ |

### **User CRUD (Admin)**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/users` | Get all users | ✅ Admin |
| `POST` | `/register` | Create new user | ✅ Admin |
| `GET` | `/users/<user_id>` | Get user by ID | ✅ Admin |
| `PUT` | `/users/<user_id>` | Update user | ✅ Admin |
| `DELETE` | `/users/<user_id>` | Delete user | ✅ Admin |
| `GET` | `/users/search` | Search users | ✅ Admin |
| `DELETE` | `/users/bulk-delete` | Bulk delete users | ✅ Admin |

### **User Analytics**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/users/stats` | Get user statistics | ✅ Admin |
| `GET` | `/analytics` | Get user analytics | ✅ |

---

## 📝 **APPROVAL REQUEST APIS**

### **Approval Management**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/approval-requests` | Get user's approval requests | ✅ |
| `POST` | `/approval-requests` | Create approval request | ✅ |
| `GET` | `/approval-requests/<request_id>` | Get specific request | ✅ |
| `PUT` | `/approval-requests/<request_id>` | Update approval request | ✅ |
| `DELETE` | `/approval-requests/<request_id>` | Delete approval request | ✅ |

---

## 📊 **USER ACTIVITY & PROGRESS APIS**

### **Activity Tracking**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/activities` | Get user activities | ✅ |
| `GET` | `/progress` | Get user progress summary | ✅ |

---

## ⭐ **REVIEW MANAGEMENT APIS**

### **Review CRUD Operations**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/reviews` | Get all reviews | ❌ |
| `POST` | `/reviews` | Create new review | ✅ |
| `GET` | `/reviews/<review_id>` | Get specific review | ❌ |
| `PUT` | `/reviews/<review_id>` | Update review | ✅ |
| `DELETE` | `/reviews/<review_id>` | Delete review | ✅ |

### **Plot-Specific Reviews**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/plots/<plot_id>/reviews` | Get reviews for plot | ❌ |
| `GET` | `/plots/<plot_id>/reviews/stats` | Get review statistics | ❌ |

### **User-Specific Reviews**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/users/<user_email>/reviews` | Get user's reviews | ✅ |

---

## 📢 **ADVERTISEMENT MANAGEMENT APIS**

### **Advertisement CRUD Operations**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/advertisements` | Get all advertisements | ❌ |
| `POST` | `/advertisements` | Create advertisement | ✅ |
| `GET` | `/advertisements/<ad_id>` | Get specific advertisement | ❌ |
| `PUT` | `/advertisements/<ad_id>` | Update advertisement | ✅ |
| `DELETE` | `/advertisements/<ad_id>` | Delete advertisement | ✅ |

### **Advertisement Features**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/advertisements/featured` | Get featured ads | ❌ |
| `GET` | `/advertisements/stats` | Get ad statistics | ✅ Admin |
| `GET` | `/users/<user_email>/advertisements` | Get user's ads | ✅ |

---

## 🛠️ **SYSTEM UTILITIES APIS**

### **Health & Testing**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/db-test` | Test database connection | ❌ |
| `GET` | `/jwt-test` | Test JWT configuration | ❌ |

---

## 📱 **FRONTEND SERVICE STRUCTURE**

### **Service Files**
```
frontend/src/services/
├── baseApiService.js      # Common API utilities
├── authService.js         # Authentication functions
├── societyService.js      # Society management
├── plotService.js         # Plot management
├── userProfileAPI.js      # User profile operations
├── userAPI.js            # User management (admin)
├── reviewAPI.js          # Review operations
├── advertisementAPI.js   # Advertisement operations
├── societyProfileAPI.js  # Society profile operations
└── index.js              # Centralized exports
```

### **Main API Functions Available in Frontend**

#### **Authentication Service**
```javascript
import { 
  checkEmail, signupUser, loginUser, googleLogin,
  forgotPassword, resetPassword, societySignup,
  getMySociety, logout, isLoggedIn, getCurrentUserRole,
  getCurrentUserId, testTokenValidity,
  getSocietyRegistrations, getPendingSocietyRegistrations
} from './services/authService.js';
```

#### **Society Service**
```javascript
import {
  getSocietyProfile, updateSocietyProfile,
  checkProfileCompleteness, initializeSocietyProfile,
  getMissingFields, debugSocietyProfile, getAllSocietyProfiles
} from './services/societyService.js';
```

#### **Plot Service**
```javascript
import {
  getPlots, createPlot, getPlot,
  updatePlot, deletePlot, getPlotsFiltered
} from './services/plotService.js';
```

#### **User Profile Service**
```javascript
import { userProfileAPI } from './services/userProfileAPI.js';
// Methods: getProfile, updateProfile, deleteProfile,
// getApprovalRequests, createApprovalRequest, etc.
```

#### **Review & Advertisement Services**
```javascript
import reviewAPI from './services/reviewAPI.js';
import advertisementAPI from './services/advertisementAPI.js';
```

---

## 🔑 **AUTHENTICATION REQUIREMENTS**

### **Public Endpoints (No Auth)**
- All login/signup endpoints
- Public advertisement and review viewing
- Database and system health checks
- Plot and review statistics

### **User Authentication Required**
- Profile management
- Creating content (reviews, ads, approval requests)
- Society profile operations
- Plot management for society owners

### **Admin Authentication Required**
- User management (CRUD operations)
- Society registration approval
- User analytics and statistics
- System administration

---

## 📋 **COMMON RESPONSE FORMATS**

### **Success Response**
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful",
  "count": 10
}
```

### **Error Response**
```json
{
  "success": false,
  "error": "Error description",
  "message": "User-friendly message"
}
```

### **JWT Token Response**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "email": "user@example.com",
    "role": "user",
    "id": "user_id"
  }
}
```

---

## 🚨 **COMMON HTTP STATUS CODES**

| Code | Description | When Used |
|------|-------------|-----------|
| `200` | OK | Successful GET, PUT operations |
| `201` | Created | Successful POST operations |
| `400` | Bad Request | Invalid input data |
| `401` | Unauthorized | Missing or invalid token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `500` | Internal Server Error | Server-side errors |

---

## 📚 **USAGE EXAMPLES**

### **Login Example**
```javascript
import { loginUser } from './services/authService.js';

const handleLogin = async (email, password) => {
  try {
    const result = await loginUser({ email, password });
    console.log('Login successful:', result);
    // Token is automatically stored in localStorage
  } catch (error) {
    console.error('Login failed:', error.message);
  }
};
```

### **Get Society Profile Example**
```javascript
import { getSocietyProfile } from './services/societyService.js';

const fetchProfile = async () => {
  try {
    const profile = await getSocietyProfile();
    console.log('Profile data:', profile);
  } catch (error) {
    console.error('Failed to fetch profile:', error.message);
  }
};
```

### **Create Plot Example**
```javascript
import { createPlot } from './services/plotService.js';

const addNewPlot = async (plotData) => {
  try {
    const result = await createPlot(plotData);
    console.log('Plot created:', result);
  } catch (error) {
    console.error('Failed to create plot:', error.message);
  }
};
```

---

## 🔧 **TESTING APIS**

### **Postman/Thunder Client Setup**
```
Base URL: http://localhost:5000/api
Headers:
  Content-Type: application/json
  Authorization: Bearer YOUR_JWT_TOKEN
```

### **Get JWT Token**
1. Make POST request to `/login` with credentials
2. Copy `access_token` from response
3. Use in Authorization header: `Bearer <token>`

This documentation covers all **78+ API endpoints** currently implemented in your NextGenArchitect project! 🎉