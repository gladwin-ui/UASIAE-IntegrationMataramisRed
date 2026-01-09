from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text, DECIMAL, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    cuisine_type = Column(String(100), nullable=False) # DB: cuisine_type
    address = Column(Text, nullable=False)
    is_open = Column(Boolean, default=True)
    image_url = Column(String(500), nullable=True) # DB: image_url
    
    # RATING SUDAH DIHAPUS TOTAL
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    menus = relationship("MenuItem", back_populates="restaurant", cascade="all, delete-orphan")

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(DECIMAL(10, 2), nullable=False)
    stock = Column(Integer, default=0) 
    is_available = Column(Boolean, default=True)
    category = Column(String(50), default="Makanan")
    image_url = Column(String(500), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    restaurant = relationship("Restaurant", back_populates="menus")