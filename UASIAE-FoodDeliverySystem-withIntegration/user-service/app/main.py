from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import jwt, JWTError # Tambahkan Import ini
import os # Tambahkan Import ini
from . import models, database, schema

# --- Init Database ---
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="User Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- KONFIGURASI AUTH (SAMA DENGAN SERVICE LAIN) ---
SECRET_KEY = os.getenv("SECRET_KEY", "kunci_rahasia_project_ini_harus_sama_semua")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# --- REST API MODELS ---
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "CUSTOMER"
    phone: str = None

# --- REST ENDPOINTS ---

@app.post("/auth/login")
def login_rest(req: LoginRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user or not schema.verify_password(req.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    # Simpan User ID di 'sub' token
    token = schema.create_access_token({"sub": str(user.id), "role": user.role, "id": user.id})
    
    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }

@app.post("/auth/register")
def register_rest(req: RegisterRequest, db: Session = Depends(database.get_db)):
    existing = db.query(models.User).filter(models.User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already used")
    
    hashed = schema.get_password_hash(req.password)
    new_user = models.User(
        name=req.name, 
        email=req.email, 
        password=hashed, 
        role=req.role,
        phone=req.phone
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    token = schema.create_access_token({"sub": str(new_user.id), "role": new_user.role, "id": new_user.id})
    
    return {
        "token": token,
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role
        }
    }

@app.get("/users/admin/all")
def get_all_users_admin(db: Session = Depends(database.get_db)):
    users = db.query(models.User).all()
    data = []
    for u in users:
        # Fetch all addresses
        addrs = db.query(models.Address).filter(models.Address.user_id == u.id).all()
        addresses_data = [
            {
                "id": a.id,
                "label": a.label,
                "full_address": a.full_address,
                "is_default": bool(a.is_default)
            } for a in addrs
        ]
        
        data.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "phone": u.phone,
            "created_at": u.created_at, # Added created_at
            "addresses": addresses_data # Return array
        })
    return {"status": "success", "data": data}

# --- UPDATE PENTING: GET REAL PROFILE FROM DB ---
@app.get("/users/profile/me")
def get_me(authorization: str = Header(None), db: Session = Depends(database.get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Token")
    
    try:
        # Decode Token
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        # Ambil Data dari DB
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "phone": user.phone
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Token")
    
# --- GRAPHQL ENDPOINT ---
graphql_app = GraphQLRouter(schema.schema)
app.include_router(graphql_app, prefix="/graphql")

# --- HELPER: GET CURRENT USER ---
def get_current_user_id(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Token")
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Token")

# --- ADDRESS ENDPOINTS ---

class AddressCreate(BaseModel):
    label: str
    full_address: str
    latitude: str = None
    longitude: str = None
    is_default: bool = False

@app.get("/users/addresses")
def get_addresses(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(database.get_db)
):
    addresses = db.query(models.Address).filter(models.Address.user_id == user_id).all()
    return {"status": "success", "data": addresses}

@app.post("/users/addresses")
def create_address(
    addr: AddressCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(database.get_db)
):
    if addr.is_default:
        # Set other addresses to non-default
        db.query(models.Address).filter(models.Address.user_id == user_id).update({"is_default": 0})
    
    new_addr = models.Address(
        user_id=user_id,
        label=addr.label,
        full_address=addr.full_address,
        latitude=addr.latitude,
        longitude=addr.longitude,
        is_default=1 if addr.is_default else 0
    )
    db.add(new_addr)
    db.commit()
    db.refresh(new_addr)
    return {"status": "success", "data": new_addr}

@app.put("/users/addresses/{address_id}")
def update_address(
    address_id: int,
    addr: AddressCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(database.get_db)
):
    address = db.query(models.Address).filter(models.Address.id == address_id, models.Address.user_id == user_id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
        
    if addr.is_default:
        # Set other addresses to non-default
        db.query(models.Address).filter(models.Address.user_id == user_id).update({"is_default": 0})
        
    address.label = addr.label
    address.full_address = addr.full_address
    address.latitude = addr.latitude
    address.longitude = addr.longitude
    address.is_default = 1 if addr.is_default else 0
    
    db.commit()
    db.refresh(address)
    return {"status": "success", "data": address}

@app.delete("/users/addresses/{address_id}")
def delete_address(
    address_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(database.get_db)
):
    address = db.query(models.Address).filter(models.Address.id == address_id, models.Address.user_id == user_id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
        
    db.delete(address)
    db.commit()
    return {"status": "success", "message": "Address deleted"}

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

@app.get("/")
def root():
    return {"message": "User Service Running (REST + GraphQL)"}

# --- INTEGRATIONS ENDPOINTS ---
class LinkIntegrationRequest(BaseModel):
    provider: str
    is_linked: bool
    provider_user_id: str = None

@app.post("/integrations/link")
def link_integration(
    req: LinkIntegrationRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(database.get_db)
):
    # Check if exists
    integration = db.query(models.UserIntegration).filter(
        models.UserIntegration.user_id == user_id,
        models.UserIntegration.provider == req.provider
    ).first()

    # Smart Linking Logic for DosWallet
    if req.provider == 'DOSWALLET':
        from .dw_client import get_doswallet_user_by_email
        
        # Get FDS User Email
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="FDS User not found")
            
        # Lookup DosWallet User by Email
        dw_user = get_doswallet_user_by_email(user.email)
        
        if not dw_user:
            raise HTTPException(status_code=404, detail=f"DosWallet account not found for email {user.email}. Please register in DosWallet first.")
            
        provider_user_id = str(dw_user['user_id'])
    else:
        # Fallback for other providers (or testing)
        provider_user_id = req.provider_user_id

    if integration:
        integration.is_linked = req.is_linked
        if provider_user_id:
            integration.provider_user_id = provider_user_id
        db.commit()
        db.refresh(integration)
    else:
        integration = models.UserIntegration(
            user_id=user_id,
            provider=req.provider,
            is_linked=req.is_linked,
            provider_user_id=provider_user_id
        )
        db.add(integration)
        db.commit()
        db.refresh(integration)
    
    return {"status": "success", "data": {
        "provider": integration.provider,
        "is_linked": integration.is_linked,
        "linked_at": integration.linked_at
    }}

@app.get("/integrations/status/{provider}")
def get_integration_status(
    provider: str,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(database.get_db)
):
    integration = db.query(models.UserIntegration).filter(
        models.UserIntegration.user_id == user_id,
        models.UserIntegration.provider == provider
    ).first()

    if integration and integration.is_linked:
        return {"status": "success", "linked": True, "data": integration.provider_user_id}
    
    return {"status": "success", "linked": False}

@app.get("/internal/integrations/{user_id}/{provider}")
def get_internal_integration(
    user_id: int,
    provider: str,
    db: Session = Depends(database.get_db)
):
    integration = db.query(models.UserIntegration).filter(
        models.UserIntegration.user_id == user_id,
        models.UserIntegration.provider == provider
    ).first()

    if integration and integration.is_linked:
        return {
            "is_linked": True,
            "provider_user_id": integration.provider_user_id
        }
    return {"is_linked": False}