"""
Fetcha Weather - Database Models Module
Version: v1.0 • Updated: 2025-01-11 20:55 AEST (Brisbane)
"""

from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy instance
db = SQLAlchemy()

# Import models after db is created to avoid circular imports
from .user import User
from .api_key import APIKey
from .usage import Usage, MonthlyUsage

__all__ = ['db', 'User', 'APIKey', 'Usage', 'MonthlyUsage']
