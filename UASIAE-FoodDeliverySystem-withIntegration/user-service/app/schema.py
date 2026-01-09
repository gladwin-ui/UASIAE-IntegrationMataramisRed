import strawberry
from typing import Optional, List
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import User, Address
from passlib.context import CryptContext
from jose import jwt
import os
from datetime import datetime, timedelta

# --- SETUP AUTH ---
# deprecated="auto" akan otomatis menangani hash lama dan mengupdatenya jika perlu
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "rahasia_super_aman")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

def get_password_hash(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password):
    # HANDLING KHUSUS: MySQL Connector kadang mengembalikan hash sebagai bytes
    # Kita paksa ubah jadi string utf-8 agar passlib bisa membacanya
    if isinstance(hashed_password, bytes):
        hashed_password = hashed_password.decode("utf-8")
    
    # Jika hashed_password masih bukan string (misal None), return False
    if not isinstance(hashed_password, str):
        return False
        
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        print(f"Auth Verify Error: {e}")
        return False

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=60)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- TYPES ---

@strawberry.type
class AddressType:
    id: int
    label: str
    full_address: str
    is_default: bool

@strawberry.type
class UserType:
    id: int
    name: str
    email: str
    role: str
    phone: Optional[str] 
    
    @strawberry.field
    def addresses(self) -> List[AddressType]:
        db = SessionLocal()
        addrs = db.query(Address).filter(Address.user_id == self.id).all()
        db.close()
        return [
            AddressType(
                id=a.id, 
                label=a.label, 
                full_address=a.full_address, 
                is_default=bool(a.is_default)
            ) for a in addrs
        ]

@strawberry.type
class AuthPayload:
    token: str
    user: UserType

# --- RESOLVERS ---

@strawberry.type
class Query:
    @strawberry.field
    def me(self, token: str) -> Optional[UserType]:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email = payload.get("sub")
            db = SessionLocal()
            user = db.query(User).filter(User.email == email).first()
            db.close()
            if user:
                return UserType(
                    id=user.id, name=user.name, email=user.email, 
                    role=user.role, phone=user.phone
                )
        except Exception as e:
            pass
        return None

    @strawberry.field
    def user_by_id(self, id: int) -> Optional[UserType]:
        db = SessionLocal()
        user = db.query(User).filter(User.id == id).first()
        db.close()
        if user:
            return UserType(
                id=user.id, name=user.name, email=user.email, 
                role=user.role, phone=user.phone
            )
        return None

@strawberry.type
class Mutation:
    @strawberry.mutation
    def login(self, email: str, password: str) -> AuthPayload:
        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()
        db.close()
        
        if not user:
            raise Exception("User not found")
        
        # Passlib akan menangani verifikasi
        if not verify_password(password, user.password):
            raise Exception("Invalid credentials")
            
        token = create_access_token({"sub": user.email, "role": user.role, "id": user.id})
        
        return AuthPayload(
            token=token,
            user=UserType(
                id=user.id, name=user.name, email=user.email, 
                role=user.role, phone=user.phone
            )
        )
    
    @strawberry.mutation
    def register(self, name: str, email: str, password: str, phone: str, role: str = "CUSTOMER") -> AuthPayload:
        db = SessionLocal()
        if db.query(User).filter(User.email == email).first():
            db.close()
            raise Exception("Email already registered")
        
        hashed_pw = get_password_hash(password)
        
        new_user = User(
            name=name, email=email, password=hashed_pw, 
            phone=phone, role=role
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        token = create_access_token({"sub": new_user.email, "role": new_user.role, "id": new_user.id})
        db.close()
        
        return AuthPayload(
            token=token,
            user=UserType(
                id=new_user.id, name=new_user.name, email=new_user.email, 
                role=new_user.role, phone=new_user.phone
            )
        )

schema = strawberry.Schema(query=Query, mutation=Mutation)