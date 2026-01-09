"""
User Service Models
"""
import sys
import os
import bcrypt

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))
from database import execute_query

class User:
    @staticmethod
    def create(name, email, phone, password):
        """Create a new user"""
        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        query = """
            INSERT INTO users (name, email, phone, password)
            VALUES (%s, %s, %s, %s)
        """
        user_id = execute_query(query, (name, email, phone, hashed_password))
        return user_id
    
    @staticmethod
    def get_by_email(email):
        """Get user by email"""
        query = "SELECT * FROM users WHERE email = %s"
        return execute_query(query, (email,), fetch_one=True)
    
    @staticmethod
    def get_by_phone(phone):
        """Get user by phone"""
        query = "SELECT * FROM users WHERE phone = %s"
        return execute_query(query, (phone,), fetch_one=True)
    
    @staticmethod
    def get_by_id(user_id):
        """Get user by ID"""
        query = "SELECT user_id, name, email, phone, created_at FROM users WHERE user_id = %s"
        return execute_query(query, (user_id,), fetch_one=True)
    
    @staticmethod
    def verify_password(plain_password, hashed_password):
        """Verify password"""
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    @staticmethod
    def update_profile(user_id, name=None, phone=None):
        """Update user profile"""
        updates = []
        params = []
        
        if name:
            updates.append("name = %s")
            params.append(name)
        if phone:
            updates.append("phone = %s")
            params.append(phone)
        
        if not updates:
            return False
        
        params.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE user_id = %s"
        execute_query(query, tuple(params))
        return True

