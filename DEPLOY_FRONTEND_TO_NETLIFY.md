# Deploy Frontend to Netlify - Complete Guide

## 🎯 Current Status

✅ **Backend on Railway**: https://web-production-2d722.up.railway.app
✅ **Frontend configured** to connect to Railway backend
✅ **CORS updated** to allow Netlify deployments
✅ **Changes pushed** to GitHub

**Now deploying the frontend takes 5 minutes!**

---

## 🚀 Deploy to Netlify (5 Minutes)

### Step 1: Sign Up for Netlify

1. Go to **https://www.netlify.com**
2. Click **"Sign up"**
3. Choose **"Sign up with GitHub"** (easiest option)
4. Authorize Netlify to access your GitHub repositories

### Step 2: Create New Site

1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **"Deploy with GitHub"**
3. Select your repository: **`fetcha.weather`** (or whatever you named it)

### Step 3: Configure Build Settings

**Important:** Netlify needs to know where your frontend files are

1. **Base directory**: `03_Website/frontend`
2. **Build command**: (leave empty - no build needed)
3. **Publish directory**: `03_Website/frontend`

Click **"Deploy site"**

### Step 4: Wait for Deployment (30 seconds)

Netlify will:
- Clone your repository
- Find the frontend folder
- Deploy your HTML/CSS/JS files
- Assign you a URL

### Step 5: Get Your Site URL

Once deployed, you'll see:
```
https://YOUR-SITE-NAME.netlify.app
```

Example: `https://fetcha-weather-xyz123.netlify.app`

---

## ✅ Test Your Deployed Site

### 1. Open the Login Page

Visit: `https://YOUR-SITE.netlify.app/login.html`

### 2. Open Browser DevTools

Press `F12` or Right-click → Inspect

### 3. Check Console Logs

You should see:
```
Environment detected: YOUR-SITE.netlify.app
API Base URL: https://web-production-2d722.up.railway.app/api
```

### 4. Try to Sign Up

1. Click "Sign Up" tab
2. Enter your details
3. Click "Create Account"
4. You should see: **"Account created successfully!"**

### 5. If You See Errors

**CORS Error?**
- Railway needs to be updated with your Netlify URL
- Go to Railway → Variables → Add:
  ```
  CORS_ORIGINS=https://YOUR-SITE.netlify.app
  ```

**"Failed to fetch"?**
- Check Railway backend is running: `https://web-production-2d722.up.railway.app/health`
- Check browser console for actual error

---

## 🎨 Customize Your Netlify URL (Optional)

### Change Site Name

1. In Netlify dashboard, go to **Site settings**
2. Click **"Change site name"**
3. Enter something like: `fetcha-weather`
4. Your URL becomes: `https://fetcha-weather.netlify.app`

### Add Custom Domain (Later)

1. Buy domain (e.g., `fetcha.com`)
2. In Netlify: **Domain settings** → **Add custom domain**
3. Update DNS records as instructed
4. Get free SSL automatically

---

## 🔄 Auto-Deploy on Git Push

**Best Part:** Netlify automatically redeploys when you push to GitHub!

```bash
# Make changes to your code
cd 03_Website/frontend
vim login.html  # Edit any file

# Commit and push
git add .
git commit -m "Update login page"
git push

# Netlify automatically:
# 1. Detects the push
# 2. Rebuilds your site
# 3. Deploys new version
# Wait 30 seconds and your changes are live!
```

---

## 📊 Netlify Dashboard Features

### Deploys Tab
- See all deployments
- Rollback to previous versions
- Preview deploy logs

### Site Settings
- Environment variables (if needed)
- Build settings
- Domain configuration

### Functions (Advanced)
- Serverless functions
- Not needed for our MVP

---

## 🐛 Troubleshooting

### Issue: "Page not found" on deployment

**Cause**: Wrong publish directory

**Fix**: In Netlify → Site settings → Build & deploy:
```
Base directory: 03_Website/frontend
Publish directory: 03_Website/frontend
```

### Issue: CORS errors in production

**Cause**: Railway doesn't allow your Netlify domain

**Fix**: Update Railway environment variable:
```
CORS_ORIGINS=https://your-site.netlify.app,https://web-production-2d722.up.railway.app
```

### Issue: Old code showing after deploy

**Cause**: Browser cache

**Fix**: Hard refresh (Ctrl+Shift+R) or clear cache

### Issue: Can't find repository

**Cause**: Netlify doesn't have access

**Fix**:
1. Netlify → Configure GitHub app
2. Grant access to your repository

---

## 🎯 Complete Deployment Checklist

### Backend (Railway) ✅
- [x] Backend deployed at: https://web-production-2d722.up.railway.app
- [x] Health endpoint working
- [x] Database connected (PostgreSQL)
- [x] Environment variables set
- [x] CORS configured for Netlify

### Frontend (Netlify) 🔄
- [ ] Sign up for Netlify
- [ ] Import GitHub repository
- [ ] Configure build settings
- [ ] Deploy site
- [ ] Get Netlify URL
- [ ] Test signup/login
- [ ] Verify API connection

### Post-Deployment
- [ ] Test all pages (index, login, dashboard, docs)
- [ ] Test signup flow end-to-end
- [ ] Test login flow
- [ ] Test API key generation
- [ ] Test weather data queries
- [ ] Set up monitoring (optional)

---

## 🌐 Your Live URLs

Once deployed, you'll have:

**Frontend (Netlify)**:
```
https://YOUR-SITE.netlify.app
├── /index.html (Homepage)
├── /login.html (Sign up/Login)
├── /weather-dashboard.html (Dashboard)
├── /docs.html (API Documentation)
├── /terms.html (Terms of Service)
└── /privacy.html (Privacy Policy)
```

**Backend (Railway)**:
```
https://web-production-2d722.up.railway.app
├── /health (Health check)
├── /api (API info)
├── /api/auth/* (Authentication)
├── /api/keys/* (API keys)
├── /api/weather/* (Weather data)
└── /api/usage/* (Usage statistics)
```

---

## 📈 What's Next?

1. **Deploy to Netlify** (5 minutes)
2. **Test everything** (10 minutes)
3. **Share with users!**

### Future Improvements
- Custom domain (fetcha.com)
- Email verification (SendGrid)
- Payment integration (Stripe)
- Analytics (Google Analytics)
- Error tracking (Sentry)

---

## 💰 Costs

- **Netlify**: FREE (up to 100GB bandwidth/month)
- **Railway**: ~$5/month
- **Total**: ~$5/month for MVP

---

**Ready? Go deploy on Netlify now!**

Once deployed, reply with your Netlify URL and I'll help with any final configurations!
