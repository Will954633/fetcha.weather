#!/usr/bin/env python3
"""
Clear All Users from Database - Automated
Version: v1.0 • Updated: 2025-01-11 10:13 AEST (Brisbane)

This script removes all users from the database automatically (for testing purposes).
"""

import sqlite3
import os


def get_db_path():
    """Get the database file path"""
    backend_dir = os.path.dirname(__file__)
    db_dir = os.path.join(backend_dir, 'database')
    return os.path.join(db_dir, 'weather.db')


def clear_all_users():
    """Remove all users and associated data from the database"""
    db_path = get_db_path()
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return False
    
    conn = sqlite3.connect(db_path)
    conn.execute('PRAGMA foreign_keys = ON')
    cursor = conn.cursor()
    
    try:
        # Get count before deletion
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        
        if user_count == 0:
            print("✅ No users in database - already clean")
            conn.close()
            return True
        
        # Get all users
        cursor.execute("SELECT id, email, full_name FROM users")
        users = cursor.fetchall()
        
        print(f"\n{'='*60}")
        print(f"Found {user_count} user(s) to delete:")
        for user in users:
            print(f"  - {user[1]} ({user[2]})")
        print(f"{'='*60}\n")
        
        # Delete all users (cascade will handle related records)
        cursor.execute("DELETE FROM users")
        conn.commit()
        
        print(f"✅ Successfully deleted {user_count} user(s)")
        print(f"✅ Database is now clean and ready for signup testing\n")
        
        conn.close()
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
        conn.rollback()
        conn.close()
        return False


if __name__ == '__main__':
    clear_all_users()
