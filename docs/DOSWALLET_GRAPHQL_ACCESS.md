# DosWallet GraphQL Access Guide

## 🎯 Overview
DosWallet menggunakan **Graphene** (Flask-GraphQL), bukan Strawberry. Namun JWT token dari FDS bisa digunakan karena SECRET_KEY sudah di-align.

---

## 📍 DosWallet GraphQL Endpoints

### **Transaction Service GraphQL**
- **URL**: http://localhost:5003/graphql
- **GraphiQL Interface**: http://localhost:5003/graphql (buka di browser)
- **Framework**: Flask-GraphQL (Graphene)

### **Wallet Service GraphQL** (if needed)
- **URL**: http://localhost:5004/graphql (jika ada)

---

## 🔑 Authentication

DosWallet menggunakan JWT yang sama dengan FDS karena:
```python
# FDS Services
SECRET_KEY = "kunci_rahasia_project_ini_harus_sama_semua"

# DosWallet Services (sudah di-align)
JWT_SECRET = "kunci_rahasia_project_ini_harus_sama_semua"
```

**Cara Menggunakan:**
1. Login di FDS (http://localhost:4001/graphql) untuk dapat token
2. Gunakan token yang sama untuk akses DosWallet GraphQL

---

## 📊 Available Queries in DosWallet

DosWallet Transaction Service memiliki queries berikut:
1. `myTransactions` - Get transaksi user yang sedang login
2. `transaction(transaction_id)` - Get detail transaksi spesifik
3. `transactionsByType(type)` - Get transaksi berdasarkan type

**Note:** For wallet balance, gunakan REST API endpoint atau query via wallet-service (port 5004)

---

## 📊 Query Transaction History

### **TEST 1: Get My Transactions (User's View)**

**Endpoint:** http://localhost:5003/graphql

**Query:**
```graphql
query MyTransactions {
  myTransactions(limit: 10, offset: 0) {
    transaction_id
    user_id
    amount
    type
    payment_method
    date
    description
    status
  }
}
```

**HTTP Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_FDS_TOKEN_HERE"
}
```
⚠️ Gunakan token dari FDS login!

**Expected Result:**
```json
{
  "data": {
    "myTransactions": [
      {
        "transaction_id": 123,
        "user_id": 5,
        "amount": -50000.0,
        "type": "MERCHANT",
        "payment_method": "doswallet",
        "date": "2026-01-05T02:01:30",
        "description": "Payment for Order #25",
        "status": "SUCCESS"
      },
      {
        "transaction_id": 122,
        "user_id": 5,
        "amount": 100000.0,
        "type": "DEPOSIT",
        "payment_method": "BANK_TRANSFER",
        "date": "2026-01-04T10:00:00",
        "description": "Top-up via Bank Transfer",
        "status": "SUCCESS"
      }
      // ... more transactions
    ]
  }
}
```

**Key Points:**
- 📌 Amount **negatif** = pengeluaran (payment)
- 📌 Amount **positif** = pemasukan (deposit/transfer received)
- 📌 Type `MERCHANT` = pembayaran ke merchant (FDS)
- 📌 Description berisi Order ID dari FDS

---

### **TEST 2: Get Specific Transaction by ID**

**Query:**
```graphql
query GetTransaction {
  transaction(transaction_id: 123) {
    transaction_id
    user_id
    amount
    type
    payment_method
    date
    receiver_id
    description
    status
  }
}
```

**HTTP Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_FDS_TOKEN_HERE"
}
```

**Expected Result:**
```json
{
  "data": {
    "transaction": {
      "transaction_id": 123,
      "user_id": 5,
      "amount": -50000.0,
      "type": "MERCHANT",
      "payment_method": "doswallet",
      "date": "2026-01-05T02:01:30",
      "receiver_id": null,
      "description": "Payment for Order #25",
      "status": "SUCCESS"
    }
  }
}
```

---

### **TEST 3: Get Transactions by Type**

**Query:**
```graphql
query GetMerchantPayments {
  transactionsByType(type: "MERCHANT", limit: 5) {
    transaction_id
    amount
    date
    description
    status
  }
}
```

**HTTP Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_FDS_TOKEN_HERE"
}
```

**Expected Result:**
```json
{
  "data": {
    "transactionsByType": [
      {
        "transaction_id": 123,
        "amount": -50000.0,
        "date": "2026-01-05T02:01:30",
        "description": "Payment for Order #25",
        "status": "SUCCESS"
      }
      // ... more merchant payments
    ]
  }
}
```

---

## 🔍 Verify FDS Payment in DosWallet

**Step-by-Step Verification:**

### 1. **Bayar Order di FDS**
```graphql
# Di FDS Payment Service (http://localhost:4004/graphql)
mutation PayOrder {
  payOrder(orderId: 25, method: "DOSWALLET") {
    success
    payment {
      id
      orderId
      amount
    }
  }
}
```

### 2. **Cek Transaction di DosWallet**
```graphql
# Di DosWallet Transaction Service (http://localhost:5003/graphql)
query MyTransactions {
  myTransactions(limit: 5) {
    transaction_id
    amount
    type
    description
    status
  }
}
```

### 3. **Match the Records**
Pastikan:
- ✅ Ada transaction baru dengan type `MERCHANT`
- ✅ Amount = -(order total price) (negatif karena pengeluaran)
- ✅ Description berisi Order ID yang sama
- ✅ Status = `SUCCESS`

---

## 💰 Get Wallet Balance

**Note:** Wallet balance tidak tersedia di Transaction Service GraphQL.

**Alternative Options:**

**Option 1: Via DosWallet REST API**
```bash
curl -X GET http://localhost:5004/api/wallets/5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Option 2: Via Wallet Service GraphQL** (if available on port 5004)
```
URL: http://localhost:5004/graphql
```

**Option 3: Calculate from Transactions**
Sum all transaction amounts to get approximate balance

---

## 🧪 Complete Testing Flow

### **Scenario: Verify FDS-DosWallet Integration**

1. **Login di FDS**
   ```
   URL: http://localhost:4001/graphql
   Get Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Cek Balance Awal di DosWallet** (via REST API)
   ```bash
   curl -X GET http://localhost:5004/api/wallets/5 \
     -H "Authorization: Bearer TOKEN"
   # Result: balance: 2732000.0
   ```

3. **Create Order di FDS**
   ```
   URL: http://localhost:4003/graphql
   Mutation: createOrder
   Result: Order ID 25, Total: 50000
   ```

4. **Pay Order di FDS**
   ```
   URL: http://localhost:4004/graphql
   Mutation: payOrder(orderId: 25)
   Result: success: true
   ```

5. **Verify Transaction di DosWallet**
   ```
   URL: http://localhost:5003/graphql
   Query: myTransactions(limit: 1)
   Result: 
   {
     transaction_id: 123,
     amount: -50000,
     type: "MERCHANT",
     description: "Payment for Order #25"
   }
   ```

6. **Verify Balance Berkurang**
   ```
   URL: http://localhost:5003/graphql
   Query: myWallet { balance }
   Result: balance: 2682000.0  (berkurang 50000)
   ```

**✅ Integration Success!**

---

## 🔧 Troubleshooting

### Error: "Authentication required"
**Cause:** Token tidak valid atau expired  
**Solution:** Login ulang di FDS untuk dapat token baru

### Error: "User not found"
**Cause:** User ID di token tidak ada di DosWallet database  
**Solution:** Pastikan user sudah terdaftar di kedua sistem (FDS dan DosWallet)

### Empty Transaction History
**Cause:** Belum ada transaksi atau filter salah  
**Solution:** 
- Coba tanpa limit/offset
- Pastikan sudah ada payment dari FDS

### Balance tidak berkurang setelah payment
**Cause:** Payment gagal atau tidak ter-record di DosWallet  
**Solution:**
- Cek logs DosWallet: `docker logs dw-transaction-service`
- Verify payment status di FDS
- Cek apakah S2S call berhasil

---

## 📝 Quick Commands Reference

### Via curl (for testing)
```bash
# 1. Login FDS
TOKEN=$(curl -s -X POST http://localhost:4001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { login(email: \"customer1@example.com\", password: \"password\") { token } }"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['login']['token'])")

# 2. Get DosWallet Balance
curl -s -X POST http://localhost:5003/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "query { myWallet { balance points } }"}' \
  | python3 -m json.tool

# 3. Get Transaction History
curl -s -X POST http://localhost:5003/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "query { myTransactions(limit: 5) { transaction_id amount type description date } }"}' \
  | python3 -m json.tool
```

---

## 🎯 Key Points to Remember

1. **Same JWT Token**
   - Token dari FDS login bisa digunakan di DosWallet
   - SECRET_KEY sudah di-align antara kedua sistem

2. **GraphQL Schema Differences**
   - FDS: Strawberry (snake_case fields)
   - DosWallet: Graphene (snake_case with underscore)

3. **Amount Convention**
   - Negatif = pengeluaran/debit
   - Positif = pemasukan/credit

4. **Transaction Types**
   - `DEPOSIT`: Top-up saldo
   - `WITHDRAW`: Tarik saldo
   - `TRANSFER`: Transfer ke user lain
   - `MERCHANT`: Pembayaran ke merchant (FDS)

5. **Verification Points**
   - Transaction ID di DosWallet
   - Balance berkurang sesuai amount
   - Points bertambah (1 point per 10k)
   - Description match dengan Order ID

---

Silakan akses **http://localhost:5003/graphql** di browser dan gunakan token dari FDS untuk query transaction history! 🚀
