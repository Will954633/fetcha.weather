"""
Fetcha Weather - API Key Model
Version: v1.0 • Updated: 2025-10-28 19:03 AEST (Brisbane)
"""

import sqlite3
import secrets
import hashlib
from datetime import datetime
from typing import Optional, Dict, Any, List


class APIKey:
    """API Key model for managing user API keys"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
    
    def _get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute('PRAGMA foreign_keys = ON')
        return conn
    
    @staticmethod
    def _generate_key() -> str:
        """Generate a secure API key"""
        return f"fw_{secrets.token_urlsafe(32)}"
    
    @staticmethod
    def _hash_key(key: str) -> str:
        """Hash an API key for storage"""
        return hashlib.sha256(key.encode()).hexdigest()
    
    def create(self, user_id: int, name: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a new API key for a user
        
        Args:
            user_id: User ID
            name: Optional name for the key
            
        Returns:
            Dict with API key data
        """
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # Generate key
            key_value = self._generate_key()
            key_hash = self._hash_key(key_value)
            
            # Insert key
            cursor.execute('''
                INSERT INTO api_keys (user_id, key_value, key_hash, name)
                VALUES (?, ?, ?, ?)
            ''', (user_id, key_value, key_hash, name))
            
            key_id = cursor.lastrowid
            conn.commit()
            
            # Get created key
            cursor.execute('SELECT * FROM api_keys WHERE id = ?', (key_id,))
            api_key = dict(cursor.fetchone())
            
            return {
                'success': True,
                'api_key': api_key,
                'key_value': key_value  # Only returned once at creation
            }
            
        except sqlite3.IntegrityError as e:
            return {
                'success': False,
                'error': f'Failed to create API key: {str(e)}'
            }
        finally:
            conn.close()
    
    def validate(self, key_value: str) -> Dict[str, Any]:
        """
        Validate an API key and return associated user
        
        Args:
            key_value: API key to validate
            
        Returns:
            Dict with validation result and user data
        """
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            key_hash = self._hash_key(key_value)
            
            cursor.execute('''
                SELECT ak.*, u.email, u.tier, u.email_verified, u.is_active as user_active
                FROM api_keys ak
                JOIN users u ON ak.user_id = u.id
                WHERE ak.key_hash = ? AND ak.is_active = 1
            ''', (key_hash,))
            
            result = cursor.fetchone()
            
            if not result:
                return {
                    'success': False,
                    'error': 'Invalid API key'
                }
            
            api_key_data = dict(result)
            
            # Check if user account is active and verified
            if not api_key_data['user_active']:
                return {
                    'success': False,
                    'error': 'User account is inactive'
                }
            
            if not api_key_data['email_verified']:
                return {
                    'success': False,
                    'error': 'Email not verified'
                }
            
            # Update last used timestamp
            cursor.execute('''
                UPDATE api_keys 
                SET last_used = ? 
                WHERE id = ?
            ''', (datetime.now(), api_key_data['id']))
            conn.commit()
            
            # Remove key_value from response (we don't want to leak it)
            api_key_data.pop('key_value', None)
            
            return {
                'success': True,
                'api_key': api_key_data
            }
            
        finally:
            conn.close()
    
    def get_by_user(self, user_id: int, include_inactive: bool = False) -> List[Dict[str, Any]]:
        """
        Get all API keys for a user
        
        Args:
            user_id: User ID
            include_inactive: Include inactive keys
            
        Returns:
            List of API key dictionaries with full key values
        """
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            if include_inactive:
                cursor.execute('SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
            else:
                cursor.execute('SELECT * FROM api_keys WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC', (user_id,))
            
            keys = [dict(row) for row in cursor.fetchall()]
            
            # Return full key values - user is authenticated via dashboard login
            # No need to hide keys since they're already behind authentication
            
            return keys
            
        finally:
            conn.close()
    
    def get_by_id(self, key_id: int) -> Optional[Dict[str, Any]]:
        """
        Get API key by ID
        
        Args:
            key_id: API key ID
            
        Returns:
            API key dictionary with full key value or None
        """
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('SELECT * FROM api_keys WHERE id = ?', (key_id,))
            result = cursor.fetchone()
            
            if not result:
                return None
            
            api_key = dict(result)
            
            # Return full key value - user is authenticated
            
            return api_key
            
        finally:
            conn.close()
    
    def deactivate(self, key_id: int, user_id: int) -> Dict[str, Any]:
        """
        Deactivate an API key
        
        Args:
            key_id: API key ID
            user_id: User ID (for security - must own the key)
            
        Returns:
            Dict with success status
        """
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # Verify ownership
            cursor.execute('SELECT * FROM api_keys WHERE id = ? AND user_id = ?', (key_id, user_id))
            if not cursor.fetchone():
                return {
                    'success': False,
                    'error': 'API key not found or access denied'
                }
            
            # Deactivate
            cursor.execute('UPDATE api_keys SET is_active = 0 WHERE id = ?', (key_id,))
            conn.commit()
            
            return {
                'success': True,
                'message': 'API key deactivated'
            }
            
        finally:
            conn.close()
    
    def delete(self, key_id: int, user_id: int) -> Dict[str, Any]:
        """
        Permanently delete an API key
        
        Args:
            key_id: API key ID
            user_id: User ID (for security - must own the key)
            
        Returns:
            Dict with success status
        """
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # Verify ownership
            cursor.execute('SELECT * FROM api_keys WHERE id = ? AND user_id = ?', (key_id, user_id))
            if not cursor.fetchone():
                return {
                    'success': False,
                    'error': 'API key not found or access denied'
                }
            
            # Delete
            cursor.execute('DELETE FROM api_keys WHERE id = ?', (key_id,))
            conn.commit()
            
            return {
                'success': True,
                'message': 'API key deleted'
            }
            
        finally:
            conn.close()
    
    def update_name(self, key_id: int, user_id: int, name: str) -> Dict[str, Any]:
        """
        Update API key name
        
        Args:
            key_id: API key ID
            user_id: User ID (for security - must own the key)
            name: New name
            
        Returns:
            Dict with success status
        """
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # Verify ownership
            cursor.execute('SELECT * FROM api_keys WHERE id = ? AND user_id = ?', (key_id, user_id))
            if not cursor.fetchone():
                return {
                    'success': False,
                    'error': 'API key not found or access denied'
                }
            
            # Update
            cursor.execute('UPDATE api_keys SET name = ? WHERE id = ?', (name, key_id))
            conn.commit()
            
            return {
                'success': True,
                'message': 'API key name updated'
            }
            
        finally:
            conn.close()
    
    def count_active_keys(self, user_id: int) -> int:
        """
        Count active API keys for a user
        
        Args:
            user_id: User ID
            
        Returns:
            Number of active keys
        """
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('SELECT COUNT(*) FROM api_keys WHERE user_id = ? AND is_active = 1', (user_id,))
            count = cursor.fetchone()[0]
            return count
            
        finally:
            conn.close()
