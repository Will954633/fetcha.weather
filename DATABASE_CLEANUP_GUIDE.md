# Database Cleanup Guide

Version: v1.0 • Updated: 2025-01-11 10:13 AEST (Brisbane)

## Overview

This guide provides instructions for clearing user data from the database during development and testing.

## Available Scripts

### 1. List All Users
View all users currently in the database:
```bash
cd 03_Website/backend
python clear_user.py --list
```

### 2. Clear All Users (Automated)
Remove all users from the database without confirmation (for testing):
```bash
cd 03_Website/backend
python clear_all_users.py
```

### 3. Clear Specific User (Interactive)
Remove a specific user with confirmation:
```bash
cd 03_Website/backend
python clear_user.py --email user@example.com
```

## What Gets Deleted

When a user is deleted, the following data is automatically removed (via CASCADE):
- User account record
- All API keys associated with the user
- All usage logs for the user
- Monthly usage summary records
- Any pending emails in the queue for that user

## Production Warning

⚠️ **IMPORTANT**: These scripts are designed for development/testing environments. Never use them in production without proper backups and authorization.

## Current Status

✅ **Database is clean** - No users in the database
- Ready for signup testing
- No saved email addresses
- Fresh start for testing signup form

## Testing the Signup Form

Now that the database is clean, you can test the signup form at:
https://precious-lily-eed7a8.netlify.app/login?signup=true

The form should work without any "Email already exists" errors.

## Database Location

The SQLite database is located at:
```
03_Website/backend/database/weather.db
```

## Script Locations

- `03_Website/backend/clear_user.py` - Interactive user management
- `03_Website/backend/clear_all_users.py` - Automated cleanup (no confirmation)
- `03_Website/backend/database/init_db.py` - Database initialization

## Common Issues

### Issue: Database not found
**Solution**: Run the database initialization script first:
```bash
cd 03_Website/backend
python database/init_db.py
```

### Issue: Permission denied
**Solution**: Ensure you have write permissions to the database directory.

### Issue: Foreign key constraint errors
**Solution**: The scripts automatically enable foreign key constraints. If issues persist, check the database schema.
