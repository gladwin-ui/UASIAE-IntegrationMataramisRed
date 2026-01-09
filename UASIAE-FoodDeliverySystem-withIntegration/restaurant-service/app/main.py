from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from strawberry.fastapi import GraphQLRouter
from typing import List
from pydantic import BaseModel
from .database import engine, Base, get_db, SessionLocal
from .models import Restaurant, MenuItem
from .schema import schema

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Restaurant Service")

graphql_app = GraphQLRouter(schema)
app.include_router(graphql_app, prefix="/graphql")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- INTERNAL API (INTEGRASI) ---

# 1. Endpoint untuk Cek Ketersediaan & Harga Menu (Dipanggil Order Service)
@app.get("/internal/menu-items/{item_id}")
def get_menu_item_internal(item_id: int, db: Session = Depends(get_db)):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    return {
        "id": item.id,
        "name": item.name,
        "price": float(item.price),
        "stock": item.stock,
        "is_available": item.is_available,
        "restaurant_id": item.restaurant_id
    }

# Model untuk payload pengurangan stok
class StockUpdateItem(BaseModel):
    menu_item_id: int
    quantity: int

# 2. Endpoint untuk Kurangi Stok (Dipanggil Order Service saat Create Order)
@app.post("/internal/menu-items/reduce-stock")
def reduce_stock_internal(items: List[StockUpdateItem], db: Session = Depends(get_db)):
    for item_req in items:
        menu_item = db.query(MenuItem).filter(MenuItem.id == item_req.menu_item_id).first()
        
        if not menu_item:
            raise HTTPException(status_code=404, detail=f"Menu {item_req.menu_item_id} not found")
        
        if menu_item.stock < item_req.quantity:
            raise HTTPException(status_code=400, detail=f"Stock not enough for {menu_item.name}")
        
        # Kurangi Stok
        menu_item.stock -= item_req.quantity
    
    db.commit()
    return {"message": "Stock updated successfully"}

# --- PUBLIC API ---

@app.get("/restaurants")
def get_restaurants(cuisine_type: str = None, db: Session = Depends(get_db)):
    query = db.query(Restaurant)
    if cuisine_type:
        query = query.filter(Restaurant.cuisine_type == cuisine_type)
    return {"status": "success", "data": query.all()}

@app.get("/restaurants/{id}")
def get_restaurant_by_id(id: int, db: Session = Depends(get_db)):
    restaurant = db.query(Restaurant).filter(Restaurant.id == id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return {"status": "success", "data": restaurant}

@app.get("/restaurants/{restaurant_id}/menu")
def get_restaurant_menu(restaurant_id: int, db: Session = Depends(get_db)):
    # Corrected relation loading or just fetch items
    # The frontend expects "data.menu_items" or just the list? 
    # Frontend: const items: MenuItem[] = response.data.menu_items || [];
    # So we need to wrap it as {"data": {"menu_items": [...]}}
    menu_items = db.query(MenuItem).filter(MenuItem.restaurant_id == restaurant_id).all()
    return {"status": "success", "data": {"menu_items": menu_items}}

from fastapi import File, UploadFile, Form

# --- RESTAURANT CRUD ---

@app.post("/restaurants")
def create_restaurant(
    name: str = Form(...),
    cuisine_type: str = Form(...),
    address: str = Form(...),
    is_open: bool = Form(True),
    image: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    # For now, we mock the image upload by assigning a placeholder
    image_url = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop"
    
    new_restaurant = Restaurant(
        name=name,
        cuisine_type=cuisine_type,
        address=address,
        is_open=is_open,
        image_url=image_url
    )
    db.add(new_restaurant)
    db.commit()
    db.refresh(new_restaurant)
    return {"status": "success", "data": new_restaurant}

@app.put("/restaurants/{id}")
def update_restaurant(
    id: int,
    name: str = Form(None),
    cuisine_type: str = Form(None),
    address: str = Form(None),
    is_open: str = Form(None), # Frontend sends 'true'/'false' string
    image: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
        
    if name: restaurant.name = name
    if cuisine_type: restaurant.cuisine_type = cuisine_type
    if address: restaurant.address = address
    if is_open is not None:
        restaurant.is_open = (is_open.lower() == 'true')
        
    db.commit()
    db.refresh(restaurant)
    return {"status": "success", "data": restaurant}

@app.delete("/restaurants/{id}")
def delete_restaurant(id: int, db: Session = Depends(get_db)):
    restaurant = db.query(Restaurant).filter(Restaurant.id == id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    # Cascade delete menu items usually handled by DB FK, ensuring here if manual needed
    db.delete(restaurant)
    db.commit()
    return {"status": "success", "message": "Restaurant deleted"}

# --- MENU CRUD ---

@app.post("/restaurants/{id}/menu")
def create_menu_item(
    id: int,
    name: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    stock: int = Form(...),
    category: str = Form("Makanan"),
    image: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
        
    image_url = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop"
    
    new_item = MenuItem(
        restaurant_id=id,
        name=name,
        description=description,
        price=price,
        stock=stock,
        category=category,
        is_available=True,
        image_url=image_url
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return {"status": "success", "data": new_item}

@app.put("/restaurants/menu-items/{item_id}")
def update_menu_item(
    item_id: int,
    name: str = Form(None),
    description: str = Form(None),
    price: float = Form(None),
    stock: int = Form(None),
    category: str = Form(None),
    is_available: str = Form(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu Item not found")
        
    if name: item.name = name
    if description: item.description = description
    if price is not None: item.price = price
    if stock is not None: item.stock = stock
    if category: item.category = category
    if is_available is not None:
        item.is_available = (is_available.lower() == 'true')
        
    db.commit()
    db.refresh(item)
    return {"status": "success", "data": item}

@app.delete("/restaurants/menu-items/{item_id}")
def delete_menu_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu Item not found")
        
    db.delete(item)
    db.commit()
    return {"status": "success", "message": "Menu Item deleted"}