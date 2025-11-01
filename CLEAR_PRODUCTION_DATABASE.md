# Clear Production Database on Railway

Version: v1.0 • Updated: 2025-01-11 10:17 AEST (Brisbane)

## Issue

The signup form is hitting the production backend on Railway (`web-production-2d722.up.railway.app`), not the local database. We need to clear the production database.

## Solution

I've added admin endpoints to the backend that allow you to manage users on the production database.

## Using the Admin Endpoints

### Option 1: Using curl (Recommended)

**List all users in production:**
```bash
curl -X GET https://web-production-2d722.up.railway.app/api/admin/list-users \
  -H "X-Admin-Key: dev-only-key-change-in-production"
```

**Clear all users from production:**
```bash
curl -X POST https://web-production-2d722.up.railway.app/api/admin/clear-users \
  -H "X-Admin-Key: dev-only-key-change-in-production" \
  -H "Content-Type: application/json"
```

**Get database statistics:**
```bash
curl -X GET https://web-production-2d722.up.railway.app/api/admin/db-stats \
  -H "X-Admin-Key: dev-only-key-change-in-production"
```

### Option 2: Using the Python Script

I've also created a Python script for you:

```bash
cd 03_Website/backend
python clear_production_db.py
```

## Security Notes

⚠️ **IMPORTANT**: The admin key is currently set to `dev-only-key-change-in-production` for testing.

In production, you should:
1. Set a strong `ADMIN_KEY` environment variable in Railway
2. Or remove these admin endpoints entirely once testing is complete

## What Happens When You Clear Users

When you clear users from the database, the following data is automatically deleted:
- User accounts
- All API keys associated with those users
- Usage logs
- Monthly usage summaries
- Pending emails

## After Clearing

Once you've cleared the production database:
1. The signup form will work without "Email already exists" errors
2. You can test the complete signup flow
3. The database will be clean for fresh testing

## Deployment Status

The admin endpoints have been added to the codebase but need to be deployed to Railway:

1. Commit the changes:
   ```bash
   git add 03_Website/backend/routes/admin.py
   git add 03_Website/backend/app.py
   git commit -m "Add admin endpoints for database management"
   git push
   ```

2. Railway will automatically deploy the changes

3. Wait a few minutes for deployment

4. Then run the clear-users command above
