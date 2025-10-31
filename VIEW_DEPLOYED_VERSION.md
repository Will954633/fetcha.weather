# How to View Your Railway Deployment

## Current Deployment Status

Based on your setup:
- ✅ **Backend (API)**: Deployed on Railway
- ❌ **Frontend (Website)**: NOT yet deployed - only exists locally

## Finding Your Railway Backend URL

1. **Go to Railway Dashboard**
   - Visit: https://railway.app/dashboard
   - Find your `fetcha-weather` project
   - Click on the backend service

2. **Get the Public URL**
   - In the service details, look for "Domains"
   - You'll see something like: `fetcha-weather-production.up.railway.app`
   - This is your backend API URL

3. **Test Your Backend**
   ```bash
   # Replace with your actual Railway URL
   curl https://your-app.up.railway.app/health
   ```
   
   Should return:
   ```json
   {
     "status": "healthy",
     "timestamp": "2025-10-31T...",
     "version": "1.0.0"
   }
   ```

## Why You Can't View the Website Yet

Your Railway deployment ONLY includes the backend API server. The frontend (HTML/CSS/JS files) needs to be deployed separately.

### Current Architecture
```
Railway (Backend Only)
└── Flask API server
    └── Endpoints: /api/auth, /api/keys, /api/weather
    
❌ Frontend is missing!
```

### What You Need
```
Netlify/Vercel (Frontend)          Railway (Backend)
└── HTML/CSS/JavaScript      ──→   └── Flask API
    └── login.html                     └── /api/auth/signup
    └── index.html                     └── /api/weather
```

## Quick Deploy Frontend to Netlify (5 Minutes)

### Option 1: Netlify (Recommended - Easiest)

1. **Sign up for Netlify**
   - Go to: https://www.netlify.com
   - Sign up with your GitHub account

2. **Deploy Frontend**
   - Click "Add new site" → "Import an existing project"
   - Choose your `Weather_Data_API` repository
   - Configure:
     ```
     Base directory: 03_Website/frontend
     Build command: (leave empty)
     Publish directory: 03_Website/frontend
     ```
   - Click "Deploy site"

3. **Get Your Frontend URL**
   - Netlify will give you a URL like: `your-site-name.netlify.app`
   - You can customize this or use a custom domain

4. **Update Frontend Config**
   - In your local `03_Website/frontend/js/config.js`, update:
     ```javascript
     // Replace the production section
     } else if (hostname.includes('netlify.app')) {
       // Production on Netlify
       apiBase = 'https://your-railway-app.up.railway.app/api';
     ```
   
5. **Push Changes & Redeploy**
   ```bash
   cd 03_Website
   git add frontend/js/config.js
   git commit -m "Update API URL for Railway backend"
   git push
   ```
   
   Netlify will auto-deploy the update.

### Option 2: Serve Frontend from Railway (Single Service)

If you want everything on Railway:

1. **Update Dockerfile** to serve both backend and frontend:
   ```dockerfile
   # Add frontend files
   COPY frontend /app/frontend
   
   # Update start command to serve static files
   CMD gunicorn app:app --bind 0.0.0.0:$PORT
   ```

2. **Update Flask app** to serve frontend:
   ```python
   # In app.py
   from flask import send_from_directory
   
   @app.route('/')
   def index():
       return send_from_directory('../frontend', 'index.html')
   
   @app.route('/<path:path>')
   def serve_static(path):
       return send_from_directory('../frontend', path)
   ```

## Accessing Your Deployed Version

### Once Frontend is Deployed:

1. **Frontend URL**: `https://your-site.netlify.app`
   - Visit `/login.html` to test signup
   - Visit `/index.html` for main page
   - Visit `/weather-dashboard.html` for dashboard

2. **Backend URL**: `https://your-app.up.railway.app`
   - This handles all API requests
   - Test: `https://your-app.up.railway.app/health`

## Environment Variables Needed

Make sure these are set in Railway:

```env
# Required
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
FLASK_ENV=production

# Optional but recommended
CORS_ORIGINS=https://your-site.netlify.app
FRONTEND_URL=https://your-site.netlify.app
```

## Testing the Deployed Version

1. **Open Frontend**: Go to `https://your-site.netlify.app/login.html`

2. **Open Developer Tools** (F12)

3. **Try to Sign Up**
   - Should see API request to Railway backend
   - Should NOT see CORS errors
   - Should see successful account creation

4. **Check Console Logs**
   ```
   Environment detected: your-site.netlify.app
   API Base URL: https://your-railway-app.up.railway.app/api
   ```

## Common Issues

### Issue: "Failed to fetch" on deployed site
**Cause**: CORS not configured for your frontend domain
**Fix**: Add your Netlify URL to CORS_ORIGINS in Railway

### Issue: Can't find Railway URL
**Solution**: 
1. Go to Railway dashboard
2. Click your service
3. Look for "Settings" → "Domains"
4. Use the provided `*.up.railway.app` URL

### Issue: Frontend showing old code
**Solution**: 
1. Clear browser cache (Ctrl+Shift+R)
2. Or open in incognito mode

## Quick Status Check Script

```bash
# Save this as check_deployment.sh
#!/bin/bash

RAILWAY_URL="https://your-app.up.railway.app"
FRONTEND_URL="https://your-site.netlify.app"

echo "Checking Railway Backend..."
curl -s "$RAILWAY_URL/health" | jq

echo "Checking Frontend..."
curl -I "$FRONTEND_URL" | grep HTTP

echo "Testing CORS..."
curl -H "Origin: $FRONTEND_URL" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     "$RAILWAY_URL/api/auth/signup" -v
```

## Next Steps

1. ✅ Backend is already on Railway
2. 🔄 Deploy frontend to Netlify (5 minutes)
3. 🔄 Update frontend config with Railway URL
4. 🔄 Update Railway CORS to allow Netlify domain
5. ✅ Test the deployed version

---

**Need Help?**
- Check Railway logs: Railway Dashboard → Your Service → Logs
- Check Netlify logs: Netlify Dashboard → Your Site → Deploys
- Test locally first to ensure everything works
