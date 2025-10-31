"""
Fetcha Weather - Database Initialization
Version: v1.0 • Updated: 2025-10-28 19:02 AEST (Brisbane)

This script initializes the SQLite database with all required tables.
"""

import sqlite3
import os
from datetime import datetime


def get_db_path():
    """Get the database file path"""
    backend_dir = os.path.dirname(os.path.dirname(__file__))
    db_dir = os.path.join(backend_dir, 'database')
    return os.path.join(db_dir, 'weather.db')


def create_tables(conn):
    """Create all database tables"""
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            email_verified INTEGER DEFAULT 0,
            verification_token TEXT,
            verification_token_expires TIMESTAMP,
            reset_token TEXT,
            reset_token_expires TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP,
            tier TEXT DEFAULT 'free' CHECK(tier IN ('free', 'pro', 'enterprise')),
            is_active INTEGER DEFAULT 1,
            login_attempts INTEGER DEFAULT 0,
            last_login_attempt TIMESTAMP
        )
    ''')
    
    # API Keys table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS api_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            key_value TEXT UNIQUE NOT NULL,
            key_hash TEXT UNIQUE NOT NULL,
            name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_used TIMESTAMP,
            is_active INTEGER DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    
    # Usage logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usage_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            api_key_id INTEGER NOT NULL,
            endpoint TEXT NOT NULL,
            location TEXT,
            state TEXT,
            date_from TEXT,
            date_to TEXT,
            response_time_ms INTEGER,
            status_code INTEGER,
            error_message TEXT,
            ip_address TEXT,
            user_agent TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE
        )
    ''')
    
    # Monthly usage summary table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS monthly_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            month TEXT NOT NULL,
            total_requests INTEGER DEFAULT 0,
            successful_requests INTEGER DEFAULT 0,
            failed_requests INTEGER DEFAULT 0,
            total_response_time_ms INTEGER DEFAULT 0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, month)
        )
    ''')
    
    # Email queue table (for async email sending)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS email_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipient TEXT NOT NULL,
            subject TEXT NOT NULL,
            body_text TEXT NOT NULL,
            body_html TEXT,
            template_name TEXT,
            template_data TEXT,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed')),
            attempts INTEGER DEFAULT 0,
            last_error TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sent_at TIMESTAMP
        )
    ''')
    
    conn.commit()
    print("✅ All tables created successfully")


def create_indexes(conn):
    """Create database indexes for performance"""
    cursor = conn.cursor()
    
    # User indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token)')
    
    # API Key indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active)')
    
    # Usage log indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_usage_logs_api_key_id ON usage_logs(api_key_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON usage_logs(timestamp)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_usage_logs_status_code ON usage_logs(status_code)')
    
    # Monthly usage indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_monthly_usage_user_month ON monthly_usage(user_id, month)')
    
    # Email queue indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at)')
    
    conn.commit()
    print("✅ All indexes created successfully")


def init_database(drop_existing=False):
    """
    Initialize the database
    
    Args:
        drop_existing: If True, drop all tables before creating (DESTRUCTIVE!)
    """
    db_path = get_db_path()
    db_dir = os.path.dirname(db_path)
    
    # Create database directory if it doesn't exist
    if not os.path.exists(db_dir):
        os.makedirs(db_dir)
        print(f"✅ Created database directory: {db_dir}")
    
    # Check if database exists
    db_exists = os.path.exists(db_path)
    
    if db_exists and drop_existing:
        print(f"⚠️  Dropping existing database: {db_path}")
        os.remove(db_path)
        db_exists = False
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    conn.execute('PRAGMA foreign_keys = ON')  # Enable foreign key constraints
    
    if not db_exists:
        print(f"✅ Creating new database: {db_path}")
    else:
        print(f"✅ Connected to existing database: {db_path}")
    
    # Create tables and indexes
    create_tables(conn)
    create_indexes(conn)
    
    # Get table count
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table'")
    table_count = cursor.fetchone()[0]
    
    conn.close()
    
    print(f"\n{'='*60}")
    print(f"Database initialized successfully!")
    print(f"Path: {db_path}")
    print(f"Tables: {table_count}")
    print(f"{'='*60}\n")
    
    return db_path


def get_db_stats():
    """Get database statistics"""
    db_path = get_db_path()
    
    if not os.path.exists(db_path):
        print("❌ Database does not exist")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print(f"\n{'='*60}")
    print("DATABASE STATISTICS")
    print(f"{'='*60}")
    
    # Get table statistics
    tables = ['users', 'api_keys', 'usage_logs', 'monthly_usage', 'email_queue']
    
    for table in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"{table.upper():20} {count:>10} rows")
        except sqlite3.OperationalError:
            print(f"{table.upper():20} {'ERROR':>10}")
    
    # Get database size
    db_size = os.path.getsize(db_path)
    db_size_mb = db_size / (1024 * 1024)
    print(f"\nDatabase Size: {db_size_mb:.2f} MB")
    
    print(f"{'='*60}\n")
    
    conn.close()


if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--drop':
        confirm = input("⚠️  This will DELETE all data. Type 'yes' to confirm: ")
        if confirm.lower() == 'yes':
            init_database(drop_existing=True)
        else:
            print("❌ Aborted")
    elif len(sys.argv) > 1 and sys.argv[1] == '--stats':
        get_db_stats()
    else:
        init_database(drop_existing=False)
