"""
Fetcha Weather - User Model
Version: v1.0 • Updated: 2025-10-28 19:02 AEST (Brisbane)
"""

import sqlite3
import bcrypt
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any


class User:
    """User model for authentication and account management"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
    
    def _get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute('PRAGMA foreign_keys = ON')
        return conn
    
    def create(self, email: str, password: str, full_name: str) -> Dict[str, Any]:
        """
        Create a new user
        
        Args:
            email: User email address
            password: Plain text password (will be hashed)
            full_name: User's full name
            
        Returns:
            Dict with user data or error
        """
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # Hash password
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')
            
            # Generate verification token
            verification_token = secrets.token_urlsafe(32)
            verification_expires = datetime.now() + timedelta(hours=24)
            
            # Insert user
            cursor.execute('''
                INSERT INTO users (email, password_hash, full_name, verification_token, verification_token_expires)
                VALUES (?, ?, ?, ?, ?)
            ''', (email.lower(), password_hash, full_name, verification_token, verification_expires))
            
            user_id = cursor.lastrowid
            conn.commit()
            
            # Get created user
            cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
            user = dict(cursor.fetchone())
            
            # Remove sensitive data
            user.pop('password_hash', None)
            
            return {
                'success': True,
                'user': user,
                'verification_token': verification_token
            }
            
        except sqlite3.IntegrityError:
            return {
                'success': False,
                'error': 'Email already exists'
            }
        finally:
            conn.close()
    
    def authenticate(self, email: str, password: str) -> Dict[str, Any]:
        """
        Authenticate user with email and password
        
        Args:
            email: User email
            password: Plain text password
            
        Returns:
            Dict with user data or error
        """
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('SELECT * FROM users WHERE email = ? AND is_active = 1', (email.lower(),))
            user_row = cursor.fetchone()
            
            if not user_row:
                return {
                    'success': False,
                    'error': 'Invalid email or password'
                }
            
            user = dict(user_row)
            
            # Check password
            if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
                # Increment login attempts
                self._increment_login_attempts(user['id'])
                return {
                    'success': False,
                    'error': 'Invalid email or password'
                }
            
            # Check if email is verified
            # TEMPORARILY DISABLED - Email service not working, allow login without verification
            # TODO: Re-enable when email service is configured
            # if not user['email_verified']:
            #     return {
            #         'success': False,
            #         'error': 'Email not verified. Please check your inbox.'
            #     }
            
            # Reset login attempts
            cursor.execute('''
                UPDATE users 
                SET login_attempts = 0, last_login = ? 
                WHERE id = ?
            ''', (datetime.now(), user['id']))
            conn.commit()
            
            # Remove sensitive data
            user.pop('password_hash', None)
            user.pop('verification_token', None)
            user.pop('reset_token', None)
            
            return {
                'success': True,
                'user': user
            }
            
        finally:
            conn.close()
    
    def _increment_login_attempts(self, user_id: int):
        """Increment failed login attempts"""
        conn = self._get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute('''
                UPDATE users 
                SET login_attempts = login_attempts + 1, last_login_attempt = ?
                WHERE id = ?
            ''', (datetime.now(), user_id))
            conn.commit()
        finally:
            conn.close()
    
    def verify_email(self, token: str) -> Dict[str, Any]:
        """
        Verify user email with token
        
        Args:
            token: Verification token
            
        Returns:
            Dict with success status
        """
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                SELECT * FROM users 
                WHERE verification_token = ? AND verification_token_expires > ?
            ''', (token, datetime.now()))
            
            user_row = cursor.fetchone()
            
            if not user_row:
                return {
                    'success': False,
                    'error': 'Invalid or expired verification token'
                }
            
            # Update user as verified
            cursor.execute('''
                UPDATE users 
                SET email_verified = 1, verification_token = NULL, verification_token_expires = NULL
                WHERE verification_token = ?
            ''', (token,))
            conn.commit()
            
            user = dict(user_row)
            user.pop('password_hash', None)
            
            return {
                'success': True,
                'user': user
            }
            
        finally:
            conn.close()
    
    def request_password_reset(self, email: str) -> Dict[str, Any]:
        """
        Generate password reset token
        
        Args:
            email: User email
            
        Returns:
            Dict with reset token
        """
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('SELECT * FROM users WHERE email = ?', (email.lower(),))
            user_row = cursor.fetchone()
            
            if not user_row:
                # Don't reveal if email exists
                return {
                    'success': True,
                    'message': 'If email exists, reset link will be sent'
                }
            
            # Generate reset token
            reset_token = secrets.token_urlsafe(32)
            reset_expires = datetime.now() + timedelta(hours=1)
            
            cursor.execute('''
                UPDATE users 
                SET reset_token = ?, reset_token_expires = ?
                WHERE email = ?
            ''', (reset_token, reset_expires, email.lower()))
            conn.commit()
            
            return {
                'success': True,
                'reset_token': reset_token,
                'email': email.lower()
            }
            
        finally:
            conn.close()
    
    def reset_password(self, token: str, new_password: str) -> Dict[str, Any]:
        """
        Reset password with token
        
        Args:
            token: Reset token
            new_password: New password (plain text)
            
        Returns:
            Dict with success status
        """
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                SELECT * FROM users 
                WHERE reset_token = ? AND reset_token_expires > ?
            ''', (token, datetime.now()))
            
            user_row = cursor.fetchone()
            
            if not user_row:
                return {
                    'success': False,
                    'error': 'Invalid or expired reset token'
                }
            
            # Hash new password
            password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')
            
            # Update password and clear reset token
            cursor.execute('''
                UPDATE users 
                SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL
                WHERE reset_token = ?
            ''', (password_hash, token))
            conn.commit()
            
            return {
                'success': True,
                'message': 'Password reset successfully'
            }
            
        finally:
            conn.close()
    
    def get_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
            user_row = cursor.fetchone()
            
            if not user_row:
                return None
            
            user = dict(user_row)
            user.pop('password_hash', None)
            user.pop('verification_token', None)
            user.pop('reset_token', None)
            
            return user
            
        finally:
            conn.close()
    
    def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('SELECT * FROM users WHERE email = ?', (email.lower(),))
            user_row = cursor.fetchone()
            
            if not user_row:
                return None
            
            user = dict(user_row)
            user.pop('password_hash', None)
            user.pop('verification_token', None)
            user.pop('reset_token', None)
            
            return user
            
        finally:
            conn.close()
    
    def update_tier(self, user_id: int, tier: str) -> Dict[str, Any]:
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
        
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('UPDATE users SET tier = ? WHERE id = ?', (tier, user_id))
            conn.commit()
            
            if cursor.rowcount == 0:
                return {
                    'success': False,
                    'error': 'User not found'
                }
            
            return {
                'success': True,
                'message': f'Tier updated to {tier}'
            }
            
        finally:
            conn.close()
    
    def resend_verification(self, email: str) -> Dict[str, Any]:
        """
        Resend verification email
        
        Args:
            email: User email
            
        Returns:
            Dict with new verification token
        """
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('SELECT * FROM users WHERE email = ?', (email.lower(),))
            user_row = cursor.fetchone()
            
            if not user_row:
                return {
                    'success': False,
                    'error': 'Email not found'
                }
            
            user = dict(user_row)
            
            if user['email_verified']:
                return {
                    'success': False,
                    'error': 'Email already verified'
                }
            
            # Generate new token
            verification_token = secrets.token_urlsafe(32)
            verification_expires = datetime.now() + timedelta(hours=24)
            
            cursor.execute('''
                UPDATE users 
                SET verification_token = ?, verification_token_expires = ?
                WHERE email = ?
            ''', (verification_token, verification_expires, email.lower()))
            conn.commit()
            
            return {
                'success': True,
                'verification_token': verification_token,
                'email': email.lower()
            }
            
        finally:
            conn.close()
