import sys
import os
import random
from datetime import datetime

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Order, OrderItem

def seed():
    db = SessionLocal()
    
    # Check if orders exist
    if db.query(Order).count() > 0:
        print("Orders already seeded. Skipping...")
        return

    print("Seeding Orders...")
    
    statuses = ["PENDING_PAYMENT", "PAID", "PREPARING", "ON_DELIVERY", "COMPLETED", "CANCELLED"]
    
    orders_to_create = []
    
    # 1. Successful Orders (Completed)
    for i in range(5):
        orders_to_create.append({
            "user_id": 5, "restaurant_id": 1, "address_id": 1,
            "status": "COMPLETED", 
            "total_price": 50000 + (i * 10000), 
            "payment_id": 100 + i
        })
        
    # 2. Active Orders
    orders_to_create.append({"user_id": 5, "restaurant_id": 2, "address_id": 1, "status": "PREPARING", "total_price": 45000, "payment_id": 201})
    orders_to_create.append({"user_id": 15, "restaurant_id": 3, "address_id": 1, "status": "ON_DELIVERY", "total_price": 60000, "payment_id": 202})
    
    # 3. Cancelled Order
    orders_to_create.append({"user_id": 5, "restaurant_id": 1, "address_id": 1, "status": "CANCELLED", "total_price": 10000, "payment_id": None})
    
    for o_data in orders_to_create:
        order = Order(
            user_id=o_data["user_id"],
            restaurant_id=o_data["restaurant_id"],
            address_id=o_data["address_id"],
            status=o_data["status"],
            total_price=o_data["total_price"],
            payment_id=o_data.get("payment_id"),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        db.add(order)
        db.commit() # Commit to get ID
        
        # Add items
        item = OrderItem(
            order_id=order.id,
            menu_item_id=1,
            menu_item_name="Dummy Item",
            quantity=2,
            price=o_data["total_price"] / 2
        )
        db.add(item)
    
    db.commit()
    print("Seeding Orders Completed.")
    db.close()

if __name__ == "__main__":
    seed()
