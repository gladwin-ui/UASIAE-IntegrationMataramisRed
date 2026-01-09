
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, Driver
from app.database import DATABASE_URL

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Ensure tables exist
Base.metadata.create_all(bind=engine)

def seed_drivers():
    db = SessionLocal()
    try:
        # User Service Seeds:
        # ID 2 -> Driver 1 (Budi)
        # ID 3 -> Driver 2 (Siti)
        
        drivers_data = [
            {
                "user_id": 2, # Budi
                "vehicle_type": "Honda Beat",
                "vehicle_number": "B 1234 ABC",
                "is_available": True,
                "is_on_job": False,
                "total_earnings": 0
            },
            {
                "user_id": 3, # Siti
                "vehicle_type": "Yamaha NMAX",
                "vehicle_number": "B 5678 XYZ",
                "is_available": True,
                "is_on_job": False,
                "total_earnings": 0
            }
        ]

        for data in drivers_data:
            exists = db.query(Driver).filter(Driver.user_id == data["user_id"]).first()
            if not exists:
                driver = Driver(**data)
                db.add(driver)
                print(f"Seeded driver for user {data['user_id']}")
            else:
                print(f"Driver for user {data['user_id']} already exists")
                
        db.commit()
    except Exception as e:
        print(f"Error seeding drivers: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_drivers()
