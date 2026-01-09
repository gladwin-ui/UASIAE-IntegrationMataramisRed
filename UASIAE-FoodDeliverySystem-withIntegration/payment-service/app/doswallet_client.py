import requests
import os

DOSWALLET_TRANSACTION_URL = "http://dw-transaction-service:5003"
DOSWALLET_WALLET_URL = "http://doswallet-wallet-service:5002"
USER_SERVICE_URL = "http://user-service:8000"
SECRET_KEY = os.getenv("X_SECRET_KEY")

class DosWalletClient:
    def get_integration(self, user_id: int):
        try:
            res = requests.get(f"{USER_SERVICE_URL}/internal/integrations/{user_id}/DOSWALLET")
            if res.status_code == 200:
                return res.json()
            return None
        except Exception as e:
            print(f"Error getting integration: {e}")
            return None

    def get_balance(self, user_id: int):
        integration = self.get_integration(user_id)
        if not integration or not integration.get("is_linked"):
            return None
        
        provider_id = integration.get("provider_user_id")
        # Call DosWallet Wallet Service
        headers = {"X-Secret-Key": SECRET_KEY}
        try:
            # Assumes endpoint /api/wallets/{id}/balance exists (Phase 3)
            res = requests.get(f"{DOSWALLET_WALLET_URL}/api/wallets/{provider_id}/balance", headers=headers)
            if res.status_code == 200:
                return res.json().get("balance")
            return 0.0 # Error or empty
        except Exception as e:
            print(f"Error getting balance: {e}")
            return None

    def pay(self, user_id: int, amount: float, order_id: str):
        integration = self.get_integration(user_id)
        if not integration or not integration.get("is_linked"):
            raise Exception("DosWallet not linked")
        
        provider_id = integration.get("provider_user_id")
        
        headers = {"X-Secret-Key": SECRET_KEY}
        payload = {
            "user_id": provider_id,
            "amount": amount,
            "merchant_id": "FDS_MERCHANT", 
            "description": f"Payment for Order {order_id}",
            "idempotency_key": f"ORDER_{order_id}"
        }
        
        # Assumes endpoint /api/merchant/payment exists (Phase 3)
        res = requests.post(f"{DOSWALLET_TRANSACTION_URL}/api/merchant/payment", json=payload, headers=headers)
        if res.status_code not in [200, 201]:
             raise Exception(f"Payment failed: {res.text}")
        
        return res.json()
