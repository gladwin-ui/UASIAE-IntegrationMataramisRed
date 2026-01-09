"""
User Service GraphQL Schema
"""
import graphene
from graphene import ObjectType, String, Int, Field, List
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))
from auth import generate_token, verify_token, get_token_from_request
from models import User

class UserType(ObjectType):
    userId = Int(name='userId')
    name = String()
    email = String()
    phone = String()
    created_at = String()
    
    def resolve_userId(self, info):
        """Resolve userId from user_id"""
        if isinstance(self, dict):
            return self.get('user_id')
        return getattr(self, 'user_id', None)

class AuthResponse(ObjectType):
    token = String()
    user = Field(UserType)
    message = String()

class RegisterInput(graphene.InputObjectType):
    name = String(required=True)
    email = String(required=True)
    phone = String(required=True)
    password = String(required=True)

class LoginInput(graphene.InputObjectType):
    email = String()
    phone = String()
    password = String(required=True)

class Query(ObjectType):
    me = Field(UserType)
    user = Field(UserType, userId=Int(required=True, name='userId'))
    
    def resolve_me(self, info):
        """Get current user from token"""
        token = get_token_from_request()
        if not token:
            return None
        
        payload = verify_token(token)
        if not payload:
            return None
        
        return User.get_by_id(payload['user_id'])
    
    def resolve_user(self, info, userId):
        """Get user by ID"""
        return User.get_by_id(userId)

class Register(graphene.Mutation):
    class Arguments:
        input = RegisterInput(required=True)
    
    Output = AuthResponse
    
    def mutate(self, info, input):
        """Register a new user"""
        # Check if email exists
        existing_user = User.get_by_email(input.email)
        if existing_user:
            return AuthResponse(
                token=None,
                user=None,
                message="Email already registered"
            )
        
        # Check if phone exists
        existing_user = User.get_by_phone(input.phone)
        if existing_user:
            return AuthResponse(
                token=None,
                user=None,
                message="Phone number already registered"
            )
        
        # Create user
        user_id = User.create(
            name=input.name,
            email=input.email,
            phone=input.phone,
            password=input.password
        )
        
        # Generate token
        token = generate_token(user_id, input.email)
        
        # Get created user
        user = User.get_by_id(user_id)
        
        return AuthResponse(
            token=token,
            user=user,
            message="Registration successful"
        )

class Login(graphene.Mutation):
    class Arguments:
        input = LoginInput(required=True)
    
    Output = AuthResponse
    
    def mutate(self, info, input):
        """Login user"""
        # Find user by email or phone
        user = None
        if input.email:
            user = User.get_by_email(input.email)
        elif input.phone:
            user = User.get_by_phone(input.phone)
        else:
            return AuthResponse(
                token=None,
                user=None,
                message="Email or phone is required"
            )
        
        if not user:
            return AuthResponse(
                token=None,
                user=None,
                message="User not found"
            )
        
        # Verify password
        if not User.verify_password(input.password, user['password']):
            return AuthResponse(
                token=None,
                user=None,
                message="Invalid password"
            )
        
        # Generate token
        token = generate_token(user['user_id'], user['email'])
        
        # Remove password from response
        user_data = {
            'user_id': user['user_id'],
            'name': user['name'],
            'email': user['email'],
            'phone': user['phone'],
            'created_at': str(user['created_at'])
        }
        
        return AuthResponse(
            token=token,
            user=user_data,
            message="Login successful"
        )

class Mutation(ObjectType):
    register = Register.Field()
    login = Login.Field()

schema = graphene.Schema(query=Query, mutation=Mutation)

