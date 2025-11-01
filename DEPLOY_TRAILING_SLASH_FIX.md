# Deploy Trailing Slash Fix to Railway

**Version:** v1.0 • **Updated:** 2025-11-01 13:50 AEST (Brisbane)

## Problem Fixed

Flask was redirecting `/api/keys` to `/api/keys/` (adding a trailing slash), which broke CORS preflight requests. I've added `app.url_map.strict_slashes = False` to prevent this.

## Deployment Options

### Option 1: Push via Git (Recommended)

If your project is connected to a GitHub repository:

```bash
cd /Users/willsimpson/Documents/Weather_Data_API/03_Website

# Add the changes
git add backend/app.py backend/.env.production

# Commit
git commit -m "Fix CORS issue: disable strict slashes in Flask"

# Push to trigger Railway deployment
git push origin main
```

Railway will automatically detect the push and redeploy.

### Option 2: Railway CLI

If you have Railway CLI installed:

```bash
cd /Users/willsimpson/Documents/Weather_Data_API/03_Website/backend

# Deploy directly
railway up
```

### Option 3: Manual File Update (If above don't work)

1. Go to Railway dashboard: https://railway.app
2. Find your project: `web-production-2d722`
3. Click on "Deployments" tab
4. Click "Manual Deploy" or "Redeploy"
5. Railway will pull latest code from your repo

### Option 4: Copy File Manually

If the project isn't connected to Git:

1. In Railway, go to your project's "Settings"
2. Look for "Deploy Trigger" or check if there's a way to upload files
3. You may need to set up GitHub integration first

## After Deployment

1. **Wait for deployment** to complete (1-3 minutes)
2. **Check Railway logs** for the message: `DEBUG: CORS_ORIGINS = ...`
3. **Test the fix:**
   - Refresh your dashboard: https://precious-lily-eed7a8.netlify.app/weather-dashboard.html
   - The API keys section should load without errors
   - You should be able to generate new API keys

## What Changed

In `backend/app.py`, I added one line:

```python
def create_app(config_name=None):
    app = Flask(__name__)
    
    # Disable strict slashes to prevent redirects that break CORS preflight
    app.url_map.strict_slashes = False  # <-- THIS LINE
    
    # ... rest of the code
```

This tells Flask to accept both `/api/keys` and `/api/keys/` without redirecting.

## Verification

Test with curl to confirm no more redirects:

```bash
curl -I "https://web-production-2d722.up.railway.app/api/keys" \
  -H "Origin: https://precious-lily-eed7a8.netlify.app"
```

You should see:
- ✅ `HTTP/2 200` (not 308)
- ✅ `access-control-allow-origin: https://precious-lily-eed7a8.netlify.app`
- ❌ No `location:` header (no redirect)

## If You Can't Deploy

Let me know and I can help you set up Git/GitHub integration with Railway, or we can explore other deployment options.
