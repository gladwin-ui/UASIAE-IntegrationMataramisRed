"""
Authentication Permission Class for Strawberry GraphQL
Enforces strict JWT validation on all protected queries/mutations
"""
from strawberry.permission import BasePermission
from strawberry.types import Info
from typing import Any
from jose import jwt, JWTError
import os

SECRET_KEY = os.getenv("SECRET_KEY", "kunci_rahasia_project_ini_harus_sama_semua")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

class IsAuthenticated(BasePermission):
    """
    Strict authentication permission - raises GraphQL error if token missing/invalid
    """
    message = "UNAUTHENTICATED: Login required"
    
    def has_permission(self, source: Any, info: Info, **kwargs) -> bool:
        request = info.context.get("request")
        
        if not request:
            raise PermissionError("Request context not found")
        
        auth_header = request.headers.get("Authorization")
        
        if not auth_header:
            raise PermissionError("UNAUTHENTICATED: Authorization header missing")
        
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise PermissionError("UNAUTHENTICATED: Invalid authentication scheme")
            
            # Decode and validate JWT
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            
            # Store user info in context for use in resolvers
            info.context["user"] = payload
            
            return True
            
        except (ValueError, JWTError) as e:
            raise PermissionError(f"UNAUTHENTICATED: Invalid or expired token - {str(e)}")

def get_current_user(info: Info) -> dict:
    """
    Helper to get current user from context (after IsAuthenticated permission check)
    """
    user = info.context.get("user")
    if not user:
        raise PermissionError("UNAUTHENTICATED: User not found in context")
    return user
