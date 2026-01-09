import strawberry
from typing import List, Optional
from strawberry.types import Info
from strawberry.permission import BasePermission
from typing import Any
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import Payment
from jose import jwt, JWTError
import os
import requests
import httpx
import json

# --- CONFIG ---
SECRET_KEY = os.getenv("SECRET_KEY", "kunci_rahasia_project_ini_harus_sama_semua")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ORDER_SERVICE_URL = "http://order-service:8000"
DOSWALLET_TRANSACTION_URL = "http://dw-transaction-service:5003/graphql"
X_SECRET_KEY = os.getenv("X_SECRET_KEY")

# --- PERMISSION CLASS ---
class IsAuthenticated(BasePermission):
    """Strict JWT authentication - raises GraphQL error if unauthorized"""
    message = "UNAUTHENTICATED: Login required"
    
    def has_permission(self, source: Any, info: Info, **kwargs) -> bool:
        request = info.context.get("request")
        
        if not request:
            raise PermissionError("UNAUTHENTICATED: Request context not found")
        
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            raise PermissionError("UNAUTHENTICATED: Authorization header missing. Please login first.")
        
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise PermissionError("UNAUTHENTICATED: Invalid authentication scheme")
            
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            info.context["user"] = payload
            return True
            
        except (ValueError, JWTError) as e:
            raise PermissionError(f"UNAUTHENTICATED: Invalid or expired token")

def get_current_user_id(info: Info) -> int:
    """Helper to get user ID from context"""
    user = info.context.get("user")
    if user:
        return int(user.get("id"))
    
    # Fallback
    request = info.context.get("request")
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise PermissionError("UNAUTHENTICATED: Authorization header missing")
    try:
        scheme, token = auth_header.split()
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload.get("id"))
    except Exception:
        raise PermissionError("UNAUTHENTICATED: Invalid or expired token")

def get_auth_token(info: Info) -> str:
    """Extract full auth token from request"""
    request = info.context.get("request")
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise PermissionError("UNAUTHENTICATED: Authorization header missing")
    try:
        scheme, token = auth_header.split()
        return token
    except Exception:
        raise PermissionError("UNAUTHENTICATED: Invalid authorization header")

# --- TYPES ---
@strawberry.type
class PaymentType:
    id: int
    order_id: int
    user_id: int
    amount: float
    status: str
    payment_method: Optional[str]
    created_at: str

@strawberry.type
class PaymentResult:
    success: bool
    message: str
    payment: Optional[PaymentType]

# --- RESOLVERS ---
@strawberry.type
class Query:
    @strawberry.field
    def payment_history(self, info: Info) -> List[PaymentType]:
        user_id = get_current_user_id(info)
        db = SessionLocal()
        payments = db.query(Payment).filter(Payment.user_id == user_id).all()
        db.close()
        return [
            PaymentType(
                id=p.id, order_id=p.order_id, user_id=p.user_id,
                amount=float(p.amount), status=p.status,
                payment_method=p.payment_method, created_at=str(p.created_at)
            ) for p in payments
        ]

@strawberry.type
class Mutation:
    @strawberry.mutation
    async def pay_order(
        self, info: Info, order_id: int, method: str
    ) -> PaymentResult:
        """
        Pay for an order. Price is fetched from backend, NOT sent from client.
        For DOSWALLET method, makes S2S GraphQL call to DosWallet Transaction Service.
        """
        
        user_id = get_current_user_id(info)
        auth_token = get_auth_token(info)
        
        # --- STEP 1: Fetch Order Details from Order Service ---
        try:
            response = requests.get(f"{ORDER_SERVICE_URL}/internal/orders/{order_id}")
            
            if response.status_code == 404:
                return PaymentResult(
                    success=False,
                    message="Order not found",
                    payment=None
                )
            
            order_data = response.json()
            
            # Validate order status
            if order_data['status'] != 'PENDING_PAYMENT':
                return PaymentResult(
                    success=False,
                    message=f"Order status is {order_data['status']}, cannot process payment",
                    payment=None
                )
            
            # Validate order ownership
            if order_data['user_id'] != user_id:
                return PaymentResult(
                    success=False,
                    message="Unauthorized: Order belongs to another user",
                    payment=None
                )
            
            # Get price from backend (secure - not from client!)
            amount = float(order_data['total_price'])
            
        except requests.exceptions.ConnectionError:
            return PaymentResult(
                success=False,
                message="Failed to connect to Order Service",
                payment=None
            )
        
        db = SessionLocal()
        try:
            # Check for duplicate payment
            existing = db.query(Payment).filter(
                Payment.order_id == order_id, Payment.status == "SUCCESS"
            ).first()
            if existing:
                return PaymentResult(
                    success=False,
                    message="Order already paid",
                    payment=None
                )
            
            # --- STEP 2: Process Payment based on method ---
            if method == "DOSWALLET":
                # S2S Call to DosWallet Transaction Service (REST API)
                # Using existing /api/merchant/payment endpoint
                try:
                    from .doswallet_client import DosWalletClient
                    dos_client = DosWalletClient()
                    
                    # This will call the merchant/payment REST endpoint
                    dos_client.pay(user_id, amount, str(order_id))
                    print(f"✅ DosWallet S2S Payment Success for Order #{order_id}, Amount: {amount}")
                    
                except Exception as e:
                    return PaymentResult(
                        success=False,
                        message=f"DosWallet payment failed: {str(e)}",
                        payment=None
                    )

            
            # --- STEP 3: Record Payment Locally ---
            new_payment = Payment(
                order_id=order_id, user_id=user_id, amount=amount,
                payment_method=method, status="SUCCESS"
            )
            db.add(new_payment)
            db.commit()
            db.refresh(new_payment)
            
            # --- STEP 4: Update Order Status to PAID ---
            requests.put(
                f"{ORDER_SERVICE_URL}/internal/orders/{order_id}/status",
                json={"status": "PAID"}
            )
            
            return PaymentResult(
                success=True,
                message="Payment successful",
                payment=PaymentType(
                    id=new_payment.id, order_id=new_payment.order_id,
                    user_id=new_payment.user_id, amount=float(new_payment.amount),
                    status=new_payment.status, payment_method=new_payment.payment_method,
                    created_at=str(new_payment.created_at)
                )
            )
            
        except Exception as e:
            db.rollback()
            return PaymentResult(
                success=False,
                message=str(e),
                payment=None
            )
        finally:
            db.close()
    
    @strawberry.mutation
    def process_payment(
        self, info: Info, order_id: int, amount: float, payment_method: str
    ) -> PaymentType:
        """Legacy REST-style mutation - kept for backward compatibility"""
        
        user_id = get_current_user_id(info)
        
        # --- VALIDATION with Order Service ---
        try:
            response = requests.get(f"{ORDER_SERVICE_URL}/internal/orders/{order_id}")
            
            if response.status_code == 404:
                raise Exception("Order Not Found in Order Service")
            
            order_data = response.json()
            
            if order_data['status'] != 'PENDING_PAYMENT':
                raise Exception(f"Payment Failed: Order status is already {order_data['status']}")
            
            if order_data['user_id'] != user_id:
                raise Exception("Unauthorized: This order belongs to another user")

        except requests.exceptions.ConnectionError:
            raise Exception("Failed to connect to Order Service")
        
        # --- Process Payment ---
        db = SessionLocal()
        try:
            existing = db.query(Payment).filter(
                Payment.order_id == order_id, Payment.status == "SUCCESS"
            ).first()
            if existing:
                raise Exception("Order already paid (Recorded in Payment DB)")

            new_payment = Payment(
                order_id=order_id, user_id=user_id, amount=amount,
                payment_method=payment_method, status="SUCCESS"
            )
            db.add(new_payment)
            db.commit()
            db.refresh(new_payment)
            
            # Update Order Status
            requests.put(
                f"{ORDER_SERVICE_URL}/internal/orders/{order_id}/status",
                json={"status": "PAID"}
            )
            
            return PaymentType(
                id=new_payment.id, order_id=new_payment.order_id,
                user_id=new_payment.user_id, amount=float(new_payment.amount),
                status=new_payment.status, payment_method=new_payment.payment_method,
                created_at=str(new_payment.created_at)
            )
            
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()

schema = strawberry.Schema(query=Query, mutation=Mutation)