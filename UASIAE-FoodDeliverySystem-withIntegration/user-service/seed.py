import sys
import os

# Ensure we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models import User
from app.schema import get_password_hash

def seed():
    db = SessionLocal()
    
    # Generate compatible hash for 'password'
    default_password = get_password_hash("password")
    
    users_data = [
        {"id": 1, "name": "Admin User", "email": "admin@example.com", "role": "ADMIN", "phone": "081234567890"},
        {"id": 2, "name": "Driver Test", "email": "driver@example.com", "role": "DRIVER", "phone": "081234567890"},
        {"id": 3, "name": "Driver One", "email": "driver1@example.com", "role": "DRIVER", "phone": "081234567891"},
        {"id": 5, "name": "Customer One", "email": "customer1@example.com", "role": "CUSTOMER", "phone": "081234567893"},
        {"id": 15, "name": "John2 Doe", "email": "john2@example.com", "role": "CUSTOMER", "phone": "081234567890"}
    ]
    
    print("Seeding Users...")
    for data in users_data:
        # Explicitly check if user exists by ID (since that's the primary key)
        existing_user = db.query(User).filter(User.id == data["id"]).first()
        
        if existing_user:
            print(f"User {data['name']} exists. Updating password...")
            existing_user.password = default_password
            # Update other fields if needed, but password is our priority
            existing_user.role = data["role"]
            existing_user.phone = data["phone"]
        else:
            print(f"User {data['name']} does not exist. Creating...")
            user = User(
                id=data["id"],
                name=data["name"],
                email=data["email"],
                password=default_password,
                role=data["role"],
                phone=data["phone"]
            )
            db.add(user)
            
    try:
        db.commit()
    except Exception as e:
        print(f"Error seeding users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
