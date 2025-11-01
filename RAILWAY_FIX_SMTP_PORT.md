# Railway SMTP_PORT Environment Variable Fix

**Version: v1.0 • Updated: 2025-10-31 21:00 AEST (Brisbane)**

## Problem

The Railway deployment is failing with this error:
```
ValueError: invalid literal for int() with base 10: 'SMTP_PORT=465'
```

## Root Cause

The environment variable `SMTP_PORT` in Railway is incorrectly formatted as:
```
SMTP_PORT=465
```

Instead of just:
```
465
```

When setting environment variables in Railway, you should NOT include the variable name and equals sign in the value field.

## Solution

### Fix the Environment Variable in Railway

1. **Go to Railway Dashboard**
   - Navigate to: https://railway.app
   - Select your project: "Fetcha Weather Backend"
   - Click on the "web" service

2. **Open Variables Tab**
   - Click on the "Variables" tab in the service

3. **Find SMTP_PORT**
   - Look for the `SMTP_PORT` variable in the list

4. **Correct the Value**
   - **WRONG:** `SMTP_PORT=465`
   - **RIGHT:** `465`
   
   The variable name should be in the left column, and ONLY the value should be in the right column.

5. **Check Other Variables**
   While you're there, verify ALL environment variables are correctly formatted:
   
   | Variable Name | Correct Value Format | Example |
   |--------------|---------------------|---------|
   | SMTP_PORT | Just the number | `465` or `587` |
   | SMTP_SERVER | Just the hostname | `smtpout.secureserver.net` |
   | SMTP_USERNAME | Just the email | `noreply@fetcha.net` |
   | SMTP_PASSWORD | Just the password | `your_password_here` |
   | SMTP_USE_SSL | true or false | `true` |
   | SECRET_KEY | Just the key value | `your_secret_key` |
   | JWT_SECRET_KEY | Just the key value | `your_jwt_key` |
   | CORS_ORIGINS | Comma-separated URLs | `https://fetcha.net,https://www.fetcha.net` |
   | FRONTEND_URL | Just the URL | `https://weather.fetcha.com` |
   | EMAIL_FROM | Just the email | `noreply@fetcha.net` |

6. **Save Changes**
   - Railway will automatically redeploy after you save

7. **Monitor Deployment**
   - Go to the "Deployments" tab
   - Wait for the new deployment to complete
   - Check the "Deploy Logs" to verify it starts successfully

## Verification

After fixing, you should see in the logs:
```
[2025-10-31 XX:XX:XX +0000] [X] [INFO] Starting gunicorn 21.2.0
[2025-10-31 XX:XX:XX +0000] [X] [INFO] Listening at: http://0.0.0.0:8080
[2025-10-31 XX:XX:XX +0000] [X] [INFO] Using worker: sync
[2025-10-31 XX:XX:XX +0000] [X] [INFO] Booting worker with pid: X
```

**NO MORE** `ValueError: invalid literal for int()` errors!

## Common Railway Environment Variable Mistakes

### ❌ WRONG - Including variable name in value
```
SMTP_PORT = SMTP_PORT=465
SMTP_SERVER = SMTP_SERVER=smtpout.secureserver.net
```

### ✅ RIGHT - Only the value
```
SMTP_PORT = 465
SMTP_SERVER = smtpout.secureserver.net
```

### ❌ WRONG - Extra quotes
```
SMTP_PORT = "465"
SMTP_SERVER = "smtpout.secureserver.net"
```

### ✅ RIGHT - No quotes needed
```
SMTP_PORT = 465
SMTP_SERVER = smtpout.secureserver.net
```

### ❌ WRONG - Including export statement
```
SMTP_PORT = export SMTP_PORT=465
```

### ✅ RIGHT - Just the value
```
SMTP_PORT = 465
```

## How Railway Variables Work

Railway's environment variable interface has two fields:

```
┌─────────────────┬──────────────────────┐
│ Variable Name   │ Variable Value       │
├─────────────────┼──────────────────────┤
│ SMTP_PORT       │ 465                  │  ✅ CORRECT
│ SMTP_PORT       │ SMTP_PORT=465        │  ❌ WRONG
│ SMTP_PORT       │ "465"                │  ❌ WRONG
└─────────────────┴──────────────────────┘
```

The left column is the variable name, the right column is ONLY the value.

## After Fixing

Once you've corrected the environment variable:

1. Railway will automatically redeploy
2. The deployment should succeed within 1-2 minutes
3. Your application will be accessible at: `https://web-production-2d722.up.railway.app`

## Need Help?

If the issue persists after fixing:
1. Check the "Deploy Logs" tab for new error messages
2. Verify ALL environment variables are correctly formatted
3. Make sure no variables have accidental spaces or special characters
4. Try removing and re-adding the problematic variable

---

**Remember:** In Railway (and most deployment platforms), environment variables should contain ONLY the value, not the variable name or any shell syntax.
