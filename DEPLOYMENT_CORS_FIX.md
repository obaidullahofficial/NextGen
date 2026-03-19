# Failed to Fetch - CORS Fix Guide

## Problem
Getting "Failed to fetch" errors when frontend (Vercel) calls backend (Render)

## Root Cause
CORS (Cross-Origin Resource Sharing) headers are either missing or misconfigured

## Solutions Applied

### ✅ Backend CORS Configuration (Render)
**File:** `backend/app.py`

```python
allowed_origins = [
    "http://localhost:5173",              # Local dev
    "http://localhost:5174",              # Local dev
    "http://localhost:5175",              # Local dev
    "http://localhost:5176",              # Local dev
    "https://next-gen-silk.vercel.app",  # Your Vercel frontend
    "https://nextgen-ta95.onrender.com"   # Render backend itself
]

# Add any custom frontend URL from environment
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url and frontend_url not in allowed_origins:
    allowed_origins.append(frontend_url)

CORS(app, 
     origins=allowed_origins,
     supports_credentials=True,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"],
     expose_headers=["Content-Type", "Authorization"])
```

### ✅ Frontend API Configuration

**File:** `frontend/.env`
```
VITE_API_URL=https://nextgen-ta95.onrender.com/api
VITE_GOOGLE_CLIENT_ID=971195175228-3qgvsj72r28agj0e639me7qd6na6jbkp.apps.googleusercontent.com
```

**File:** `frontend/src/services/baseApiService.js`
```javascript
export const API_URL = import.meta.env.VITE_API_URL || "https://nextgen-ta95.onrender.com/api";
```

## Render Backend Setup

### Environment Variables to Configure on Render:
1. Go to your Render service dashboard
2. Navigate to **Settings** → **Environment**
3. Add these variables:

```
FRONTEND_URL=https://your-vercel-domain.vercel.app
DATABASE_URL=your_database_connection_string
JWT_SECRET_KEY=6b30c0cdbdc749228ae16f07492b441310eac85611cbd607e1e110237218f89b
FLASK_ENV=production
```

### Build Command:
```bash
pip install -r requirements.txt
```

### Start Command:
```bash
gunicorn -w 4 -b 0.0.0.0:$PORT app:app
```

## Vercel Frontend Setup

### Environment Variables on Vercel:
1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add:

```
VITE_API_URL=https://nextgen-ta95.onrender.com/api
VITE_GOOGLE_CLIENT_ID=971195175228-3qgvsj72r28agj0e639me7qd6na6jbkp.apps.googleusercontent.com
```

### Build Settings:
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

## Troubleshooting

### Check if Backend is Running:
```bash
curl -I https://nextgen-ta95.onrender.com/api/health
```

### Check CORS Headers in Response:
```bash
curl -H "Origin: https://your-vercel-domain.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS https://nextgen-ta95.onrender.com/api/users
```

Should return:
```
Access-Control-Allow-Origin: https://your-vercel-domain.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Frontend Network Tab Issues:
1. Open browser DevTools → **Network** tab
2. Look for failed preflight requests (OPTIONS method)
3. Check response headers for CORS errors

## If Still Getting Failed to Fetch:

1. **Check Backend Logs on Render:**
   - Dashboard → Logs
   - Look for CORS-related errors

2. **Verify Frontend Is Using Correct API URL:**
   ```javascript
   // Open browser console
   console.log(import.meta.env.VITE_API_URL)
   ```

3. **Check if Backend is Actually Running:**
   - Visit `https://nextgen-ta95.onrender.com/health` in browser
   - Should see response (not error)

4. **Disable CORS Temporarily (Not Recommended for Production):**
   ```python
   CORS(app)  # Allow all origins
   ```
   Then rebuild and test. If it works, the issue is your CORS configuration.

5. **Check Firewall/Network:**
   - Ensure Render backend allows external requests
   - Check Vercel deployment logs for network errors

## Additional Notes

- **Credentials:** CORS is configured with `supports_credentials=True` for cookie-based auth
- **Methods:** Supports GET, POST, PUT, DELETE, OPTIONS
- **Headers:** Allows Content-Type and Authorization headers
- **HTTPS:** All production URLs must use HTTPS
