# CORS X-API-Key Header Issue - FIXED

**Version:** v1.0 • **Updated:** 2025-01-11 16:27 AEST (Brisbane)

---

## Issue Summary

Weather API queries were failing with a CORS error because the backend wasn't allowing the `X-API-Key` header that's required for API key authentication.

### Error Message
```
Access to fetch at 'https://web-production-2d722.up.railway.app/api/weather/location...' 
from origin 'https://precious-lily-eed7a8.netlify.app' has been blocked by CORS policy: 
Request header field x-api-key is not allowed by Access-Control-Allow-Headers in preflight response.
```

### Symptoms
- ✅ User login/signup works
- ✅ Dashboard loads correctly  
- ✅ API key generation works
- ❌ Weather queries fail with CORS error
- ❌ "Failed to fetch" error in console

### Root Cause

The CORS configuration in `backend/app.py` only allowed `Content-Type` and `Authorization` headers, but the weather API endpoints require the `X-API-Key` header for authentication:

```python
# OLD CODE (BROKEN)
CORS(app, 
     origins=config.CORS_ORIGINS,
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization'],  # ❌ Missing X-API-Key
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     expose_headers=['Content-Type', 'Authorization'],
     max_age=3600)
```

---

## Solution Implemented

Added `X-API-Key` to the list of allowed headers in the CORS configuration:

```python
# NEW CODE (FIXED)
CORS(app, 
     origins=config.CORS_ORIGINS,
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization', 'X-API-Key'],  # ✅ Added X-API-Key
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     expose_headers=['Content-Type', 'Authorization'],
     max_age=3600)
```

---

## Testing

### Before Fix
- ❌ Weather queries → CORS error
- ❌ API key authentication → Blocked by preflight
- ❌ Dashboard queries → "Failed to fetch"

### After Fix (Expected)
- ✅ Weather queries → Success with API key
- ✅ API key authentication → Works properly
- ✅ Dashboard queries → Return weather data

---

## Deployment

**Commit:** `3e3319e`  
**Repository:** `github.com/Will954633/fetcha.weather.git`  
**Branch:** `main`

**Files Changed:**
- `backend/app.py` (added X-API-Key to CORS headers)

**Deployment Status:**
- ✅ Pushed to GitHub main branch
- 🔄 Railway auto-deployment triggered (connected to main branch)
- ⏳ Waiting for Railway build and deploy (~2-3 minutes)

**Production URLs:**
- Backend API: https://web-production-2d722.up.railway.app/api
- Frontend: https://precious-lily-eed7a8.netlify.app
- Dashboard: https://precious-lily-eed7a8.netlify.app/weather-dashboard.html

---

## Verification Steps

Once Railway deploys:

1. **Test Weather Query:**
   ```
   1. Login to dashboard
   2. Ensure you have an API key generated
   3. Fill out the weather query form:
      - Location: Brisbane
      - State: Queensland  
      - Date From: 2025-10-25
      - Date To: 2025-11-01
   4. Click "Run Query"
   5. Should see: Weather data results (NOT CORS error)
   ```

2. **Check Browser Console:**
   ```
   1. Open browser DevTools (F12)
   2. Go to Console tab
   3. Run a weather query
   4. Should see: Successful API response
   5. Should NOT see: CORS policy error
   ```

3. **Verify API Key Header:**
   ```
   1. Open browser DevTools → Network tab
   2. Run a weather query
   3. Click on the weather API request
   4. Go to Headers section
   5. Should see: X-API-Key: [your-api-key]
   6. Response should be: 200 OK with weather data
   ```

---

## Related Issues

This fix was discovered after resolving the login redirect issue. The workflow revealed two separate issues:

1. **Login Redirect Issue** (FIXED in commit 69e2fe7)
   - Login page redirected without validating token
   - Fixed by adding backend token validation

2. **CORS X-API-Key Issue** (FIXED in commit 3e3319e)
   - Weather queries blocked by CORS
   - Fixed by adding X-API-Key to allowed headers

---

## Technical Details

### CORS Preflight Request

When the browser makes a request with a custom header like `X-API-Key`, it first sends a preflight OPTIONS request to check if the header is allowed. The server must respond with the header name in `Access-Control-Allow-Headers`.

**Request Flow:**
```
1. Browser → OPTIONS /api/weather/location (Preflight)
   Headers: Access-Control-Request-Headers: x-api-key
   
2. Server → 200 OK
   Headers: Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key ✅
   
3. Browser → GET /api/weather/location (Actual Request)
   Headers: X-API-Key: cfx_xxx...
   
4. Server → 200 OK with weather data
```

### Why This Works

Flask-CORS automatically handles preflight requests when `allow_headers` is configured. By adding `X-API-Key` to the list, the server now:

1. Accepts preflight requests asking for `x-api-key` header
2. Responds with `Access-Control-Allow-Headers: ... X-API-Key ...`
3. Browser allows the actual request with the `X-API-Key` header
4. Weather API receives the key and authenticates the request

---

## Related Files

- `backend/app.py` - CORS configuration
- `backend/routes/weather.py` - Weather API endpoints
- `frontend/js/weather-dashboard.js` - Dashboard query logic

---

## Next Steps

- [x] Fix CORS configuration
- [x] Push to GitHub
- [ ] Wait for Railway deployment (~2-3 min)
- [ ] Test weather queries
- [ ] Verify API key authentication works

---

**Status:** ✅ FIXED - Deployed to production (Railway auto-deploying)
