# E2E Demo Script

This script (`e2e_demo.py`) demonstrates a minimal end-to-end flow:

- Register two users (via User Service GraphQL)
- Deposit funds to User A
- Transfer funds from User A to User B
- Create a QRIS payment request and confirm it (REST endpoints)

Usage:

- Ensure the microservices are running: `user-service` and `transaction-service`.
- Set `TRANSACTION_API_KEY` in your environment if you enabled API key protection.
- Run: `python e2e_demo.py`

Notes:
- The script is lightweight and intended for local development only.
- It uses GraphQL endpoints for auth-required operations and REST endpoints for payments.
