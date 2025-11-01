"""
Initialize PostgreSQL Database for Railway Production
This script creates all necessary tables in the PostgreSQL database
"""

import os
import psycopg2
from psycopg2 import sql

def get_database_url():
    """Get PostgreSQL database URL from environment"""
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        raise ValueError("DATABASE_URL environment variable not set")
    return db_url

def create_tables(conn):
    """Create all database tables for PostgreSQL"""
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            email_verified BOOLEAN DEFAULT FALSE,
            verification_token TEXT,
            verification_token_expires TIMESTAMP,
            reset_token TEXT,
            reset_token_expires TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP,
            tier VARCHAR(20) DEFAULT 'free' CHECK(tier IN ('free', 'pro', 'enterprise')),
            is_active BOOLEAN DEFAULT TRUE,
            login_attempts INTEGER DEFAULT 0,
            last_login_attempt TIMESTAMP
        )
    ''')
    
    # API Keys table (renamed from api_keys to match the models)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS api_keys (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            key_value TEXT UNIQUE NOT NULL,
            key_hash TEXT UNIQUE NOT NULL,
            name VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_used TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE
        )
    ''')
    
    # Usage logs table (renamed from usage_logs to usage to match the models)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usage (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            api_key_id INTEGER NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
            endpoint TEXT NOT NULL,
            location TEXT,
            state TEXT,
            date_from TEXT,
            date_to TEXT,
            response_time_ms INTEGER,
            status_code INTEGER,
            error_message TEXT,
            ip_address VARCHAR(45),
            user_agent TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Monthly usage summary table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS monthly_usage (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            month VARCHAR(7) NOT NULL,
            total_requests INTEGER DEFAULT 0,
            successful_requests INTEGER DEFAULT 0,
            failed_requests INTEGER DEFAULT 0,
            total_response_time_ms BIGINT DEFAULT 0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, month)
        )
    ''')
    
    # Email queue table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS email_queue (
            id SERIAL PRIMARY KEY,
            recipient VARCHAR(255) NOT NULL,
            subject TEXT NOT NULL,
            body_text TEXT NOT NULL,
            body_html TEXT,
            template_name VARCHAR(100),
            template_data TEXT,
            status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed')),
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
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_usage_user_id ON usage(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_usage_api_key_id ON usage(api_key_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage(timestamp)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_usage_status_code ON usage(status_code)')
    
    # Monthly usage indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_monthly_usage_user_month ON monthly_usage(user_id, month)')
    
    # Email queue indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at)')
    
    conn.commit()
    print("✅ All indexes created successfully")

def init_database():
    """Initialize PostgreSQL database"""
    try:
        db_url = get_database_url()
        print(f"✅ Connecting to PostgreSQL database...")
        
        # Connect to PostgreSQL
        conn = psycopg2.connect(db_url)
        conn.autocommit = False
        
        print(f"✅ Connected successfully")
        
        # Create tables and indexes
        create_tables(conn)
        create_indexes(conn)
        
        # Get table count
        cursor = conn.cursor()
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        table_count = cursor.fetchone()[0]
        
        conn.close()
        
        print(f"\n{'='*60}")
        print(f"PostgreSQL Database initialized successfully!")
        print(f"Tables created: {table_count}")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"\n❌ Error initializing database:")
        print(f"   {str(e)}\n")
        raise

if __name__ == '__main__':
    init_database()
