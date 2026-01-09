# INTEGRATION ARCHITECTURE: Food Delivery System (FDS) <-> DosWallet (DW)

## 1. Project Topology
We are integrating two independent microservice systems located in sibling directories under `UASIAE/`:
1.  `./food-delivery/` (The Merchant System: React + FastAPI + Express Gateway)
2.  `./doswallet/` (The Payment Provider: React + FastAPI)

**Infrastructure Requirement:**
- Both systems must operate on a single external Docker network: `shared-network`.
- Services communicate via container names (e.g., FDS `payment-service` calls DW `transaction-service`).

## 2. Business Logic & Data Flow

### A. Account Linking (One-Time Setup)
1.  **Trigger:** User selects "DosWallet" on FDS Payment Page.
2.  **Condition:** If `is_linked` is false, show "Hubungkan Akun".
3.  **Action:** Redirects to DW Frontend (`http://localhost:5173/link-merchant?merchant=food-delivery`).
4.  **DW Side:** User logs in. DW validates if the email matches.
5.  **Success:** User clicks "Return to Merchant" -> Redirects to FDS with a secure token.
6.  **FDS Side:** Backend verifies token and updates `user_integrations` table.

### B. Payment Flow & Bonus Points
1.  **View Balance:** FDS Payment Page fetches **Real-time Balance** from DW API (`wallet-service`) via FDS Backend proxy.
2.  **Transaction:**
    -   User clicks "Pay".
    -   FDS `payment-service` sends request to DW `transaction-service`.
    -   **Security:** Header includes `X-Secret-Key`.
3.  **Bonus Logic (Critical):**
    -   Upon successful deduction, DW `transaction-service` must trigger an internal call to DW `wallet-service` to add **1 Bonus Point** to the user.

## 3. Database Schema Changes
**FDS User Database (`user_service_db`):**
New Table: `user_integrations`
- `id` (PK)
- `user_id` (FK to users)
- `provider_name` (Enum: 'DOSWALLET')
- `provider_user_email` (String)
- `is_linked` (Boolean)
- `linked_at` (Timestamp)

## 4. Seeding Strategy (For Demo)
-   **FDS:** Admin, Driver, Customer (`customer1@example.com`), Restaurants.
-   **DW:** User with email `customer1@example.com` and initial balance Rp 1.000.000.