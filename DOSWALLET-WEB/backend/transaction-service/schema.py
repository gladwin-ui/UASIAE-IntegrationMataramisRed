"""
Transaction Service GraphQL Schema
"""
import graphene
from graphene import ObjectType, String, Decimal, Int, Field, List, Float
from datetime import datetime
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'wallet-service'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'user-service'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'notification-service'))
from auth import verify_token, get_token_from_request
from models import Transaction

# Import User model
import importlib.util
user_models_path = os.path.join(os.path.dirname(__file__), '..', 'user-service', 'models.py')
spec = importlib.util.spec_from_file_location("user_models", user_models_path)
user_models = importlib.util.module_from_spec(spec)
spec.loader.exec_module(user_models)
User = user_models.User

# Import Notification model
notification_models_path = os.path.join(os.path.dirname(__file__), '..', 'notification-service', 'models.py')
spec = importlib.util.spec_from_file_location("notification_models", notification_models_path)
notification_models = importlib.util.module_from_spec(spec)
spec.loader.exec_module(notification_models)
Notification = notification_models.Notification

# Import Wallet - since both services share the same database
# Load wallet-service models explicitly to avoid module name collisions with this service's own models.py
import importlib.util
wallet_models_path = os.path.join(os.path.dirname(__file__), '..', 'wallet-service', 'models.py')
spec = importlib.util.spec_from_file_location("wallet_models", wallet_models_path)
wallet_models = importlib.util.module_from_spec(spec)
spec.loader.exec_module(wallet_models)
Wallet = wallet_models.Wallet

class TransactionType(ObjectType):
    # Force snake_case field names to match frontend queries
    transaction_id = Int(name='transaction_id')
    user_id = Int(name='user_id')
    # Use Float instead of Decimal for better compatibility
    amount = Float()
    # Use a Python-safe attribute name but expose GraphQL field as `type` for backward compatibility
    transaction_type = String(name='type')
    payment_method = String(name='payment_method')
    date = String()
    receiver_id = Int(name='receiver_id')
    description = String()
    status = String()

    # Backwards-compatible snake_case field for clients requesting `transaction_id`
    transaction_id_snake = Int(name='transaction_id')

    def resolve_transaction_id_snake(self, info):
        if isinstance(self, dict):
            return self.get('transaction_id')
        return getattr(self, 'transaction_id', None)

    def resolve_transaction_type(self, info):
        # Support both dict (DB row) and object instances
        if isinstance(self, dict):
            return self.get('type')
        return getattr(self, 'type', None)

    def resolve_status(self, info):
        if isinstance(self, dict):
            return self.get('status')
        return getattr(self, 'status', None)
    
    def resolve_user_id(self, info):
        """Resolve user_id field"""
        if isinstance(self, dict):
            return self.get('user_id')
        return getattr(self, 'user_id', None)
    
    def resolve_transaction_id(self, info):
        """Resolve transaction_id field"""
        if isinstance(self, dict):
            return self.get('transaction_id')
        return getattr(self, 'transaction_id', None)
    
    def resolve_payment_method(self, info):
        """Resolve payment_method field"""
        if isinstance(self, dict):
            return self.get('payment_method')
        return getattr(self, 'payment_method', None)
    
    def resolve_receiver_id(self, info):
        """Resolve receiver_id field"""
        if isinstance(self, dict):
            return self.get('receiver_id')
        return getattr(self, 'receiver_id', None)
    
    def resolve_description(self, info):
        """Resolve description field"""
        if isinstance(self, dict):
            return self.get('description')
        return getattr(self, 'description', None)
    
    def resolve_date(self, info):
        """Convert datetime to ISO string format"""
        if isinstance(self, dict):
            date_val = self.get('date')
        else:
            date_val = getattr(self, 'date', None)
        
        if date_val is None:
            return None
        
        # If it's already a string, return as is
        if isinstance(date_val, str):
            return date_val
        
        # If it's a datetime object, convert to ISO string
        if hasattr(date_val, 'isoformat'):
            return date_val.isoformat()
        
        return str(date_val)
    
    def resolve_amount(self, info):
        """Ensure amount is properly formatted as Float"""
        if isinstance(self, dict):
            amount_val = self.get('amount')
        else:
            amount_val = getattr(self, 'amount', None)
        
        if amount_val is None:
            return None
        
        # Convert to float (Decimal from DB will be converted automatically)
        try:
            # Handle Decimal type from database
            if hasattr(amount_val, '__float__'):
                return float(amount_val)
            return float(amount_val)
        except (ValueError, TypeError):
            return None

class PaymentResponse(ObjectType):
    """
    Response type for payment mutation from external systems (Food Delivery).
    """
    status = String(required=True)
    trxId = String()
    balanceRemaining = Float()
    message = String()

class Query(ObjectType):
    # Support both snake_case and camelCase for query name
    myTransactions = List(TransactionType, limit=Int(), offset=Int())
    transaction = Field(TransactionType, transaction_id=Int(required=True))
    transactions_by_type = List(TransactionType, transaction_type=String(required=True, name='type'), limit=Int(), offset=Int())
    
    def resolve_myTransactions(self, info, limit=50, offset=0):
        """
        Get current user's transactions
        FIX: Lookup user by email from JWT instead of user_id to handle FDS-DosWallet user_id mismatch
        """
        token = get_token_from_request()
        if not token:
            print("[DEBUG] No token found")
            return []
        
        payload = verify_token(token)
        if not payload:
            print("[DEBUG] Token verification failed")
            return []
        
        # Get email from JWT (field "sub" contains email)
        email = payload.get('sub') or payload.get('email')
        print(f"[DEBUG] Email from JWT: {email}")
        
        if not email:
            # Fallback to old behavior if email not in token
            user_id = payload.get('user_id')
            print(f"[DEBUG] No email, using fallback user_id: {user_id}")
            if user_id:
                return Transaction.get_by_user_id(user_id, limit, offset)
            return []
        
        # Lookup user in DosWallet database by email
        # NOTE: User table is in doswallet_user_db, we need cross-database query
        # Direct SQL query instead of using User model to avoid database context issues
        from database import execute_query
        user_data = execute_query(
            "SELECT user_id, email FROM doswallet_user_db.users WHERE email = %s",
            (email,),
            fetch_one=True
        )
        print(f"[DEBUG] User data from database: {user_data}")
        
        if not user_data:
            print("[DEBUG] User not found in DosWallet database")
            return []
        
        # Extract user_id from query result
        # user_data is a tuple (user_id, name, email, phone, password, created_at, updated_at)
        # or a dict depending on execute_query implementation
        if isinstance(user_data, dict):
            doswallet_user_id = user_data.get('user_id')
        elif isinstance(user_data, tuple) or isinstance(user_data, list):
            doswallet_user_id = user_data[0]  # First column is user_id
        else:
            doswallet_user_id = getattr(user_data, 'user_id', None)
        
        print(f"[DEBUG] DosWallet user_id extracted: {doswallet_user_id}")
        
        if not doswallet_user_id:
            print("[DEBUG] Could not extract user_id")
            return []
        
        # Use DosWallet's user_id (not FDS user_id from JWT!)
        transactions = Transaction.get_by_user_id(doswallet_user_id, limit, offset)
        print(f"[DEBUG] Found {len(transactions) if transactions else 0} transactions")
        return transactions
    
    def resolve_transaction(self, info, transaction_id):
        """Get transaction by ID"""
        return Transaction.get_by_id(transaction_id)
    
    def resolve_transactions_by_type(self, info, transaction_type, limit=50, offset=0):
        """
        Get transactions by type
        FIX: Lookup user by email from JWT instead of user_id
        """
        token = get_token_from_request()
        if not token:
            return []
        
        payload = verify_token(token)
        if not payload:
            return []
        
        # Get email from JWT
        email = payload.get('sub') or payload.get('email')
        if not email:
            # Fallback to old behavior
            user_id = payload.get('user_id')
            if user_id:
                return Transaction.get_by_user_and_type(user_id, transaction_type, limit, offset)
            return []
        
        # Lookup user in DosWallet database
        user_data = User.get_by_email(email)
        if not user_data:
            return []
        
        # Extract user_id from query result
        if isinstance(user_data, dict):
            doswallet_user_id = user_data.get('user_id')
        elif isinstance(user_data, tuple) or isinstance(user_data, list):
            doswallet_user_id = user_data[0]
        else:
            doswallet_user_id = getattr(user_data, 'user_id', None)
        
        if not doswallet_user_id:
            return []
        
        # Use DosWallet's user_id
        return Transaction.get_by_user_and_type(doswallet_user_id, transaction_type, limit, offset)
        if not payload:
            return []
        
        return Transaction.get_by_type(payload['user_id'], transaction_type, limit, offset)

class Deposit(graphene.Mutation):
    class Arguments:
        # Use Float instead of Decimal for better compatibility with GraphQL clients
        amount = Float(required=True)
        # Accept camelCase `paymentMethod` at the GraphQL layer and map to python `payment_method`
        payment_method = String(name='paymentMethod')
        description = String()
        # Accept camelCase `idempotencyKey` at the GraphQL layer and map to python `idempotency_key`
        idempotency_key = String(name='idempotencyKey')
    
    Output = TransactionType
    
    def mutate(self, info, amount, payment_method=None, description=None, idempotency_key=None):
        """Create deposit transaction (atomic, idempotent)"""
        try:
            token = get_token_from_request()
            if not token:
                raise Exception("Authentication required")
            
            payload = verify_token(token)
            if not payload:
                raise Exception("Invalid token")
            
            user_id = payload['user_id']
            # Validation
            if float(amount) <= 0:
                raise Exception('Amount must be greater than zero')
            
            transaction_id = Transaction.deposit_atomic(user_id, float(amount), payment_method=payment_method, description=description, idempotency_key=idempotency_key)
            result = Transaction.get_by_id(transaction_id)
            if not result:
                raise Exception(f'Transaction {transaction_id} not found after creation')
            return result
        except Exception as e:
            import traceback
            import sys
            sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))
            from database import get_db_connection
            # Log error for debugging
            print(f"Deposit mutation error: {str(e)}", file=sys.stderr)
            print(traceback.format_exc(), file=sys.stderr)
            raise Exception(f"Deposit failed: {str(e)}")

class Withdraw(graphene.Mutation):
    class Arguments:
        # Use Float instead of Decimal for better compatibility with GraphQL clients
        amount = Float(required=True)
        # Accept camelCase `paymentMethod` at the GraphQL layer and map to python `payment_method`
        payment_method = String(name='paymentMethod')
        description = String()
        # Accept camelCase `idempotencyKey`
        idempotency_key = String(name='idempotencyKey')
    
    Output = TransactionType
    
    def mutate(self, info, amount, payment_method=None, description=None, idempotency_key=None):
        """Create withdrawal transaction (atomic)"""
        token = get_token_from_request()
        if not token:
            raise Exception("Authentication required")
        
        payload = verify_token(token)
        if not payload:
            raise Exception("Invalid token")
        
        user_id = payload['user_id']
        if float(amount) <= 0:
            raise Exception('Amount must be greater than zero')
        
        transaction_id = Transaction.withdraw_atomic(user_id, float(amount), payment_method=payment_method, description=description, idempotency_key=idempotency_key)
        return Transaction.get_by_id(transaction_id)

class Transfer(graphene.Mutation):
    class Arguments:
        receiver_id = Int(required=True)
        # Use Float instead of Decimal for better compatibility with GraphQL clients
        amount = Float(required=True)
        description = String()
        # Accept camelCase `idempotencyKey` in GraphQL variables
        idempotency_key = String(name='idempotencyKey')
    
    Output = TransactionType
    
    def mutate(self, info, receiver_id, amount, description=None, idempotency_key=None):
        """Create transfer transaction (atomic)"""
        token = get_token_from_request()
        if not token:
            raise Exception("Authentication required")
        
        payload = verify_token(token)
        if not payload:
            raise Exception("Invalid token")
        
        user_id = payload['user_id']
        if user_id == receiver_id:
            raise Exception("Cannot transfer to yourself")
        
        if float(amount) <= 0:
            raise Exception('Amount must be greater than zero')
        
        try:
            result = Transaction.transfer_atomic(user_id, receiver_id, float(amount), description=description or f"Transfer to user {receiver_id}", idempotency_key=idempotency_key)
            # transfer_atomic may return either a transaction id or a dict result
            if isinstance(result, dict):
                return result
            return Transaction.get_by_id(result)
        except Exception as e:
            # Bubble up a clear error message
            raise Exception(str(e))

class Pay(graphene.Mutation):
    """
    Mutasi untuk memproses pembayaran pesanan dari sistem eksternal (Food Delivery).
    Mengurangi saldo user berdasarkan 'nim' dan 'amount'.
    """
    class Arguments:
        nim = String(required=True)
        amount = Float(required=True)
    
    Output = PaymentResponse
    
    def mutate(self, info, nim, amount):
        """Process payment from external system (Food Delivery)"""
        # Validation
        if amount <= 0:
            return PaymentResponse(
                status="FAILED",
                trxId=None,
                balanceRemaining=None,
                message="Amount must be greater than zero"
            )
        
        # Look up user by email (assuming NIM is stored as email or email contains NIM)
        # Try direct email match first, then try email containing NIM
        user = User.get_by_email(nim)
        if not user:
            # Try to find user where email starts with NIM (e.g., NIM@university.edu)
            from database import execute_query
            query = "SELECT * FROM users WHERE email LIKE %s"
            users = execute_query(query, (f"{nim}%",), fetch_all=True)
            if users:
                user = users[0]
            else:
                return PaymentResponse(
                    status="FAILED",
                    trxId=None,
                    balanceRemaining=None,
                    message="User not found"
                )
        
        user_id = user['user_id']
        
        # Perform atomic payment (check balance and debit)
        try:
            result = Transaction.pay_atomic(
                user_id=user_id,
                amount=float(amount),
                description=f"Payment from Food Delivery System for NIM: {nim}",
                payment_method='food_delivery'
            )
            
            if result['success']:
                # Calculate points earned (1 point per Rp 10,000)
                points_earned = int(float(amount) / 10000)
                
                # Send success notification with points info
                try:
                    points_msg = f" dan mendapatkan {points_earned} poin reward!" if points_earned > 0 else "!"
                    Notification.create(
                        user_id=user_id,
                        message=f"Pembayaran berhasil: Rp {amount:,.2f} untuk pesanan Food Delivery{points_msg} Saldo tersisa: Rp {result['balance_remaining']:,.2f}"
                    )
                except Exception:
                    pass  # Notification failure shouldn't break payment
                
                return PaymentResponse(
                    status="SUCCESS",
                    trxId=str(result['transaction_id']),
                    balanceRemaining=float(result['balance_remaining']),
                    message=None
                )
            else:
                # Send failure notification
                try:
                    Notification.create(
                        user_id=user_id,
                        message=f"Pembayaran gagal: {result['message']}"
                    )
                except Exception:
                    pass
                
                return PaymentResponse(
                    status="FAILED",
                    trxId=None,
                    balanceRemaining=float(result['balance_remaining']) if result.get('balance_remaining') is not None else None,
                    message=result['message']
                )
        except Exception as e:
            return PaymentResponse(
                status="FAILED",
                trxId=None,
                balanceRemaining=None,
                message=str(e)
            )

class Mutation(ObjectType):
    deposit = Deposit.Field()
    withdraw = Withdraw.Field()
    transfer = Transfer.Field()
    pay = Pay.Field()

schema = graphene.Schema(query=Query, mutation=Mutation)

