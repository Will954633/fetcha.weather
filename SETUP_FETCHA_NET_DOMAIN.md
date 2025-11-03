# Setting Up fetcha.net Domain with Subdomain Routing

**Version:** v1.0 • **Updated:** 2025-03-11 09:29 AEST (Brisbane)

---

## 🎯 Overview

You've purchased **fetcha.net** and want to set up subdomain routing so each page/service has its own subdomain:

### Proposed Subdomain Structure

```
fetcha.net                    → Homepage (index.html)
www.fetcha.net                → Homepage (index.html)
login.fetcha.net              → Login/Signup page
dashboard.fetcha.net          → Weather Dashboard
docs.fetcha.net               → API Documentation
api.fetcha.net                → Backend API (Railway)
```

---

## 📋 Prerequisites

- [x] Domain purchased: **fetcha.net**
- [x] Backend deployed on Railway
- [x] Frontend files ready for deployment
- [ ] Access to domain registrar (where you bought fetcha.net)

---

## 🏗️ Architecture Options

### Option 1: Multiple Netlify Sites (Recommended for Simplicity)
**Pros:**
- Easy to manage
- Each subdomain can be a separate Netlify site
- Simple DNS setup
- Free SSL certificates

**Cons:**
- More deployment configurations
- Need to manage multiple sites

### Option 2: Single Netlify Site with Redirects
**Pros:**
- Single deployment
- Centralized management

**Cons:**
- Cannot use true subdomains (only path-based routing like fetcha.net/login)
- More complex configuration

### Option 3: Cloudflare Pages with Workers (Advanced)
**Pros:**
- Full control over routing
- Single deployment

**Cons:**
- More complex setup
- Learning curve

---

## ✅ RECOMMENDED: Option 1 - Multiple Netlify Sites

This is the simplest and most straightforward approach.

---

## 🚀 Step-by-Step Implementation

### Phase 1: Deploy Main Site (fetcha.net)

#### 1.1: Deploy Root Domain to Netlify

1. **Sign up for Netlify** (if not already):
   - Go to https://www.netlify.com
   - Sign up with GitHub

2. **Create New Site**:
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub repository
   - Configure:
     ```
     Base directory: 03_Website/frontend
     Build command: (leave empty)
     Publish directory: 03_Website/frontend
     ```

3. **Deploy**:
   - Click "Deploy site"
   - Wait 30 seconds for deployment
   - Note your temporary URL (e.g., `random-name-123.netlify.app`)

#### 1.2: Configure Custom Domain

1. **In Netlify Dashboard**:
   - Go to Site settings → Domain management
   - Click "Add custom domain"
   - Enter: `fetcha.net`
   - Click "Verify"

2. **You'll see DNS instructions like**:
   ```
   Type    Name    Value
   A       @       75.2.60.5
   AAAA    @       2600:4040:e::1
   ```

3. **In Your Domain Registrar** (where you bought fetcha.net):
   - Log in to your domain control panel
   - Find DNS settings
   - Add the A and AAAA records provided by Netlify
   - Save changes

4. **Wait for DNS Propagation** (5 minutes - 48 hours):
   - Usually takes 5-30 minutes
   - Check status in Netlify dashboard

5. **SSL Certificate**:
   - Netlify automatically provisions Let's Encrypt SSL
   - Your site will be available at `https://fetcha.net`

#### 1.3: Add www Subdomain

1. **In Netlify**:
   - Same site → Add domain alias
   - Enter: `www.fetcha.net`
   - Click "Verify"

2. **In Domain Registrar**:
   - Add CNAME record:
     ```
     Type    Name    Value
     CNAME   www     [your-site].netlify.app
     ```

---

### Phase 2: Set Up Subdomains

For each subdomain (login, docs, dashboard), you have two options:

#### Option A: Separate Netlify Sites (Recommended)

**For login.fetcha.net:**

1. **Create a new folder structure**:
   ```bash
   cd 03_Website
   mkdir -p subdomains/login
   cp frontend/login.html subdomains/login/index.html
   cp -r frontend/js subdomains/login/
   cp -r frontend/css subdomains/login/
   cp -r frontend/assets subdomains/login/
   ```

2. **Create new Netlify site**:
   - In Netlify → "Add new site"
   - Import same GitHub repo
   - Configure:
     ```
     Base directory: 03_Website/subdomains/login
     Publish directory: 03_Website/subdomains/login
     ```

3. **Add custom domain**:
   - In new site → Domain settings
   - Add: `login.fetcha.net`

4. **In Domain Registrar**:
   - Add CNAME record:
     ```
     Type    Name     Value
     CNAME   login    [login-site].netlify.app
     ```

**Repeat for other subdomains:**
- `docs.fetcha.net` → docs.html
- `dashboard.fetcha.net` → weather-dashboard.html

#### Option B: Use Netlify Redirects (Simpler but Limited)

**NOTE:** This gives you path-based routing (fetcha.net/login) not true subdomains (login.fetcha.net)

If you want true subdomains, use Option A above.

---

### Phase 3: Set Up API Subdomain (api.fetcha.net)

#### 3.1: In Railway Dashboard

1. **Go to your Railway project**
2. **Click on Settings** → **Networking** → **Custom Domain**
3. **Add domain**: `api.fetcha.net`
4. **Railway will provide CNAME target** (e.g., `your-project.up.railway.app`)

#### 3.2: In Domain Registrar

1. **Add CNAME record**:
   ```
   Type    Name    Value
   CNAME   api     web-production-2d722.up.railway.app
   ```

2. **Save changes**

3. **Wait for DNS propagation**

#### 3.3: Update Backend CORS

1. **Edit backend config**:
   ```python
   # In Railway environment variables
   CORS_ORIGINS=https://fetcha.net,https://www.fetcha.net,https://login.fetcha.net,https://dashboard.fetcha.net,https://docs.fetcha.net
   ```

---

### Phase 4: Update Frontend Configuration

#### 4.1: Update config.js

```javascript
// 03_Website/frontend/js/config.js
function getAPIBaseURL() {
    const hostname = window.location.hostname;
    
    // Production with custom domain
    if (hostname.includes('fetcha.net')) {
        return 'https://api.fetcha.net/api';
    }
    
    // Netlify preview
    if (hostname.includes('netlify.app')) {
        return 'https://web-production-2d722.up.railway.app/api';
    }
    
    // Local development
    return 'http://localhost:5000/api';
}

const API_BASE_URL = getAPIBaseURL();
```

---

## 🗺️ DNS Configuration Summary

Here's what your DNS records should look like:

```
# Root domain
Type    Name    Value                                   TTL
A       @       75.2.60.5                              3600
AAAA    @       2600:4040:e::1                         3600

# WWW subdomain
CNAME   www     your-main-site.netlify.app             3600

# Subdomains for pages (if using separate Netlify sites)
CNAME   login   your-login-site.netlify.app            3600
CNAME   docs    your-docs-site.netlify.app             3600
CNAME   dashboard your-dashboard-site.netlify.app      3600

# API subdomain
CNAME   api     web-production-2d722.up.railway.app    3600
```

---

## 🧪 Testing Your Setup

### 1. Test Root Domain
```bash
curl https://fetcha.net
# Should return your homepage HTML
```

### 2. Test WWW
```bash
curl https://www.fetcha.net
# Should redirect to or show homepage
```

### 3. Test API Subdomain
```bash
curl https://api.fetcha.net/health
# Should return: {"status": "healthy"}
```

### 4. Test in Browser
1. Visit `https://fetcha.net` → Should show homepage
2. Visit `https://login.fetcha.net` → Should show login page (if configured)
3. Visit `https://api.fetcha.net/api` → Should show API info

---

## 🎨 SIMPLER ALTERNATIVE: Single Site with Path Routing

If subdomains are too complex, you can use a single site with paths:

```
fetcha.net              → Homepage
fetcha.net/login        → Login page
fetcha.net/dashboard    → Dashboard
fetcha.net/docs         → Docs
api.fetcha.net          → API (separate)
```

**This requires NO subdomain configuration** - just deploy your frontend folder as-is to fetcha.net!

### Setup Steps:
1. Deploy `03_Website/frontend` to Netlify
2. Point `fetcha.net` to Netlify (A/AAAA records)
3. Point `api.fetcha.net` to Railway (CNAME)
4. Done!

---

## 📝 Which Approach Should You Choose?

### Choose Path-Based Routing (fetcha.net/login) if:
- ✅ You want simplicity
- ✅ You're okay with paths instead of subdomains
- ✅ You want one deployment
- ✅ You're just starting out

### Choose Subdomain Routing (login.fetcha.net) if:
- ✅ You want professional-looking URLs
- ✅ You plan to scale different services independently
- ✅ You don't mind managing multiple deployments
- ✅ You want clear service separation

---

## 🚦 Quick Start Recommendation

**Start with Path-Based Routing**, then migrate to subdomains later if needed:

### Step 1: Deploy Main Site
```bash
# Deploy 03_Website/frontend to Netlify
# Point fetcha.net to Netlify
```

### Step 2: Configure API
```bash
# Point api.fetcha.net to Railway
```

### Step 3: Update Links
```javascript
// Update navigation to use paths
<a href="/login">Login</a>
<a href="/dashboard">Dashboard</a>
<a href="/docs">Docs</a>
```

### Step 4: Test
```
https://fetcha.net → Homepage ✅
https://fetcha.net/login → Login ✅
https://api.fetcha.net/health → API ✅
```

---

## 🔧 Implementation Checklist

### DNS Setup
- [ ] Log in to domain registrar
- [ ] Add A/AAAA records for fetcha.net
- [ ] Add CNAME for www.fetcha.net
- [ ] Add CNAME for api.fetcha.net
- [ ] Wait for DNS propagation (check with `dig fetcha.net`)

### Netlify Setup
- [ ] Deploy frontend to Netlify
- [ ] Add custom domain: fetcha.net
- [ ] Add domain alias: www.fetcha.net
- [ ] Verify SSL certificate provisioned
- [ ] Test HTTPS access

### Railway Setup
- [ ] Add custom domain: api.fetcha.net
- [ ] Update CORS settings
- [ ] Test API endpoint

### Code Updates
- [ ] Update config.js with domain detection
- [ ] Update any hardcoded URLs
- [ ] Test all API calls
- [ ] Verify authentication flows

---

## 🐛 Troubleshooting

### DNS Not Resolving
```bash
# Check DNS propagation
dig fetcha.net
dig api.fetcha.net

# Check from different DNS servers
nslookup fetcha.net 8.8.8.8
```

### SSL Certificate Issues
- Wait 5-10 minutes after DNS setup
- Check Netlify/Railway dashboard for cert status
- Ensure DNS records are correct

### CORS Errors
- Verify CORS_ORIGINS includes all your domains
- Check browser console for actual error
- Test with cURL to isolate frontend issues

### Subdomain Not Loading
- Verify CNAME record is correct
- Check DNS propagation with `dig login.fetcha.net`
- Ensure Netlify site is deployed and domain is added

---

## 💰 Costs

- **Domain (fetcha.net)**: ~$10-15/year
- **Netlify**: FREE (up to 100GB bandwidth/month)
- **Railway**: ~$5/month
- **Total**: ~$5/month + domain registration

---

## 📞 Next Steps

1. **Tell me where you bought fetcha.net** (GoDaddy, Namecheap, Google Domains, etc.)
2. **Choose your routing approach** (paths vs subdomains)
3. **I'll provide specific DNS instructions** for your registrar

Ready to proceed? Let me know your domain registrar and preferred approach!
