from sqlalchemy import Column, Integer, String, Boolean, DECIMAL, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, unique=True) # Link ke User Service
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, unique=True) # Link ke User Service
    vehicle_type = Column(String(50), nullable=False)
    vehicle_number = Column(String(50), nullable=False)
    
    is_available = Column(Boolean, default=True)
    is_on_job = Column(Boolean, default=False)
    
    # LEGACY COMPATIBILITY: total_earnings IS THE WALLET (UNPAID AMOUNT).
    # It gets reset to 0 after salary payment.
    total_earnings = Column(DECIMAL(10, 2), default=0.00) 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    tasks = relationship("DeliveryTask", back_populates="driver")

class DeliveryTask(Base):
    __tablename__ = "delivery_tasks"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, nullable=False) # Link ke Order Service
    driver_id = Column(Integer, ForeignKey("drivers.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="ASSIGNED") # ASSIGNED, COMPLETED
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    driver = relationship("Driver", back_populates="tasks")

class DriverSalary(Base):
    __tablename__ = "driver_salaries"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id", ondelete="CASCADE"), nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    base_salary = Column(DECIMAL(10, 2), nullable=False)
    commission = Column(DECIMAL(10, 2), default=0.00)
    total_orders = Column(Integer, default=0)
    total_earnings = Column(DECIMAL(10, 2), default=0.00)
    status = Column(String(50), default="PENDING")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())