"""
Transaction Service Models
FIXED: Cross-database access for wallets table
"""
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))
from database import execute_query, get_db_connection

class Transaction:
    @staticmethod
    def create(user_id, amount, transaction_type, payment_method=None, receiver_id=None, description=None):
        """Create a new transaction"""
        query = """
            INSERT INTO transactions (user_id, amount, type, payment_method, receiver_id, description)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        transaction_id = execute_query(
            query,
            (user_id, amount, transaction_type, payment_method, receiver_id, description)
        )
        return transaction_id

    @staticmethod
    def create_with_idempotency(user_id, amount, transaction_type, payment_method=None, receiver_id=None, description=None, idempotency_key=None, status='completed', qr_payload=None):
        if idempotency_key:
            existing = execute_query("SELECT transaction_id FROM transactions WHERE idempotency_key = %s", (idempotency_key,), fetch_one=True)
            if existing:
                return existing['transaction_id']

        query = """
            INSERT INTO transactions (user_id, amount, type, payment_method, receiver_id, description, idempotency_key, status, qr_payload)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        transaction_id = execute_query(
            query,
            (user_id, amount, transaction_type, payment_method, receiver_id, description, idempotency_key, status, qr_payload)
        )
        return transaction_id

    @staticmethod
    def transfer_atomic(sender_id, receiver_id, amount, description=None, idempotency_key=None):
        """Perform a transfer in a single DB transaction with row locking."""
        if amount <= 0:
            raise ValueError("Amount must be greater than zero")

        conn = None
        cursor = None
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            conn.start_transaction()

            # FIX: Point to doswallet_wallet_db.wallets
            cursor.execute("SELECT * FROM doswallet_wallet_db.wallets WHERE user_id = %s FOR UPDATE", (sender_id,))
            sender_wallet = cursor.fetchone()
            if not sender_wallet:
                cursor.execute("INSERT INTO doswallet_wallet_db.wallets (user_id, balance, points) VALUES (%s, 0.00, 0)", (sender_id,))
                cursor.execute("SELECT * FROM doswallet_wallet_db.wallets WHERE user_id = %s FOR UPDATE", (sender_id,))
                sender_wallet = cursor.fetchone()

            # FIX: Point to doswallet_wallet_db.wallets
            cursor.execute("SELECT * FROM doswallet_wallet_db.wallets WHERE user_id = %s FOR UPDATE", (receiver_id,))
            receiver_wallet = cursor.fetchone()
            if not receiver_wallet:
                cursor.execute("INSERT INTO doswallet_wallet_db.wallets (user_id, balance, points) VALUES (%s, 0.00, 0)", (receiver_id,))
                cursor.execute("SELECT * FROM doswallet_wallet_db.wallets WHERE user_id = %s FOR UPDATE", (receiver_id,))
                receiver_wallet = cursor.fetchone()

            if float(sender_wallet['balance']) < float(amount):
                conn.rollback()
                raise Exception("Insufficient balance")

            # FIX: Update balances in doswallet_wallet_db
            cursor.execute("UPDATE doswallet_wallet_db.wallets SET balance = balance - %s WHERE user_id = %s", (amount, sender_id))
            cursor.execute("UPDATE doswallet_wallet_db.wallets SET balance = balance + %s WHERE user_id = %s", (amount, receiver_id))

            cursor.execute("INSERT INTO transactions (user_id, amount, type, receiver_id, description, idempotency_key, status) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                           (sender_id, amount, 'transfer', receiver_id, description, idempotency_key, 'completed'))
            transaction_id = cursor.lastrowid

            conn.commit()
            return Transaction.get_by_id(transaction_id)
        except Exception:
            if conn:
                conn.rollback()
            raise
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    @staticmethod
    def create_payment_request(amount, external_id=None, description=None, idempotency_key=None, qr_payload=None):
        user_id = None
        status = 'pending'
        transaction_id = Transaction.create_with_idempotency(user_id, amount, 'deposit', payment_method='external', receiver_id=None, description=description, idempotency_key=idempotency_key, status=status, qr_payload=qr_payload)
        return transaction_id

    @staticmethod
    def confirm_payment_by_idempotency(idempotency_key, provider_reference=None):
        tx = execute_query("SELECT * FROM transactions WHERE idempotency_key = %s", (idempotency_key,), fetch_one=True)
        if not tx:
            raise Exception("Payment not found")
        if tx['status'] == 'completed':
            return tx['transaction_id']

        conn = None
        cursor = None
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            conn.start_transaction()

            cursor.execute("UPDATE transactions SET status = 'completed' WHERE transaction_id = %s", (tx['transaction_id'],))

            if tx.get('user_id'):
                # FIX: Use doswallet_wallet_db
                cursor.execute("SELECT * FROM doswallet_wallet_db.wallets WHERE user_id = %s FOR UPDATE", (tx['user_id'],))
                wallet = cursor.fetchone()
                if not wallet:
                    cursor.execute("INSERT INTO doswallet_wallet_db.wallets (user_id, balance, points) VALUES (%s, 0.00, 0)", (tx['user_id'],))
                cursor.execute("UPDATE doswallet_wallet_db.wallets SET balance = balance + %s WHERE user_id = %s", (tx['amount'], tx['user_id']))

            conn.commit()
            return tx['transaction_id']
        except Exception:
            if conn:
                conn.rollback()
            raise
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    @staticmethod
    def deposit_atomic(user_id, amount, payment_method=None, description=None, idempotency_key=None):
        if amount <= 0:
            raise ValueError("Amount must be greater than zero")

        conn = None
        cursor = None
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            conn.start_transaction()

            if idempotency_key:
                cursor.execute("SELECT transaction_id, status FROM transactions WHERE idempotency_key = %s", (idempotency_key,))
                existing = cursor.fetchone()
                if existing:
                    if existing.get('status') == 'completed':
                        conn.commit()
                        return existing['transaction_id']

            # FIX: Use doswallet_wallet_db
            cursor.execute("SELECT * FROM doswallet_wallet_db.wallets WHERE user_id = %s FOR UPDATE", (user_id,))
            wallet = cursor.fetchone()
            if not wallet:
                cursor.execute("INSERT INTO doswallet_wallet_db.wallets (user_id, balance, points) VALUES (%s, 0.00, 0)", (user_id,))

            cursor.execute("INSERT INTO transactions (user_id, amount, type, payment_method, description, idempotency_key, status) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                           (user_id, amount, 'deposit', payment_method, description, idempotency_key, 'completed'))
            transaction_id = cursor.lastrowid

            # FIX: Update wallet in correct DB
            cursor.execute("UPDATE doswallet_wallet_db.wallets SET balance = balance + %s WHERE user_id = %s", (amount, user_id))

            conn.commit()
            return transaction_id
        except Exception:
            if conn:
                conn.rollback()
            raise
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    @staticmethod
    def withdraw_atomic(user_id, amount, payment_method=None, description=None, idempotency_key=None):
        if amount <= 0:
            raise ValueError("Amount must be greater than zero")

        conn = None
        cursor = None
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            conn.start_transaction()

            # FIX: Use doswallet_wallet_db
            cursor.execute("SELECT * FROM doswallet_wallet_db.wallets WHERE user_id = %s FOR UPDATE", (user_id,))
            wallet = cursor.fetchone()
            if not wallet:
                conn.rollback()
                raise Exception("Wallet not found")

            if float(wallet['balance']) < float(amount):
                conn.rollback()
                raise Exception("Insufficient balance")

            cursor.execute("INSERT INTO transactions (user_id, amount, type, payment_method, description, idempotency_key, status) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                           (user_id, amount, 'withdraw', payment_method, description, idempotency_key, 'completed'))
            transaction_id = cursor.lastrowid

            # FIX: Update wallet in correct DB
            cursor.execute("UPDATE doswallet_wallet_db.wallets SET balance = balance - %s WHERE user_id = %s", (amount, user_id))

            conn.commit()
            return transaction_id
        except Exception:
            if conn:
                conn.rollback()
            raise
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    
    @staticmethod
    def get_by_id(transaction_id):
        query = """
            SELECT * FROM transactions WHERE transaction_id = %s
        """
        return execute_query(query, (transaction_id,), fetch_one=True)
    
    @staticmethod
    def get_by_user_id(user_id, limit=50, offset=0):
        query = """
            SELECT * FROM transactions 
            WHERE user_id = %s OR receiver_id = %s
            ORDER BY date DESC
            LIMIT %s OFFSET %s
        """
        return execute_query(query, (user_id, user_id, limit, offset), fetch_all=True)
    
    @staticmethod
    def get_by_type(user_id, transaction_type, limit=50, offset=0):
        query = """
            SELECT * FROM transactions 
            WHERE user_id = %s AND type = %s
            ORDER BY date DESC
            LIMIT %s OFFSET %s
        """
        return execute_query(query, (user_id, transaction_type, limit, offset), fetch_all=True)
    
    @staticmethod
    def get_all(limit=50, offset=0):
        query = """
            SELECT * FROM transactions 
            ORDER BY date DESC
            LIMIT %s OFFSET %s
        """
        return execute_query(query, (limit, offset), fetch_all=True)
    
    @staticmethod
    def pay_atomic(user_id, amount, description=None, payment_method='food_delivery', idempotency_key=None):
        if amount <= 0:
            return {'success': False, 'message': 'Amount must be greater than zero'}
        
        conn = None
        cursor = None
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            conn.start_transaction()
            
            # FIX: Use doswallet_wallet_db
            cursor.execute("SELECT * FROM doswallet_wallet_db.wallets WHERE user_id = %s FOR UPDATE", (user_id,))
            wallet = cursor.fetchone()
            
            if not wallet:
                conn.rollback()
                return {'success': False, 'message': 'Wallet not found'}
            
            current_balance = float(wallet['balance'])
            if current_balance < float(amount):
                conn.rollback()
                return {'success': False, 'balance_remaining': current_balance, 'message': 'Insufficient Balance'}
            
            new_balance = current_balance - float(amount)
            # FIX: Update wallet in correct DB
            cursor.execute("UPDATE doswallet_wallet_db.wallets SET balance = %s WHERE user_id = %s", (new_balance, user_id))
            
            points_earned = int(float(amount) / 10000)
            if points_earned > 0:
                # FIX: Update wallet points in correct DB
                cursor.execute("UPDATE doswallet_wallet_db.wallets SET points = points + %s WHERE user_id = %s", (points_earned, user_id))
            
            cursor.execute("""
                INSERT INTO transactions (user_id, amount, type, payment_method, description, idempotency_key, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (user_id, amount, 'withdraw', payment_method, description, idempotency_key, 'completed'))
            transaction_id = cursor.lastrowid
            
            conn.commit()
            
            return {'success': True, 'transaction_id': transaction_id, 'balance_remaining': new_balance, 'message': None}
        except Exception as e:
            if conn:
                conn.rollback()
            return {'success': False, 'message': f'Payment processing error: {str(e)}'}
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()