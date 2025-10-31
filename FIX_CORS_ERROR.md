# CORS Error Fix - Railway Deployment

**Version:** v1.0 • **Updated:** 2025-10-31 18:57 AEST (Brisbane)

## Problem
The Netlify frontend cannot communicate with the Railway backend due to CORS policy blocking the requests. The error message is:
```
Access to fetch at 'https://web-production-2d722.up.railway.app/api/auth/signup' 
from origin 'https://6904794a9b7912595179c0f7--precious-lily-eed7a8.netlify.app' 
has been blocked by CORS policy
```

## Root Cause
1. The environment variable name was incorrect (`ALLOWED_ORIGINS` instead of `CORS_ORIGINS`)
2. The Netlify URL was not included in the allowed origins list

## Solution Applied

### 1. Updated Backend Configuration
✅ Fixed `config.py` to properly handle comma-separated CORS origins
✅ Updated `.env.production` with correct variable name and Netlify URL

### 2. Deploy to Railway

You need to update the environment variable on Railway:

#### Step-by-Step Instructions:

1. **Go to Railway Dashboard**
   - Navigate to: https://railway.app/dashboard
   - Select your backend project: `web-production-2d722`

2. **Open Variables Section**
   - Click on your service
   - Go to the "Variables" tab

3. **Add/Update CORS_ORIGINS Variable**
   - Click "New Variable"
   - Variable name: `CORS_ORIGINS`
   - Variable value: 
     ```
     https://6904794a9b7912595179c0f7--precious-lily-eed7a8.netlify.app,https://fetcha.weather,https://www.fetcha.weather,https://api.fetcha.net
     ```

4. **Remove Old Variable (if exists)**
   - If you see `ALLOWED_ORIGINS`, delete it
   - It's no longer needed

5. **Deploy the Updated Code**
   ```bash
   cd /Users/willsimpson/Documents/Weather_Data_API/03_Website
   git add backend/config.py backend/.env.production
   git commit -m "Fix CORS configuration for Netlify frontend"
   git push origin main
   ```

6. **Wait for Deployment**
   - Railway will automatically redeploy
   - Wait 2-3 minutes for the deployment to complete
   - Check the deployment logs to ensure no errors

7. **Test the Fix**
   - Go to: https://6904794a9b7912595179c0f7--precious-lily-eed7a8.netlify.app/login?signup=true
   - Try to sign up with test credentials
   - The signup should now work without CORS errors

## What Changed

### config.py
```python
# Before: Used wildcard pattern that doesn't work with Flask-CORS
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'https://*.netlify.app').split(',')

# After: Properly parse comma-separated list
cors_env = os.environ.get('CORS_ORIGINS', '')
if cors_env:
    CORS_ORIGINS = [origin.strip() for origin in cors_env.split(',') if origin.strip()]
else:
    CORS_ORIGINS = ['https://weather.fetcha.com']
```

### .env.production
```bash
# Before
ALLOWED_ORIGINS=https://fetcha.weather,https://www.fetcha.weather,https://api.fetcha.net

# After
CORS_ORIGINS=https://6904794a9b7912595179c0f7--precious-lily-eed7a8.netlify.app,https://fetcha.weather,https://www.fetcha.weather,https://api.fetcha.net
```

## Important Notes

1. **Netlify URL Changes**: When Netlify creates a new deployment, the URL hash might change. If that happens, update the `CORS_ORIGINS` variable on Railway with the new URL.

2. **Custom Domain**: Once you set up a custom domain on Netlify, add it to the `CORS_ORIGINS` list and remove the generated Netlify URL.

3. **Multiple Frontends**: If you deploy to multiple environments (staging, production), add all their URLs to the comma-separated list.

## Verification Steps

After deploying, verify the fix:

1. **Check Backend Health**
   ```bash
   curl https://web-production-2d722.up.railway.app/health
   ```
   Should return: `{"status":"healthy",...}`

2. **Check CORS Headers**
   ```bash
   curl -H "Origin: https://6904794a9b7912595179c0f7--precious-lily-eed7a8.netlify.app" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        https://web-production-2d722.up.railway.app/api/auth/signup -v
   ```
   Should see: `Access-Control-Allow-Origin` header in response

3. **Test Frontend**
   - Open browser console
   - Go to signup page
   - Submit form
   - No CORS errors should appear

## Troubleshooting

### If CORS errors persist:

1. **Clear Browser Cache**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Or clear cache completely

2. **Check Railway Logs**
   ```bash
   # In Railway dashboard, check logs for:
   # - "CORS_ORIGINS" environment variable being loaded
   # - Any startup errors
   ```

3. **Verify Environment Variable**
   - In Railway dashboard, confirm `CORS_ORIGINS` is set correctly
   - Check for typos or extra spaces

4. **Check Deployment**
   - Ensure the latest code was deployed
   - Check git commit matches Railway deployment

## Contact Support

If the issue persists after following these steps, check:
- Railway deployment logs
- Browser console for detailed error messages
- Network tab to see the actual request/response headers
