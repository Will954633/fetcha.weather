# Railway Deployment Guide for Fetcha Weather
**Version: v1.0 • Updated: 2025-10-28 18:53 AEST (Brisbane)**

---

## 🚂 Why Railway?

Railway is perfect for this MVP:
- **$5/month** (cheaper than VPS at $12/month)
- **Zero DevOps** - No server management needed
- **Auto-scaling** - Handles traffic spikes automatically
- **Built-in CI/CD** - Deploy from Git commits
- **Free SSL** - Automatic HTTPS
- **PostgreSQL included** - Can upgrade from SQLite easily

---

## 📦 Railway Project Structure

```
Railway Project: fetcha-weather
├── Backend Service (Python/Flask)
│   ├── Auto-deploy from Git
│   ├── Environment variables configured
│   └── Custom domain: api.weather.fetcha.com
│
└── PostgreSQL Database (Optional - start with SQLite)
    └── Upgrade when needed
```

---

## 🚀 Deployment Steps

### Step 1: Prepare Backend for Railway

**Create `railway.json` in backend folder:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "gunicorn app:app",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Update `requirements.txt`:**
```txt
Flask==3.0.0
Flask-CORS==4.0.0
gunicorn==21.2.0
python-dotenv==1.0.0
PyJWT==2.8.0
bcrypt==4.1.2
requests==2.31.0
beautifulsoup4==4.12.2
playwright==1.40.0
```

**Create `Procfile`:**
```
web: gunicorn app:app --bind 0.0.0.0:$PORT
```

### Step 2: Set Up Railway Project

1. **Go to Railway.app**
   - Sign up/login with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your Weather_Data_API repository

3. **Configure Service**
   - Root directory: `03_Website/backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `gunicorn app:app`

4. **Set Environment Variables**
   ```
   PORT=8000
   SECRET_KEY=your-secret-key-here
   JWT_SECRET=your-jwt-secret-here
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   EMAIL_USER=your-google-business-email
   EMAIL_PASSWORD=your-app-password
   FRONTEND_URL=https://weather.fetcha.com
   DATABASE_URL=sqlite:///weather.db
   ```

### Step 3: Configure Custom Domain

1. **Add Custom Domain in Railway**
   - Go to service settings
   - Click "Add Custom Domain"
   - Enter: `api.weather.fetcha.com`

2. **Update DNS Records**
   In your domain provider (where fetcha.com is registered):
   ```
   Type: CNAME
   Name: api.weather
   Value: [provided by Railway]
   TTL: 3600
   ```

3. **Wait for DNS Propagation**
   - Usually takes 5-30 minutes
   - Railway will auto-provision SSL certificate

### Step 4: Deploy Frontend

**Option A: Netlify (Recommended for MVP)**
1. Connect GitHub repo
2. Build settings:
   - Base directory: `03_Website/frontend`
   - Build command: (none needed)
   - Publish directory: `03_Website/frontend`
3. Custom domain: `weather.fetcha.com`

**Option B: Vercel**
1. Import project from GitHub
2. Root directory: `03_Website/frontend`
3. Framework: None (static)
4. Custom domain: `weather.fetcha.com`

### Step 5: Update Frontend API Endpoint

In all frontend JavaScript files, update:
```javascript
const API_BASE_URL = 'https://api.weather.fetcha.com';
```

---

## 💰 Railway Pricing

### Hobby Plan ($5/month)
- 512 MB RAM
- 1 GB disk
- Shared CPU
- Perfect for MVP (100-1000 users)

### Pro Plan ($20/month - if needed later)
- 8 GB RAM
- 100 GB disk
- Dedicated resources
- For scaling beyond MVP

**Cost Comparison:**
- Railway: $5/month + Netlify Free = **$5/month total**
- VPS: $12/month + management time = **$12/month + complexity**

**Railway saves $7/month and eliminates DevOps!**

---

## 🔧 Railway Configuration Files

### `railway.toml`
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "gunicorn app:app --bind 0.0.0.0:$PORT"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10

[env]
PORT = "8000"
```

### `nixpacks.toml`
```toml
[phases.setup]
nixPkgs = ["python39", "playwright-driver"]

[phases.install]
cmds = ["pip install -r requirements.txt"]

[phases.build]
cmds = ["playwright install chromium"]

[start]
cmd = "gunicorn app:app --bind 0.0.0.0:$PORT"
```

---

## 🐛 Troubleshooting

### Issue: App crashes on startup
**Solution:** Check Railway logs for Python errors
```bash
# In Railway dashboard, click "Deployments" → "View Logs"
```

### Issue: Database not persisting
**Solution:** Railway's disk is ephemeral. For production:
1. Add Railway PostgreSQL plugin
2. Update DATABASE_URL in environment variables
3. Migrate from SQLite to PostgreSQL

### Issue: Playwright not working
**Solution:** Add to `requirements.txt`:
```txt
playwright==1.40.0
```
Then in Railway dashboard: "Settings" → "Redeploy"

### Issue: Slow cold starts
**Solution:** Railway's Hobby plan has cold starts. Options:
1. Upgrade to Pro plan ($20/month - always on)
2. Use UptimeRobot to ping every 5 minutes (keep warm)

---

## 📊 Monitoring

### Railway Built-in Metrics
- CPU usage
- Memory usage
- Network traffic
- Response times

### Additional Monitoring (Optional)
- **UptimeRobot**: Monitor uptime (free)
- **Sentry**: Error tracking (free tier)
- **LogTail**: Log aggregation (Railway integration)

---

## 🔄 CI/CD Workflow

Railway automatically deploys when you push to GitHub:

```bash
# Local development
git add .
git commit -m "Update feature"
git push origin main

# Railway automatically:
# 1. Detects push
# 2. Builds new version
# 3. Runs tests (if configured)
# 4. Deploys to production
# 5. Zero downtime swap
```

---

## 🎯 Production Checklist

### Before Launch
- [ ] Environment variables set in Railway
- [ ] Custom domain configured (api.weather.fetcha.com)
- [ ] SSL certificate active (auto by Railway)
- [ ] Frontend deployed (weather.fetcha.com)
- [ ] Frontend API URL updated to Railway domain
- [ ] Health check endpoint working
- [ ] Email service configured (Google Business)
- [ ] Database initialized
- [ ] Test signup flow end-to-end
- [ ] Test weather API query end-to-end

### After Launch
- [ ] Monitor Railway dashboard for errors
- [ ] Check response times
- [ ] Verify email delivery
- [ ] Monitor disk usage
- [ ] Set up UptimeRobot pings
- [ ] Configure error alerting

---

## 🚀 Scaling Strategy

### When to Scale

**Stay on Hobby ($5/month) while:**
- < 1,000 users
- < 10,000 requests/day
- < 500 MB database

**Upgrade to Pro ($20/month) when:**
- > 1,000 active users
- > 50,000 requests/day
- Need guaranteed uptime
- Need more resources

**Consider PostgreSQL when:**
- > 1 GB data
- Need advanced queries
- Multiple concurrent users
- Want automated backups

---

## 💡 Railway Advantages for MVP

1. **No Server Management**
   - Railway handles OS updates
   - Security patches automatic
   - Zero DevOps knowledge needed

2. **Git-based Deployment**
   - Push to deploy
   - Automatic rollbacks if deploy fails
   - Preview environments for branches

3. **Built-in Monitoring**
   - See metrics in dashboard
   - Log streaming
   - Performance insights

4. **Cost Effective**
   - $5/month vs $12/month VPS
   - Scales only when needed
   - No wasted resources

5. **Developer Experience**
   - Simple configuration
   - Fast deployments
   - Easy debugging

---

## 📞 Support

### Railway Support
- Documentation: https://docs.railway.app
- Community: https://discord.gg/railway
- Status: https://railway.statuspage.io

### Our Support
- Email: support@fetcha.com
- Deployment issues: Check Railway logs first
- DNS issues: Verify CNAME records

---

**Next Steps:**
1. Sign up for Railway account
2. Connect GitHub repository
3. Follow deployment steps above
4. Launch in hours, not days!

---

**Document Version**: v1.0  
**Created**: 2025-10-28 18:53 AEST (Brisbane)  
**Railway Pricing**: $5/month (Hobby)  
**Status**: READY TO DEPLOY
