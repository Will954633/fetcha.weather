"""
Fetcha Weather - Backend Configuration
Version: v1.0 • Updated: 2025-10-28 19:01 AEST (Brisbane)
"""

import os
from datetime import timedelta

class Config:
    """Base configuration class"""
    
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = False
    TESTING = False
    
    # Database
    DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'database', 'weather.db')
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{DATABASE_PATH}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Authentication
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5000').split(',')
    
    # Email Configuration
    EMAIL_SERVICE = os.environ.get('EMAIL_SERVICE', 'sendgrid')  # sendgrid, ses, smtp
    SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
    EMAIL_FROM = os.environ.get('EMAIL_FROM', 'noreply@fetcha.com')
    EMAIL_FROM_NAME = os.environ.get('EMAIL_FROM_NAME', 'Fetcha Weather')
    
    # Frontend URLs
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    VERIFY_EMAIL_URL = f"{FRONTEND_URL}/verify-email"
    RESET_PASSWORD_URL = f"{FRONTEND_URL}/reset-password"
    
    # API Rate Limiting
    RATE_LIMIT_ENABLED = True
    RATE_LIMIT_STORAGE_URL = os.environ.get('RATE_LIMIT_STORAGE_URL', 'memory://')
    
    # Tier Configurations
    TIERS = {
        'free': {
            'monthly_quota': 100,
            'rate_limit': '10/hour',
            'timeout_seconds': 180,
            'features': ['basic_access', 'email_support']
        },
        'pro': {
            'monthly_quota': 5000,
            'rate_limit': '100/hour',
            'timeout_seconds': 300,
            'features': ['basic_access', 'priority_support', 'batch_queries', 'higher_limits']
        },
        'enterprise': {
            'monthly_quota': -1,  # Unlimited
            'rate_limit': '1000/hour',
            'timeout_seconds': 600,
            'features': ['all', 'sla', 'dedicated_support', 'custom_solutions', 'data_caching']
        }
    }
    
    # Weather API Configuration
    WEATHER_API_TIMEOUT = 300  # 5 minutes max
    WEATHER_API_MAX_RETRIES = 3
    WEATHER_API_CACHE_ENABLED = True
    WEATHER_API_CACHE_TTL = 3600  # 1 hour
    
    # BOM API Settings
    BOM_API_PATH = os.environ.get('BOM_API_PATH', 
                                   os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                                               '01_Australian_Historical_Weather',
                                               'BOM_Daily_Weather_Observations',
                                               'bom_daily_observations_api.py'))
    
    # Security
    BCRYPT_LOG_ROUNDS = 12
    MAX_LOGIN_ATTEMPTS = 5
    LOGIN_ATTEMPT_WINDOW = 900  # 15 minutes in seconds
    
    # Session
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    SESSION_COOKIE_SECURE = True  # HTTPS only in production
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FILE = os.path.join(os.path.dirname(__file__), 'logs', 'app.log')
    
    # Monitoring
    SENTRY_DSN = os.environ.get('SENTRY_DSN', '')
    ENABLE_METRICS = True


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SESSION_COOKIE_SECURE = False  # Allow HTTP in development
    CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:5001', 'http://localhost:8000', 'http://127.0.0.1:3000', 'http://127.0.0.1:5000', 'http://127.0.0.1:5001', 'http://127.0.0.1:8000', 'null']  # 'null' allows file:// protocol


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    # Override with environment variables in production
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    
    # Production URLs
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://weather.fetcha.com')
    VERIFY_EMAIL_URL = f"{FRONTEND_URL}/verify-email"
    RESET_PASSWORD_URL = f"{FRONTEND_URL}/reset-password"
    
    # Production CORS - Allow multiple origins
    # Split comma-separated list from environment variable
    cors_env = os.environ.get('CORS_ORIGINS', '')
    if cors_env:
        CORS_ORIGINS = [origin.strip() for origin in cors_env.split(',') if origin.strip()]
    else:
        # Default fallback
        CORS_ORIGINS = ['https://weather.fetcha.com']
    
    # Production security
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_SAMESITE = 'Strict'


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    DATABASE_PATH = ':memory:'  # In-memory database for tests
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    RATE_LIMIT_ENABLED = False


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}


def get_config(config_name=None):
    """Get configuration based on environment"""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    return config.get(config_name, DevelopmentConfig)
