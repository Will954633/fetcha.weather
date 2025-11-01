# Fix CORS Error for Netlify Frontend

**Version: v1.0 • Updated: 2025-10-31 21:07 AEST (Brisbane)**

## Problem

When trying to signup from the Netlify-hosted frontend, you're getting:
```
Access to fetch at 'https://web-production-2d722.up.railway.app/api/auth/signup' 
from origin 'https://precious-lily-eed7a8.netlify.app' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause

The Railway backend's `CORS_ORIGINS` environment variable doesn't include your Netlify URL.

**Your Netlify URL:** `https://precious-lily-eed7a8.netlify.app`

## Solution

### Step 1: Add Netlify URL to Railway CORS_ORIGINS

1. **Go to Railway Dashboard**
   - Navigate to: https://railway.app
   - Select your project: "Fetcha Weather Backend"
   - Click on the "web" service

2. **Open Variables Tab**
   - Click on the "Variables" tab

3. **Find or Create CORS_ORIGINS**
   - Look for the `CORS_ORIGINS` variable
   - If it exists, edit it
   - If it doesn't exist, create it

4. **Set the Value**
   
   The CORS_ORIGINS value should be a comma-separated list of allowed origins:
   
   ```
   https://precious-lily-eed7a8.netlify.app,https://fetcha.net,https://www.fetcha.net,https://weather.fetcha.com
   ```
   
   **IMPORTANT:** 
   - Use commas to separate multiple URLs (NO spaces)
   - Include ALL URLs where your frontend is hosted
   - DO NOT include trailing slashes

5. **Save**
   - Railway will automatically redeploy

6. **Wait for Deployment**
   - Check the "Deployments" tab
   - Wait for the deployment to complete (1-2 minutes)

### Step 2: Verify Other Required Variables

While you're in the Variables tab, make sure these are ALL correctly set:

| Variable Name | Correct Format | Example Value |
|--------------|----------------|---------------|
| CORS_ORIGINS | Comma-separated URLs, no spaces | `https://precious-lily-eed7a8.netlify.app,https://fetcha.net` |
| FRONTEND_URL | Single URL, no trailing slash | `https://precious-lily-eed7a8.netlify.app` |
| SMTP_PORT | Just the number | `465` |
| SMTP_SERVER | Just the hostname | `smtpout.secureserver.net` |
| SMTP_USERNAME | Just the email | `noreply@fetcha.net` |
| SMTP_PASSWORD | Just the password | `your_password_here` |
| SMTP_USE_SSL | true or false | `true` |
| EMAIL_FROM | Just the email | `noreply@fetcha.net` |
| SECRET_KEY | Strong secret key | (generate one) |
| JWT_SECRET_KEY | Strong secret key | (generate one) |

### Common CORS_ORIGINS Mistakes

#### ❌ WRONG - With spaces
```
https://precious-lily-eed7a8.netlify.app, https://fetcha.net
```

#### ✅ RIGHT - No spaces
```
https://precious-lily-eed7a8.netlify.app,https://fetcha.net
```

#### ❌ WRONG - With trailing slashes
```
https://precious-lily-eed7a8.netlify.app/,https://fetcha.net/
```

#### ✅ RIGHT - No trailing slashes
```
https://precious-lily-eed7a8.netlify.app,https://fetcha.net
```

#### ❌ WRONG - Using http instead of https
```
http://precious-lily-eed7a8.netlify.app
```

#### ✅ RIGHT - Use https
```
https://precious-lily-eed7a8.netlify.app
```

## Testing After Fix

1. **Wait for Railway to finish deploying** (check Deployments tab)

2. **Clear your browser cache** or open an incognito window

3. **Go to your Netlify site:**
   ```
   https://precious-lily-eed7a8.netlify.app/login.html?signup=true
   ```

4. **Try to sign up** - it should work now!

5. **Check browser console** - no more CORS errors

## If It Still Doesn't Work

1. **Verify the Railway deployment succeeded**
   - Check Deploy Logs for any errors
   - Make sure there are no `ValueError` errors about SMTP_PORT

2. **Check the exact Netlify URL**
   - Make sure you're using the exact URL from the error message
   - Copy it directly: `https://precious-lily-eed7a8.netlify.app`

3. **Verify CORS_ORIGINS format**
   - No spaces between URLs
   - No trailing slashes
   - All URLs use `https://`

4. **Check browser console**
   - Look for the exact error message
   - Verify the origin in the error matches what you added

## Multiple Frontends?

If you have multiple domains pointing to your frontend, add them all:

```
https://precious-lily-eed7a8.netlify.app,https://fetcha.net,https://www.fetcha.net,https://weather.fetcha.com,https://app.fetcha.net
```

Just remember: **no spaces, no trailing slashes, comma-separated**.

---

**Quick Checklist:**
- [ ] Added Netlify URL to CORS_ORIGINS in Railway
- [ ] Fixed SMTP_PORT to just `465` (not `SMTP_PORT=465`)
- [ ] Set FRONTEND_URL to Netlify URL
- [ ] Verified all environment variables are correct
- [ ] Railway deployment succeeded
- [ ] Tested signup from Netlify site
- [ ] No CORS errors in browser console
