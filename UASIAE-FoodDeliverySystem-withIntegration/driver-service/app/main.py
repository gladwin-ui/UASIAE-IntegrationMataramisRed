from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter
from .database import engine, Base
from .schema import schema

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Driver Service")

graphql_app = GraphQLRouter(schema)
app.include_router(graphql_app, prefix="/graphql")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from .database import get_db
from . import models
from pydantic import BaseModel
import datetime

@app.get("/drivers/admin/all")
def get_all_drivers_admin(db: Session = Depends(get_db)):
    drivers = db.query(models.Driver).all()
    
    # Fetch User Service for Names
    user_map = {}
    try:
        # Assuming User Service is internal safe
        # In Docker: http://user-service:8000
        USER_SERVICE_URL = "http://user-service:8000"
        # Ideally, we call a bulk endpoint or get_all_users
        import requests
        res = requests.get(f"{USER_SERVICE_URL}/users/admin/all") # Returns all users
        if res.status_code == 200:
            users_data = res.json().get('data', []) # Correctly access 'data' list
            for u in users_data:
                user_map[u['id']] = u
    except Exception as e:
        print(f"Failed to fetch users: {e}")

    results = []
    
    # Pre-fetch Order Data to avoid N+1 if possible, but for MVP loop is okay
    # Need to be careful about performance, but robust logic is priority now.
    
    ORDER_SERVICE_URL = "http://order-service:8000"

    for d in drivers:
        u_data = user_map.get(d.user_id, {})
        
        # Check Active Orders from Order Service (Legacy Logic)
        active_orders_count = 0
        real_time_on_job = d.is_on_job
        
        try:
            # We assume Order Service uses User ID as driver_id
            order_res = requests.get(f"{ORDER_SERVICE_URL}/internal/orders/driver/{d.user_id}")
            if order_res.status_code == 200:
                orders_data = order_res.json().get('data', [])
                active_orders_count = len(orders_data)
                # Sync status: If active orders > 0, they are ON JOB.
                if active_orders_count > 0:
                    real_time_on_job = True
                else:
                    real_time_on_job = False # Free if no orders
        except Exception as e:
            print(f"Failed to fetch orders for driver {d.user_id}: {e}")

        # Calculate Lifetime Earnings
        paid_earnings = float(db.query(func.sum(models.DriverSalary.total_earnings)).filter(models.DriverSalary.driver_id == d.id).scalar() or 0)
        current_wallet = float(d.total_earnings or 0) # Wallet (Unpaid)
        
        # User requested "Total Paid" (excluding unpaid/wallet) in Track Drivers
        lifetime_total = paid_earnings

        results.append({
            "id": d.id,
            "user_id": d.user_id,
            "name": u_data.get('name', f"Driver User {d.user_id}"),
            "vehicle_type": d.vehicle_type,
            "vehicle_number": d.vehicle_number,
            "license_number": d.vehicle_number, 
            "is_available": d.is_available, 
            "is_on_job": real_time_on_job,
            "total_earnings": current_wallet, # Wallet (Unpaid)
            "lifetime_earnings": lifetime_total, # New field: Total Pendapatan
            "created_at": d.created_at,
            "phone": u_data.get('phone', "08123456789"),
            "email": u_data.get('email', '-'),
            "active_orders": active_orders_count 
        })
    return {"status": "success", "data": results}

@app.get("/drivers/admin/salaries")
def get_driver_salaries(db: Session = Depends(get_db)):
    salaries = db.query(models.DriverSalary).all()
    # Ideally join with Driver name
    return {"status": "success", "data": salaries}

class EarningRequest(BaseModel):
    user_id: int
    amount: float
    order_id: int

@app.post("/internal/drivers/earnings")
def add_driver_earning(req: EarningRequest, db: Session = Depends(get_db)):
    print(f"DEBUG: Received Earning Request for User {req.user_id}, Amount {req.amount}")
    
    # 1. Update Earnings in Driver Table
    driver = db.query(models.Driver).filter(models.Driver.user_id == req.user_id).first()
    if not driver:
        print(f"DEBUG: Driver not found for user {req.user_id}, creating new...")
        # Create if not exists (Auto-register driver on first job)
        driver = models.Driver(
            user_id=req.user_id, 
            vehicle_type="Unknown", 
            vehicle_number="Unknown", 
            total_earnings=0
        )
        db.add(driver)
        db.commit()
    
    # Update Wallet (total_earnings is the UNPAID wallet in Legacy match)
    old_earnings = float(driver.total_earnings or 0)
    driver.total_earnings = float(driver.total_earnings or 0) + req.amount
    
    db.commit()
    db.refresh(driver)
    
    print(f"DEBUG: Updated Driver {driver.id} (User {req.user_id}). Earnings: {old_earnings} -> {driver.total_earnings}")
    
    return {"status": "success", "message": "Earning recorded to wallet", "new_balance": driver.total_earnings}

@app.post("/drivers/admin/salaries/mark-as-paid/{driver_id}")
@app.post("/drivers/admin/salaries/pay/{driver_id}")
def pay_driver_salary(driver_id: int, db: Session = Depends(get_db)):
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    if driver.total_earnings <= 0:
        raise HTTPException(status_code=400, detail="No unpaid earnings to process")

    amount_to_pay = driver.total_earnings

    # 1. Record in Salary History (Proof of Payment)
    # Create salary record with status PAID
    now = datetime.datetime.now()
    current_month = now.month
    current_year = now.year

    new_salary = models.DriverSalary(
        driver_id=driver_id,
        month=current_month,
        year=current_year,
        base_salary=2000000, # Fixed Base
        commission=amount_to_pay, # Commission = collected earnings
        total_orders=1, # Todo: Calculate real orders count if needed
        total_earnings=amount_to_pay,
        status="PAID"
    )
    db.add(new_salary)
    
    # Reset Wallet
    driver.total_earnings = 0
    
    db.commit()
    return {"status": "success", "message": f"Paid {amount_to_pay} to driver", "salary_id": new_salary.id}

@app.post("/drivers/reset-data")
def reset_driver_data(db: Session = Depends(get_db)):
    # Reset Earnings and Job Status
    db.query(models.Driver).update({
        models.Driver.total_earnings: 0,
        models.Driver.is_on_job: False,
        models.Driver.is_available: True
    })
    
    # Clear Salary History
    db.query(models.DriverSalary).delete()
    
    # Reset Auto Increment if possible (Optional for salary)
    try:
        db.execute("ALTER TABLE driver_salaries AUTO_INCREMENT = 1")
    except:
        pass
    
    db.commit()
    return {"status": "success", "message": "Driver data reset"}

# Internal Endpoint for Order Service to fetch Driver Details
@app.get("/internal/drivers/details/{user_id}")
def get_driver_details_internal(user_id: int, db: Session = Depends(get_db)):
    driver = db.query(models.Driver).filter(models.Driver.user_id == user_id).first()
    
    # Defaults
    data = {
        "name": f"Driver {user_id}",
        "phone": "-",
        "vehicle": "Unknown Vehicle"
    }

    if driver:
        # Format Vehicle: "Type (Number)"
        data["vehicle"] = f"{driver.vehicle_type} ({driver.vehicle_number})"
        data["vehicle_number"] = driver.vehicle_number
        data["vehicle_type"] = driver.vehicle_type
    
    # Fetch Name/Phone from User Service
    try:
        USER_SERVICE_URL = "http://user-service:8000"
        import requests
        res = requests.get(f"{USER_SERVICE_URL}/users/admin/all") # Fallback to admin/all if no direct internal detail
        # Ideally we'd have a lighter endpoint, but this works for MVP cache
        if res.status_code == 200:
            users = res.json()['data']
            user_info = next((u for u in users if u['id'] == user_id), None)
            if user_info:
                data["name"] = user_info['name']
                data["phone"] = user_info.get('phone', '-')
    except Exception as e:
        print(f"Failed to fetch user details for driver: {e}")
        
    return data