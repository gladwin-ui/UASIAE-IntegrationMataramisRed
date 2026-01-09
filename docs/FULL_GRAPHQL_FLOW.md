# Full GraphQL Flow Testing Guide

## 🎯 Overview
This document provides a complete GraphQL testing flow for the UASIAE Food Delivery System with **STRICT SECURITY ENFORCEMENT**. All queries and mutations (except login/register) now **REQUIRE** valid JWT authentication.

---

## 🔐 Security Model

### Authentication Requirements:
- ✅ **Login/Register mutations**: Public (no token required)
- 🔒 **All other queries/mutations**: REQUIRE valid JWT token
- ❌ **Missing/Invalid token**: Returns `UNAUTHENTICATED` error
- ✅ **Valid token**: Returns requested data

### Error Codes:
- `UNAUTHENTICATED`: Missing or invalid JWT token
- `FORBIDDEN`: User lacks required permissions
- `NOT_FOUND`: Requested resource doesn't exist
- `BAD_REQUEST`: Invalid input parameters

---

## 📊 Testing Flow

### **TEST 1: Try Fetching Restaurants WITHOUT Token (Expected: ERROR)**

**Purpose:** Verify strict authentication is enforced

**Endpoint:** http://localhost:4002/graphql

**Query:**
```graphql
query GetRestaurantsWithoutAuth {
  restaurants {
    id
    name
  }
}
```

**HTTP Headers:**
```json
{
  "Content-Type": "application/json"
}
```
**DO NOT** include Authorization header!

**Expected Result (SUCCESS = Error Response):**
```json
{
  "data": null,
  "errors": [
    {
      "message": "UNAUTHENTICATED: Authorization header missing. Please login first.",
      "path": ["restaurants"],
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ]
}
```

**✅ Pass Criteria:** Query returns error, NOT data  
**❌ Fail Criteria:** Query returns restaurant data without authentication

---

### **TEST 2: Customer Login (Get JWT Token)**

**Purpose:** Authenticate and obtain JWT token for subsequent requests

**Endpoint:** http://localhost:4001/graphql  
(Or via Gateway: http://localhost:4000/user/graphql)

**Mutation:**
```graphql
mutation LoginCustomer {
  login(email: "customer1@example.com", password: "password") {
    token
    user {
      id
      name
      email
      role
    }
  }
}
```

**HTTP Headers:**
```json
{
  "Content-Type": "application/json"
}
```
No Authorization header needed for login.

**Expected Result:**
```json
{
  "data": {
    "login": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjdXN0b21lcjFAZXhhbXBsZS5jb20iLCJyb2xlIjoiQ1VTVE9NRVIiLCJpZCI6NSwiZXhwIjoxNzY3NDk1NTk2fQ.xxxxx",
      "user": {
        "id": 5,
        "name": "Customer One",
        "email": "customer1@example.com",
        "role": "CUSTOMER"
      }
    }
  }
}
```

**Action Required:**
📋 **COPY the `token` value** - you'll need it for all subsequent tests!

**Variables for Next Steps:**
```
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx"
USER_ID = 5
```

---

### **TEST 3: Fetch Restaurants WITH Valid Token**

**Purpose:** Verify authenticated access works correctly

**Endpoint:** http://localhost:4002/graphql

**Query:**
```graphql
query GetRestaurants {
  restaurants {
    id
    name
    category
    address
    isOpen
  }
}
```

**HTTP Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
```
⚠️ Replace `YOUR_TOKEN_HERE` with actual token from TEST 2

**Expected Result:**
```json
{
  "data": {
    "restaurants": [
      {
        "id": 1,
        "name": "Sate Padang Asli",
        "category": "Indonesian",
        "address": "Jl. Padang No. 123",
        "isOpen": true
      },
      {
        "id": 2,
        "name": "Warung Nasi Sunda",
        "category": "Indonesian",
        "address": "Jl. Sunda No. 456",
        "isOpen": true
      }
      // ... more restaurants
    ]
  }
}
```

**✅ Pass Criteria:** Returns list of restaurants  
**❌ Fail Criteria:** Returns error or empty data

---

### **TEST 4: Get Restaurant Menu**

**Purpose:** Fetch menu items for a specific restaurant

**Endpoint:** http://localhost:4002/graphql

**Query:**
```graphql
query GetRestaurantMenu {
  restaurant(id: 1) {
    id
    name
    category
    menus {
      id
      name
      description
      price
      stock
      category
      isAvailable
    }
  }
}
```

**HTTP Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

**Expected Result:**
```json
{
  "data": {
    "restaurant": {
      "id": 1,
      "name": "Sate Padang Asli",
      "category": "Indonesian",
      "menus": [
        {
          "id": 1,
          "name": "Sate Padang (Daging)",
          "description": "Sate daging sapi dengan bumbu kacang khas Padang",
          "price": 25000.0,
          "stock": 38,
          "category": "Main Course",
          "isAvailable": true
        },
        {
          "id": 2,
          "name": "Sate Padang (Lidah)",
          "description": "Sate lidah sapi dengan bumbu kacang",
          "price": 27000.0,
          "stock": 26,
          "category": "Main Course",
          "isAvailable": true
        }
        // ... more menu items
      ]
    }
  }
}
```

**Action Required:**
📋 **Note down a `menu.id`** (e.g., id: 1) for creating an order

---

### **TEST 5: Create Order**

**Purpose:** Create a new order for the logged-in customer

**Endpoint:** http://localhost:4003/graphql  
(Or via Gateway: http://localhost:4000/order/graphql)

**Mutation:**
```graphql
mutation CreateOrder {
  createOrder(
    restaurantId: 1
    addressId: 1
    items: [
      { menuItemId: 1, quantity: 2 }
    ]
  ) {
    id
    userId
    restaurantId
    status
    totalPrice
    items {
      id
      menuItemName
      quantity
      price
    }
  }
}
```

**HTTP Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

**Expected Result:**
```json
{
  "data": {
    "createOrder": {
      "id": 25,
      "userId": 5,
      "restaurantId": 1,
      "status": "PENDING_PAYMENT",
      "totalPrice": 50000.0,
      "items": [
        {
          "id": 42,
          "menuItemName": "Sate Padang (Daging)",
          "quantity": 2,
          "price": 25000.0
        }
      ]
    }
  }
}
```

**Action Required:**
📋 **Save the `order.id`** (e.g., 25) for payment step

**Variables for Next Steps:**
```
ORDER_ID = 25
TOTAL_PRICE = 50000.0
```

---

### **TEST 6: Get My Orders**

**Purpose:** Verify the order was created successfully

**Endpoint:** http://localhost:4003/graphql

**Query:**
```graphql
query GetMyOrders {
  myOrders {
    id
    restaurantId
    status
    totalPrice
    items {
      menuItemName
      quantity
      price
    }
  }
}
```

**HTTP Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

**Expected Result:**
```json
{
  "data": {
    "myOrders": [
      {
        "id": 25,
        "restaurantId": 1,
        "status": "PENDING_PAYMENT",
        "totalPrice": 50000.0,
        "items": [
          {
            "menuItemName": "Sate Padang (Daging)",
            "quantity": 2,
            "price": 25000.0
          }
        ]
      }
      // ... other orders
    ]
  }
}
```

---

### **TEST 7: Payment with DosWallet (S2S Integration - CRITICAL!)**

**Purpose:** Test the **GraphQL Server-to-Server** integration between FDS Payment Service and DosWallet Transaction Service

**Endpoint:** http://localhost:4004/graphql  
(Or via Gateway: http://localhost:4000/payment/graphql)

**Mutation:**
```graphql
mutation PayOrderWithDosWallet {
  payOrder(orderId: 25, method: "DOSWALLET") {
    success
    message
    payment {
      id
      orderId
      userId
      amount
      status
      paymentMethod
      createdAt
    }
  }
}
```
⚠️ Replace `orderId: 25` with your actual order ID from TEST 5

**HTTP Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

**Expected Result (SUCCESS):**
```json
{
  "data": {
    "payOrder": {
      "success": true,
      "message": "Payment successful",
      "payment": {
        "id": 18,
        "orderId": 25,
        "userId": 5,
        "amount": 50000.0,
        "status": "SUCCESS",
        "paymentMethod": "DOSWALLET",
        "createdAt": "2026-01-05T02:01:30"
      }
    }
  }
}
```

**Expected Result (INSUFFICIENT BALANCE):**
```json
{
  "data": {
    "payOrder": {
      "success": false,
      "message": "DosWallet payment failed: Saldo tidak cukup",
      "payment": null
    }
  }
}
```

**What Happens Behind the Scenes:**
1. 🔵 Payment Service receives `payOrder` mutation
2. 🔵 Payment Service fetches order details from Order Service (validates price)
3. 🔵 Payment Service makes **S2S GraphQL call** to DosWallet Transaction Service
4. 🟢 DosWallet deducts balance from customer's wallet
5. 🟢 DosWallet creates transaction record
6. 🟢 DosWallet returns success response to Payment Service
7. 🟢 Payment Service records payment in database
8. 🟢 Payment Service updates order status to "PAID"
9. ✅ Returns success to client

**✅ Pass Criteria:**
- `success: true`
- Payment recorded in FDS database
- Transaction recorded in DosWallet database
- Order status changed to "PAID"

---

### **TEST 8: Verify Payment History**

**Purpose:** Confirm payment was recorded correctly

**Endpoint:** http://localhost:4004/graphql

**Query:**
```graphql
query GetPaymentHistory {
  paymentHistory {
    id
    orderId
    userId
    amount
    status
    paymentMethod
    createdAt
  }
}
```

**HTTP Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

**Expected Result:**
```json
{
  "data": {
    "paymentHistory": [
      {
        "id": 18,
        "orderId": 25,
        "userId": 5,
        "amount": 50000.0,
        "status": "SUCCESS",
        "paymentMethod": "DOSWALLET",
        "createdAt": "2026-01-05T02:01:30"
      }
      // ... other payments
    ]
  }
}
```

**✅ Pass Criteria:** Payment for order ID 25 appears in history

---

### **TEST 9: Try Accessing Another User's Order (Expected: ERROR)**

**Purpose:** Verify authorization prevents accessing unauthorized resources

**Endpoint:** http://localhost:4003/graphql

**Query:**
```graphql
query GetOrderById {
  order(id: 1) {
    id
    userId
    status
  }
}
```
⚠️ Assuming order ID 1 belongs to a different user

**HTTP Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

**Expected Result:**
```json
{
  "data": {
    "order": null
  }
}
```
Or potentially:
```json
{
  "data": null,
  "errors": [
    {
      "message": "FORBIDDEN: You don't have permission to access this order",
      "extensions": {
        "code": "FORBIDDEN"
      }
    }
  ]
}
```

---

## 🧪 Complete Test Checklist

Copy this checklist and mark as you test:

### Authentication & Security Tests
- [ ] **TEST 1**: Restaurants query WITHOUT token → Returns `UNAUTHENTICATED` error ✅
- [ ] **TEST 2**: Login mutation → Returns valid JWT token ✅
- [ ] **TEST 3**: Restaurants query WITH token → Returns data ✅

### Order Flow Tests
- [ ] **TEST 4**: Get restaurant menu → Returns menu items ✅
- [ ] **TEST 5**: Create order → Returns order with `PENDING_PAYMENT` status ✅
- [ ] **TEST 6**: Get my orders → Shows newly created order ✅

### Payment & Integration Tests
- [ ] **TEST 7**: Pay with DosWallet → `success: true` ✅
- [ ] **TEST 8**: Verify payment history → Payment recorded ✅
- [ ] **TEST 9**: Access unauthorized order → Returns error/null ✅

### S2S Integration Verification
- [ ] Payment Service logs show: "✅ DosWallet S2S Payment Success"
- [ ] DosWallet logs show: GraphQL request received
- [ ] Order status changed from `PENDING_PAYMENT` to `PAID`
- [ ] Transaction recorded in DosWallet database

---

## 🎯 Success Criteria

The GraphQL integration is considered **FULLY SUCCESSFUL** if:

1. ✅ **Strict Authentication Enforced**
   - All queries/mutations (except login/register) require valid JWT
   - Missing/invalid tokens return proper `UNAUTHENTICATED` errors
   - Errors include clear messages and error codes

2. ✅ **Complete Order Flow Works**
   - Customer can browse restaurants (authenticated)
   - Customer can create orders
   - Orders are validated against restaurant menu

3. ✅ **Payment Integration Works**
   - Payment Service successfully calls DosWallet via GraphQL
   - S2S communication includes JWT + X-Secret-Key
   - Balance is deducted correctly
   - Payment records created in both systems

4. ✅ **Error Handling is Clear**
   - GraphQL errors have proper structure
   - Error messages are descriptive
   - Error codes are standardized (UNAUTHENTICATED, FORBIDDEN, NOT_FOUND)

---

## 🔧 Troubleshooting

### Error: "UNAUTHENTICATED: Authorization header missing"
**Cause:** Missing Authorization header  
**Solution:** Add header: `"Authorization": "Bearer YOUR_TOKEN"`

### Error: "UNAUTHENTICATED: Invalid or expired token"
**Cause:** Token expired or malformed  
**Solution:** Login again (TEST 2) to get fresh token

### Error: "Cannot query field 'X' on type 'Y'"
**Cause:** Field name mismatch in GraphQL schema  
**Solution:** Check schema documentation or use GraphiQL autocomplete

### Payment fails with "Insufficient balance"
**Cause:** Customer's DosWallet balance < order amount  
**Solution:** Top-up balance via DosWallet service or use different payment method

### Services returning 500 errors
**Cause:** Services not running or crashed  
**Solution:** 
```bash
docker-compose ps  # Check status
docker-compose logs payment-service  # Check logs
docker-compose restart payment-service  # Restart if needed
```

---

## 📝 Quick Reference URLs

### Direct Service Endpoints (With GraphiQL)
- **User Service**: http://localhost:4001/graphql
- **Restaurant Service**: http://localhost:4002/graphql
- **Order Service**: http://localhost:4003/graphql
- **Payment Service**: http://localhost:4004/graphql
- **Driver Service**: http://localhost:4005/graphql

### Via API Gateway
- **User**: http://localhost:4000/user/graphql
- **Restaurant**: http://localhost:4000/restaurant/graphql
- **Order**: http://localhost:4000/order/graphql
- **Payment**: http://localhost:4000/payment/graphql
- **Driver**: http://localhost:4000/driver/graphql

---

## 💡 Pro Tips

1. **Use GraphiQL Interface**
   - Open any GraphQL endpoint in browser
   - Autocomplete helps discover available fields
   - Set headers in "Request Headers" panel

2. **Save Your Token**
   - Copy token from login response to notepad
   - Token typically valid for 24 hours
   - Use same token for all subsequent requests

3. **Test Order First**
   - Copy the EXACT queries from this document
   - Replace only the token and IDs as instructed
   - Verify each step before proceeding to next

4. **Monitor Logs for S2S Calls**
   ```bash
   # Terminal 1: Watch Payment Service
   docker logs -f payment-service_container_name
   
   # Terminal 2: Watch DosWallet
   docker logs -f dw-transaction-service
   ```

5. **Use Variables in GraphiQL**
   ```graphql
   mutation PayOrder($orderId: Int!, $method: String!) {
     payOrder(orderId: $orderId, method: $method) {
       success
       message
     }
   }
   ```
   Query Variables:
   ```json
   {
     "orderId": 25,
     "method": "DOSWALLET"
   }
   ```

---

## 🏦 **TEST 10: DosWallet Transaction History (Cross-System Integration)**

> **Purpose:** Verify that FDS-issued JWT token works with DosWallet GraphQL and transaction data is accessible

This test proves the **complete end-to-end integration** between FDS and DosWallet!

### **Method 1: curl Test (Recommended - Most Reliable)**

**Step 1: Get FDS Token**
```bash
TOKEN=$(curl -s -X POST http://localhost:4001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { login(email: \"customer1@example.com\", password: \"password\") { token } }"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['login']['token'])")

echo "Token: $TOKEN"
```

**Step 2: Query DosWallet Transactions**
```bash
curl -s -X POST http://localhost:5003/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "query { myTransactions(limit: 5) { transaction_id user_id amount type description status } }"}' \
  | python3 -m json.tool
```

**Expected Result:**
```json
{
    "data": {
        "myTransactions": [
            {
                "transaction_id": 13,
                "user_id": 1,
                "amount": 50000.0,
                "type": "withdraw",
                "description": "Payment for Order 23",
                "status": "completed"
            },
            {
                "transaction_id": 12,
                "user_id": 1,
                "amount": 50000.0,
                "type": "withdraw",
                "description": "Payment for Order 22",
                "status": "completed"
            }
            // ... more transactions
        ]
    }
}
```

**✅ Pass Criteria:**
- Returns array of transactions (not empty!)
- FDS token (user_id=5) successfully validated by DosWallet
- Email-based user lookup works (maps to DosWallet user_id=1)
- Cross-system JWT authentication successful

---

### **Method 2: Browser DevTools**

If you prefer testing in browser:

1. **Open Browser DevTools** (F12 or Cmd+Option+I)
2. **Go to Console tab**
3. **Paste and run this code:**

```javascript
// Complete FDS → DosWallet integration test
fetch('http://localhost:4001/graphql', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    query: 'mutation { login(email: "customer1@example.com", password: "password") { token } }'
  })
})
.then(r => r.json())
.then(data => {
  const token = data.data.login.token;
  console.log("✅ FDS Token obtained");
  
  // Query DosWallet with FDS token
  return fetch('http://localhost:5003/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      query: `query {
        myTransactions(limit: 5) {
          transaction_id
          user_id
          amount
          type
          description
          status
        }
      }`
    })
  });
})
.then(r => r.json())
.then(result => {
  console.log("🎉 DosWallet Response:", result);
  if (result.data && result.data.myTransactions.length > 0) {
    console.log(`✅ SUCCESS! Got ${result.data.myTransactions.length} transactions!`);
    console.table(result.data.myTransactions);
  } else {
    console.log("❌ No transactions found");
  }
});
```

**Expected Console Output:**
```
✅ FDS Token obtained
🎉 DosWallet Response: {data: {myTransactions: Array(10)}}
✅ SUCCESS! Got 10 transactions!
```

**Plus a nice table showing all transactions!**

---

### **What This Test Proves:**

1. ✅ **SECRET_KEY Alignment** - FDS and DosWallet use same secret key
2. ✅ **JWT Cross-Validation** - Token signed by FDS accepted by DosWallet
3. ✅ **Email-Based User Lookup** - FDS user_id (5) correctly mapped to DosWallet user_id (1) via email
4. ✅ **Cross-Database Query** - Transaction service queries user table from different database
5. ✅ **MySQL Permissions** - Proper GRANT permissions configured
6. ✅ **GraphQL S2S Integration** - Two separate GraphQL systems communicate seamlessly

---

## 🎉 Summary

This testing guide ensures:
- ✅ **Security**: Strict authentication enforced on all protected endpoints
- ✅ **Functionality**: Complete customer order flow works end-to-end
- ✅ **Integration**: FDS ↔ DosWallet GraphQL S2S communication verified
- ✅ **Error Handling**: Clear, standardized error messages
- ✅ **Documentation**: Copy-paste ready queries for easy testing
- ✅ **Cross-System Auth**: Single JWT token works across both systems

Happy testing! 🚀