# PostgreSQL Connection Fix - Production Config Issue

**Date:** 2025-11-01 21:44 AEST (Brisbane)  
**Status:** DEPLOYED TO GITHUB - Waiting for Railway Auto-Deploy

---

## Problem Identified

The backend was using **SQLite instead of PostgreSQL** in production because:

1. The base `Config` class set `SQLALCHEMY_DATABASE_URI` at class definition time
2. `ProductionConfig` inherited this but **didn't override it**
3. Result: App always used SQLite, even though `DATABASE_URL` env var was set in Railway

## Root Cause

```python
class Config:
    # This ran ONCE when class was defined
    if os.environ.get('DATABASE_URL'):
        SQLALCHEMY_DATABASE_URI = database_url  
    else:
        SQLALCHEMY_DATABASE_URI = f'sqlite:///{DATABASE_PATH}'

class ProductionConfig(Config):
    # ❌ Did NOT override SQLALCHEMY_DATABASE_URI
    # So it inherited the SQLite path!
```

## Solution Applied

Added database configuration override in `ProductionConfig`:

```python
class ProductionConfig(Config):
    # ... other config ...
    
    # ✅ NOW OVERRIDES DATABASE_URI 
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        SQLALCHEMY_DATABASE_URI = database_url
        DATABASE_PATH = None
```

## Commits Pushed to GitHub

- `d52144f` - Fix ProductionConfig to properly use PostgreSQL DATABASE_URL  
- `eefc07d` - Add debug logging for database URI
- `c7f5c14` - Fix PostgreSQL URL for SQLAlchemy 1.4+ (postgres:// → postgresql://)
- `2dc03ce` - Convert backend from SQLite to SQLAlchemy ORM

## Expected Logs After Deployment

After Railway deploys, you should see:
```
DEBUG: DATABASE_URI = postgresql://defaultuser...  (✅ PostgreSQL)
```

Instead of:
```
DEBUG: DATABASE_URI = sqlite:////app/backend/database/weather.db...  (❌ SQLite)
```

## Next Steps

1. **Wait for Railway Auto-Deploy** (usually 2-3 minutes)
2. **Check Railway Dashboard** - Verify new deployment started
3. **Test Signup** - Create new user on website
4. **Verify** - Run `railway connect postgres` and check for users in database

## Verification Command

```bash
cd 03_Website
railway connect postgres
SELECT email, created_at FROM users ORDER BY created_at DESC;
\q
```

## Files Modified

- `backend/config.py` - Added ProductionConfig database override
- `backend/app.py` - Added DATABASE_URI debug logging

---

**All changes are on GitHub. Railway should auto-deploy within minutes.**
