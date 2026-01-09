from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter
from pydantic import BaseModel
import requests
from .database import engine, Base
from .schema import schema

# Create Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Payment Service")

graphql_app = GraphQLRouter(schema)
app.include_router(graphql_app, prefix="/graphql")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ORDER_SERVICE_URL = "http://order-service:8000"

from typing import Optional
class PaymentRequest(BaseModel):
    order_id: int
    payment_id: int
    payment_method: str = "E-Wallet"
    user_id: Optional[int] = None

from .doswallet_client import DosWalletClient
dos_client = DosWalletClient()

@app.get("/payment-methods/doswallet/balance")
def get_doswallet_balance(user_id: int): 
    balance = dos_client.get_balance(user_id)
    if balance is None:
        raise HTTPException(status_code=400, detail="Not linked or service unavailable")
    return {"balance": balance}

@app.post("/")
def process_payment(req: PaymentRequest):
    if req.payment_method == "DOSWALLET":
        if not req.user_id:
            raise HTTPException(status_code=400, detail="User ID required for DosWallet payment")
        
        try:
             # Fetch real amount from Order Service
             res = requests.get(f"{ORDER_SERVICE_URL}/internal/orders/{req.order_id}")
             if res.status_code != 200: 
                 raise HTTPException(status_code=404, detail="Order not found")
             order = res.json()
             amount = order['total_price']
             
             # Process Payment via DosWallet Client
             dos_client.pay(req.user_id, amount, str(req.order_id))
        except Exception as e:
             print(f"Payment Error: {e}")
             raise HTTPException(status_code=400, detail=str(e))

    # Update Order Status (Simulate success for E-Wallet too)
    try:
        # For DosWallet, we might want to ensure pay() succeeded (it raises ex on fail)
        requests.put(f"{ORDER_SERVICE_URL}/internal/orders/{req.order_id}/status", json={"status": "PAID"})
        return {"status": "success", "message": "Payment successful"}
    except:
        raise HTTPException(status_code=500, detail="Failed to update order status")