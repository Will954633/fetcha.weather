# Fetcha Weather - Getting Started Guide
**Version: v1.0 • Updated: 2025-10-28 19:05 AEST (Brisbane)**

---

## 🎉 Phase 1 Backend Foundation - COMPLETE!

The backend foundation for Fetcha Weather has been successfully implemented. This guide will help you understand what's been built and how to continue development.

---

## ✅ What's Been Built

### 1. Configuration System (`backend/config.py`)
Complete configuration management with:
- **Environment-based configs**: Development, Production, Testing
- **Tier definitions**: Free, Pro, Enterprise with quotas and limits
- **Security settings**: JWT, bcrypt, session management
- **Email configuration**: SendGrid/SES integration ready
- **BOM API integration**: Path to existing weather data API

### 2. Database System (`backend/database/`)
SQLite database with complete schema:
- **Users table**: Authentication, email verification, password reset
- **API Keys table**: Secure key management with hashing
- **Usage Logs table**: Detailed request tracking
- **Monthly Usage table**: Aggregated statistics
- **Email Queue table**: Async email delivery

**Database Features:**
- Foreign key constraints enabled
- Comprehensive indexing for performance
- Initialization script with stats reporting
- Created at: `backend/database/weather.db`

### 3. Data Models (`backend/models/`)

#### User Model (`user.py`)
- ✅ User creation with email verification
- ✅ Password authentication with bcrypt
- ✅ Email verification tokens (24-hour expiry)
- ✅ Password reset flow (1-hour expiry)
- ✅ Login attempt tracking
- ✅ Tier management (free/pro/enterprise)
- ✅ Account activation/deactivation

#### APIKey Model (`api_key.py`)
- ✅ Secure key generation (`fw_` prefix + 32-byte token)
- ✅ SHA-256 key hashing for storage
- ✅ Key validation and user lookup
- ✅ Last used timestamp tracking
- ✅ Key activation/deactivation
- ✅ Multiple keys per user support
- ✅ Key naming for organization

#### Usage Model (`usage.py`)
- ✅ Request logging with full metadata
- ✅ Monthly usage aggregation
- ✅ Quota checking and enforcement
- ✅ Usage statistics (success rate, response times)
- ✅ Endpoint breakdown analytics
- ✅ Daily usage trends
- ✅ Old log cleanup utilities

---

## 📁 Project Structure

```
03_Website/
├── backend/
│   ├── config.py                    ✅ COMPLETE
│   ├── app.py                       ⏳ TODO - Main Flask app
│   ├── requirements.txt             ✅ READY
│   │
│   ├── database/
│   │   ├── init_db.py              ✅ COMPLETE
│   │   └── weather.db              ✅ INITIALIZED (6 tables)
│   │
│   ├── models/
│   │   ├── user.py                 ✅ COMPLETE
│   │   ├── api_key.py              ✅ COMPLETE
│   │   └── usage.py                ✅ COMPLETE
│   │
│   ├── routes/                     ⏳ TODO
│   │   ├── auth.py                 - Authentication endpoints
│   │   ├── api_keys.py             - API key management
│   │   ├── weather.py              - Weather data proxy
│   │   └── usage.py                - Usage tracking
│   │
│   ├── middleware/                 ⏳ TODO
│   │   ├── auth_middleware.py      - JWT validation
│   │   └── rate_limiter.py         - Rate limiting
│   │
│   └── services/                   ⏳ TODO
│       ├── email_service.py        - Email notifications
│       └── weather_service.py      - Weather API integration
│
├── frontend/                       ✅ READY (copied from Fetcha)
│   ├── login.html
│   ├── dashboard.html
│   ├── verify-email.html
│   ├── forgot-password.html
│   ├── css/
│   ├── js/
│   └── assets/
│
└── docs/
    ├── FETCHA_WEATHER_MVP_DEVELOPMENT_PLAN.md    ✅ COMPLETE
    ├── EXECUTIVE_SUMMARY.md                       ✅ COMPLETE
    ├── RAILWAY_DEPLOYMENT.md                      ✅ COMPLETE
    ├── PROJECT_STATUS.md                          ✅ UPDATED
    └── GETTING_STARTED.md                         ✅ THIS FILE
```

---

## 🚀 Quick Start

### 1. Verify Database Setup

```bash
cd 03_Website/backend

# Check database statistics
python database/init_db.py --stats

# Re-initialize database (CAUTION: Deletes all data)
python database/init_db.py --drop
```

### 2. Test Models (Python Interactive)

```python
# Start Python from backend directory
cd 03_Website/backend
python

# Import models
from models.user import User
from models.api_key import APIKey
from models.usage import Usage

# Initialize models
db_path = 'database/weather.db'
user_model = User(db_path)
key_model = APIKey(db_path)
usage_model = Usage(db_path)

# Create a test user
result = user_model.create(
    email='test@example.com',
    password='TestPassword123!',
    full_name='Test User'
)
print(result)

# Create an API key
if result['success']:
    user_id = result['user']['id']
    key_result = key_model.create(user_id, name='Test Key')
    print(f"API Key: {key_result['key_value']}")
```

### 3. Environment Setup

Create a `.env` file in `backend/`:

```env
# Flask
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here

# Database
DATABASE_PATH=database/weather.db

# Email (SendGrid)
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@fetcha.com

# Frontend
FRONTEND_URL=http://localhost:3000

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5000
```

---

## 📝 Next Steps (Phase 1 Continuation)

### Immediate Tasks

#### 1. Create Flask Application (`app.py`)
```python
# Structure:
# - Initialize Flask app with config
# - Set up CORS
# - Initialize JWT
# - Register route blueprints
# - Add error handlers
# - Configure logging
```

#### 2. Authentication Routes (`routes/auth.py`)
Endpoints to implement:
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login (returns JWT)
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/resend-verification` - Resend verification email
- `GET /api/auth/me` - Get current user (requires JWT)

#### 3. API Key Routes (`routes/api_keys.py`)
Endpoints to implement:
- `GET /api/keys` - List user's API keys
- `POST /api/keys` - Generate new API key
- `PUT /api/keys/:id` - Update key name
- `DELETE /api/keys/:id` - Delete API key

#### 4. Weather Proxy (`routes/weather.py`)
Endpoints to implement:
- `GET /api/weather/location` - Get weather data by location
- `GET /api/weather/state` - Get weather data by state
- Integration with existing BOM API

#### 5. Usage Routes (`routes/usage.py`)
Endpoints to implement:
- `GET /api/usage/monthly` - Get monthly usage stats
- `GET /api/usage/recent` - Get recent requests
- `GET /api/usage/stats` - Get detailed statistics

#### 6. Middleware

**JWT Authentication** (`middleware/auth_middleware.py`):
```python
# - Validate JWT tokens
# - Extract user from token
# - Attach user to request
```

**Rate Limiting** (`middleware/rate_limiter.py`):
```python
# - Check tier-based rate limits
# - Track requests per hour
# - Return 429 if exceeded
```

**API Key Validation**:
```python
# - Validate API key header
# - Check quota limits
# - Log usage
```

#### 7. Services

**Email Service** (`services/email_service.py`):
```python
# - SendGrid integration
# - Email templates
# - Queue management
# - Async sending
```

**Weather Service** (`services/weather_service.py`):
```python
# - Import existing BOM API
# - Add caching layer
# - Error handling
# - Response formatting
```

---

## 🧪 Testing Strategy

### Unit Tests
Create `backend/tests/`:
```bash
backend/tests/
├── test_models.py          # Test User, APIKey, Usage models
├── test_auth.py            # Test authentication flow
├── test_api_keys.py        # Test API key management
├── test_weather.py         # Test weather API proxy
└── test_usage.py           # Test usage tracking
```

### Integration Tests
```bash
backend/tests/integration/
├── test_signup_flow.py     # Full user registration
├── test_api_flow.py        # API key generation & usage
└── test_quota_limits.py    # Quota enforcement
```

---

## 📊 Database Management

### Common Operations

```bash
# View database stats
cd 03_Website/backend
python database/init_db.py --stats

# Backup database
cp database/weather.db database/weather_backup_$(date +%Y%m%d).db

# Reset database (development only)
python database/init_db.py --drop
```

### Direct SQL Access

```bash
# Open SQLite CLI
sqlite3 database/weather.db

# Common queries:
sqlite> SELECT * FROM users;
sqlite> SELECT COUNT(*) FROM api_keys;
sqlite> SELECT * FROM monthly_usage;
sqlite> .schema users
sqlite> .quit
```

---

## 🔐 Security Checklist

- ✅ Passwords hashed with bcrypt (12 rounds)
- ✅ API keys hashed with SHA-256
- ✅ JWT tokens with expiration
- ✅ Email verification required
- ✅ Password reset with 1-hour expiry
- ✅ Login attempt tracking
- ✅ Foreign key constraints
- ⏳ TODO: Rate limiting implementation
- ⏳ TODO: CORS configuration
- ⏳ TODO: Input validation
- ⏳ TODO: SQL injection prevention (using parameterized queries ✅)

---

## 💡 Development Tips

### 1. Use Virtual Environment
```bash
cd 03_Website/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Enable Debug Mode
```python
# In app.py
if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

### 3. Monitor Logs
```bash
# Create logs directory
mkdir -p backend/logs

# Tail logs in development
tail -f backend/logs/app.log
```

### 4. API Testing Tools
- **Postman**: For manual API testing
- **curl**: Quick command-line tests
- **pytest**: Automated testing
- **Insomnia**: Alternative to Postman

---

## 📚 Additional Resources

### Documentation
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Flask-JWT-Extended](https://flask-jwt-extended.readthedocs.io/)
- [SQLite Python](https://docs.python.org/3/library/sqlite3.html)
- [bcrypt](https://github.com/pyca/bcrypt/)

### Project Documentation
- [Development Plan](FETCHA_WEATHER_MVP_DEVELOPMENT_PLAN.md)
- [Executive Summary](EXECUTIVE_SUMMARY.md)
- [Railway Deployment](RAILWAY_DEPLOYMENT.md)
- [BOM API Documentation](../01_Australian_Historical_Weather/BOM_Daily_Weather_Observations/BOM_API_SDK_Documentation.md)

---

## 🆘 Troubleshooting

### Database Locked Error
```bash
# Close any SQLite connections
# Kill any running Python processes
pkill -9 python

# Re-initialize database
python database/init_db.py
```

### Import Errors
```bash
# Ensure you're in the backend directory
cd 03_Website/backend

# Verify Python path
python -c "import sys; print(sys.path)"

# Add backend to PYTHONPATH if needed
export PYTHONPATH="${PYTHONPATH}:/path/to/03_Website/backend"
```

### Configuration Issues
```bash
# Check environment variables
python -c "from config import get_config; print(get_config('development').DATABASE_PATH)"

# Verify .env file loaded
python -c "from dotenv import load_dotenv; load_dotenv(); import os; print(os.environ.get('FLASK_ENV'))"
```

---

## 🎯 Progress Tracking

**Phase 1 (Days 1-7): Backend Foundation**
- [x] Day 1-2: Project setup and configuration
- [x] Day 3-4: Database and models
- [ ] Day 5-7: Core API integration (IN PROGRESS)

**Next Session:**
1. Create `app.py` with Flask initialization
2. Implement authentication routes
3. Add JWT middleware
4. Create weather API proxy
5. Test complete flow: Signup → Login → Generate Key → Query Weather

---

## 📞 Support

For questions or issues:
- Review the [Development Plan](FETCHA_WEATHER_MVP_DEVELOPMENT_PLAN.md)
- Check the [BOM API Documentation](../01_Australian_Historical_Weather/BOM_Daily_Weather_Observations/BOM_API_SDK_Documentation.md)
- Refer to model docstrings for usage examples

---

**Last Updated**: 2025-10-28 19:05 AEST (Brisbane)  
**Status**: Phase 1 Backend Foundation - 60% Complete  
**Next Milestone**: Complete authentication and API routes
