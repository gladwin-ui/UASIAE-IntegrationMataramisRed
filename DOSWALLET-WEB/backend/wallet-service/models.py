"""
Wallet Service Models
"""
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))
from database import execute_query

class Wallet:
    @staticmethod
    def create(user_id):
        """Create wallet for user"""
        query = """
            INSERT INTO wallets (user_id, balance, points)
            VALUES (%s, 0.00, 0)
        """
        wallet_id = execute_query(query, (user_id,))
        return wallet_id
    
    @staticmethod
    def get_by_user_id(user_id):
        """Get wallet by user ID"""
        query = """
            SELECT wallet_id, user_id, balance, points, created_at, updated_at
            FROM wallets WHERE user_id = %s
        """
        return execute_query(query, (user_id,), fetch_one=True)
    
    @staticmethod
    def update_balance(user_id, amount, operation='add'):
        """Update wallet balance"""
        if operation == 'add':
            query = "UPDATE wallets SET balance = balance + %s WHERE user_id = %s"
        elif operation == 'subtract':
            query = "UPDATE wallets SET balance = balance - %s WHERE user_id = %s"
        else:
            return False
        
        execute_query(query, (amount, user_id))
        return True
    
    @staticmethod
    def update_points(user_id, points, operation='add'):
        """Update wallet points"""
        if operation == 'add':
            query = "UPDATE wallets SET points = points + %s WHERE user_id = %s"
        elif operation == 'subtract':
            query = "UPDATE wallets SET points = points - %s WHERE user_id = %s"
        else:
            return False
        
        execute_query(query, (points, user_id))
        return True
    
    @staticmethod
    def get_balance(user_id):
        """Get wallet balance"""
        wallet = Wallet.get_by_user_id(user_id)
        if wallet:
            return wallet['balance']
        return 0.00
    
    @staticmethod
    def get_points(user_id):
        """Get wallet points"""
        wallet = Wallet.get_by_user_id(user_id)
        if wallet:
            return wallet['points']
        return 0

