"""
Fetcha Weather - User Model (SQLAlchemy ORM)
Version: v2.0 • Updated: 2025-01-11 20:55 AEST (Brisbane)
Converted from SQLite3 to SQLAlchemy ORM for PostgreSQL compatibility
"""

import bcrypt
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy import CheckConstraint
from sqlalchemy.exc import IntegrityError

# Import db from __init__.py will be handled at runtime to avoid circular imports
from . import db


class User(db.Model):
    """User model for authentication and account management"""
    
    __tablename__ = 'users'
    
    # Columns
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.Text, nullable=False)
    full_name = db.Column(db.String(255), nullable=False)
    email_verified = db.Column(db.Boolean, default=False, nullable=False)
    verification_token = db.Column(db.Text, nullable=True)
    verification_token_expires = db.Column(db.DateTime, nullable=True)
    reset_token = db.Column(db.Text, nullable=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)
    tier = db.Column(db.String(20), default='free', nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    login_attempts = db.Column(db.Integer, default=0, nullable=False)
    last_login_attempt = db.Column(db.DateTime, nullable=True)
    
    # Table constraints
    __table_args__ = (
        CheckConstraint("tier IN ('free', 'pro', 'enterprise')", name='check_tier'),
    )
    
    # Relationships
    api_keys = db.relationship('APIKey', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    usage_logs = db.relationship('Usage', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, include_sensitive=False):
        """
        Convert user object to dictionary
        
        Args:
            include_sensitive: Include password_hash and tokens
            
        Returns:
            Dict representation of user
        """
        user_dict = {
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name,
            'email_verified': self.email_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'tier': self.tier,
            'is_active': self.is_active,
            'login_attempts': self.login_attempts,
            'last_login_attempt': self.last_login_attempt.isoformat() if self.last_login_attempt else None
        }
        
        if include_sensitive:
            user_dict.update({
                'password_hash': self.password_hash,
                'verification_token': self.verification_token,
                'verification_token_expires': self.verification_token_expires.isoformat() if self.verification_token_expires else None,
                'reset_token': self.reset_token,
                'reset_token_expires': self.reset_token_expires.isoformat() if self.reset_token_expires else None
            })
        
        return user_dict
    
    @staticmethod
    def create(email: str, password: str, full_name: str) -> Dict[str, Any]:
        """
        Create a new user
        
        Args:
            email: User email address
            password: Plain text password (will be hashed)
            full_name: User's full name
            
        Returns:
            Dict with user data or error
        """
        try:
            # Hash password
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')
            
            # Generate verification token
            verification_token = secrets.token_urlsafe(32)
            verification_expires = datetime.utcnow() + timedelta(hours=24)
            
            # Create user instance
            user = User(
                email=email.lower(),
                password_hash=password_hash,
                full_name=full_name,
                verification_token=verification_token,
                verification_token_expires=verification_expires
            )
            
            # Add to session and commit
            db.session.add(user)
            db.session.commit()
            
            return {
                'success': True,
                'user': user.to_dict(),
                'verification_token': verification_token
            }
            
        except IntegrityError:
            db.session.rollback()
            return {
                'success': False,
                'error': 'Email already exists'
            }
        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def authenticate(email: str, password: str) -> Dict[str, Any]:
        """
        Authenticate user with email and password
        
        Args:
            email: User email
            password: Plain text password
            
        Returns:
            Dict with user data or error
        """
        try:
            user = User.query.filter_by(email=email.lower(), is_active=True).first()
            
            if not user:
                return {
                    'success': False,
                    'error': 'Invalid email or password'
                }
            
            # Check password
            if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
                # Increment login attempts
                user.login_attempts += 1
                user.last_login_attempt = datetime.utcnow()
                db.session.commit()
                return {
                    'success': False,
                    'error': 'Invalid email or password'
                }
            
            # Check if email is verified
            # TEMPORARILY DISABLED - Email service not working, allow login without verification
            # TODO: Re-enable when email service is configured
            # if not user.email_verified:
            #     return {
            #         'success': False,
            #         'error': 'Email not verified. Please check your inbox.'
            #     }
            
            # Reset login attempts and update last login
            user.login_attempts = 0
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            return {
                'success': True,
                'user': user.to_dict()
            }
            
        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def verify_email(token: str) -> Dict[str, Any]:
        """
        Verify user email with token
        
        Args:
            token: Verification token
            
        Returns:
            Dict with success status
        """
        try:
            user = User.query.filter(
                User.verification_token == token,
                User.verification_token_expires > datetime.utcnow()
            ).first()
            
            if not user:
                return {
                    'success': False,
                    'error': 'Invalid or expired verification token'
                }
            
            # Update user as verified
            user.email_verified = True
            user.verification_token = None
            user.verification_token_expires = None
            db.session.commit()
            
            return {
                'success': True,
                'user': user.to_dict()
            }
            
        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def request_password_reset(email: str) -> Dict[str, Any]:
        """
        Generate password reset token
        
        Args:
            email: User email
            
        Returns:
            Dict with reset token
        """
        try:
            user = User.query.filter_by(email=email.lower()).first()
            
            if not user:
                # Don't reveal if email exists
                return {
                    'success': True,
                    'message': 'If email exists, reset link will be sent'
                }
            
            # Generate reset token
            reset_token = secrets.token_urlsafe(32)
            reset_expires = datetime.utcnow() + timedelta(hours=1)
            
            user.reset_token = reset_token
            user.reset_token_expires = reset_expires
            db.session.commit()
            
            return {
                'success': True,
                'reset_token': reset_token,
                'email': email.lower()
            }
            
        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def reset_password(token: str, new_password: str) -> Dict[str, Any]:
        """
        Reset password with token
        
        Args:
            token: Reset token
            new_password: New password (plain text)
            
        Returns:
            Dict with success status
        """
        try:
            user = User.query.filter(
                User.reset_token == token,
                User.reset_token_expires > datetime.utcnow()
            ).first()
            
            if not user:
                return {
                    'success': False,
                    'error': 'Invalid or expired reset token'
                }
            
            # Hash new password
            password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')
            
            # Update password and clear reset token
            user.password_hash = password_hash
            user.reset_token = None
            user.reset_token_expires = None
            db.session.commit()
            
            return {
                'success': True,
                'message': 'Password reset successfully'
            }
            
        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def get_by_id(user_id: int) -> Optional['User']:
        """Get user by ID"""
        return User.query.get(user_id)
    
    @staticmethod
    def get_by_email(email: str) -> Optional['User']:
        """Get user by email"""
        return User.query.filter_by(email=email.lower()).first()
    
    @staticmethod
    def update_tier(user_id: int, tier: str) -> Dict[str, Any]:
        """
        Update user tier
        
        Args:
            user_id: User ID
            tier: New tier (free, pro, enterprise)
            
        Returns:
            Dict with success status
        """
        if tier not in ['free', 'pro', 'enterprise']:
            return {
                'success': False,
                'error': 'Invalid tier'
            }
        
        try:
            user = User.query.get(user_id)
            
            if not user:
                return {
                    'success': False,
                    'error': 'User not found'
                }
            
            user.tier = tier
            db.session.commit()
            
            return {
                'success': True,
                'message': f'Tier updated to {tier}'
            }
            
        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def resend_verification(email: str) -> Dict[str, Any]:
        """
        Resend verification email
        
        Args:
            email: User email
            
        Returns:
            Dict with new verification token
        """
        try:
            user = User.query.filter_by(email=email.lower()).first()
            
            if not user:
                return {
                    'success': False,
                    'error': 'Email not found'
                }
            
            if user.email_verified:
                return {
                    'success': False,
                    'error': 'Email already verified'
                }
            
            # Generate new token
            verification_token = secrets.token_urlsafe(32)
            verification_expires = datetime.utcnow() + timedelta(hours=24)
            
            user.verification_token = verification_token
            user.verification_token_expires = verification_expires
            db.session.commit()
            
            return {
                'success': True,
                'verification_token': verification_token,
                'email': email.lower()
            }
            
        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'error': str(e)
            }
