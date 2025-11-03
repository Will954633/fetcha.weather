# Add Google Client ID to Railway - URGENT FIX

**Issue:** Backend returns "Google authentication is not properly configured"

**Root Cause:** The `GOOGLE_CLIENT_ID` environment variable is not set in Railway

## Quick Fix Steps

### Option 1: Railway Dashboard (Recommended)

1. Go to [Railway Dashboard](https://railway.app)
2. Select your backend project (web-production-2d722 or similar)
3. Click on the **Variables** tab
4. Click **+ New Variable**
5. Add:
   - **Variable Name:** `GOOGLE_CLIENT_ID`
   - **Value:** `400382614619-fbe3daa832pmmf1od3u2bdjjs0gcqgvl.apps.googleusercontent.com`
6. Click **Add**
7. Railway will automatically redeploy your backend

### Option 2: Railway CLI (If installed)

```bash
cd 03_Website/backend
railway variables set GOOGLE_CLIENT_ID=400382614619-fbe3daa832pmmf1od3u2bdjjs0gcqgvl.apps.googleusercontent.com
```

## Verify the Fix

1. Wait for Railway to finish redeploying (usually 1-2 minutes)
2. Go to https://fetcha.net/login.html
3. Click "Continue with Google"
4. You should now see the Google account picker
5. Sign in successfully

## What Was the Problem?

The frontend was correctly configured, but the backend needed the `GOOGLE_CLIENT_ID` environment variable to validate Google tokens. Without it, the backend returns:

```
Error: Google authentication is not properly configured
```

Once you add the variable to Railway, Google OAuth will work immediately!
