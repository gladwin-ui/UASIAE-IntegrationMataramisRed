# GRAPHQL ARCHITECTURE & INTEGRATION: FDS <-> DosWallet

## 1. System Topology & Ports
We operate on `shared-network`.
* **Shared Config:** JWT Secret (`kunci_rahasia_project_ini_harus_sama_semua`), Algorithm (`HS256`).

### Food Delivery System (FDS)
* **Gateway:** `http://localhost:4000` (Proxies `/service/graphql` to internal services).
* **User Service (4001):** Handle Login/Auth via GraphQL.
* **Restaurant Service (4002):** Menu & Restaurant Queries.
* **Order Service (4003):** Create Order & Order History.
* **Payment Service (4004):** **CRITICAL**. Handles Payment Mutation calling DosWallet.
* **Driver Service (4005):** Driver Job & Wallet.

### DosWallet (DW)
* **Transaction Service (5003):** GraphQL Endpoint for Deductions.
* **Wallet Service (5002):** GraphQL Endpoint for History & Balance.
* **User Service (5001):** User Data.

## 2. Core Integration Logic (GraphQL S2S)

### Scenario: Payment via DosWallet
1.  **Client (FDS Frontend):** Sends Mutation `payOrder(orderId: 123, method: "DOSWALLET")` to FDS Payment Service.
    * *Note:* No price sent from client. Backend fetches price from DB.
2.  **FDS Payment Service (Backend):**
    * Fetches Order Details (Price: 50.000).
    * **S2S Call:** Constructs a GraphQL Client (using `httpx` or `gql`) to call **DosWallet Transaction Service** (`http://dw-transaction-service:5003/graphql`).
    * **Header:** Passes the original User's JWT Token (Bearer) + `X-Secret-Key`.
    * **Query:** Executes mutation `createTransaction(amount: 50000, type: PAYMENT, merchant: "FDS")`.
3.  **DosWallet:**
    * Validates JWT & Secret Key.
    * Deducts Balance.
    * Adds Bonus Point (internal logic).
    * Returns Success to FDS.
4.  **FDS:** Updates Order Status to `PAID`. Returns `PaymentType` to Frontend.

### Scenario: Login & History
1.  **FDS Login:** Mutation `login` returns JWT.
2.  **DosWallet Access:** Client uses FDS JWT to query DosWallet GraphQL directly (via Gateway proxy) to fetch `walletHistory`. DosWallet validates the signature using the shared secret.

## 3. Implementation Scope (Full Postman Migration)
All REST endpoints defined in the attached `postman-collection.json` must be converted to **Strawberry GraphQL Resolvers**.
* **Customer:** Login, Browse Resto, Add Cart/Order, Pay, View History.
* **Admin:** Dashboard Stats, Manage Drivers/Users/Restos.
* **Driver:** View Jobs, Update Status, View Wallet.