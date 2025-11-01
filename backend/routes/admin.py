"""
Admin Routes - Database Management
Version: v1.0 • Updated: 2025-01-11 10:16 AEST (Brisbane)

SECURITY WARNING: These endpoints should be protected or removed in production!
"""

from flask import Blueprint, jsonify, request
import sqlite3
import os
from functools import wraps

admin_bp = Blueprint('admin', __name__)

# Simple admin key check (replace with proper auth in production)
ADMIN_KEY = os.getenv('ADMIN_KEY', 'dev-only-key-change-in-production')

def require_admin_key(f):
    """Decorator to require admin key"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('X-Admin-Key')
        if auth_header != ADMIN_KEY:
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function


def get_db_path():
    """Get the database file path"""
    backend_dir = os.path.dirname(os.path.dirname(__file__))
    db_dir = os.path.join(backend_dir, 'database')
    return os.path.join(db_dir, 'weather.db')


@admin_bp.route('/clear-users', methods=['POST'])
@require_admin_key
def clear_all_users():
    """Clear all users from database (testing only!)"""
    try:
        db_path = get_db_path()
        
        if not os.path.exists(db_path):
            return jsonify({
                'success': False,
                'error': 'Database not found'
            }), 404
        
        conn = sqlite3.connect(db_path)
        conn.execute('PRAGMA foreign_keys = ON')
        cursor = conn.cursor()
        
        # Get count before deletion
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        
        if user_count == 0:
            return jsonify({
                'success': True,
                'message': 'No users in database',
                'users_deleted': 0
            })
        
        # Get user details before deletion
        cursor.execute("SELECT email, full_name FROM users")
        users = cursor.fetchall()
        
        # Delete all users (cascade will handle related records)
        cursor.execute("DELETE FROM users")
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Successfully deleted {user_count} user(s)',
            'users_deleted': user_count,
            'deleted_users': [{'email': u[0], 'name': u[1]} for u in users]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@admin_bp.route('/list-users', methods=['GET'])
@require_admin_key
def list_all_users():
    """List all users in database"""
    try:
        db_path = get_db_path()
        
        if not os.path.exists(db_path):
            return jsonify({
                'success': False,
                'error': 'Database not found'
            }), 404
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, email, full_name, email_verified, created_at, tier
            FROM users
            ORDER BY created_at DESC
        """)
        users = cursor.fetchall()
        conn.close()
        
        user_list = []
        for user in users:
            user_list.append({
                'id': user[0],
                'email': user[1],
                'name': user[2],
                'verified': bool(user[3]),
                'created_at': user[4],
                'tier': user[5]
            })
        
        return jsonify({
            'success': True,
            'count': len(user_list),
            'users': user_list
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@admin_bp.route('/db-stats', methods=['GET'])
@require_admin_key
def get_db_stats():
    """Get database statistics"""
    try:
        db_path = get_db_path()
        
        if not os.path.exists(db_path):
            return jsonify({
                'success': False,
                'error': 'Database not found'
            }), 404
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        stats = {}
        tables = ['users', 'api_keys', 'usage_logs', 'monthly_usage', 'email_queue']
        
        for table in tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                stats[table] = cursor.fetchone()[0]
            except:
                stats[table] = 'error'
        
        # Get database size
        db_size = os.path.getsize(db_path)
        stats['database_size_mb'] = round(db_size / (1024 * 1024), 2)
        
        conn.close()
        
        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
