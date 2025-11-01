#!/usr/bin/env python3
"""
Clear User from Database
Version: v1.0 • Updated: 2025-01-11 10:12 AEST (Brisbane)

This script removes a user from the database by email address.
"""

import sqlite3
import os
import sys


def get_db_path():
    """Get the database file path"""
    backend_dir = os.path.dirname(__file__)
    db_dir = os.path.join(backend_dir, 'database')
    return os.path.join(db_dir, 'weather.db')


def clear_user_by_email(email):
    """
    Remove a user and all associated data by email address
    
    Args:
        email: The email address of the user to remove
    """
    db_path = get_db_path()
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return False
    
    conn = sqlite3.connect(db_path)
    conn.execute('PRAGMA foreign_keys = ON')  # Enable foreign key constraints
    cursor = conn.cursor()
    
    try:
        # Check if user exists
        cursor.execute("SELECT id, email, full_name FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        
        if not user:
            print(f"❌ No user found with email: {email}")
            conn.close()
            return False
        
        user_id, user_email, user_name = user
        print(f"\n{'='*60}")
        print(f"Found user:")
        print(f"  ID: {user_id}")
        print(f"  Email: {user_email}")
        print(f"  Name: {user_name}")
        print(f"{'='*60}\n")
        
        # Get counts of associated data
        cursor.execute("SELECT COUNT(*) FROM api_keys WHERE user_id = ?", (user_id,))
        api_key_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM usage_logs WHERE user_id = ?", (user_id,))
        usage_log_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM monthly_usage WHERE user_id = ?", (user_id,))
        monthly_usage_count = cursor.fetchone()[0]
        
        print(f"Associated data:")
        print(f"  API Keys: {api_key_count}")
        print(f"  Usage Logs: {usage_log_count}")
        print(f"  Monthly Usage Records: {monthly_usage_count}")
        print()
        
        # Confirm deletion
        confirm = input("⚠️  Delete this user and all associated data? (yes/no): ")
        if confirm.lower() != 'yes':
            print("❌ Deletion cancelled")
            conn.close()
            return False
        
        # Delete user (cascade will handle related records)
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        
        print(f"\n✅ User '{user_email}' and all associated data has been deleted")
        print(f"{'='*60}\n")
        
        conn.close()
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
        conn.rollback()
        conn.close()
        return False


def list_all_users():
    """List all users in the database"""
    db_path = get_db_path()
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, email, full_name, email_verified, created_at, tier
        FROM users
        ORDER BY created_at DESC
    """)
    users = cursor.fetchall()
    
    if not users:
        print("No users found in database")
        conn.close()
        return
    
    print(f"\n{'='*80}")
    print(f"{'ID':<5} {'Email':<30} {'Name':<20} {'Verified':<10} {'Tier':<10}")
    print(f"{'='*80}")
    
    for user in users:
        user_id, email, name, verified, created_at, tier = user
        verified_str = "Yes" if verified else "No"
        print(f"{user_id:<5} {email:<30} {name:<20} {verified_str:<10} {tier:<10}")
    
    print(f"{'='*80}")
    print(f"Total users: {len(users)}\n")
    
    conn.close()


if __name__ == '__main__':
    if len(sys.argv) > 1:
        if sys.argv[1] == '--list':
            list_all_users()
        elif sys.argv[1] == '--email' and len(sys.argv) > 2:
            email = sys.argv[2]
            clear_user_by_email(email)
        else:
            print("Usage:")
            print("  python clear_user.py --list                     # List all users")
            print("  python clear_user.py --email user@example.com   # Delete specific user")
    else:
        # Interactive mode
        list_all_users()
        email = input("\nEnter email address to delete (or 'quit' to exit): ")
        if email.lower() != 'quit':
            clear_user_by_email(email)
