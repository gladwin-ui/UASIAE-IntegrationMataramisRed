"""
Shared database connection utility
"""
import mysql.connector
from mysql.connector import pooling
from config import DB_CONFIG
import time

# Lazy initialization of connection pool
db_pool = None

def get_pool():
    """Get or create connection pool"""
    global db_pool
    if db_pool is None:
        # Retry connection with delay for Docker
        max_retries = 5
        for attempt in range(max_retries):
            try:
                db_pool = pooling.MySQLConnectionPool(
                    pool_name="doswallet_pool",
                    pool_size=DB_CONFIG.get('pool_size', 5),
                    pool_reset_session=True,
                    host=DB_CONFIG['host'],
                    port=DB_CONFIG['port'],
                    user=DB_CONFIG['user'],
                    password=DB_CONFIG['password'],
                    database=DB_CONFIG['database'],
                    charset=DB_CONFIG['charset'],
                    autocommit=False
                )
                break
            except mysql.connector.Error as e:
                if attempt < max_retries - 1:
                    print(f"Database connection attempt {attempt + 1} failed, retrying...")
                    time.sleep(2)
                else:
                    raise
    return db_pool

def get_db_connection():
    """Get database connection from pool"""
    try:
        pool = get_pool()
        return pool.get_connection()
    except mysql.connector.Error as err:
        print(f"Error getting database connection: {err}")
        raise

def execute_query(query, params=None, fetch_one=False, fetch_all=False):
    """Execute a database query"""
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, params or ())
        
        if fetch_one:
            result = cursor.fetchone()
        elif fetch_all:
            result = cursor.fetchall()
        else:
            result = cursor.lastrowid
        
        conn.commit()
        return result
    except mysql.connector.Error as err:
        if conn:
            conn.rollback()
        print(f"Database error: {err}")
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

