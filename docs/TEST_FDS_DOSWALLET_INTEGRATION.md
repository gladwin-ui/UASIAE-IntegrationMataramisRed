# Testing Integrasi FDS GraphQL ↔ DosWallet GraphQL

## 🎯 Tujuan Testing
Memastikan **Payment Service (FDS)** bisa melakukan **Server-to-Server (S2S) GraphQL call** ke **DosWallet Transaction Service** saat customer melakukan pembayaran.

---

## 📊 Arsitektur Integrasi

```
Customer (Frontend)
    ↓ GraphQL payOrder mutation
API Gateway (localhost:4000)
    ↓ proxy ke
Payment Service (localhost:4004/graphql)
    ↓ [S2S GraphQL Call]
    ↓ HTTP POST ke http://dw-transaction-service:5003/graphql
    ↓ dengan JWT token + X-Secret-Key header
DosWallet Transaction Service
    ↓ Deduct balance dari wallet
    ↓ Return success/failure
Payment Service
    ↓ Record payment jika success
    ↓ Update order status ke PAID
Return result to Customer
```

---

## 🔍 Cara Cek Integrasi - 3 Metode

### **METODE 1: Via GraphQL Mutation (Recommended)**

#### Persiapan:
1. **Login dulu** untuk dapat JWT token:
```bash
curl -X POST http://localhost:4000/user/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { login(email: \"customer1@example.com\", password: \"password\") { token user { id } } }"}'
```
Simpan token yang didapat!

2. **Buat order baru**:
```bash
TOKEN="YOUR_TOKEN_HERE"

curl -X POST http://localhost:4000/order/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "mutation { createOrder(restaurantId: 1, addressId: 1, items: [{menuItemId: 1, quantity: 2}]) { id totalPrice status } }"}'
```
Simpan Order ID yang didapat!

#### Testing Integrasi:
```bash
TOKEN="YOUR_TOKEN_HERE"
ORDER_ID=23  # Ganti dengan order ID dari step sebelumnya

curl -X POST http://localhost:4000/payment/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"query\": \"mutation { payOrder(orderId: $ORDER_ID, method: \\\"DOSWALLET\\\") { success message payment { id amount status } } }\"}"
```

#### Expected Output (SUCCESS):
```json
{
  "data": {
    "payOrder": {
      "success": true,
      "message": "Payment successful",
      "payment": {
        "id": 16,
        "amount": 50000.0,
        "status": "SUCCESS"
      }
    }
  }
}
```

#### Expected Output (ERROR - Insufficient Balance):
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

---

### **METODE 2: Monitoring Docker Logs (Real-time)**

Buka 2 terminal untuk monitor logs secara real-time:

**Terminal 1: Monitor Payment Service Logs**
```bash
docker logs -f uasiae-fooddeliverysystem-withintegration-payment-service-1
```

**Terminal 2: Monitor DosWallet Transaction Service Logs**
```bash
docker logs -f dw-transaction-service
```

#### Ciri-ciri Integrasi Berhasil:

**Di Payment Service logs**, Anda akan lihat:
```
✅ DosWallet S2S Payment Success for Order #23, Amount: 50000.0
```

**Di DosWallet Transaction Service logs**, Anda akan lihat:
```
INFO: GraphQL request body: {"query": "...", "variables": {...}}
INFO: Payment processed for user_id=5, amount=50000
```

---

### **METODE 3: Cek Database Langsung**

#### 1. Cek Payment di FDS Database:
```bash
docker exec -it uasiae-fooddeliverysystem-withintegration-payment_db-1 mysql -uroot -ppassword payment_db -e "SELECT * FROM payments WHERE order_id = 23;"
```

Expected output:
```
+----+----------+---------+--------+----------+----------------+---------------------+
| id | order_id | user_id | amount | status   | payment_method | created_at          |
+----+----------+---------+--------+----------+----------------+---------------------+
| 16 |       23 |       5 |  50000 | SUCCESS  | DOSWALLET      | 2026-01-05 00:50:00 |
+----+----------+---------+--------+----------+----------------+---------------------+
```

#### 2. Cek Transaction di DosWallet Database:
```bash
docker exec -it dw-mysql mysql -uroot -ppassword doswallet -e "SELECT transaction_id, user_id, amount, type, description, status FROM transactions WHERE description LIKE '%Order%' ORDER BY created_at DESC LIMIT 5;"
```

Expected output:
```
+----------------+---------+--------+-------------+---------------------------+--------+
| transaction_id | user_id | amount | type        | description               | status |
+----------------+---------+--------+-------------+---------------------------+--------+
|            123 |       5 | -50000 | MERCHANT    | Payment for Order #23     | SUCCESS|
+----------------+---------+--------+-------------+---------------------------+--------+
```

**⚠️ Perhatikan:**
- Amount di DosWallet akan **negatif** (karena deduct)
- Type = `MERCHANT`
- Description berisi order ID

---

## 🧪 Test Case Lengkap

### **Test Case 1: Payment SUCCESS (Happy Path)**

**Precondition:**
- Customer1 punya balance di DosWallet ≥ 50000
- Order sudah dibuat dengan status PENDING_PAYMENT

**Steps:**
1. Call `payOrder` mutation via GraphQL
2. Check payment service logs untuk "✅ DosWallet S2S Payment Success"
3. Check response: `success: true`
4. Verify order status berubah ke "PAID"

**Expected Result:**
- ✅ Response success = true
- ✅ Payment tercatat di FDS payment_db
- ✅ Transaction tercatat di DosWallet dengan amount negatif
- ✅ Order status = PAID

---

### **Test Case 2: Payment FAILED (Insufficient Balance)**

**Precondition:**
- Customer1 balance di DosWallet < 50000

**Steps:**
1. Call `payOrder` mutation via GraphQL
2. Check payment service logs

**Expected Result:**
- ❌ Response success = false
- ❌ Message: "DosWallet payment failed: Saldo tidak cukup"
- ❌ Tidak ada payment tercatat di FDS
- ❌ Tidak ada transaction baru di DosWallet
- ✅ Order status tetap PENDING_PAYMENT

---

## 🔧 Troubleshooting

### Error: "Cannot connect to DosWallet"
**Solusi:**
```bash
# Pastikan DosWallet services running
docker ps | grep dw-

# Restart DosWallet transaction service
cd /Users/rayyyhann/Documents/UASIAE/DOSWALLET-WEB
docker-compose restart dw-transaction-service
```

### Error: "X-Secret-Key invalid"
**Cek environment variable:**
```bash
docker exec uasiae-fooddeliverysystem-withintegration-payment-service-1 env | grep X_SECRET_KEY
docker exec dw-transaction-service env | grep X_SECRET_KEY
```

Keduanya harus sama!

### Payment success tapi tidak tercatat di DosWallet
**Cek logs DosWallet:**
```bash
docker logs dw-transaction-service --tail 50
```

Lihat apakah ada error atau GraphQL request ditolak.

---

## ✅ Checklist Integrasi Sukses

Untuk memastikan integrasi FDS ↔ DosWallet bekerja sempurna:

- [ ] Payment mutation return `success: true`
- [ ] Payment Service logs menunjukkan "✅ DosWallet S2S Payment Success"
- [ ] DosWallet logs menunjukkan GraphQL request diterima
- [ ] Payment tercatat di `payment_db.payments` dengan status SUCCESS
- [ ] Transaction tercatat di `doswallet.transactions` dengan type MERCHANT
- [ ] Balance customer di DosWallet berkurang sesuai amount order
- [ ] Order status berubah dari PENDING_PAYMENT → PAID

Jika **semua checklist ✅**, maka integrasi GraphQL FDS-DosWallet **BERHASIL!** 🎉

---

## 💡 Tips

1. **Gunakan Postman/Thunder Client** untuk testing GraphQL mutation lebih mudah
2. **Monitor logs real-time** saat melakukan payment untuk debugging
3. **Cek database** jika ada discrepancy di response vs actual data
4. **Top-up balance** customer1 di DosWallet jika insufficient balance

---

## 📞 Quick Commands Reference

```bash
# Get customer1 balance
docker exec -it dw-mysql mysql -uroot -ppassword doswallet -e "SELECT * FROM wallets WHERE user_id = 5;"

# Top-up balance customer1 (via DosWallet transaction service)
curl -X POST http://localhost:5003/api/transactions/deposit \
  -H "Content-Type: application/json" \
  -H "X-Secret-Key: doswallet_service_secret" \
  -d '{"user_id": 5, "amount": 1000000, "payment_method": "BANK_TRANSFER"}'

# Check all payments
docker exec -it uasiae-fooddeliverysystem-withintegration-payment_db-1 mysql -uroot -ppassword payment_db -e "SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;"
```
