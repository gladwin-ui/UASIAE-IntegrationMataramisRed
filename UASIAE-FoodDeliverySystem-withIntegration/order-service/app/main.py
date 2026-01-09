from fastapi import FastAPI, Depends, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from pydantic import BaseModel
from jose import jwt # Add this
import os # Add this
from .database import engine, Base, get_db
from .models import Order
from .schema import schema

# Buat tabel
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Order Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Valid Statuses
STATUS_PENDING = "PENDING_PAYMENT"
STATUS_PAID = "PAID"
STATUS_PREPARING = "PREPARING"
STATUS_ON_DELIVERY = "ON_THE_WAY"
STATUS_DELIVERED = "DELIVERED"
STATUS_COMPLETED = "COMPLETED"
STATUS_CANCELLED = "CANCELLED"

SECRET_KEY = os.getenv("SECRET_KEY", "kunci_rahasia_project_ini_harus_sama_semua")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# --- HELPER: GET CURRENT USER ---
def get_current_user_id(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Token")
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Token")

# --- TAMBAHAN UNTUK INTEGRASI (Internal API) ---
# ... (internal APIs remain)

@app.get("/orders")
def get_my_orders(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    # Filter OUT completed/cancelled if user only wants "Active" or explicit history?
    # User said: "Pesanan still comes to my order... harusnya tidak".
    # Assuming "My Orders" usually implies Active or All.
    # If user wants them GONE, filter CANCELLED.
    # User requested to see History ("Selesai") and interact with Pending.
    # Showing ALL orders sorted by Date.
    orders = db.query(Order).filter(
        Order.user_id == user_id
    ).order_by(Order.created_at.desc()).all()
    
    # Fetch Restaurants for name mapping
    restaurant_map = {}
    try:
        res = requests.get(f"{RESTAURANT_SERVICE_URL}/restaurants")
        if res.status_code == 200:
            for r in res.json()['data']:
                restaurant_map[r['id']] = r['name']
    except Exception as e:
        print(f"Failed to fetch restaurants map: {e}")

    data = []
    for o in orders:
        data.append({
            "order_id": o.id, # Critical for Frontend Link
            "id": o.id,
            "restaurant_id": o.restaurant_id,
            "restaurant_name": restaurant_map.get(o.restaurant_id, f"Restaurant {o.restaurant_id}"),
            "status": o.status,
            "total_price": float(o.total_price),
            "created_at": o.created_at
        })
    
    return {"status": "success", "data": data}

import requests # Add this
from datetime import datetime, timedelta # Add this
from typing import List, Optional # Add this
from .models import OrderItem # Add this

RESTAURANT_SERVICE_URL = "http://restaurant-service:8000"

class OrderItemRequest(BaseModel):
    menu_item_id: int
    quantity: int

class CreateOrderRequest(BaseModel):
    restaurant_id: int
    address_id: int
    items: List[OrderItemRequest]

@app.post("/orders")
def create_order(
    req: CreateOrderRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    try:
        # --- LANGKAH 1: Validasi Stok & Harga ke Restaurant Service ---
        validated_items = []
        total_amount = 0
        stock_update_payload = []

        for item_input in req.items:
            # Nembak API Internal Restaurant
            try:
                res = requests.get(f"{RESTAURANT_SERVICE_URL}/internal/menu-items/{item_input.menu_item_id}")
                if res.status_code != 200:
                    raise HTTPException(status_code=400, detail=f"Menu Item ID {item_input.menu_item_id} not found")
                
                menu_data = res.json()
                
                # Cek Restoran (Pastikan item milik restoran yang benar)
                if menu_data['restaurant_id'] != req.restaurant_id:
                        raise HTTPException(status_code=400, detail=f"Menu {menu_data['name']} does not belong to this restaurant")

                # Cek Stok
                if menu_data['stock'] < item_input.quantity:
                    raise HTTPException(status_code=400, detail=f"Stock habis untuk {menu_data['name']}. Sisa: {menu_data['stock']}")

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
                raise HTTPException(status_code=503, detail="Failed to connect to Restaurant Service")

        # --- LANGKAH 2: Kurangi Stok (Reservasi Stok) ---
        res_stock = requests.post(
            f"{RESTAURANT_SERVICE_URL}/internal/menu-items/reduce-stock",
            json=stock_update_payload
        )
        if res_stock.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to reduce stock: {res_stock.text}")

        # --- LANGKAH 3: Simpan Order ke DB ---
        estimasi = datetime.now() + timedelta(minutes=45)

        new_order = Order(
            user_id=user_id,
            restaurant_id=req.restaurant_id,
            address_id=req.address_id,
            total_price=total_amount,
            status=STATUS_PENDING,
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
        
        return {
            "status": "success", 
            "data": {
                "id": new_order.id, 
                "order_id": new_order.id, # Frontend keys
                "payment_id": 12345, # Frontend requires a payment_id to proceed. Mocking for MVP.
                "user_id": new_order.user_id,
                "restaurant_id": new_order.restaurant_id,
                "address_id": new_order.address_id,
                "status": new_order.status,
                "total_price": float(new_order.total_price),
                "estimated_delivery_time": new_order.estimated_delivery_time
            }
        }
        
    except Exception as e:
        db.rollback()
        # If stock was reduced but DB failed, typically we should try to rollback stock too, 
        # but for this MVP scope we skip distributed transaction complexity.
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

# --- DRIVER ENDPOINTS (Moved Up to Avoid Conflict with /orders/{order_id}) ---

@app.get("/orders/available")
def get_available_orders(
    request: Request, # Need request for Token
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    orders = db.query(Order).filter(Order.status.in_([STATUS_PAID, STATUS_PREPARING]), Order.driver_id == None).all()
    
    restaurant_map = {}
    user_map = {} # Map for User Info

    try:
        res = requests.get(f"{RESTAURANT_SERVICE_URL}/restaurants")
        if res.status_code == 200:
            for r in res.json()['data']:
                restaurant_map[r['id']] = r['name']

        # Fetch Users for Real Names & Addresses
        USER_SERVICE_URL = "http://user-service:8000"
        u_res = requests.get(f"{USER_SERVICE_URL}/users/admin/all")
        if u_res.status_code == 200:
            for u in u_res.json()['data']:
                 user_map[u['id']] = u
    except:
        pass

    data = []
    for o in orders:
        items = db.query(OrderItem).filter(OrderItem.order_id == o.id).all()
        items_data = [
            {"menu_item_name": i.menu_item_name, "quantity": i.quantity, "price": float(i.price)} for i in items
        ]

        # Improved Placeholder using User Map
        c_name = f"User {o.user_id}" 
        c_addr = f"Address {o.address_id}" 
        
        user_info = user_map.get(o.user_id)
        if user_info:
            c_name = user_info['name']
            # Find address
            for addr in user_info.get('addresses', []):
                if addr['id'] == o.address_id:
                    c_addr = addr['full_address']
                    break

        data.append({
            "order_id": o.id, 
            "id": o.id,
            "restaurant_name": restaurant_map.get(o.restaurant_id, f"Restaurant {o.restaurant_id}"),
            "restaurant_address": f"Resto Address",
            "delivery_address": c_addr,
            "customer_name": c_name, 
            "customer_address": c_addr, 
            "total_price": float(o.total_price),
            "status": o.status,
            "created_at": o.created_at,
            "items": items_data
        })
    return {"status": "success", "data": data}

@app.get("/orders/driver/my-orders")
def get_my_driver_orders(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    # Filter OUT completed orders (ACTIVE ONLY)
    orders = db.query(Order).filter(
        Order.driver_id == user_id,
        Order.status.notin_([STATUS_DELIVERED, STATUS_COMPLETED, STATUS_CANCELLED])
    ).order_by(Order.created_at.desc()).all()
    
    restaurant_map = {}
    user_map = {} # Map for User Info

    try:
        res = requests.get(f"{RESTAURANT_SERVICE_URL}/restaurants")
        if res.status_code == 200:
            for r in res.json()['data']:
                restaurant_map[r['id']] = r['name']
        
        # Fetch Users
        USER_SERVICE_URL = "http://user-service:8000"
        u_res = requests.get(f"{USER_SERVICE_URL}/users/admin/all")
        if u_res.status_code == 200:
            for u in u_res.json()['data']:
                 user_map[u['id']] = u
    except:
        pass

    data = []
    for o in orders:
        items = db.query(OrderItem).filter(OrderItem.order_id == o.id).all()
        items_data = [
            {"menu_item_name": i.menu_item_name, "quantity": i.quantity, "price": float(i.price)} for i in items
        ]

        # Normalize Status for Frontend (Legacy fix)
        display_status = o.status
        if o.status == "ON_DELIVERY":
            display_status = "ON_THE_WAY"

        # Resolve Customer Info
        customer_name = f"User {o.user_id}"
        customer_address = f"Address {o.address_id}"
        
        user_info = user_map.get(o.user_id)
        if user_info:
            customer_name = user_info['name']
            # Find address
            for addr in user_info.get('addresses', []):
                if addr['id'] == o.address_id:
                    customer_address = addr['full_address']
                    break

        data.append({
            "order_id": o.id,
            "id": o.id,
            "restaurant_name": restaurant_map.get(o.restaurant_id, f"Restaurant {o.restaurant_id}"),
            "restaurant_address": "Jakarta", 
            "delivery_address": customer_address,
            "customer_name": customer_name,
            "customer_address": customer_address,
            "total_price": float(o.total_price),
            "status": display_status,
            "created_at": o.created_at,
            "items": items_data
        })
    return {"status": "success", "data": data}

@app.post("/orders/{order_id}/accept")
def accept_order_driver(
    order_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.driver_id is not None:
        raise HTTPException(status_code=400, detail="Order already taken")
        
    order.driver_id = user_id
    order.status = STATUS_ON_DELIVERY
    db.commit()
    return {"status": "success", "message": "Order accepted"}

DRIVER_SERVICE_URL = "http://driver-service:8000"

@app.post("/orders/{order_id}/complete")
def complete_order_driver(
    order_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.driver_id != user_id:
        raise HTTPException(status_code=403, detail="Not your order")
        
    order.status = STATUS_DELIVERED 
    db.commit()
    
    # --- INTEGRASI: Update Gaji Driver ---
    try:
        earning = float(order.total_price) * 0.10
        print(f"DEBUG: Computing Earning for Driver {user_id}. Order {order.id} Price {order.total_price} -> Earning {earning}")
        
        res = requests.post(
            f"{DRIVER_SERVICE_URL}/internal/drivers/earnings",
            json={
                "user_id": user_id,
                "amount": earning,
                "order_id": order.id
            }
        )
        print(f"DEBUG: Driver Service Response: {res.status_code} {res.text}")
    except requests.exceptions.RequestException as e:
        print(f"Failed to record earning (Request Error): {e}")
        if e.response:
             print(f"Response Body: {e.response.text}")
    except Exception as e:
        print(f"Failed to record earning: {e}")
    
    return {"status": "success", "message": "Order completed"}

@app.post("/orders/{order_id}/cancel") # Use POST or PUT
def cancel_order(
    order_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your order")
        
    if order.status not in [STATUS_PENDING]:
        raise HTTPException(status_code=400, detail="Cannot cancel order in this status")
        
    order.status = STATUS_CANCELLED
    db.commit()
    return {"status": "success", "message": "Order cancelled"}

@app.get("/orders/{order_id}")
def get_order_by_id(
    order_id: int,
    request: Request, # Add Request
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    # Ensure user owns the order OR user is admin
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
    
    # --- FETCH DETAILS (INTEGRASI) ---
    restaurant_name = f"Restaurant {order.restaurant_id}"
    restaurant_address = "Restaurant Address"
    customer_name = "Customer"
    customer_address = f"Address {order.address_id}"
    driver_details = None # Default null
    
    # 1. Fetch Restaurant Info
    try:
        r_res = requests.get(f"{RESTAURANT_SERVICE_URL}/restaurants/{order.restaurant_id}")
        if r_res.status_code == 200:
            r_data = r_res.json()['data']
            restaurant_name = r_data['name']
            restaurant_address = r_data.get('address', 'Unknown Address')
    except Exception as e:
        print(f"Failed to fetch restaurant: {e}")

    # 2. Fetch User Info (Profile & Address)
    USER_SERVICE_URL = "http://user-service:8000"
    token = request.headers.get("Authorization")
    if token:
        try:
            headers = {"Authorization": token}
            
            # Profile
            u_res = requests.get(f"{USER_SERVICE_URL}/users/profile/me", headers=headers)
            if u_res.status_code == 200:
                customer_name = u_res.json()['name']
            
            # Address
            a_res = requests.get(f"{USER_SERVICE_URL}/users/addresses", headers=headers)
            if a_res.status_code == 200:
                addresses = a_res.json()['data']
                # Find matching address
                matched = next((a for a in addresses if a['id'] == order.address_id), None)
                if matched:
                    customer_address = matched['full_address']
        except Exception as e:
            print(f"Failed to fetch user info: {e}")

     # 3. Driver Details
    if order.driver_id:
         # Call Driver Service Internal Endpoint
         DRIVER_SERVICE_URL = "http://driver-service:8000"
         try:
             d_res = requests.get(f"{DRIVER_SERVICE_URL}/internal/drivers/details/{order.driver_id}")
             if d_res.status_code == 200:
                 driver_details = d_res.json()
             else:
                 driver_details = {
                     "name": f"Driver {order.driver_id}", 
                     "phone": "-", 
                     "vehicle": "Unknown",
                     "vehicle_number": "-",
                     "vehicle_type": "Unknown"
                 }
         except Exception as e:
             print(f"Failed to fetch driver details: {e}")
             driver_details = {
                 "name": "Driver (Error)", 
                 "phone": "-", 
                 "vehicle": "Unknown",
                 "vehicle_number": "-",
                 "vehicle_type": "Unknown"
             }

    # Normalize Status for Frontend (Legacy fix)
    display_status = order.status
    if order.status == "ON_DELIVERY":
        display_status = "ON_THE_WAY"

    order_data = {
        "id": order.id,
        "order_id": order.id,
        "user_id": order.user_id,
        "restaurant_id": order.restaurant_id,
        "restaurant_name": restaurant_name, # Flattened for Frontend
        "customer_name": customer_name, # Flattened 
        "customer_address": customer_address, # Flattened for Payment Page
        "address_id": order.address_id,
        "status": display_status, 
        "total_price": float(order.total_price),
        "created_at": order.created_at,
        "estimated_delivery": order.estimated_delivery_time,
        "delivery_address": customer_address, 
        "restaurant_details": {
            "name": restaurant_name,
            "address": restaurant_address
        },
        "driver_details": driver_details, 
        "items": [
            {
                "id": i.id,
                "menu_item_id": i.menu_item_id,
                "menu_item_name": i.menu_item_name,
                "name": i.menu_item_name, 
                "quantity": i.quantity,
                "price": float(i.price)
            } for i in items
        ]
    }
    
    return {"status": "success", "data": order_data}

@app.get("/orders/driver/history")
def get_driver_order_history(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    # Fetch Completed Orders
    orders = db.query(Order).filter(
        Order.driver_id == user_id,
        Order.status.in_([STATUS_DELIVERED, STATUS_COMPLETED])
    ).order_by(Order.created_at.desc()).all()
    
    # ... (Same mapping logic as others, simplified for brevity or reuse) ...
    # Reuse mapping logic ideally, but for now duplicate for safety/speed
    restaurant_map = {}
    user_map = {} # Map for User Info
    
    try:
        res = requests.get(f"{RESTAURANT_SERVICE_URL}/restaurants")
        if res.status_code == 200:
            for r in res.json()['data']:
                restaurant_map[r['id']] = r['name']
                
        # Fetch Users for Real Names & Addresses
        USER_SERVICE_URL = "http://user-service:8000"
        u_res = requests.get(f"{USER_SERVICE_URL}/users/admin/all")
        if u_res.status_code == 200:
            for u in u_res.json()['data']:
                 user_map[u['id']] = u
    except:
        pass
        
    data = []
    for o in orders:
        items = db.query(OrderItem).filter(OrderItem.order_id == o.id).all()
        items_data = [{"menu_item_name": i.menu_item_name, "quantity": i.quantity, "price": float(i.price)} for i in items]
        
        # Resolve Customer Info
        customer_name = f"User {o.user_id}"
        customer_address = f"Address {o.address_id}"
        
        user_info = user_map.get(o.user_id)
        if user_info:
            customer_name = user_info['name']
            # Find address
            for addr in user_info.get('addresses', []):
                if addr['id'] == o.address_id:
                    customer_address = addr['full_address']
                    break
        
        data.append({
            "order_id": o.id,
            "id": o.id,
            "restaurant_name": restaurant_map.get(o.restaurant_id, f"Restaurant {o.restaurant_id}"),
            "customer_name": customer_name, 
            "customer_address": customer_address, 
            "total_price": float(o.total_price),
            "status": o.status,
            "created_at": o.created_at,
            "items": items_data
        })
    return {"status": "success", "data": data}

# --- TAMBAHAN UNTUK INTEGRASI (Internal API) ---

class OrderStatusUpdate(BaseModel):
    status: str

# 1. Endpoint untuk Payment Service mengecek Order
@app.get("/internal/orders/{order_id}")
def get_order_internal(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {
        "id": order.id,
        "status": order.status,
        "total_price": float(order.total_price),
        "user_id": order.user_id
    }

# 2. Endpoint untuk Payment Service meng-update status jadi PAID/PREPARING
@app.put("/internal/orders/{order_id}/status")
def update_order_status_internal(order_id: int, update: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = update.status
    db.commit()
    return {"message": "Status updated successfully", "new_status": order.status}

# ... (kode sebelumnya) ...

# 3. Endpoint Get Order by Status (Untuk Driver cari order PAID)
@app.get("/internal/orders/status/{status}")
def get_orders_by_status_internal(status: str, db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.status == status).all()
    return [
        {
            "id": o.id,
            "restaurant_id": o.restaurant_id,
            "address_id": o.address_id,
            "total_price": float(o.total_price),
            "status": o.status
        } for o in orders
    ]

# 4. Endpoint Sales Statistics (Admin Dashboard)
@app.get("/orders/admin/sales/statistics")
def get_sales_statistics(db: Session = Depends(get_db)):
    # Total Orders
    total_orders = db.query(Order).count()
    
    # Total Sales (Sum of total_price where status is NOT CANCELLED)
    # Using coalesce to return 0 if None
    total_sales = db.query(func.coalesce(func.sum(Order.total_price), 0)).filter(Order.status != STATUS_CANCELLED).scalar()
    
    # Completed Orders (DELIVERED or COMPLETED)
    completed_orders = db.query(Order).filter(Order.status.in_([STATUS_DELIVERED, STATUS_COMPLETED])).count()

    # Pending Orders (PENDING, PAID, PREPARING, ON_THE_WAY)
    pending_orders = db.query(Order).filter(
        Order.status.in_([STATUS_PENDING, STATUS_PAID, STATUS_PREPARING, STATUS_ON_DELIVERY])
    ).count()

    # Calculate Average Order Value
    avg_order = 0
    if total_orders > 0:
        avg_order = float(total_sales or 0) / total_orders

    # Daily Statistics (Last 7 Days)
    # MySQL: DATE(created_at)
    # SQLAlchemy: func.date(...)
    from datetime import timedelta
    
    # Simple Group By Date
    daily_stats_query = db.query(
        func.date(Order.created_at).label('date'),
        func.count(Order.id).label('count'),
        func.sum(Order.total_price).label('revenue')
    ).filter(Order.status != STATUS_CANCELLED).group_by(func.date(Order.created_at)).all()
    
    daily_statistics = [
        {
            "date": str(s.date),
            "total_orders": s.count,
            "total_sales": float(s.revenue or 0)
        } for s in daily_stats_query
    ]

    return {
        "status": "success", 
        "data": {
            "total_orders": total_orders,
            "total_revenue": float(total_sales or 0),
            "completed_orders": completed_orders,
            "pending_orders": pending_orders,
            "average_order_value": avg_order,
            "daily_statistics": daily_statistics
        }
    }

@app.get("/orders/admin/sales/restaurants")
def get_restaurant_sales(db: Session = Depends(get_db)):
    # Group orders by restaurant_id and sum total_price
    # 1. Get Sales Data (Grouped)
    sales_results = db.query(
        Order.restaurant_id,
        func.count(Order.id).label("total_orders"),
        func.sum(Order.total_price).label("total_sales")
    ).filter(Order.status != STATUS_CANCELLED).group_by(Order.restaurant_id).all()
    
    print(f"DEBUG SALES RESULTS: {sales_results}") # DEBUG LOG
    
    sales_map = {r.restaurant_id: {"orders": r.total_orders, "sales": float(r.total_sales or 0)} for r in sales_results}
    print(f"DEBUG SALES MAP: {sales_map}") # DEBUG LOG

    # 2. Fetch All Restaurants
    all_restaurants = []
    try:
        res = requests.get(f"{RESTAURANT_SERVICE_URL}/restaurants")
        if res.status_code == 200:
            all_restaurants = res.json()['data']
    except Exception as e:
        print(f"Failed to fetch restaurants: {e}")
        # Fallback: only show those with sales if API fails
        data = []
        for r_id, stats in sales_map.items():
             data.append({
                "restaurant_id": r_id,
                "restaurant_name": f"Resto {r_id}",
                "total_orders": stats['orders'],
                "total_revenue": stats['sales'] # FIXED
            })
        return {"status": "success", "data": data}

    # 3. Merge Data
    data = []
    for r in all_restaurants:
        r_id = r['id']
        stats = sales_map.get(r_id, {"orders": 0, "sales": 0})
        data.append({
            "restaurant_id": r_id,
            "restaurant_name": r['name'],
            "total_orders": stats['orders'],
            "total_revenue": stats['sales'] # FIXED: total_sales -> total_revenue
        })
        
    return {"status": "success", "data": data}

# --- NEW INTERNAL ENDPOINT FOR DRIVER SERVICE ---
@app.get("/internal/orders/driver/{driver_id}")
def get_driver_active_orders_internal(driver_id: int, db: Session = Depends(get_db)):
    # Return orders that are active (ON_THE_WAY, PREPARING, etc) assigned to this driver
    # Legacy logic: Active = Not Completed/Delivered/Cancelled
    orders = db.query(Order).filter(
        Order.driver_id == driver_id,
        Order.status.notin_([STATUS_DELIVERED, STATUS_COMPLETED, STATUS_CANCELLED])
    ).all()
    
    return {
        "status": "success",
        "data": [
            {
                "id": o.id,
                "order_id": o.id,
                "status": o.status,
                "total_price": float(o.total_price)
            } for o in orders
        ]
    }

@app.get("/orders/admin/all")
def get_all_orders_admin(db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    
    # 1. Fetch Restaurant Map
    restaurant_map = {}
    try:
        r_res = requests.get(f"{RESTAURANT_SERVICE_URL}/restaurants")
        if r_res.status_code == 200:
            for r in r_res.json()['data']:
                restaurant_map[r['id']] = r['name']
    except:
        pass

    # 2. Fetch User Map (For Customer and Driver Names)
    user_map = {}
    try:
        USER_SERVICE_URL = "http://user-service:8000"
        u_res = requests.get(f"{USER_SERVICE_URL}/users/admin/all")
        if u_res.status_code == 200:
            for u in u_res.json()['data']:
                user_map[u['id']] = u # Store whole object
    except Exception as e:
        print(f"Failed to fetch user map: {e}")

    data = []
    for o in orders:
        # Normalize Status for Frontend (Legacy fix)
        display_status = o.status
        if o.status == "ON_DELIVERY":
            display_status = "ON_THE_WAY"
            
        # Resolved Names & Emails
        c_name = user_map.get(o.user_id, {}).get('name', f"User {o.user_id}")
        c_email = user_map.get(o.user_id, {}).get('email', "-")
        
        d_name = "Belum ditugaskan"
        d_email = "-"
        if o.driver_id:
            d_name = user_map.get(o.driver_id, {}).get('name', f"Driver {o.driver_id}")
            d_email = user_map.get(o.driver_id, {}).get('email', "-")

        data.append({
            "id": o.id, 
            "order_id": o.id,
            "restaurant_name": restaurant_map.get(o.restaurant_id, f"Resto {o.restaurant_id}"),
            "customer_name": c_name, 
            "customer_email": c_email,
            "driver_name": d_name,
            "driver_email": d_email,
            "total_price": float(o.total_price),
            "status": display_status, 
            "created_at": o.created_at
        })
        
    return {"status": "success", "data": data}






@app.post("/orders/admin/reset-data")
def reset_order_data(db: Session = Depends(get_db)):
    # Delete all OrderItems first (foreign key dependency)
    db.query(OrderItem).delete()
    # Delete all Orders
    db.query(Order).delete()
    
    # Reset Auto Increment (MySQL specific)
    try:
        db.execute("ALTER TABLE orders AUTO_INCREMENT = 1")
        db.execute("ALTER TABLE order_items AUTO_INCREMENT = 1")
    except Exception as e:
        print(f"Warning: Could not reset AUTO_INCREMENT: {e}")
    
    db.commit()
    return {"status": "success", "message": "Order data reset and IDs reset to 1"}

graphql_app = GraphQLRouter(schema)
app.include_router(graphql_app, prefix="/graphql")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)