import requests
import os

DOSWALLET_USER_URL = "http://doswallet-user-service:5001"  # Service name in shared-network

def get_doswallet_user_by_email(email):
    """
    Get DosWallet user details by email.
    Returns dict if found, None if not found or error.
    """
    try:
        url = f"{DOSWALLET_USER_URL}/api/users/by-email"
        response = requests.get(url, params={'email': email}, timeout=5)
        
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        print(f"Error connecting to DosWallet User Service: {e}")
        return None
