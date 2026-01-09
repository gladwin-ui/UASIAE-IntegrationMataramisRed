"""
Wallet Service GraphQL Schema
"""
import graphene
from graphene import ObjectType, String, Decimal, Int, Field, Float
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))
from auth import verify_token, get_token_from_request
from models import Wallet

class WalletType(ObjectType):
    # Force snake_case field names to match frontend queries
    wallet_id = Int(name='wallet_id')
    user_id = Int(name='user_id')
    balance = Float()  # Use Float instead of Decimal for compatibility
    points = Int()
    created_at = String(name='created_at')
    updated_at = String(name='updated_at')
    
    def resolve_balance(self, info):
        """Resolve balance as Float"""
        if isinstance(self, dict):
            balance_val = self.get('balance')
        else:
            balance_val = getattr(self, 'balance', None)
        
        if balance_val is None:
            return None
        
        try:
            if hasattr(balance_val, '__float__'):
                return float(balance_val)
            return float(balance_val)
        except (ValueError, TypeError):
            return None

class Query(ObjectType):
    # Support both snake_case and camelCase
    my_wallet = Field(WalletType, name='my_wallet')
    wallet = Field(WalletType, user_id=Int(required=True))
    
    def resolve_my_wallet(self, info):
        """Get current user's wallet"""
        token = get_token_from_request()
        if not token:
            return None
        
        payload = verify_token(token)
        if not payload:
            return None
        
        wallet = Wallet.get_by_user_id(payload['user_id'])
        if not wallet:
            # Create wallet if doesn't exist
            Wallet.create(payload['user_id'])
            wallet = Wallet.get_by_user_id(payload['user_id'])
        
        return wallet
    
    def resolve_wallet(self, info, user_id):
        """Get wallet by user ID"""
        return Wallet.get_by_user_id(user_id)

class UpdateBalance(graphene.Mutation):
    class Arguments:
        amount = Decimal(required=True)
        operation = String(required=True)  # 'add' or 'subtract'
    
    Output = WalletType
    
    def mutate(self, info, amount, operation):
        """Update wallet balance"""
        token = get_token_from_request()
        if not token:
            raise Exception("Authentication required")
        
        payload = verify_token(token)
        if not payload:
            raise Exception("Invalid token")
        
        user_id = payload['user_id']
        
        # Ensure wallet exists
        wallet = Wallet.get_by_user_id(user_id)
        if not wallet:
            Wallet.create(user_id)
        
        # Update balance
        Wallet.update_balance(user_id, float(amount), operation)
        
        return Wallet.get_by_user_id(user_id)

class UpdatePoints(graphene.Mutation):
    class Arguments:
        points = Int(required=True)
        operation = String(required=True)  # 'add' or 'subtract'
    
    Output = WalletType
    
    def mutate(self, info, points, operation):
        """Update wallet points"""
        token = get_token_from_request()
        if not token:
            raise Exception("Authentication required")
        
        payload = verify_token(token)
        if not payload:
            raise Exception("Invalid token")
        
        user_id = payload['user_id']
        
        # Ensure wallet exists
        wallet = Wallet.get_by_user_id(user_id)
        if not wallet:
            Wallet.create(user_id)
        
        # Update points
        Wallet.update_points(user_id, points, operation)
        
        return Wallet.get_by_user_id(user_id)

class Mutation(ObjectType):
    update_balance = UpdateBalance.Field()
    update_points = UpdatePoints.Field()

schema = graphene.Schema(query=Query, mutation=Mutation)

