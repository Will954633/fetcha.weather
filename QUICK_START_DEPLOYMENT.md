# 🚀 Quick Start: Deploy Fetcha Weather to Railway
**Your Setup:** Railway + GitHub + fetcha.net domain  
**Target:** fetcha.weather (website) + api.fetcha.net (backend)

---

## ✅ What You Have

- [x] Railway account
- [x] Domain: fetcha.net
- [x] GitHub repo: git@github.com:Will954633/fetcha.weather.git
- [x] Code ready to deploy

---

## 🎯 Deployment Steps (30 minutes)

### Step 1: Generate Security Keys (2 minutes)

Open terminal and run:
```bash
# Generate SECRET_KEY
python3 -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))"

# Generate JWT_SECRET_KEY  
python3 -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_urlsafe(32))"
```

**Save these keys** - you'll need them in Step 4.

---

### Step 2: Push Code to GitHub (5 minutes)

```bash
# Navigate to project
cd 03_Website

# Initialize git (if not already done)
git init

# Add remote
git remote add origin git@github.com:Will954633/fetcha.weather.git

# Stage all files
git add .

# Commit
git commit -m "Initial deployment - Phase 1 complete"

# Push to GitHub
git push -u origin main
```

---

### Step 3: Create Railway Project (3 minutes)

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose: `Will954633/fetcha.weather`
5. Railway will detect the project automatically

**Root Directory:** Set to `03_Website` in Railway settings

---

### Step 4: Add PostgreSQL Database (2 minutes)

1. In your Railway project, click **"New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Wait 2-3 minutes for provisioning
4. Railway automatically sets `DATABASE_URL`

---

### Step 5: Configure Environment Variables (5 minutes)

In Railway project → **Variables** tab, add these:

```bash
# Flask Configuration
FLASK_ENV=production
SECRET_KEY=<paste-your-generated-secret-key>
JWT_SECRET_KEY=<paste-your-generated-jwt-secret>

# CORS - Update after domain setup
ALLOWED_ORIGINS=https://fetcha.weather,https://www.fetcha.weather,https://api.fetcha.net

# Server
PORT=5000
PYTHONUNBUFFERED=1

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/app.log

# Database (auto-set by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

**Click "Deploy"** - Railway will automatically deploy!

---

### Step 6: Verify Deployment (2 minutes)

Railway will provide a URL like: `https://your-app.up.railway.app`

Test the health endpoint:
```bash
curl https://your-app.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-31T16:00:00+10:00",
  "version": "1.0.0"
}
```

✅ **Backend is live!**

---

### Step 7: Configure Domain (10 minutes)

#### A. Set up API subdomain (api.fetcha.net)

**In Railway:**
1. Go to Settings → **Domains**
2. Click **"Add Domain"**
3. Enter: `api.fetcha.net`
4. Railway shows DNS instructions

**In your DNS provider (where fetcha.net is registered):**

Add this CNAME record:
```
Type: CNAME
Name: api
Value: <your-app>.up.railway.app
TTL: 3600
```

Wait 5-10 minutes for DNS propagation + SSL certificate generation.

#### B. Set up main website (fetcha.weather)

**Option 1: Netlify (Recommended - Free)**

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Deploy frontend:
```bash
cd 03_Website/frontend
netlify deploy --prod
```

3. Follow prompts:
   - Create new site
   - Publish directory: `.` (current directory)
   - Site name: `fetcha-weather`

4. Netlify will give you a URL like: `fetcha-weather.netlify.app`

**In your DNS provider:**

Add CNAME for fetcha.weather:
```
Type: CNAME
Name: weather.fetcha (or @ if using fetcha.weather as root)
Value: fetcha-weather.netlify.app
TTL: 3600
```

**In Netlify dashboard:**
- Go to Domain settings
- Add custom domain: `fetcha.weather`
- Netlify auto-provisions SSL

**Option 2: Railway Static Site**

1. Create new Railway service
2. Connect same GitHub repo
3. Set root directory: `03_Website/frontend`
4. Add domain: `fetcha.weather`

---

### Step 8: Update Frontend API URL (3 minutes)

Once your backend is at `api.fetcha.net`, update frontend files:

**Files to update:**
- `frontend/js/weather-auth.js`
- `frontend/js/weather-dashboard.js`

Change:
```javascript
const API_BASE_URL = 'http://localhost:5000';
```

To:
```javascript
const API_BASE_URL = 'https://api.fetcha.net';
```

Commit and push:
```bash
git add .
git commit -m "Update API URL to production"
git push
```

Railway auto-deploys the update!

---

### Step 9: Initialize Database (2 minutes)

SSH into Railway to initialize the database:

```bash
railway run python backend/database/init_db.py
```

Or use Railway's web console to run this command.

---

### Step 10: Final Testing (5 minutes)

#### Test Backend:
```bash
# Health check
curl https://api.fetcha.net/health

# API info
curl https://api.fetcha.net/api

# Register user
curl -X POST https://api.fetcha.net/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'
```

#### Test Frontend:
1. Visit: https://fetcha.weather
2. Click "Sign Up"
3. Create account
4. Generate API key
5. Test weather endpoint from dashboard

✅ **Everything is live!**

---

## 🎉 You're Done!

Your Fetcha Weather API is now live at:
- **Website:** https://fetcha.weather
- **API:** https://api.fetcha.net
- **Docs:** https://fetcha.weather/docs.html

---

## 📊 Monitor Your Deployment

### Railway Dashboard
- View logs: `railway logs --follow`
- Monitor metrics: CPU, memory, requests
- Check deployments: Each git push triggers auto-deploy

### Quick Commands
```bash
# View logs
railway logs

# Connect to database
railway connect postgres

# Run commands in production
railway run <command>

# View environment variables
railway variables
```

---

## 🐛 Troubleshooting

**Backend not responding?**
```bash
railway logs
```
Look for errors in startup or database connection.

**Frontend can't reach API?**
- Check CORS settings in Railway variables
- Verify API_BASE_URL in frontend JS files
- Check DNS propagation: `dig api.fetcha.net`

**Database errors?**
```bash
railway run python backend/database/init_db.py
```

**SSL certificate pending?**
Wait 5-10 minutes after adding custom domain.

---

## 💰 Expected Costs

- **Railway Developer:** $5/month
- **PostgreSQL Starter:** $5/month  
- **Netlify (frontend):** FREE
- **Domain (fetcha.net):** Already paid
- **Total: $10/month**

---

## 🔄 Future Deployments

After initial setup, deployments are automatic:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push

# Railway auto-deploys backend
# Netlify auto-deploys frontend
```

That's it! Zero-downtime deployments.

---

## 📈 Next Steps After Launch

1. **Monitor for 24 hours**
   - Watch Railway logs
   - Check for errors
   - Monitor signup rate

2. **Share with beta users**
   - Send email announcements
   - Get feedback

3. **Plan Phase 2** (2-4 weeks later)
   - Stripe integration
   - Paid Pro tier ($29/month)
   - Billing dashboard

---

## 🎯 Domain Strategy for Your Brand

You now have the foundation for the **Fetcha Data Platform**:

```
fetcha.net (root domain)
├── fetcha.weather (this project) ✅
├── api.fetcha.net (unified API)
├── fetcha.property (future)
└── fetcha.economic (future)
```

This positions you perfectly for a multi-product data platform!

---

**Ready to deploy? Start with Step 1! 🚀**
