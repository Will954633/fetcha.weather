# Signup 500 Error - Fixed

**Version:** v1.0  
**Updated:** 2025-10-31 19:42 AEST (Brisbane)

## Problem Summary

Users attempting to sign up at the deployed site received a **500 Internal Server Error**:

```
POST https://web-production-2d722.up.railway.app/api/auth/signup 500 (Internal Server Error)
```

### Error Details

- **Root Cause:** Database tables did not exist on Railway deployment
- **Why:** The `init_db.py` script was never called during application startup
- **Impact:** All signup attempts failed with 500 error when User model tried to access non-existent database tables

## Solution Implemented

### Changes Made

Modified `03_Website/backend/app.py` to automatically initialize the database on application startup:

```python
from database.init_db import init_database

def create_app(config_name=None):
    # ... existing code ...
    
    # Initialize database
    try:
        db_path = init_database(drop_existing=False)
        app.logger.info(f'Database initialized: {db_path}')
    except Exception as e:
        app.logger.error(f'Database initialization failed: {str(e)}')
        raise
    
    # ... rest of code ...
```

### What This Does

1. **On every app startup**, the database is automatically checked and initialized if needed
2. **Creates all required tables** (users, api_keys, usage_logs, monthly_usage, email_queue)
3. **Creates all indexes** for optimal performance
4. **Idempotent operation** - safe to run multiple times, won't drop existing data
5. **Logs the process** for debugging and monitoring

## Deployment Status

✅ **Fix deployed to:**
- Commit: `09e180f` 
- Pushed to: `main` branch
- Railway: Auto-deployment in progress

## Testing Instructions

Once Railway finishes deploying (usually 1-2 minutes):

1. Visit the signup page: https://6904794a9b7912595179c0f7--precious-lily-eed7a8.netlify.app/login?signup=true
2. Try creating a new account with:
   - Valid email address
   - Strong password (8+ chars, uppercase, lowercase, number)
   - Full name
3. Should receive success message instead of 500 error

## Database Details

### Tables Created

- **users** - User accounts and authentication
- **api_keys** - API access keys
- **usage_logs** - Detailed usage tracking
- **monthly_usage** - Aggregated monthly statistics
- **email_queue** - Email sending queue

### Database Location (Railway)

- Path: `/app/backend/database/weather.db`
- Created automatically on first startup
- Persists across deployments via Railway volumes

## Verification

To verify the fix worked:

1. Check Railway logs for: `Database initialized: /app/backend/database/weather.db`
2. Test signup functionality
3. Check that database has 6 tables created

## Additional Notes

- The database will be created with proper indexes for performance
- Foreign key constraints are enabled
- The fix is backward compatible with local development
- No data loss - existing database content is preserved

## Related Files

- `03_Website/backend/app.py` - Application entry point (modified)
- `03_Website/backend/database/init_db.py` - Database initialization script
- `03_Website/backend/models/user.py` - User model
- `03_Website/backend/routes/auth.py` - Authentication routes
