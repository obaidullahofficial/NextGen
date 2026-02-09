# Frontend Services Directory

This directory contains the API service layer for the NextGenArchitect frontend application. The services are organized by domain/model for better maintainability and separation of concerns.

## Architecture Overview

The service layer is structured as follows:

```
services/
├── README.md              # This documentation
├── baseApiService.js      # Common API utilities and configurations
├── authService.js         # Authentication-related functions
├── societyService.js      # Society profile management functions
├── plotService.js         # Plot management functions
├── index.js              # Centralized exports for easy importing
└── apiService.js         # Legacy file (backward compatibility)
```

## Service Files Description

### 📋 baseApiService.js
Contains common utilities used across all services:
- `API_URL` - Base API endpoint URL
- `getValidToken()` - Token validation and retrieval
- `createAuthHeaders()` - Helper for creating authenticated request headers
- `apiRequest()` - Generic API request wrapper with error handling
- `authenticatedRequest()` - Helper for authenticated requests
- `getSessionTimeRemaining()` - Session time utilities
- `isSessionExpiringSoon()` - Session expiration checks

### 🔐 authService.js
Handles all authentication-related operations:
- `checkEmail()` - Check email availability
- `signupUser()` - User registration
- `loginUser()` - User login
- `societySignup()` - Society registration
- `getMySociety()` - Get current user's society
- `logout()` - User logout
- `isLoggedIn()` - Check authentication status
- `getCurrentUserRole()` - Get user role from token
- `getCurrentUserId()` - Get user ID from token
- `testTokenValidity()` - Validate token with server

### 🏢 societyService.js
Manages society profile operations:
- `getSocietyProfile()` - Get society profile data
- `updateSocietyProfile()` - Update society profile
- `checkProfileCompleteness()` - Check if profile is complete
- `initializeSocietyProfile()` - Initialize new profile
- `getMissingFields()` - Get list of missing required fields
- `debugSocietyProfile()` - Debug profile data (development)

### 🏗️ plotService.js
Handles plot/property management:
- `getPlots()` - Get all plots for society
- `createPlot()` - Create new plot
- `getPlot()` - Get single plot by ID
- `updatePlot()` - Update existing plot
- `deletePlot()` - Delete plot
- `getPlotsFiltered()` - Get plots with filtering options

### 📦 index.js
Centralized export file that re-exports all functions from other services. This allows for clean imports across the application.

### ⚠️ apiService.js (Legacy)
Maintained for backward compatibility. This file re-exports all functions from the modular services and shows deprecation warnings in development mode.

## Usage Examples

### New Recommended Approach

```javascript
// Import specific functions from individual services
import { loginUser, logout } from './services/authService.js';
import { getSocietyProfile, updateSocietyProfile } from './services/societyService.js';
import { getPlots, createPlot } from './services/plotService.js';

// Or import from the centralized index
import { 
  loginUser, 
  getSocietyProfile, 
  getPlots 
} from './services/index.js';

// Or use the convenient default import
import * as api from './services';
```

### Legacy Approach (Still Supported)

```javascript
// This still works but shows deprecation warning in development
import { loginUser, getSocietyProfile, getPlots } from './services/apiService.js';
```

## Benefits of the New Structure

1. **🎯 Separation of Concerns**: Each service handles one specific domain
2. **🧩 Modularity**: Easy to import only what you need
3. **🔧 Maintainability**: Easier to find and modify specific functionality
4. **♻️ Reusability**: Common utilities are shared via baseApiService
5. **🔄 Backward Compatibility**: Existing code continues to work
6. **📚 Clarity**: Clear organization makes the codebase more understandable

## Common Patterns

### Error Handling
All services use consistent error handling through the `baseApiService`:
```javascript
try {
  const result = await getSocietyProfile();
  // Handle success
} catch (error) {
  // Error handling - tokens are automatically cleaned up if invalid
  console.error('Profile fetch failed:', error.message);
}
```

### File Uploads
Services automatically detect FormData for file uploads:
```javascript
const formData = new FormData();
formData.append('image', file);
formData.append('name', 'Plot Name');

// Automatically handles multipart/form-data
await updateSocietyProfile(formData);
```

### Authentication
All authenticated requests automatically include the JWT token:
```javascript
// Token is automatically included from localStorage
const plots = await getPlots();
```

## Migration Guide

To migrate from the legacy `apiService.js`:

1. **Identify the functions you're using**
2. **Check which service they belong to** (auth, society, plot, or base)
3. **Update your imports**:
   ```javascript
   // Before
   import { loginUser, getSocietyProfile } from './apiService.js';
   
   // After - Option 1 (specific services)
   import { loginUser } from './services/authService.js';
   import { getSocietyProfile } from './services/societyService.js';
   
   // After - Option 2 (centralized)
   import { loginUser, getSocietyProfile } from './services/index.js';
   ```

## Development Notes

- The legacy `apiService.js` shows deprecation warnings in development mode
- All services include comprehensive logging for debugging
- Error handling is centralized and consistent
- Token management is automatic and secure
- FormData uploads are automatically detected

For questions or issues with the service layer, refer to the individual service files or the base service utilities.
