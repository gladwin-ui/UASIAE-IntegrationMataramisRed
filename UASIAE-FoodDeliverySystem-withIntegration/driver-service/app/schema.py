import strawberry
from typing import List, Optional
from strawberry.types import Info
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import Driver, DeliveryTask, DriverSalary
from jose import jwt
import os
import requests

# --- CONFIG ---
SECRET_KEY = os.getenv("SECRET_KEY", "kunci_rahasia_project_ini_harus_sama_semua")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ORDER_SERVICE_URL = "http://order-service:8000"

def get_current_user(info: Info) -> dict:
    request = info.context.get("request")
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise Exception("Authorization header missing")
    try:
        scheme, token = auth_header.split()
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        raise Exception("Invalid or expired token")

# --- TYPES ---
@strawberry.type
class DriverType:
    id: int
    user_id: int
    vehicle_type: str
    vehicle_number: str
    is_available: bool
    is_on_job: bool
    total_earnings: float

@strawberry.type
class AvailableOrderType:
    id: int
    restaurant_id: int
    address_id: int
    total_price: float
    status: str

@strawberry.type
class DeliveryTaskType:
    id: int
    order_id: int
    driver_id: int
    status: str

# --- RESOLVERS ---
@strawberry.type
class Query:
    @strawberry.field
    def my_profile(self, info: Info) -> Optional[DriverType]:
        user = get_current_user(info)
        db = SessionLocal()
        driver = db.query(Driver).filter(Driver.user_id == user['id']).first()
        db.close()
        if driver:
            return DriverType(
                id=driver.id, user_id=driver.user_id, vehicle_type=driver.vehicle_type,
                vehicle_number=driver.vehicle_number, is_available=bool(driver.is_available),
                is_on_job=bool(driver.is_on_job), total_earnings=float(driver.total_earnings)
            )
        return None

    @strawberry.field
    def available_orders(self, info: Info) -> List[AvailableOrderType]:
        # Cek Token (Driver Only)
        user = get_current_user(info)
        if user.get("role") != "DRIVER":
            raise Exception("Unauthorized: Only Drivers can view available orders")

        # Nembak Order Service: Cari yang statusnya PAID
        try:
            res = requests.get(f"{ORDER_SERVICE_URL}/internal/orders/status/PAID")
            if res.status_code == 200:
                data = res.json()
                return [
                    AvailableOrderType(
                        id=o['id'], restaurant_id=o['restaurant_id'], address_id=o['address_id'],
                        total_price=o['total_price'], status=o['status']
                    ) for o in data
                ]
            return []
        except Exception:
            return []

# --- MUTATIONS ---
@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_or_update_profile(self, info: Info, vehicle_type: str, vehicle_number: str) -> DriverType:
        user = get_current_user(info)
        db = SessionLocal()
        try:
            driver = db.query(Driver).filter(Driver.user_id == user['id']).first()
            if not driver:
                driver = Driver(user_id=user['id'], is_available=True)
                db.add(driver)
            
            driver.vehicle_type = vehicle_type
            driver.vehicle_number = vehicle_number
            db.commit()
            db.refresh(driver)
            return DriverType(
                id=driver.id, user_id=driver.user_id, vehicle_type=driver.vehicle_type,
                vehicle_number=driver.vehicle_number, is_available=bool(driver.is_available),
                is_on_job=bool(driver.is_on_job), total_earnings=float(driver.total_earnings)
            )
        finally:
            db.close()

    @strawberry.mutation
    def accept_order(self, info: Info, order_id: int) -> DeliveryTaskType:
        user = get_current_user(info)
        db = SessionLocal()
        try:
            driver = db.query(Driver).filter(Driver.user_id == user['id']).first()
            if not driver:
                raise Exception("Driver profile not found")
            
            if driver.is_on_job:
                raise Exception("You are currently on a job!")

            # 1. Update status Driver
            driver.is_on_job = True
            driver.is_available = False
            
            # 2. Buat Task Lokal
            task = DeliveryTask(order_id=order_id, driver_id=driver.id, status="ASSIGNED")
            db.add(task)
            db.commit()

            # 3. Update Order Service (Assign Driver & Status ON_DELIVERY)
            res = requests.put(
                f"{ORDER_SERVICE_URL}/internal/orders/{order_id}/assign-driver",
                json={"driver_id": driver.id}
            )
            if res.status_code != 200:
                raise Exception("Failed to assign driver in Order Service")

            return DeliveryTaskType(
                id=task.id, order_id=task.order_id, driver_id=task.driver_id, status=task.status
            )
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()

    @strawberry.mutation
    def complete_order(self, info: Info, task_id: int) -> DeliveryTaskType:
        user = get_current_user(info)
        db = SessionLocal()
        try:
            # Cari task milik driver ini
            driver = db.query(Driver).filter(Driver.user_id == user['id']).first()
            task = db.query(DeliveryTask).filter(DeliveryTask.id == task_id, DeliveryTask.driver_id == driver.id).first()
            
            if not task:
                raise Exception("Task not found")

            # 1. Update Task
            task.status = "COMPLETED"
            
            # 2. Update Driver (Free again)
            driver.is_on_job = False
            driver.is_available = True
            
            # 3. Tambah Earnings (Misal 10.000 per order)
            DELIVERY_FEE = 10000
            driver.total_earnings = float(driver.total_earnings) + DELIVERY_FEE
            
            db.commit()

            # 4. Update Order Service (Status COMPLETED)
            requests.put(
                f"{ORDER_SERVICE_URL}/internal/orders/{task.order_id}/status",
                json={"status": "COMPLETED"}
            )

            return DeliveryTaskType(
                id=task.id, order_id=task.order_id, driver_id=task.driver_id, status=task.status
            )
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()

schema = strawberry.Schema(query=Query, mutation=Mutation)