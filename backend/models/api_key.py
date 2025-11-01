"""
Fetcha Weather - API Key Model (SQLAlchemy ORM)
Version: v2.0 • Updated: 2025-01-11 20:56 AEST (Brisbane)
Converted from SQLite3 to SQLAlchemy ORM for PostgreSQL compatibility
"""

import secrets
import hashlib
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.exc import IntegrityError

# Import db from __init__.py will be handled at runtime to avoid circular imports
from . import db


class APIKey(db.Model):
    """API Key model for managing user API keys"""
    
    __tablename__ = 'api_keys'
    
    # Columns
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    key_value = db.Column(db.Text, unique=True, nullable=False)
    key_hash = db.Column(db.Text, unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_used = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    # Relationships
    usage_logs = db.relationship('Usage', backref='api_key', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, include_key_value=False):
        """
        Convert API key object to dictionary
        
        Args:
            include_key_value: Include full key value
            
        Returns:
            Dict representation of API key
        """
        api_key_dict = {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_used': self.last_used.isoformat() if self.last_used else None,
            'is_active': self.is_active
        }
        
        if include_key_value:
            api_key_dict['key_value'] = self.key_value
        
        return api_key_dict
    
    @staticmethod
    def _generate_key() -> str:
        """Generate a secure API key"""
        return f"fw_{secrets.token_urlsafe(32)}"
    
    @staticmethod
    def _hash_key(key: str) -> str:
        """Hash an API key for storage"""
        return hashlib.sha256(key.encode()).hexdigest()
    
    @staticmethod
    def create(user_id: int, name: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a new API key for a user
        
        Args:
            user_id: User ID
            name: Optional name for the key
            
        Returns:
            Dict with API key data
        """
        try:
            # Generate key
            key_value = APIKey._generate_key()
            key_hash = APIKey._hash_key(key_value)
            
            # Create API key instance
            api_key = APIKey(
                user_id=user_id,
                key_value=key_value,
                key_hash=key_hash,
                name=name
            )
            
            # Add to session and commit
            db.session.add(api_key)
            db.session.commit()
            
            return {
                'success': True,
                'api_key': api_key.to_dict(),
                'key_value': key_value  # Only returned once at creation
            }
            
        except IntegrityError as e:
            db.session.rollback()
            return {
                'success': False,
                'error': f'Failed to create API key: {str(e)}'
            }
        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def validate(key_value: str) -> Dict[str, Any]:
        """
        Validate an API key and return associated user
        
        Args:
            key_value: API key to validate
            
        Returns:
            Dict with validation result and user data
        """
        try:
            key_hash = APIKey._hash_key(key_value)
            
            # Join with User table to get user details
            api_key = db.session.query(APIKey).join(APIKey.user).filter(
                APIKey.key_hash == key_hash,
                APIKey.is_active == True
            ).first()
            
            if not api_key:
                return {
                    'success': False,
                    'error': 'Invalid API key'
                }
            
            # Check if user account is active
            if not api_key.user.is_active:
                return {
                    'success': False,
                    'error': 'User account is inactive'
                }
            
            # Email verification not required for MVP - dashboard login is sufficient security
            
            # Update last used timestamp
            api_key.last_used = datetime.utcnow()
            db.session.commit()
            
            # Build response with user data
            api_key_data = api_key.to_dict()
            api_key_data['email'] = api_key.user.email
            api_key_data['tier'] = api_key.user.tier
            api_key_data['email_verified'] = api_key.user.email_verified
            api_key_data['user_active'] = api_key.user.is_active
            
            return {
                'success': True,
                'api_key': api_key_data
            }
            
        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def get_by_user(user_id: int, include_inactive: bool = False) -> List[Dict[str, Any]]:
        """
        Get all API keys for a user
        
        Args:
            user_id: User ID
            include_inactive: Include inactive keys
            
        Returns:
            List of API key dictionaries with full key values
        """
        try:
            query = APIKey.query.filter_by(user_id=user_id)
            
            if not include_inactive:
                query = query.filter_by(is_active=True)
            
            api_keys = query.order_by(APIKey.created_at.desc()).all()
            
            # Return full key values - user is authenticated via dashboard login
            # No need to hide keys since they're already behind authentication
            return [key.to_dict(include_key_value=True) for key in api_keys]
            
        except Exception as e:
            return []
    
    @staticmethod
    def get_by_id(key_id: int) -> Optional[Dict[str, Any]]:
        """
        Get API key by ID
        
        Args:
            key_id: API key ID
            
        Returns:
            API key dictionary with full key value or None
        """
        try:
            api_key = APIKey.query.get(key_id)
            
            if not api_key:
                return None
            
            # Return full key value - user is authenticated
            return api_key.to_dict(include_key_value=True)
            
        except Exception as e:
            return None
    
    @staticmethod
    def deactivate(key_id: int, user_id: int) -> Dict[str, Any]:
        """
        Deactivate an API key
        
        Args:
            key_id: API key ID
            user_id: User ID (for security - must own the key)
            
        Returns:
            Dict with success status
        """
        try:
            # Verify ownership
            api_key = APIKey.query.filter_by(id=key_id, user_id=user_id).first()
            
            if not api_key:
                return {
                    'success': False,
                    'error': 'API key not found or access denied'
                }
            
            # Deactivate
            api_key.is_active = False
            db.session.commit()
            
            return {
                'success': True,
                'message': 'API key deactivated'
            }
            
        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def delete(key_id: int, user_id: int) -> Dict[str, Any]:
        """
        Permanently delete an API key
        
        Args:
            key_id: API key ID
            user_id: User ID (for security - must own the key)
            
        Returns:
            Dict with success status
        """
        try:
            # Verify ownership
            api_key = APIKey.query.filter_by(id=key_id, user_id=user_id).first()
            
            if not api_key:
                return {
                    'success': False,
                    'error': 'API key not found or access denied'
                }
            
            # Delete
            db.session.delete(api_key)
            db.session.commit()
            
            return {
                'success': True,
                'message': 'API key deleted'
            }
            
        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def update_name(key_id: int, user_id: int, name: str) -> Dict[str, Any]:
        """
        Update API key name
        
        Args:
            key_id: API key ID
            user_id: User ID (for security - must own the key)
            name: New name
            
        Returns:
            Dict with success status
        """
        try:
            # Verify ownership
            api_key = APIKey.query.filter_by(id=key_id, user_id=user_id).first()
            
            if not api_key:
                return {
                    'success': False,
                    'error': 'API key not found or access denied'
                }
            
            # Update
            api_key.name = name
            db.session.commit()
            
            return {
                'success': True,
                'message': 'API key name updated'
            }
            
        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def count_active_keys(user_id: int) -> int:
        """
        Count active API keys for a user
        
        Args:
            user_id: User ID
            
        Returns:
            Number of active keys
        """
        try:
            count = APIKey.query.filter_by(user_id=user_id, is_active=True).count()
            return count
        except Exception as e:
            return 0
