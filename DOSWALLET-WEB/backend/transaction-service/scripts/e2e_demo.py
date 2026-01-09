"""Simple E2E demo script to exercise register -> deposit -> transfer -> QRIS payment confirm
Assumptions:
- user-service is running at http://localhost:5001/graphql
- transaction-service is running at http://localhost:5003
- TRANSACTION_API_KEY (if set) is available and will be used for REST calls

Usage: python e2e_demo.py
"""
import os
import requests
import time

USER_SVC = os.getenv('USER_SVC', 'http://localhost:5001/graphql')
TX_SVC = os.getenv('TX_SVC', 'http://localhost:5003')
API_KEY = os.getenv('TRANSACTION_API_KEY')

headers = {'Content-Type': 'application/json'}

def register_user(name, email, phone, password):
    query = '''mutation Register($input: RegisterInput!){ register(input: $input) { token user { user_id name email } message } }'''
    payload = {'query': query, 'variables': {'input': {'name': name, 'email': email, 'phone': phone, 'password': password}}}
    r = requests.post(USER_SVC, json=payload, headers=headers)
    if r.status_code != 200:
        print('REGISTER FAILED', r.status_code, r.text)
        r.raise_for_status()
    try:
        return r.json()['data']['register']
    except Exception:
        print('Unexpected register response:', r.text)
        raise

def deposit(token, amount, idempotency_key=None):
    query = '''mutation Deposit($amount: Decimal!, $idempotency_key: String){ deposit(amount: $amount, idempotency_key: $idempotency_key) { transaction_id amount type status } }'''
    payload = {'query': query, 'variables': {'amount': amount, 'idempotency_key': idempotency_key}}
    h = headers.copy()
    h['Authorization'] = f'Bearer {token}'
    r = requests.post(f"{TX_SVC}/graphql", json=payload, headers=h)
    r.raise_for_status()
    return r.json()

def transfer(token, receiver_id, amount, idempotency_key=None):
    query = '''mutation Transfer($receiverId: Int!, $amount: Decimal!, $idempotency_key: String){ transfer(receiverId: $receiverId, amount: $amount, idempotency_key: $idempotency_key) { transaction_id amount type receiver_id description } }'''
    payload = {'query': query, 'variables': {'receiverId': receiver_id, 'amount': amount, 'idempotency_key': idempotency_key}}
    h = headers.copy()
    h['Authorization'] = f'Bearer {token}'
    r = requests.post(f"{TX_SVC}/graphql", json=payload, headers=h)
    r.raise_for_status()
    return r.json()


def create_payment_request(amount, description=None, idempotency_key=None, qr_payload=None):
    h = headers.copy()
    if API_KEY:
        h['X-API-KEY'] = API_KEY
    r = requests.post(f"{TX_SVC}/payments/create", json={'amount': amount, 'description': description, 'idempotency_key': idempotency_key, 'qr_payload': qr_payload}, headers=h)
    r.raise_for_status()
    return r.json()


def confirm_payment(idempotency_key, provider_reference=None):
    h = headers.copy()
    if API_KEY:
        h['X-API-KEY'] = API_KEY
    r = requests.post(f"{TX_SVC}/payments/confirm", json={'idempotency_key': idempotency_key, 'provider_reference': provider_reference}, headers=h)
    r.raise_for_status()
    return r.json()

if __name__ == '__main__':
    print('Registering users...')
    a = register_user('E2E User A', f'e2e-a-{int(time.time())}@example.com', f'+620000{int(time.time())%10000}', 'password')
    b = register_user('E2E User B', f'e2e-b-{int(time.time())}@example.com', f'+620001{int(time.time())%10000}', 'password')

    token_a = a['token']
    user_a = a['user']
    user_b = b['user']

    print('Depositing to User A...')
    deposit_resp = deposit(token_a, 100.0, idempotency_key='e2e-dep-1')
    print('Deposit response:', deposit_resp)

    print('Transferring 25 to User B...')
    transfer_resp = transfer(token_a, user_b['user_id'], 25.0, idempotency_key='e2e-transfer-1')
    print('Transfer response:', transfer_resp)

    print('Creating payment request (QRIS)')
    pr = create_payment_request(50.0, description='E2E Order #1', idempotency_key='e2e-order-1', qr_payload='QR:E2E1')
    print('Payment request:', pr)

    print('Confirming payment (webhook simulation)')
    confirm = confirm_payment('e2e-order-1', provider_reference='sim-ref-1')
    print('Confirm result:', confirm)

    print('E2E demo finished')
