import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

def get_db_connection():
    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return conn
    except psycopg2.OperationalError as e:
        print(f"Database connection failed: {e}")
        print(f"DATABASE_URL: {DATABASE_URL}")
        raise

def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute('''
        CREATE TABLE IF NOT EXISTS urls (
            id SERIAL PRIMARY KEY,
            short_code VARCHAR(10) UNIQUE NOT NULL,
            original_url TEXT NOT NULL,
            clicks INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cur.execute('''
        CREATE INDEX IF NOT EXISTS idx_short_code ON urls(short_code)
    ''')
    
    cur.execute('''
        CREATE INDEX IF NOT EXISTS idx_original_url ON urls(original_url)
    ''')
    
    conn.commit()
    cur.close()
    conn.close()
    
    print("Database tables created successfully!")

def create_url_entry(short_code: str, original_url: str, clicks: int = 0) -> Dict:
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute('''
            INSERT INTO urls (short_code, original_url, clicks)
            VALUES (%s, %s, %s)
            RETURNING short_code, original_url, clicks, created_at
        ''', (short_code, original_url, clicks))
        
        result = cur.fetchone()
        conn.commit()
        
        return dict(result)
    
    except psycopg2.IntegrityError:
        conn.rollback()
        return find_url_by_code(short_code)
    
    finally:
        cur.close()
        conn.close()

def find_url_by_original(original_url: str) -> Optional[Dict]:
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute('''
        SELECT short_code, original_url, clicks, created_at
        FROM urls
        WHERE original_url = %s
    ''', (original_url,))
    
    result = cur.fetchone()
    cur.close()
    conn.close()
    
    return dict(result) if result else None

def find_url_by_code(short_code: str) -> Optional[Dict]:
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute('''
        SELECT short_code, original_url, clicks, created_at
        FROM urls
        WHERE short_code = %s
    ''', (short_code,))
    
    result = cur.fetchone()
    cur.close()
    conn.close()
    
    return dict(result) if result else None

def get_all_urls() -> List[Dict]:
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute('''
        SELECT 
            short_code, 
            original_url, 
            clicks, 
            TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
        FROM urls
        ORDER BY created_at DESC
    ''')
    
    results = cur.fetchall()
    cur.close()
    conn.close()
    
    return [dict(row) for row in results]

def increment_url_clicks(short_code: str):
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute('''
        UPDATE urls
        SET clicks = clicks + 1
        WHERE short_code = %s
    ''', (short_code,))
    
    conn.commit()
    cur.close()
    conn.close()

def get_stats() -> Dict:
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute('''
        SELECT 
            COUNT(*) as total_urls,
            COALESCE(SUM(clicks), 0) as total_clicks
        FROM urls
    ''')
    
    result = cur.fetchone()
    cur.close()
    conn.close()
    
    return dict(result)

def delete_url(short_code: str) -> bool:
    """Delete a URL by short code"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute('''
        DELETE FROM urls
        WHERE short_code = %s
    ''', (short_code,))
    
    deleted = cur.rowcount > 0
    conn.commit()
    cur.close()
    conn.close()
    
    return deleted

def get_url_stats(short_code: str) -> Optional[Dict]:
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute('''
        SELECT 
            short_code, 
            original_url, 
            clicks, 
            created_at,
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at)) / 86400 as age_days
        FROM urls
        WHERE short_code = %s
    ''', (short_code,))
    
    result = cur.fetchone()
    cur.close()
    conn.close()
    
    return dict(result) if result else None