import strawberry
from typing import List, Optional
from strawberry.types import Info
from strawberry.permission import BasePermission
from typing import Any
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import Order, OrderItem
from datetime import datetime, timedelta
from jose import jwt, JWTError
import os
import requests # UNTUK NEMBAK RESTAURANT SERVICE

# --- CONFIG ---
SECRET_KEY = os.getenv("SECRET_KEY", "kunci_rahasia_project_ini_harus_sama_semua")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
RESTAURANT_SERVICE_URL = "http://restaurant-service:8000" # URL Docker

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
    """Helper to get user ID from context (after IsAuthenticated check)"""
    user = info.context.get("user")
    if user:
        return int(user.get("id"))
    
    # Fallback to manual token parsing for backward compatibility
    request = info.context.get("request")
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise PermissionError("UNAUTHENTICATED: Authorization header missing")
    try:
        scheme, token = auth_header.split()
        if scheme.lower() != "bearer":
            raise PermissionError("UNAUTHENTICATED: Invalid authentication scheme")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload.get("id"))
    except Exception:
        raise PermissionError("UNAUTHENTICATED: Invalid or expired token")

# --- INPUT TYPES ---
@strawberry.input
class OrderItemInput:
    menu_item_id: int
    quantity: int
    # Kita hapus input 'price' & 'name' manual, biar sistem yang ambil dari DB (Lebih Aman!)

# --- OUTPUT TYPES ---
@strawberry.type
class OrderItemType:
    id: int
    menu_item_name: str
    quantity: int
    price: float

@strawberry.type
class OrderType:
    id: int
    user_id: int
    restaurant_id: int
    status: str
    total_price: float
    external_payment_id: Optional[str] = "MOCK-TRX-123" 

    @strawberry.field
    def items(self) -> List[OrderItemType]:
        db = SessionLocal()
        items_db = db.query(OrderItem).filter(OrderItem.order_id == self.id).all()
        db.close()
        return [
            OrderItemType(
                id=i.id,
                menu_item_name=i.menu_item_name,
                quantity=i.quantity,
                price=float(i.price)
            ) for i in items_db
        ]

# --- RESOLVERS ---
@strawberry.type
class Query:
    @strawberry.field
    def order(self, id: int) -> Optional[OrderType]:
        db = SessionLocal()
        order = db.query(Order).filter(Order.id == id).first()
        db.close()
        if order:
            return OrderType(
                id=order.id, user_id=order.user_id, restaurant_id=order.restaurant_id,
                status=order.status, total_price=float(order.total_price)
            )
        return None
    
    @strawberry.field
    def my_orders(self, info: Info) -> List[OrderType]:
        user_id = get_current_user_id(info)
        db = SessionLocal()
        orders = db.query(Order).filter(Order.user_id == user_id).all()
        db.close()
        return [
            OrderType(
                id=o.id, user_id=o.user_id, restaurant_id=o.restaurant_id,
                status=o.status, total_price=float(o.total_price)
            ) for o in orders
        ]

# --- MUTATION ---
@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_order(
        self,
        info: Info,
        restaurant_id: int, 
        address_id: int, 
        items: List[OrderItemInput]
    ) -> OrderType:
        
        user_id = get_current_user_id(info)
        db = SessionLocal()
        
        try:
            # --- LANGKAH 1: Validasi Stok & Harga ke Restaurant Service ---
            validated_items = []
            total_amount = 0
            stock_update_payload = []

            for item_input in items:
                # Nembak API Internal Restaurant
                try:
                    res = requests.get(f"{RESTAURANT_SERVICE_URL}/internal/menu-items/{item_input.menu_item_id}")
                    if res.status_code != 200:
                        raise Exception(f"Menu Item ID {item_input.menu_item_id} not found")
                    
                    menu_data = res.json()
                    
                    # Cek Restoran (Pastikan item milik restoran yang benar)
                    if menu_data['restaurant_id'] != restaurant_id:
                         raise Exception(f"Menu {menu_data['name']} does not belong to this restaurant")

                    # Cek Stok
                    if menu_data['stock'] < item_input.quantity:
                        raise Exception(f"Stock habis untuk {menu_data['name']}. Sisa: {menu_data['stock']}")

                    # Hitung Total (Pakai harga dari DB, bukan input user -> Anti Cheat)
                    item_total = menu_data['price'] * item_input.quantity
                    total_amount += item_total
                    
                    validated_items.append({
                        "id": menu_data['id'],
                        "name": menu_data['name'],
                        "price": menu_data['price'],
                        "qty": item_input.quantity
                    })
                    
                    stock_update_payload.append({
                        "menu_item_id": menu_data['id'],
                        "quantity": item_input.quantity
                    })
                    
                except requests.exceptions.ConnectionError:
                    raise Exception("Failed to connect to Restaurant Service")

            # --- LANGKAH 2: Kurangi Stok (Reservasi Stok) ---
            # Kita kurangi stok SAAT order dibuat agar tidak ada race condition
            res_stock = requests.post(
                f"{RESTAURANT_SERVICE_URL}/internal/menu-items/reduce-stock",
                json=stock_update_payload
            )
            if res_stock.status_code != 200:
                raise Exception(f"Failed to reduce stock: {res_stock.text}")

            # --- LANGKAH 3: Simpan Order ke DB ---
            estimasi = datetime.now() + timedelta(minutes=45)

            new_order = Order(
                user_id=user_id,
                restaurant_id=restaurant_id,
                address_id=address_id,
                total_price=total_amount,
                status="PENDING_PAYMENT",
                estimated_delivery_time=estimasi 
            )
            db.add(new_order)
            db.commit()
            db.refresh(new_order)
            
            for v_item in validated_items:
                order_item = OrderItem(
                    order_id=new_order.id,
                    menu_item_id=v_item['id'],
                    menu_item_name=v_item['name'],
                    quantity=v_item['qty'],
                    price=v_item['price']
                )
                db.add(order_item)
            db.commit()
            
            return OrderType(
                id=new_order.id,
                user_id=new_order.user_id,
                restaurant_id=new_order.restaurant_id,
                status=new_order.status,
                total_price=float(new_order.total_price)
            )
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()

schema = strawberry.Schema(query=Query, mutation=Mutation)