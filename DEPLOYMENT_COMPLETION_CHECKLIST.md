# 🚀 Fetcha Weather Deployment Completion Checklist
**Version:** v1.0 • Updated: 2025-01-11 19:57 AEST (Brisbane)

---

## 📊 Current Deployment Status

### ✅ COMPLETED (Backend Infrastructure)
- [x] Backend code deployed to Railway
- [x] Security keys generated (SECRET_KEY, JWT_SECRET_KEY)
- [x] Git repository initialized
- [x] Production environment files created
- [x] Railway auto-deploy configured
- [x] CORS configuration for production
- [x] Database models and migrations ready
- [x] Email verification system coded
- [x] API endpoints fully functional
- [x] Weather data integration working

### ❌ NOT COMPLETED (Critical for Launch)
- [ ] Frontend deployed to hosting platform
- [ ] Custom domain connected (fetcha.weather or fetcha.com)
- [ ] DNS records configured
- [ ] PostgreSQL database provisioned (currently using SQLite)
- [ ] Database initialized in production
- [ ] Email service verified in production
- [ ] SSL certificates verified
- [ ] End-to-end testing on production
- [ ] Monitoring and alerting configured

---

## 🎯 REMAINING TASKS TO GO LIVE

### PHASE 1: Deploy Frontend (15 minutes)

#### Option A: Netlify (Recommended - Free Tier)

**Step 1: Create Netlify Account**
1. Go to https://www.netlify.com
2. Sign up with GitHub account
3. Verify email

**Step 2: Deploy Frontend**
```bash
# No commands needed - use Netlify UI
```

1. Click "Add new site" → "Import an existing project"
2. Choose GitHub
3. Select your repository: `Weather_Data_API`
4. Configure build settings:
   - **Base directory**: `03_Website/frontend`
   - **Build command**: (leave empty - static site)
   - **Publish directory**: `03_Website/frontend`
5. Click "Deploy site"

**Step 3: Get Your Netlify URL**
- You'll receive: `random-name-12345.netlify.app`
- Can customize to: `fetcha-weather.netlify.app`

#### Option B: Vercel (Alternative)

```bash
cd 03_Website/frontend
npm install -g vercel
vercel --prod
```

---

### PHASE 2: Configure Production API URL (5 minutes)

**Update frontend configuration:**

<read_file>
<path>03_Website/frontend/js/config.js</path>
</read_file>

You need to:
1. Find your Railway backend URL:
   - Go to https://railway.app/dashboard
   - Click your project
   - Look for: `your-app.up.railway.app`

2. Update config.js with the Railway URL
3. Commit and push changes
4. Netlify will auto-redeploy

---

### PHASE 3: Domain & DNS Configuration (20 minutes)

#### A. Backend Domain (api.fetcha.weather or api.fetcha.com)

**In Railway:**
1. Go to your service → Settings → Networking
2. Click "Generate Domain" (free Railway subdomain)
3. OR add custom domain: `api.fetcha.weather`

**In Your Domain Registrar (where you bought fetcha.weather):**
```
Type: CNAME
Name: api
Value: your-app.up.railway.app (from Railway)
TTL: 3600
```

**Alternative if using fetcha.com:**
```
Type: CNAME
Name: api.weather
Value: your-app.up.railway.app
TTL: 3600
```

#### B. Frontend Domain (fetcha.weather or www.fetcha.weather)

**In Netlify:**
1. Site Settings → Domain Management
2. Click "Add custom domain"
3. Enter: `fetcha.weather` (or `www.fetcha.weather`)

**In Your Domain Registrar:**

For apex domain (fetcha.weather):
```
Type: A
Name: @
Value: 75.2.60.5 (Netlify's load balancer)
TTL: 3600
```

For www subdomain:
```
Type: CNAME
Name: www
Value: your-site.netlify.app
TTL: 3600
```

**DNS Propagation:**
- Wait 5-30 minutes
- Check with: `nslookup fetcha.weather`

---

### PHASE 4: Database Setup (10 minutes)

#### Current State: SQLite (File-based)
- Works for development
- **NOT recommended for production** (Railway's filesystem is ephemeral)

#### Recommended: PostgreSQL

**Step 1: Add PostgreSQL to Railway**
1. In Railway project dashboard
2. Click "New" → "Database" → "PostgreSQL"
3. Wait 2-3 minutes for provisioning
4. DATABASE_URL is auto-generated

**Step 2: Update Environment Variables**
In Railway → Variables tab:
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
```
(Railway auto-links this variable)

**Step 3: Initialize Database**
```bash
# Connect to Railway
railway link

# Run database initialization
railway run python backend/database/init_db.py
```

**Step 4: Verify**
```bash
railway run python -c "from backend.models.user import db; print(db.engine.url)"
```

---

### PHASE 5: Email Service Verification (5 minutes)

**Required Environment Variables in Railway:**
```env
EMAIL_USER=your-business-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

**App-Specific Password Setup:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Factor Authentication
3. Generate App Password for "Mail"
4. Copy the 16-character password
5. Add to Railway environment variables

**Test Email Service:**
```bash
railway run python backend/test_email.py
```

---

### PHASE 6: Final Environment Variables (Railway)

**Complete List for Railway:**
```env
# Flask Configuration
FLASK_ENV=production
SECRET_KEY=VskL9AbW1NZBa5P_9K1v5EEqyvmURi_6GbhIKvXUoJA
JWT_SECRET_KEY=6eZ6uBKmmmlKSI7NlN8oL5XAJlmnDNYdkxKWpk6PTNI

# Database (auto-configured when you add PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# CORS - UPDATE WITH YOUR ACTUAL DOMAINS
ALLOWED_ORIGINS=https://fetcha.weather,https://www.fetcha.weather,https://api.fetcha.weather

# Frontend URL - UPDATE WITH YOUR ACTUAL DOMAIN
FRONTEND_URL=https://fetcha.weather

# Email Service - ADD YOUR CREDENTIALS
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Server Configuration
PORT=5000
PYTHONUNBUFFERED=1
LOG_LEVEL=INFO
```

---

### PHASE 7: Production Testing (15 minutes)

**Test Checklist:**

1. **Health Check**
   ```bash
   curl https://api.fetcha.weather/health
   # Should return: {"status":"healthy"}
   ```

2. **User Signup**
   - Go to https://fetcha.weather/login.html
   - Create new account
   - Verify email is sent
   - Check email verification link works

3. **Login**
   - Login with created account
   - Verify redirect to dashboard
   - Check JWT token is set

4. **API Key Generation**
   - In dashboard, click "Generate API Key"
   - Verify key is created
   - Copy key for next test

5. **Weather API Test**
   ```bash
   curl -X POST https://api.fetcha.weather/api/weather \
     -H "Content-Type: application/json" \
     -H "X-API-Key: your-generated-key" \
     -d '{
       "location": "Launceston",
       "start_date": "2024-01-01",
       "end_date": "2024-01-07"
     }'
   ```

6. **CORS Test**
   - Open browser console on https://fetcha.weather
   - Perform API request
   - Verify no CORS errors

---

## 🔒 Security Checklist

Before going live:

- [ ] All secrets in Railway environment variables (not in code)
- [ ] `.env` files NOT committed to GitHub
- [ ] CORS properly configured with exact domains
- [ ] HTTPS enabled on all domains
- [ ] Email verification required for signup
- [ ] Rate limiting configured (if needed)
- [ ] SQL injection protection (using ORM - ✅ already done)
- [ ] XSS protection (Flask defaults - ✅)

---

## 📊 Monitoring & Maintenance

### Required Monitoring

1. **Uptime Monitoring**
   - Use UptimeRobot (free): https://uptimerobot.com
   - Monitor: `https://api.fetcha.weather/health`
   - Alert via email if down

2. **Railway Metrics**
   - Dashboard → Metrics tab
   - Watch: CPU, Memory, Network
   - Set up alerts for high usage

3. **Log Monitoring**
   ```bash
   # View live logs
   railway logs --follow
   ```

4. **Database Backups**
   - Railway PostgreSQL auto-backs up daily
   - Download manual backup: Railway Dashboard → Database → Backups

### Recommended (Optional)

- **Sentry** for error tracking (free tier)
- **Google Analytics** for usage stats
- **Hotjar** for user behavior (if needed)

---

## 💰 Monthly Costs

### Minimum Configuration (MVP)
- **Railway**: $5/month (Hobby plan)
- **PostgreSQL**: Included in Railway
- **Netlify**: $0/month (free tier)
- **Domain**: ~$12/year ($1/month)
- **Email**: $0 (using Gmail)

**Total: ~$6/month**

### With Custom Domain SSL
- Same as above
- SSL certificates FREE (auto-provisioned by Railway & Netlify)

**Total: ~$6/month**

---

## 🚨 Common Issues & Solutions

### Issue 1: "Failed to fetch" on frontend
**Cause**: CORS not configured correctly
**Fix**: 
1. Add exact frontend domain to ALLOWED_ORIGINS in Railway
2. Redeploy backend
3. Clear browser cache (Ctrl+Shift+R)

### Issue 2: Database not persisting
**Cause**: Using SQLite on Railway (ephemeral filesystem)
**Fix**: Migrate to PostgreSQL (see Phase 4 above)

### Issue 3: Emails not sending
**Cause**: Gmail App Password not configured
**Fix**: 
1. Enable 2FA on Google account
2. Generate App Password
3. Add to Railway environment variables
4. Restart service

### Issue 4: Domain not resolving
**Cause**: DNS propagation delay or incorrect records
**Fix**:
1. Wait up to 48 hours (usually 5-30 minutes)
2. Verify DNS with: `nslookup your-domain.com`
3. Check DNS records in registrar dashboard

### Issue 5: Railway build failing
**Cause**: Missing dependencies or incorrect Procfile
**Fix**:
1. Check Railway build logs
2. Verify `requirements.txt` is complete
3. Ensure `Procfile` exists in backend folder

---

## 📞 Support Resources

### Railway
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://railway.statuspage.io

### Netlify
- Docs: https://docs.netlify.com
- Support: https://answers.netlify.com

### Your Project
- GitHub Issues: (create issues in your repo)
- Email support: (set up support email)

---

## ✅ FINAL PRE-LAUNCH CHECKLIST

**Infrastructure:**
- [ ] Backend deployed on Railway
- [ ] Frontend deployed on Netlify
- [ ] PostgreSQL database provisioned
- [ ] Database initialized with tables
- [ ] All environment variables set

**Domains & SSL:**
- [ ] Custom domain configured for backend
- [ ] Custom domain configured for frontend
- [ ] DNS records propagated
- [ ] SSL certificates active (HTTPS working)

**Functionality:**
- [ ] User signup works
- [ ] Email verification works
- [ ] Login works
- [ ] API key generation works
- [ ] Weather API queries work
- [ ] No CORS errors

**Monitoring:**
- [ ] UptimeRobot configured
- [ ] Railway metrics dashboard bookmarked
- [ ] Error alerting set up
- [ ] Backup strategy confirmed

**Documentation:**
- [ ] API documentation accessible
- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] Contact information available

---

## 🚀 LAUNCH SEQUENCE

**When all items above are checked:**

1. **Announcement Prep**
   - Prepare launch message
   - Screenshot the working app
   - Prepare demo video (optional)

2. **Soft Launch**
   - Share with 5-10 test users
   - Gather feedback
   - Fix any critical issues

3. **Public Launch**
   - Post on social media
   - Submit to directories
   - Email potential users

**Congratulations! Your Fetcha Weather API is LIVE! 🎉**

---

## 📈 Post-Launch Tasks

**Week 1:**
- Monitor error rates daily
- Respond to user feedback
- Fix critical bugs immediately

**Month 1:**
- Analyze usage patterns
- Optimize slow endpoints
- Plan feature updates

**Ongoing:**
- Monthly security updates
- Database maintenance
- Feature releases

---

**Need Help?** Review the documentation files:
- `DEPLOYMENT_GUIDE.md` - Comprehensive deployment guide
- `RAILWAY_DEPLOYMENT.md` - Railway-specific details
- `README.md` - General project information
- `QUICK_START_DEPLOYMENT.md` - Fast deployment steps

**Good luck with your launch! 🚀**
