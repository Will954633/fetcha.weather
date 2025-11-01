# Fix API Keys CORS Error

**Version:** v1.0 • **Updated:** 2025-11-01 12:52 AEST (Brisbane)

## Problem

The dashboard cannot load API keys due to a CORS error:
```
Access to fetch at 'https://web-production-2d722.up.railway.app/api/keys' from origin 'https://precious-lily-eed7a8.netlify.app' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: Redirect is not allowed for a preflight request.
```

## Root Cause

The Railway backend's CORS_ORIGINS environment variable contains an old Netlify URL that no longer matches your current deployment URL.

## Solution

Update the CORS_ORIGINS environment variable in Railway to include the correct Netlify URL.

### Step 1: Update Railway Environment Variables

1. Go to Railway dashboard: https://railway.app
2. Select your project: `web-production-2d722`
3. Click on the **Variables** tab
4. Find the `CORS_ORIGINS` variable
5. Update it to include your current Netlify URL:

```
https://precious-lily-eed7a8.netlify.app,https://www.precious-lily-eed7a8.netlify.app,https://fetcha.weather,https://www.fetcha.weather,https://api.fetcha.net
```

**Important:** Make sure there are NO spaces between the URLs, only commas.

6. Click **Save** or **Deploy** to apply the changes
7. Railway will automatically redeploy your backend with the new CORS settings

### Step 2: Verify the Fix

1. Wait for Railway to finish redeploying (usually 1-2 minutes)
2. Refresh your dashboard at: https://precious-lily-eed7a8.netlify.app/weather-dashboard.html
3. The API keys section should now load successfully

### Step 3: Test API Key Generation

1. Click the "Generate New API Key" button
2. You should see a new API key created
3. The key should appear in your API keys list

## Alternative: Quick Railway Update via CLI

If you have the Railway CLI installed:

```bash
cd /Users/willsimpson/Documents/Weather_Data_API/03_Website/backend
railway variables set CORS_ORIGINS="https://precious-lily-eed7a8.netlify.app,https://www.precious-lily-eed7a8.netlify.app,https://fetcha.weather,https://www.fetcha.weather,https://api.fetcha.net"
```

## Expected Behavior After Fix

✅ Dashboard loads user information  
✅ Usage statistics display correctly  
✅ API keys list loads without errors  
✅ Can generate new API keys  
✅ Can view, edit, and delete existing API keys  
✅ Recent queries display properly

## Additional Notes

### Why This Happened

Netlify generates unique URLs for each deployment. When you made a new deployment, Netlify created a new subdomain, but the Railway backend still had the old URL in its CORS whitelist.

### Preventing Future Issues

1. **Use Custom Domain**: Once you set up a custom domain (e.g., `app.fetcha.weather`), this won't happen as the domain stays constant
2. **Wildcard Subdomain**: You could use a wildcard for Netlify previews, but this reduces security
3. **Update Together**: When redeploying frontend, remember to check/update backend CORS if URL changes

### Netlify URL Pattern

Netlify URLs follow this pattern:
- Main deployment: `https://[site-name].netlify.app`
- Deploy previews: `https://[deploy-id]--[site-name].netlify.app`

Your current deployment is the main one, so the URL should remain stable unless you change the site name.

## Troubleshooting

### If API Keys Still Don't Load

1. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Check Console tab for CORS errors
   - Verify the exact URL being blocked

2. **Verify Railway Deployment:**
   - Check Railway logs for errors
   - Confirm the new environment variable was applied
   - Look for "DEBUG: CORS_ORIGINS" in the logs

3. **Clear Browser Cache:**
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Or clear browser cache completely

4. **Test Backend Directly:**
   ```bash
   curl -X OPTIONS \
     -H "Origin: https://precious-lily-eed7a8.netlify.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Authorization" \
     -v \
     https://web-production-2d722.up.railway.app/api/keys
   ```
   
   You should see `Access-Control-Allow-Origin` in the response headers.

### If You Still Have Issues

Check if the frontend config is correct:

```javascript
// In 03_Website/frontend/js/config.js
const API_BASE_URL = 'https://web-production-2d722.up.railway.app/api';
```

This should match your Railway backend URL.

## Success Indicators

When everything is working:
- No CORS errors in browser console
- API keys list loads with "✅ Loaded X API keys"
- Can click "Generate New API Key" button
- Modal opens and key is created successfully
- Recent queries display data

---

**Last Updated:** 2025-11-01 12:52 AEST (Brisbane)
