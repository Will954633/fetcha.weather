# GoDaddy Setup Guide for fetcha.net (Path-Based Routing)

**Version:** v1.0 • **Updated:** 2025-03-11 09:32 AEST (Brisbane)

---

## 🎯 Your Setup

- **Domain:** fetcha.net (purchased from GoDaddy)
- **Routing:** Path-based (fetcha.net/login, fetcha.net/docs, etc.)
- **Frontend:** Netlify
- **Backend API:** Railway (api.fetcha.net)

---

## 🚀 Complete Setup in 4 Steps

### Step 1: Deploy Frontend to Netlify (15 minutes)

#### 1.1: Create Netlify Account
1. Go to **https://www.netlify.com**
2. Click **"Sign up"**
3. Choose **"Sign up with GitHub"**
4. Authorize Netlify

#### 1.2: Deploy Your Site
1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **"Deploy with GitHub"**
3. Select your repository
4. Configure build settings:
   ```
   Base directory: 03_Website/frontend
   Build command: (leave empty)
   Publish directory: 03_Website/frontend
   ```
5. Click **"Deploy site"**
6. Wait 30-60 seconds for deployment

#### 1.3: Note Your Netlify URL
After deployment, you'll see a URL like:
```
https://random-name-12345.netlify.app
```

**SAVE THIS URL** - you'll need it for DNS setup!

---

### Step 2: Configure GoDaddy DNS (10 minutes)

#### 2.1: Log in to GoDaddy
1. Go to **https://www.godaddy.com**
2. Sign in to your account
3. Go to **"My Products"** → **"Domains"**
4. Find **fetcha.net** and click **"DNS"**

#### 2.2: Get Netlify DNS Values
Back in Netlify:
1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter: `fetcha.net`
4. Click **"Verify"**
5. Netlify will show you DNS records:
   ```
   A     @    75.2.60.5
   AAAA  @    2600:4040:e::1
   ```
   (Exact IPs may vary - use what Netlify shows you)

#### 2.3: Configure GoDaddy DNS Records

**Delete Old A Records (if any):**
1. In GoDaddy DNS Management, find any existing **A** or **AAAA** records for `@` (root)
2. Click the pencil icon → Delete
3. Confirm deletion

**Add Netlify A Record:**
1. Click **"Add"** → Select **"A"**
2. Fill in:
   ```
   Type: A
   Name: @ (this means root domain - fetcha.net)
   Value: 75.2.60.5 (or the IP Netlify gave you)
   TTL: 1 Hour (default)
   ```
3. Click **"Save"**

**Add Netlify AAAA Record (IPv6):**
1. Click **"Add"** → Select **"AAAA"**
2. Fill in:
   ```
   Type: AAAA
   Name: @
   Value: 2600:4040:e::1 (or the IPv6 Netlify gave you)
   TTL: 1 Hour
   ```
3. Click **"Save"**

**Add WWW CNAME (optional but recommended):**
1. Click **"Add"** → Select **"CNAME"**
2. Fill in:
   ```
   Type: CNAME
   Name: www
   Value: random-name-12345.netlify.app (your Netlify URL)
   TTL: 1 Hour
   ```
3. Click **"Save"**

**Add API CNAME:**
1. Click **"Add"** → Select **"CNAME"**
2. Fill in:
   ```
   Type: CNAME
   Name: api
   Value: web-production-2d722.up.railway.app
   TTL: 1 Hour
   ```
3. Click **"Save"**

#### 2.4: Verify DNS Records

Your GoDaddy DNS should now show:
```
Type    Name    Value                                   TTL
A       @       75.2.60.5                              1 Hour
AAAA    @       2600:4040:e::1                         1 Hour
CNAME   www     random-name-12345.netlify.app          1 Hour
CNAME   api     web-production-2d722.up.railway.app    1 Hour
```

---

### Step 3: Configure Railway Custom Domain (5 minutes)

#### 3.1: Add Custom Domain in Railway
1. Go to **https://railway.app**
2. Open your project
3. Click on your service (web-production-2d722)
4. Go to **Settings** → **Networking**
5. Under **Custom Domain**, click **"+ Add Domain"**
6. Enter: `api.fetcha.net`
7. Click **"Add"**

#### 3.2: Wait for DNS Verification
- Railway will check if your DNS is configured correctly
- This can take 5-30 minutes
- You'll see a checkmark when it's ready

#### 3.3: Update CORS Settings
1. Still in Railway → Go to **Variables**
2. Find (or add) `CORS_ORIGINS`
3. Update to:
   ```
   CORS_ORIGINS=https://fetcha.net,https://www.fetcha.net,https://api.fetcha.net
   ```
4. Click **"Update Variables"**
5. Railway will automatically redeploy

---

### Step 4: Update Frontend Code (5 minutes)

#### 4.1: Update config.js

Edit `03_Website/frontend/js/config.js`:

```javascript
// API Configuration
function getAPIBaseURL() {
    const hostname = window.location.hostname;
    
    // Production with custom domain
    if (hostname === 'fetcha.net' || hostname === 'www.fetcha.net') {
        return 'https://api.fetcha.net/api';
    }
    
    // Netlify preview deployments
    if (hostname.includes('netlify.app')) {
        return 'https://web-production-2d722.up.railway.app/api';
    }
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }
    
    // Fallback
    return 'https://api.fetcha.net/api';
}

const API_BASE_URL = getAPIBaseURL();

// Log for debugging
console.log('Environment detected:', window.location.hostname);
console.log('API Base URL:', API_BASE_URL);
```

#### 4.2: Commit and Push Changes

```bash
cd /Users/willsimpson/Documents/Weather_Data_API/03_Website
git add frontend/js/config.js
git commit -m "Update config.js for fetcha.net domain"
git push
```

Netlify will automatically redeploy with the new changes (wait 30-60 seconds).

---

## 🧪 Testing Your Setup

### Wait for DNS Propagation (10-30 minutes)

DNS changes can take time. Check propagation:

```bash
# Check if fetcha.net points to Netlify
dig fetcha.net

# Check if api.fetcha.net points to Railway
dig api.fetcha.net
```

Or use online tool: **https://www.whatsmydns.net**

### Test Each Component

#### 1. Test Homepage
```
Visit: https://fetcha.net
Expected: See your homepage
```

#### 2. Test WWW Redirect
```
Visit: https://www.fetcha.net
Expected: See your homepage (or redirect to fetcha.net)
```

#### 3. Test API Endpoint
```
Visit: https://api.fetcha.net/health
Expected: {"status": "healthy"}
```

#### 4. Test Login Page
```
Visit: https://fetcha.net/login.html
Expected: See login/signup page
```

#### 5. Test Dashboard
```
Visit: https://fetcha.net/weather-dashboard.html
Expected: See weather dashboard (after login)
```

#### 6. Test Docs
```
Visit: https://fetcha.net/docs.html
Expected: See API documentation
```

### Test Full User Flow

1. **Visit homepage**: https://fetcha.net
2. **Click "Start Free"** (should go to fetcha.net/login.html)
3. **Sign up** with test email
4. **Check browser console** - should show:
   ```
   Environment detected: fetcha.net
   API Base URL: https://api.fetcha.net/api
   ```
5. **Complete signup** - should work without CORS errors
6. **Login** - should work
7. **Generate API key** on dashboard
8. **Test weather API** with your key

---

## 🎨 Your Final URL Structure

Once everything is set up:

```
https://fetcha.net                    → Homepage
https://fetcha.net/login.html         → Login/Signup
https://fetcha.net/weather-dashboard.html → Dashboard
https://fetcha.net/docs.html          → API Docs
https://fetcha.net/terms.html         → Terms
https://fetcha.net/privacy.html       → Privacy Policy

https://api.fetcha.net                → Backend API
https://api.fetcha.net/health         → Health check
https://api.fetcha.net/api            → API info
https://api.fetcha.net/api/weather/*  → Weather endpoints
```

---

## 🐛 Troubleshooting

### Issue: "This site can't be reached"

**Cause:** DNS not propagated yet

**Solution:**
1. Wait 10-30 minutes
2. Clear browser cache (Ctrl+Shift+Delete)
3. Try incognito mode
4. Check DNS propagation: https://www.whatsmydns.net

### Issue: SSL Certificate Not Working

**Cause:** Netlify hasn't provisioned SSL yet

**Solution:**
1. Wait 5-10 minutes after DNS propagation
2. In Netlify → Domain settings → Check SSL status
3. Click "Renew certificate" if needed

### Issue: CORS Errors in Browser

**Cause:** Railway CORS not updated

**Solution:**
1. Check Railway variables include: `CORS_ORIGINS=https://fetcha.net,https://www.fetcha.net`
2. Ensure Railway redeployed after variable change
3. Hard refresh browser (Ctrl+Shift+R)

### Issue: api.fetcha.net Not Working

**Cause:** DNS not propagated or Railway not configured

**Solution:**
1. Check GoDaddy DNS has CNAME for `api` → `web-production-2d722.up.railway.app`
2. Check Railway custom domain settings
3. Wait for Railway to verify domain (can take 30 minutes)
4. Test with: `curl https://api.fetcha.net/health`

### Issue: Old Content Showing

**Cause:** Browser cache or CDN cache

**Solution:**
1. Hard refresh (Ctrl+Shift+R)
2. Clear browser cache
3. Try incognito mode
4. Wait 5 minutes for CDN cache to clear

---

## ✅ Setup Checklist

### GoDaddy DNS Configuration
- [ ] Logged in to GoDaddy
- [ ] Removed old A records for @ (root)
- [ ] Added A record: @ → 75.2.60.5 (Netlify IP)
- [ ] Added AAAA record: @ → 2600:4040:e::1 (Netlify IPv6)
- [ ] Added CNAME: www → [your-site].netlify.app
- [ ] Added CNAME: api → web-production-2d722.up.railway.app
- [ ] Saved all changes

### Netlify Configuration
- [ ] Frontend deployed to Netlify
- [ ] Custom domain added: fetcha.net
- [ ] Domain alias added: www.fetcha.net
- [ ] SSL certificate provisioned
- [ ] Site loads at https://fetcha.net

### Railway Configuration
- [ ] Custom domain added: api.fetcha.net
- [ ] Domain verified (checkmark visible)
- [ ] CORS_ORIGINS updated with fetcha.net domains
- [ ] Service redeployed
- [ ] API responds at https://api.fetcha.net/health

### Code Updates
- [ ] Updated config.js for fetcha.net domain detection
- [ ] Committed and pushed changes to GitHub
- [ ] Netlify auto-deployed new version
- [ ] Browser console shows correct API URL

### Testing
- [ ] https://fetcha.net loads homepage
- [ ] https://www.fetcha.net works
- [ ] https://api.fetcha.net/health returns healthy
- [ ] Can sign up at https://fetcha.net/login.html
- [ ] Can login successfully
- [ ] No CORS errors in browser console
- [ ] Can access dashboard at https://fetcha.net/weather-dashboard.html
- [ ] Can generate API key
- [ ] Can make weather API requests

---

## 📊 Expected Timeline

| Step | Duration | Total |
|------|----------|-------|
| Deploy to Netlify | 15 min | 15 min |
| Configure GoDaddy DNS | 10 min | 25 min |
| DNS Propagation (wait) | 10-30 min | 35-55 min |
| Configure Railway | 5 min | 40-60 min |
| Update Code | 5 min | 45-65 min |
| Testing | 10 min | 55-75 min |

**Total: 1-1.5 hours** (including DNS propagation wait time)

---

## 💡 Pro Tips

1. **Use Incognito Mode** for testing - avoids cache issues
2. **Check DNS First** before assuming something is broken
3. **Watch Browser Console** for helpful error messages
4. **Test API Directly** with cURL before testing in browser
5. **Wait for DNS** - don't panic if it takes 30 minutes

---

## 🎯 Success Criteria

You'll know everything is working when:

✅ **https://fetcha.net** loads your homepage
✅ **https://api.fetcha.net/health** returns `{"status":"healthy"}`
✅ You can **sign up** without errors
✅ You can **login** successfully
✅ You can **generate an API key**
✅ You can **make weather API requests** with your key
✅ **No CORS errors** in browser console

---

## 📞 Ready to Deploy?

Follow the steps above in order. Each step builds on the previous one.

**Start with Step 1** (Deploy to Netlify) and work your way through!

If you get stuck, check the Troubleshooting section or let me know which step you're on.
