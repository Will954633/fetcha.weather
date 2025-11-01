# Prompt for Converting Database Models to SQLAlchemy ORM

Copy and paste this entire prompt into a new Cline/Claude conversation:

---

# Task: Convert Flask Backend from SQLite to SQLAlchemy ORM for PostgreSQL

## Context

I have a Flask backend currently deployed on Railway with PostgreSQL. The backend configuration (`config.py`) is already set up to use PostgreSQL via `SQLALCHEMY_DATABASE_URI`, but the models (`User`, `APIKey`, `Usage`) are using direct SQLite connections which bypass SQLAlchemy entirely.

**Current Issue:** When users sign up on the website, the data isn't being saved to PostgreSQL because the models connect directly to a SQLite file instead of using the SQLAlchemy ORM.

**Goal:** Convert all database models from direct SQLite3 connections to SQLAlchemy ORM so they save to PostgreSQL on Railway.

## Current Setup

**Database Configuration** (`backend/config.py`):
- ✅ Already configured to use PostgreSQL when `DATABASE_URL` environment variable is set
- ✅ `SQLALCHEMY_DATABASE_URI` points to PostgreSQL on Railway
- ✅ PostgreSQL database exists with tables created (`users`, `api_keys`, `usage`)

**Current Models** (using SQLite3 directly):
1. `backend/models/user.py` - User authentication and management
2. `backend/models/api_key.py` - API key generation and validation  
3. `backend/models/usage.py` - API usage tracking

**Routes using these models:**
1. `backend/routes/auth.py` - Signup, login, email verification
2. `backend/routes/api_keys.py` - API key CRUD operations
3. `backend/routes/usage.py` - Usage tracking and reporting

## PostgreSQL Table Schema

Tables are already created with this schema:

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    verification_token_expires TIMESTAMP,
    reset_token TEXT,
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    tier VARCHAR(20) DEFAULT 'free' CHECK(tier IN ('free', 'pro', 'enterprise')),
    is_active BOOLEAN DEFAULT TRUE,
    login_attempts INTEGER DEFAULT 0,
    last_login_attempt TIMESTAMP
);

-- API Keys table
CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_value TEXT UNIQUE NOT NULL,
    key_hash TEXT UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Usage table
CREATE TABLE usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_key_id INTEGER NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    location TEXT,
    state TEXT,
    date_from TEXT,
    date_to TEXT,
    response_time_ms INTEGER,
    status_code INTEGER,
    error_message TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Required Work

### Step 1: Set Up SQLAlchemy in app.py

1. Read `backend/app.py`
2. Add SQLAlchemy initialization:
   ```python
   from flask_sqlalchemy import SQLAlchemy
   
   db = SQLAlchemy()
   
   # In create_app():
   db.init_app(app)
   ```
3. Ensure migrations are supported (Flask-Migrate)

### Step 2: Convert User Model

1. Read `backend/models/user.py`
2. Convert from SQLite3 direct connections to SQLAlchemy ORM:
   - Replace `sqlite3.connect()` with SQLAlchemy db session
   - Convert class to inherit from `db.Model`
   - Define columns using `db.Column`
   - Keep all existing methods (`create`, `authenticate`, `verify_email`, etc.)
   - Ensure password hashing with bcrypt still works
   - Maintain all validation logic

### Step 3: Convert APIKey Model

1. Read `backend/models/api_key.py`
2. Convert to SQLAlchemy ORM:
   - Same conversion as User model
   - Maintain foreign key relationship to User
   - Keep all existing methods

### Step 4: Convert Usage Model

1. Read `backend/models/usage.py`
2. Convert to SQLAlchemy ORM:
   - Same conversion principles
   - Maintain foreign keys to User and APIKey
   - Keep all tracking methods

### Step 5: Update Routes

1. Update `backend/routes/auth.py`:
   - Replace model imports
   - Update to use `db.session.add()` and `db.session.commit()`
   - Handle SQLAlchemy exceptions
   
2. Update `backend/routes/api_keys.py`:
   - Same updates as auth.py
   
3. Update `backend/routes/usage.py`:
   - Same updates as above

### Step 6: Update Dependencies

1. Check `backend/requirements.txt`
2. Add if missing:
   ```
   Flask-SQLAlchemy==3.0.5
   Flask-Migrate==4.0.5
   psycopg2-binary==2.9.9
   ```

### Step 7: Test & Deploy

1. Test locally that models work with PostgreSQL
2. Push changes to GitHub
3. Railway will auto-deploy
4. Test signup on live site: `https://precious-lily-eed7a8.netlify.app/login.html`
5. Verify signup saves to PostgreSQL:
   ```bash
   railway connect postgres
   SELECT * FROM users;
   ```

## Important Requirements

1. **Maintain ALL existing functionality** - every method must work exactly as before
2. **Preserve data types** - match the PostgreSQL schema exactly  
3. **Keep error handling** - maintain or improve error messages
4. **No breaking changes** - routes should work without modification (or minimal changes)
5. **Use Flask-SQLAlchemy best practices** - proper session management
6. **Handle migrations** - set up Flask-Migrate for future schema changes

## Success Criteria

1. ✅ User signup on website saves to PostgreSQL database
2. ✅ Login authentication works
3. ✅ API key generation saves to PostgreSQL
4. ✅ Usage tracking saves to PostgreSQL
5. ✅ All existing routes continue  to work
6. ✅ No errors in Railway logs
7. ✅ Database queries via `railway connect postgres` show saved data

## Files to Modify

**Core Models:**
- `backend/models/user.py` (complete rewrite to SQLAlchemy)
- `backend/models/api_key.py` (complete rewrite to SQLAlchemy)
- `backend/models/usage.py` (complete rewrite to SQLAlchemy)

**Application Setup:**
- `backend/app.py` (add SQLAlchemy initialization)
-`backend/models/__init__.py` (create if doesn't exist, export db and models)

**Routes (update to use new models):**
- `backend/routes/auth.py`
- `backend/routes/api_keys.py`
- `backend/routes/usage.py`

**Dependencies:**
- `backend/requirements.txt` (add SQLAlchemy packages)

## Working Directory

```
/Users/willsimpson/Documents/Weather_Data_API/03_Website
```

## Deployment

- Backend is on Railway, auto-deploys from GitHub
- Frontend is on Netlify: `https://precious-lily-eed7a8.netlify.app`
- PostgreSQL database is on Railway with DATABASE_URL environment variable set

## Additional Context

- Email verification is disabled (users are auto-verified on signup)
- Password requirements: 8+ chars, 1 uppercase, 1 lowercase, 1 number
- BCrypt is used for password hashing
- JWT tokens for authentication
- CORS is configured for Netlify frontend

## Start Here

1. Read the current models to understand the structure
2. Create SQLAlchemy versions maintaining all methods
3. Test locally first if possible
4. Deploy to Railway and test live

Please complete this conversion, ensuring all data saves to PostgreSQL correctly. Test thoroughly and confirm signup works end-to-end.
