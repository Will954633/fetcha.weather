# 🌤️ Fetcha Weather API
**Australian Weather Data API** | Production-Ready Phase 1

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

---

## 🚀 Quick Deploy

```bash
# 1. Clone and navigate
git clone git@github.com:Will954633/fetcha.weather.git
cd fetcha.weather

# 2. Deploy to Railway (automated)
./deploy.sh
```

That's it! Railway will auto-deploy your backend.

---

## 📋 What's Included

### ✅ Backend (Flask API)
- User authentication (JWT)
- API key management
- Usage tracking & quotas
- BOM weather data integration
- PostgreSQL database
- Production-ready with Gunicorn

### ✅ Frontend (Static HTML/CSS/JS)
- Landing page
- Documentation site
- Terms of Service
- Privacy Policy
- User dashboard
- Login/Signup

### ✅ Deployment
- Railway configuration
- Environment variables template
- Auto-deploy on git push
- Production secrets generated

---

## 🎯 Domain Setup

**Your Domain Strategy:**
```
fetcha.net (root domain)
├── fetcha.weather      → Frontend (this project)
├── api.fetcha.net     → Backend API
├── www.fetcha.weather → Redirect to fetcha.weather
```

**Future Projects:**
```
├── fetcha.property    → Property data API
└── fetcha.economic    → Economic indicators API
```

---

## ⚡ Production Setup

### 1. Environment Variables (Railway Dashboard)

Copy these from `backend/.env.production`:

```env
SECRET_KEY=VskL9AbW1NZBa5P_9K1v5EEqyvmURi_6GbhIKvXUoJA
JWT_SECRET_KEY=6eZ6uBKmmmlKSI7NlN8oL5XAJlmnDNYdkxKWpk6PTNI
FLASK_ENV=production
PORT=5000
ALLOWED_ORIGINS=https://fetcha.weather,https://www.fetcha.weather,https://api.fetcha.net
```

### 2. Database (Auto-configured by Railway)
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### 3. DNS Configuration

**For api.fetcha.net (backend):**
```
Type: CNAME
Name: api
Value: your-app.up.railway.app
```

**For fetcha.weather (frontend):**
```
Type: CNAME
Name: weather.fetcha
Value: your-netlify-site.netlify.app
```

---

## 📖 Documentation

- [Quick Start Deployment](./QUICK_START_DEPLOYMENT.md) - Your custom deployment guide
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Comprehensive deployment docs
- [Phase 1 Complete](./PHASE_1_LAUNCH_COMPLETE.md) - Launch checklist
- [Getting Started](./GETTING_STARTED.md) - API usage guide

---

## 🛠️ Local Development

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python database/init_db.py
python app.py

# Frontend
cd frontend
# Open login.html in browser
open login.html
```

API runs at: http://localhost:5000

---

## 🔑 Generated Security Keys

Your production keys are stored in `backend/.env.production`:
- ✅ SECRET_KEY: VskL9AbW1NZBa5P_9K1v5EEqyvmURi_6GbhIKvXUoJA
- ✅ JWT_SECRET_KEY: 6eZ6uBKmmmlKSI7NlN8oL5XAJlmnDNYdkxKWpk6PTNI

**⚠️ IMPORTANT:** These keys are already in `.gitignore` and won't be committed to GitHub.

---

## 📊 API Endpoints

### Authentication
```
POST /api/auth/signup       - Create account
POST /api/auth/login        - Get JWT token
POST /api/auth/verify-email - Verify email
```

### API Keys
```
POST   /api/keys            - Generate API key
GET    /api/keys            - List API keys
DELETE /api/keys/:id        - Revoke API key
```

### Weather Data
```
GET /api/weather?location=Launceston&date_from=2025-10-01&date_to=2025-10-31
```

### Usage & Stats
```
GET /api/usage              - Get usage statistics
GET /api/usage/history      - Usage history
```

---

## 💰 Costs

### Phase 1 (Free Tier)
- Railway Developer: $5/month
- PostgreSQL: $5/month
- Netlify: FREE
- **Total: $10/month**

### Phase 2 (With Billing)
- Same infrastructure
- Stripe fees: 2.9% + 30¢
- **Revenue: $29/month per Pro subscriber**

---

## 🔐 Security Features

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ API key validation
- ✅ Rate limiting (100 req/month free)
- ✅ CORS configuration
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ Secure password requirements

---

## 📱 Frontend Auto-Configuration

The frontend automatically detects the environment:

**Development (localhost):**
```javascript
API_BASE = 'http://localhost:5000/api'
```

**Production (fetcha.weather):**
```javascript
API_BASE = 'https://api.fetcha.net/api'
```

No manual configuration needed! 🎉

---

## 🚢 Deployment Commands

```bash
# Deploy backend + frontend
./deploy.sh

# View Railway logs
railway logs --follow

# Run database migrations
railway run python backend/database/init_db.py

# Connect to production database
railway connect postgres
```

---

## ✅ Deployment Checklist

- [x] Security keys generated
- [x] Git repository initialized
- [x] .gitignore configured
- [x] Frontend auto-configuration added
- [x] Railway config ready
- [x] Procfile created
- [x] Production .env template ready
- [ ] Push to GitHub
- [ ] Deploy to Railway
- [ ] Add PostgreSQL database
- [ ] Configure environment variables
- [ ] Set up custom domain
- [ ] Deploy frontend to Netlify
- [ ] Test production endpoints

---

## 📞 Support

- **Email:** hello@fetchaweather.com
- **Documentation:** https://fetcha.weather/docs.html
- **GitHub:** https://github.com/Will954633/fetcha.weather

---

## 📄 License

Proprietary - All rights reserved

---

## 🎉 Ready to Launch!

Follow the [Quick Start Deployment Guide](./QUICK_START_DEPLOYMENT.md) to go live in 30 minutes.

**Next command:**
```bash
./deploy.sh
