# Food Delivery & QRIS Integration Docs

This document describes the integration endpoints provided by the Transaction Service for external systems (e.g., Food Delivery) and QRIS payment flows.

## API Authentication
- The Transaction Service supports an optional API key mechanism. Set `TRANSACTION_API_KEY` in the environment (shared `.env`) to a secret value.
- Supply the key in the `X-API-KEY` header for protected endpoints.

## Endpoints

### Create payment request (QRIS)
POST /payments/create

Body (JSON):
- amount (number, required)
- description (string, optional)
- idempotency_key (string, optional)
- qr_payload (string, optional)  # Pre-generated QR payload

Response: 201
{ transaction_id: <int>, status: 'pending' }

Example:

curl -X POST http://localhost:5003/payments/create \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: <your-key>" \
  -d '{"amount": 50.0, "description": "Food order #123", "idempotency_key": "order-123", "qr_payload": "QR:DATA"}'

---

### Confirm payment (webhook)
POST /payments/confirm

Body (JSON):
- idempotency_key (string, required)
- provider_reference (string, optional)

Response: 200
{ transaction_id: <int>, status: 'completed' }

Example:

curl -X POST http://localhost:5003/payments/confirm \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: <your-key>" \
  -d '{"idempotency_key":"order-123", "provider_reference":"gw-abc-123"}'

---

### Food Delivery Charge (Server-to-server)
POST /integrations/food_delivery/charge

Body (JSON):
- user_id (int, required)
- amount (number, required)
- merchant_id (int, optional)  # If provided, transfer funds to this merchant's wallet
- idempotency_key (string, optional)
- description (string, optional)

Response: 201
{ ...transaction data... }

Example (charge using merchant id):

curl -X POST http://localhost:5003/integrations/food_delivery/charge \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: <your-key>" \
  -d '{"user_id": 42, "amount": 12.5, "merchant_id": 9001, "idempotency_key":"fd-42-1", "description":"Order #42"}'

Example (charge without merchant id - withdraw):

curl -X POST http://localhost:5003/integrations/food_delivery/charge \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: <your-key>" \
  -d '{"user_id": 42, "amount": 12.5, "idempotency_key":"fd-42-2", "description":"Order #42"}'


---

## Notes & Best Practices
- Use idempotency keys for all external requests to prevent duplicate charges.
- Always verify API key and use HTTPS in production.
- For QRIS flows: create a pending payment via `/payments/create` then confirm it via `/payments/confirm` when the payment provider notifies you.
