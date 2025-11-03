# Netlify DNS Setup for fetcha.net (Simplified Approach)

**Version:** v1.0 • **Updated:** 2025-03-11 10:00 AEST (Brisbane)

---

## 🎯 What You're Seeing

Netlify has already created a DNS zone for fetcha.net. You have two options:

1. **Use Netlify DNS (RECOMMENDED - Simpler)** - Manage all DNS in Netlify
2. **Use GoDaddy DNS** - Manage all DNS in GoDaddy

Let's use **Netlify DNS** since you're already there!

---

## ✅ Complete Setup Using Netlify DNS (Simplest Approach)

### Step 1: Add DNS Records in Netlify (5 minutes)

You're currently on the Netlify DNS management page for fetcha.net. You should see **"Add new record"** button.

#### 1.1: Add A Record for Root Domain

1. Click **"Add new record"**
2. Select type: **A**
3. Fill in:
   ```
   Name: @ (or leave blank - this means root domain)
   Value: 75.2.60.5
   TTL: 3600 (default)
   ```
4. Click **"Save"**

#### 1.2: Add AAAA Record (IPv6)

1. Click **"Add new record"** again
2. Select type: **AAAA**
3. Fill in:
   ```
   Name: @ (or leave blank)
   Value: 2600:4040:e::1
   TTL: 3600
   ```
4. Click **"Save"**

#### 1.3: Add WWW CNAME

1. Click **"Add new record"**
2. Select type: **CNAME**
3. Fill in:
   ```
   Name: www
   Value: [your-netlify-site].netlify.app
   ```
   (Replace with your actual Netlify site URL from Step 1 of deployment)
4. Click **"Save"**

#### 1.4: Add API CNAME (for Railway backend)

1. Click **"Add new record"**
2. Select type: **CNAME**
3. Fill in:
   ```
   Name: api
   Value: web-production-2d722.up.railway.app
   TTL: 3600
   ```
4. Click **"Save"**

**Your Netlify DNS should now show 4 records:**
```
Type    Name    Value                                   TTL
A       @       75.2.60.5                              3600
AAAA    @       2600:4040:e::1                         3600
CNAME   www     [your-site].netlify.app                3600
CNAME   api     web-production-2d722.up.railway.app    3600
```

---

### Step 2: Update GoDaddy Nameservers (10 minutes)

Now you need to tell GoDaddy to use Netlify's nameservers instead of GoDaddy's.

#### 2.1: Get Netlify Nameservers

On your Netlify DNS page, you should see a section called **"Name servers"** with these values:

```
dns1.p02.nsone.net
dns2.p02.nsone.net
dns3.p02.nsone.net
dns4.p02.nsone.net
```

**Copy these** - you'll need them in GoDaddy.

#### 2.2: Update GoDaddy

1. Log in to **GoDaddy.com**
2. Go to **"My Products"** → **"Domains"**
3. Find **fetcha.net** in your domain list
4. Click the **three dots (⋮)** or **"Manage"** next to fetcha.net
5. Scroll down to **"Additional Settings"**
6. Click **"Manage DNS"** or **"Change Nameservers"**
7. Look for **"Nameservers"** section
8. Click **"Change"** or **"Custom"** (depends on GoDaddy's interface)
9. Select **"I'll use my own nameservers"** or **"Custom nameservers"**
10. Enter the 4 Netlify nameservers:
    ```
    dns1.p02.nsone.net
    dns2.p02.nsone.net
    dns3.p02.nsone.net
    dns4.p02.nsone.net
    ```
11. Click **"Save"**
12. GoDaddy may warn you this will delete existing DNS records - **click "OK"** or "Continue"
    (This is fine because you've already set up the DNS records in Netlify)

---

### Step 3: Wait for Propagation (10-48 hours, usually 1-4 hours)

After changing nameservers:

#### 3.1: Check Status in Netlify

1. Go back to Netlify dashboard → fetcha.net DNS settings
2. Netlify will automatically detect when the nameserver change is complete
3. You'll see a message like "DNS is configured correctly" when ready

#### 3.2: Check DNS Propagation

Use online tool: **https://www.whatsmydns.net**

1. Enter: `fetcha.net`
2. Select: `NS` (Nameserver)
3. Click **"Search"**
4. You should see `dns1.p02.nsone.net`, etc. appearing around the world

Or use command line:
```bash
dig fetcha.net NS
```

Should show Netlify nameservers when propagated.

---

### Step 4: Configure Railway (5 minutes)

While waiting for DNS propagation, set up Railway:

#### 4.1: Add Custom Domain

1. Go to **https://railway.app**
2. Open your project (web-production-2d722)
3. Click **Settings** → **Networking** (or **Domains**)
4. Click **"+ Add Domain"** or **"+ Custom Domain"**
5. Enter: `api.fetcha.net`
6. Click **"Add"**

#### 4.2: Update CORS

1. Still in Railway → Click **"Variables"**
2. Find `CORS_ORIGINS` (or click **"+ New Variable"** if it doesn't exist)
3. Set value to:
   ```
   CORS_ORIGINS=https://fetcha.net,https://www.fetcha.net,https://api.fetcha.net
   ```
4. Click **"Update Variables"** or **"Add"**
5. Railway will automatically redeploy (wait 1-2 minutes)

---

### Step 5: Enable IPv6 in Netlify (Optional but Recommended)

Back in Netlify DNS page for fetcha.net:

1. Find the **"Enable IPv6 on your domain"** section
2. Click **"Enable IPv6"**
3. This improves global accessibility

---

### Step 6: Deploy Code Changes

```bash
cd /Users/willsimpson/Documents/Weather_Data_API/03_Website
git add frontend/js/config.js
git commit -m "Configure fetcha.net domain with api subdomain"
git push
```

Netlify will auto-deploy in 30-60 seconds.

---

## 🧪 Testing (After DNS Propagation)

### Test 1: Check Nameservers
```bash
dig fetcha.net NS
```

Should show:
```
fetcha.net.  3600  IN  NS  dns1.p02.nsone.net.
fetcha.net.  3600  IN  NS  dns2.p02.nsone.net.
fetcha.net.  3600  IN  NS  dns3.p02.nsone.net.
fetcha.net.  3600  IN  NS  dns4.p02.nsone.net.
```

### Test 2: Check A Record
```bash
dig fetcha.net A
```

Should show:
```
fetcha.net.  3600  IN  A  75.2.60.5
```

### Test 3: Check CNAME Records
```bash
dig api.fetcha.net CNAME
```

Should show:
```
api.fetcha.net.  3600  IN  CNAME  web-production-2d722.up.railway.app.
```

### Test 4: Visit in Browser

1. **Homepage**: https://fetcha.net
   - Expected: Your homepage loads

2. **WWW**: https://www.fetcha.net
   - Expected: Your homepage loads (may redirect to fetcha.net)

3. **API Health**: https://api.fetcha.net/health
   - Expected: `{"status": "healthy"}`

4. **Login Page**: https://fetcha.net/login.html
   - Expected: Login page loads

5. **Console Check**: Open browser DevTools (F12) → Console
   - Expected: 
     ```
     Environment detected: fetcha.net
     API Base URL: https://api.fetcha.net/api
     ```

### Test 5: Full User Flow

1. Visit https://fetcha.net
2. Click "Start Free" → should go to /login.html
3. Sign up with test email
4. Should work without CORS errors
5. Login successfully
6. Generate API key on dashboard
7. Test weather API with your key

---

## ⏰ Timeline

| Step | Duration | What Happens |
|------|----------|--------------|
| Add DNS records in Netlify | 5 min | You add 4 DNS records |
| Update GoDaddy nameservers | 10 min | Point to Netlify DNS |
| DNS propagation | 1-4 hours | Wait for global DNS update |
| Configure Railway | 5 min | Add api.fetcha.net domain |
| Deploy code | 2 min | Push changes to GitHub |
| Testing | 10 min | Verify everything works |

**Total Active Time**: ~30 minutes
**Total Wait Time**: 1-4 hours (DNS propagation)

---

## 🐛 Troubleshooting

### Issue: "Nameserver update failed" in GoDaddy

**Solution:**
- Make sure you're using the exact nameservers from Netlify
- Try again in a few minutes
- Contact GoDaddy support if it persists

### Issue: Site still not loading after 4 hours

**Cause:** DNS hasn't propagated yet

**Solution:**
1. Check whatsmydns.net - is it showing Netlify nameservers globally?
2. Wait another 2-4 hours
3. Try incognito mode / different browser
4. Clear your DNS cache:
   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   ```

### Issue: "This site can't be reached"

**Cause:** DNS not propagated OR wrong DNS records

**Solution:**
1. Check `dig fetcha.net` - does it show 75.2.60.5?
2. Check Netlify DNS records are correct
3. Wait for propagation

### Issue: CORS errors in browser

**Cause:** Railway CORS not updated

**Solution:**
1. Check Railway variables: `CORS_ORIGINS=https://fetcha.net,https://www.fetcha.net,https://api.fetcha.net`
2. Check Railway redeployed after variable change
3. Hard refresh (Ctrl+Shift+R)

### Issue: api.fetcha.net not working

**Cause:** Railway custom domain not configured OR DNS not propagated

**Solution:**
1. Check Railway: api.fetcha.net should have a checkmark
2. Check DNS: `dig api.fetcha.net` should show Railway's address
3. Wait for DNS propagation
4. Test directly: `curl https://api.fetcha.net/health`

---

## ✅ Success Checklist

### Netlify DNS Setup
- [ ] Added A record: @ → 75.2.60.5
- [ ] Added AAAA record: @ → 2600:4040:e::1
- [ ] Added CNAME: www → [your-site].netlify.app
- [ ] Added CNAME: api → web-production-2d722.up.railway.app
- [ ] Enabled IPv6 (optional)

### GoDaddy Configuration
- [ ] Changed nameservers to Netlify's 4 nameservers
- [ ] Saved changes
- [ ] Received confirmation

### Railway Setup
- [ ] Added custom domain: api.fetcha.net
- [ ] Updated CORS_ORIGINS variable
- [ ] Service redeployed

### Code Updates
- [ ] Committed config.js changes
- [ ] Pushed to GitHub
- [ ] Netlify auto-deployed

### DNS Propagation
- [ ] Waited 1-4 hours
- [ ] Checked whatsmydns.net shows Netlify nameservers
- [ ] dig commands show correct records

### Testing
- [ ] https://fetcha.net loads
- [ ] https://www.fetcha.net works
- [ ] https://api.fetcha.net/health returns healthy
- [ ] Can sign up without errors
- [ ] No CORS errors in console
- [ ] Full user flow works

---

## 🎯 Why Use Netlify DNS?

**Advantages:**
✅ Centralized management - all DNS in one place
✅ Automatic SSL certificates
✅ Fast DNS propagation
✅ Better integration with Netlify deployments
✅ Free

**vs GoDaddy DNS:**
- GoDaddy charges for some DNS features
- Netlify DNS is optimized for their CDN
- Easier to manage in one dashboard

---

## 💡 Pro Tips

1. **Be Patient** with DNS propagation - it can take 1-24 hours
2. **Use whatsmydns.net** to check global propagation status
3. **Clear DNS cache** on your computer after changes
4. **Test in incognito mode** to avoid browser cache
5. **Check Railway status** before assuming DNS issue

---

## 📞 Current Status

You're at: **Step 1 - Adding DNS Records in Netlify**

**Next actions:**
1. Click "Add new record" in Netlify
2. Add all 4 DNS records (A, AAAA, CNAME www, CNAME api)
3. Then proceed to Step 2 (update GoDaddy nameservers)

Need help with any specific step? Let me know where you're stuck!
