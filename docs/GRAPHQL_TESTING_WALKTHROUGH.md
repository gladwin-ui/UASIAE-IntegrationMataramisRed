# GraphQL Testing Walkthrough - Manual Testing Guide

## 🚀 Prerequisites
✅ Docker sudah running
✅ Semua services sudah di-rebuild dan restart (especially payment-service)

---

## 📋 Testing Steps

### STEP 1: Test Login (User Authentication)

**URL to Access:** http://localhost:4001/graphql
(Atau bisa juga via Gateway: http://localhost:4000/user/graphql)

**Query untuk Copy-Paste:**
```graphql
mutation Login {
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

**Expected Result:**
```json
{
  "data": {
    "login": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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

**⚠️ PENTING:** Simpan `token` yang Anda dapat! Akan digunakan untuk step selanjutnya.

---

### STEP 2: Test Get Restaurants

**URL to Access:** http://localhost:4002/graphql
(Atau via Gateway: http://localhost:4000/restaurant/graphql)

**Query untuk Copy-Paste:**
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

**HTTP Headers (Set di GraphiQL):**
```json
{
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
```
*Ganti `YOUR_TOKEN_HERE` dengan token dari Step 1*

**Expected Result:**
```json
{
  "data": {
    "restaurants": [
      {
        "id": 1,
        "name": "Sate Padang Asli",
        "category": "Indonesian",
        "address": "....",
        "isOpen": true
      },
      ...
    ]
  }
}
```

---

### STEP 3: Test Get Restaurant Menu

**URL to Access:** http://localhost:4002/graphql

**Query untuk Copy-Paste:**
```graphql
query GetRestaurantMenu {
  restaurant(id: 1) {
    id
    name
    menus {
      id
      name
      price
      stock
      description
    }
  }
}
```

**HTTP Headers:**
```json
{
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
      "menus": [
        {
          "id": 1,
          "name": "Sate Padang (Daging)",
          "price": 25000.0,
          "stock": 38,
          "description": "..."
        },
        ...
      ]
    }
  }
}
```

**⚠️ PENTING:** Simpan `menu.id` yang ingin Anda pesan!

---

### STEP 4: Test Create Order (CRITICAL!)

**URL to Access:** http://localhost:4003/graphql
(Atau via Gateway: http://localhost:4000/order/graphql)

**Query untuk Copy-Paste:**
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
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

**Expected Result:**
```json
{
  "data": {
    "createOrder": {
      "id": 22,
      "userId": 5,
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
  }
}
```

**⚠️ PENTING:** Simpan `id` dari order yang baru dibuat! (contoh: 22)

---

### STEP 5: Test Payment with DosWallet (S2S Integration - MOST CRITICAL!)

**URL to Access:** http://localhost:4004/graphql
(Atau via Gateway: http://localhost:4000/payment/graphql)

**Query untuk Copy-Paste:**
```graphql
mutation PayOrder {
  payOrder(orderId: 22, method: "DOSWALLET") {
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

**HTTP Headers:**
```json
{
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

**⚠️ Ganti `orderId: 22` dengan order ID yang Anda dapat dari Step 4!**

**Expected Result (SUCCESS):**
```json
{
  "data": {
    "payOrder": {
      "success": true,
      "message": "Payment successful",
      "payment": {
        "id": 15,
        "orderId": 22,
        "userId": 5,
        "amount": 50000.0,
        "status": "SUCCESS",
        "paymentMethod": "DOSWALLET",
        "createdAt": "2026-01-04T22:01:00"
      }
    }
  }
}
```

**Expected Result (ERROR - if balance insufficient):**
```json
{
  "data": {
    "payOrder": {
      "success": false,
      "message": "DosWallet payment failed: Insufficient balance",
      "payment": null
    }
  }
}
```

---

### STEP 6: Verify Payment History

**URL to Access:** http://localhost:4004/graphql

**Query untuk Copy-Paste:**
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
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

**Expected Result:**
```json
{
  "data": {
    "paymentHistory": [
      {
        "id": 15,
        "orderId": 22,
        "userId": 5,
        "amount": 50000.0,
        "status": "SUCCESS",
        "paymentMethod": "DOSWALLET",
        "createdAt": "2026-01-04T22:01:00"
      },
      ...
    ]
  }
}
```

**✅ Cek apakah payment untuk order ID Anda ada di list!**

---

## 🔍 Troubleshooting

### Error: "Cannot query field 'payOrder' on type 'Mutation'"
**Solusi:** Payment service belum restart dengan code terbaru
```bash
cd /Users/rayyyhann/Documents/UASIAE/UASIAE-FoodDeliverySystem-withIntegration
docker-compose build payment-service --no-cache
docker-compose up -d payment-service
```

### Error: "Authorization header missing"
**Solusi:** Pastikan Anda set HTTP Headers di GraphiQL dengan token yang benar

### Error: "Invalid or expired token"
**Solusi:** Login ulang (Step 1) untuk mendapatkan token baru

### Error: "Order not found"
**Solusi:** Pastikan order ID yang Anda gunakan benar (dari Step 4)

### Error: "DosWallet payment failed: Insufficient balance"
**Solusi:** Customer1 perlu top-up balance di DosWallet dulu

---

## 📝 Testing Checklist

Silakan copy hasil testing Anda dalam format ini:

- [ ] **STEP 1 (Login)**: ✅ Success / ❌ Error: _______
- [ ] **STEP 2 (Get Restaurants)**: ✅ Success / ❌ Error: _______
- [ ] **STEP 3 (Get Menu)**: ✅ Success / ❌ Error: _______
- [ ] **STEP 4 (Create Order)**: ✅ Success / ❌ Error: _______
  - Order ID yang didapat: _______
  - Total Price: _______
- [ ] **STEP 5 (Payment - S2S)**: ✅ Success / ❌ Error: _______
  - Success: true/false: _______
  - Message: _______
  - Payment ID: _______
- [ ] **STEP 6 (Verify History)**: ✅ Success / ❌ Error: _______

---

## 🎯 Success Criteria

GraphQL Integration dianggap **BERHASIL** jika:
1. ✅ Login berhasil dan mendapat token
2. ✅ Query restaurants berhasil
3. ✅ Create order berhasil dengan status PENDING_PAYMENT
4. ✅ Payment mutation berhasil dengan success: true
5. ✅ Payment tercatat di payment history
6. ✅ Tidak ada GraphQL errors di semua step

**CRITICAL:** Step 5 (Payment) adalah test paling penting karena ini yang melakukan **Server-to-Server GraphQL call** dari Payment Service ke DosWallet!

---

## 💡 Tips

1. **Gunakan GraphiQL interface** - Lebih mudah untuk testing manual
2. **Set HTTP Headers** di tab "Request Headers" di GraphiQL
3. **Copy-paste query persis** seperti di walkthrough ini
4. **Simpan token** di notepad untuk digunakan di semua step
5. **Catat order ID** setelah create order untuk payment step

---

Silakan jalankan testing dan report hasilnya! 🚀
