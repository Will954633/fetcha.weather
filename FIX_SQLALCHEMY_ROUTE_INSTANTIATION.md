# SQLAlchemy Route Instantiation Fix

**Version:** v1.0  
**Updated:** 2025-03-11 14:02 AEST (Brisbane)

## Issue Summary

New users were unable to create API keys or view usage statistics, receiving 500 errors on all dashboard endpoints related to API keys and usage tracking.

### Console Errors
```
Failed to load resource: the server responded with a status of 500 ()
- /api/keys (GET) - Failed to load API keys
- /api/keys (POST) - Failed to create API key
- /api/usage/stats (GET) - Failed to load stats
- /api/usage/recent (GET) - Failed to load recent queries
```

## Root Cause

After converting from SQLite3 to SQLAlchemy ORM (PostgreSQL), the route handlers were still attempting to instantiate model classes with `DB_PATH`:

**Before (Incorrect):**
```python
api_key_model = APIKey(DB_PATH)
keys = api_key_model.get_by_user(user_id)
```

This caused errors because SQLAlchemy models:
1. Don't take a database path parameter in their constructor
2. Use static methods that should be called directly on the class

## Solution

Updated both `routes/api_keys.py` and `routes/usage.py` to call static methods directly on the model classes:

**After (Correct):**
```python
keys = APIKey.get_by_user(user_id)
```

### Files Modified

#### 1. `backend/routes/api_keys.py`
- Removed `DB_PATH` variable
- Changed all model instantiations to direct static method calls:
  - `APIKey.get_by_user()`
  - `APIKey.count_active_keys()`
  - `APIKey.create()`
  - `APIKey.get_by_id()`
  - `APIKey.update_name()`
  - `APIKey.deactivate()`
  - `APIKey.delete()`
  - `APIKey.validate()`
  - `User.get_by_id()`

#### 2. `backend/routes/usage.py`
- Removed `DB_PATH` variable
- Changed all model instantiations to direct static method calls:
  - `Usage.get_monthly_usage()`
  - `Usage.check_quota()`
  - `Usage.get_recent_requests()`
  - `Usage.get_usage_stats()`
  - `Usage.get_endpoint_breakdown()`
  - `Usage.get_daily_usage()`
  - `User.get_by_id()`

#### 3. `backend/routes/weather.py`
- Removed `DB_PATH` variable
- Changed all model instantiations to direct static method calls:
  - `APIKey.validate()`
  - `User.get_by_id()`
  - `Usage.check_quota()`
  - `Usage.log_request()`

## Deployment

**Commit 1:** 19bd02f - "Fix: Remove DB_PATH instantiation from routes - use SQLAlchemy static methods"  
**Commit 2:** dfad983 - "Fix: Remove DB_PATH from weather routes - use SQLAlchemy static methods"

Changes pushed to GitHub and automatically deployed to Railway.

## Testing

After Railway completes deployment (~2-3 minutes), test with the new user (testx01@gmail.com):

1. **Login** - Should succeed ✓
2. **Load Dashboard** - Should display without errors ✓
3. **View Usage Stats** - Should show 0/1000 quota ✓
4. **Create API Key** - Should generate and display key ✓
5. **View API Keys** - Should list created key ✓
6. **View Recent Queries** - Should show empty list initially ✓
7. **Run Quick Query** - Should fetch weather data successfully ✓

## Impact

- **Affected:** All new users trying to use the dashboard
- **Severity:** Critical - Complete dashboard failure for new users
- **Resolution Time:** ~15 minutes from identification to deployment

## Prevention

This issue occurred because:
1. The SQLAlchemy conversion was incomplete in the routes layer
2. No integration tests were run on new user signup flow
3. The previous user account had existing data that may have masked the issue

**Recommendation:** Add integration tests for new user dashboard initialization.

## Related Documentation

- `SQLALCHEMY_CONVERSION_COMPLETE.md` - Initial SQLAlchemy conversion
- `POSTGRESQL_FIX_APPLIED.md` - PostgreSQL connection fixes
