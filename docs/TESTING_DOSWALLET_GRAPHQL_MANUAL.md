# 🎯 Manual Testing Guide: DosWallet GraphQL dengan FDS Token

> **STATUS: ✅ VERIFIED WORKING!**  
> **Tujuan:** Query transaksi DosWallet menggunakan token dari FDS login  
> **Result:** Successfully returns transaction data with aligned SECRET_KEY

---

## ✅ **CONFIRMED WORKING** - Test Results

**Latest Test (2026-01-09):**
```json
{
    "data": {
        "myTransactions": [
            {"transaction_id": 13, "user_id": 1, "amount": 50000.0},
            {"transaction_id": 12, "user_id": 1, "amount": 50000.0},
            {"transaction_id": 11, "user_id": 1, "amount": 25000.0}
        ]
    }
}
```
✅ FDS Token successfully validated by DosWallet!  
✅ User lookup by email works!  
✅ Transactions returned correctly!

---

## ✅ Prerequisites Check

Pastikan semua services running:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

Expected:
- ✅ FDS services (user, restaurant, order, payment, driver, gateway, frontend)
- ✅ DosWallet services (mysql, user, wallet, transaction, notification, frontend)

---

## 📋 Step-by-Step Testing

### **STEP 1: Login di FDS GraphQL** 🔐

1. **Buka browser** → http://localhost:4001/graphql
   
2. **Paste query ini** di panel kiri:
```graphql
mutation {
  login(email: "customer1@example.com", password: "password") {
    token
    user {
      id
      email
    }
  }
}
```

3. **Klik tombol Execute** (▶️ play button)

4. **COPY TOKEN** dari response (string panjang yang dimulai dengan `eyJ...`)

**Expected Result:**
```json
{
  "data": {
    "login": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 5,
        "email": "customer1@example.com"
      }
    }
  }
}
```

✅ **SAVE TOKEN INI** untuk step berikutnya!

---

### **STEP 2: Buka DosWallet GraphQL** 🏦

1. **Buka tab baru** → http://localhost:5003/graphql

2. **IMPORTANT:** GraphiQL versi lama ini **tidak punya UI untuk headers**

---

### **STEP 3: Set Authorization Header via Browser Console** 🔧

Karena GraphiQL lama tidak punya header panel, kita akan "hijack" fetch request:

1. **Buka DevTools** - tekan `F12` atau `Cmd+Option+I` (Mac)

2. **Klik tab "Console"**

3. **Paste JavaScript ini** (ganti `YOUR_TOKEN_HERE` dengan token dari STEP 1):

```javascript
// IMPROVED VERSION - Prevents "Maximum call stack size exceeded"

// Simpan token
const FDS_TOKEN = "YOUR_TOKEN_HERE";  // <-- PASTE TOKEN DI SINI!

// Check if already hijacked to prevent recursive calls
if (!window._fetchHijacked) {
  window._originalFetch = window.fetch;
  window._fetchHijacked = true;

  window.fetch = function(input, init) {
    // Only modify GraphQL requests, skip favicon and other assets
    const url = typeof input === 'string' ? input : input.url;
    
    if (!url.includes('favicon') && (url.includes('/graphql') || url === '/graphql')) {
      init = init || {};
      init.headers = init.headers || {};
      
      if (init.headers instanceof Headers) {
        init.headers.set('Authorization', 'Bearer ' + FDS_TOKEN);
      } else {
        init.headers['Authorization'] = 'Bearer ' + FDS_TOKEN;
      }
      
      console.log('🔐 Auth header added to:', url);
    }
    
    return window._originalFetch(input, init);
  };

  console.log("✅ Fetch hijacked! Authorization header will be added to GraphQL requests.");
  console.log("🔑 Token preview:", FDS_TOKEN.substring(0, 30) + "...");
} else {
  console.log("⚠️ Fetch already hijacked. Skipping to avoid recursion.");
}
```

4. **Tekan Enter** untuk run script

5. **Verify:** Anda should see:
   - `✅ Fetch hijacked! Authorization header will be added to GraphQL requests.`
   - `🔑 Token preview: eyJhbGciOiJIUzI1NiIsInR5cCI6...`

**💡 Troubleshooting:**
- ❌ **Error "Maximum call stack size exceeded"** → Reload page (F5) dan run script sekali saja
- ❌ **Error "Favicon 401"** → **IGNORE!** Ini normal, browser coba load favicon

---

### **STEP 4: Query myTransactions** 📊

1. **Di GraphiQL interface**, paste query ini:

```graphql
query {
  myTransactions(limit: 10) {
    transaction_id
    user_id
    amount
    type
    description
    status
  }
}
```

2. **Klik Execute button** (▶️)

3. **Check hasil** di panel kanan

---

## 🎯 Expected Results

### **✅ SUCCESS - Confirmed Working (2026-01-09):**

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
      // ... more transactions (total 10)
    ]
  }
}
```

**✅ What This Means:**
- ✅ Token FDS berhasil divalidasi oleh DosWallet
- ✅ SECRET_KEY aligned antara FDS dan DosWallet  
- ✅ User lookup by email bekerja (maps FDS user_id=5 → DosWallet user_id=1)
- ✅ Cross-database query berhasil
- ✅ MySQL permissions configured correctly
- ✅ **Integration WORKS!** 🎉

---

### **❌ FAIL - Jika Masih Kosong:**

```json
{
  "data": {
    "myTransactions": []
  }
}
```

**Troubleshooting:**
1. Check browser console untuk error messages
2. Check DosWallet logs:
   ```bash
   docker logs doswallet-transaction-service --tail 30 | grep DEBUG
   ```
3. Verify token belum expired (login ulang jika perlu)

---

### **❌ FAIL - Unauthorized Error:**

```json
{
  "errors": [
    {
      "message": "Unauthorized"
    }
  ]
}
```

**Berarti:**
- Token tidak di-inject dengan benar
- Ulangi STEP 3 dan pastikan script di-run
- Atau token invalid/expired

---

## 🔍 Cara Verify Database Langsung

Jika ingin confirm data transaksi ada di database:

```bash
docker exec doswallet-mysql mysql -uroot -pdoswallet123 doswallet_transaction_db -e "
SELECT t.transaction_id, t.user_id, t.amount, t.type, LEFT(t.description, 40) as description
FROM transactions t
JOIN doswallet_user_db.users u ON t.user_id = u.user_id
WHERE u.email = 'customer1@example.com'
ORDER BY t.date DESC
LIMIT 5;
"
```

Expected: Should show 10 transactions for customer1@example.com

---

## 💡 Alternative Testing Methods

### **Method A: Direct curl (No Browser)**

```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:4001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { login(email: \"customer1@example.com\", password: \"password\") { token } }"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['login']['token'])")

# Query DosWallet
curl -s -X POST http://localhost:5003/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "query { myTransactions(limit: 5) { transaction_id user_id amount type } }"}' \
  | python3 -m json.tool
```

### **Method B: Postman / Thunder Client**

1. Create POST request → http://localhost:5003/graphql
2. Headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer YOUR_TOKEN`
3. Body (GraphQL):
   ```graphql
   query {
     myTransactions(limit: 5) {
       transaction_id
       amount
       type
     }
   }
   ```

---

## 🐛 Common Issues

### Issue 1: "Service not responding"
**Solution:**
```bash
cd /Users/rayyyhann/Documents/UASIAE/DOSWALLET-WEB
docker-compose restart dw-transaction-service
```

### Issue 2: "Cannot connect to MySQL"
**Solution:**
```bash
docker-compose restart doswallet-mysql
sleep 10
docker-compose restart dw-transaction-service
```

### Issue 3: Token expired
**Solution:** Login ulang di STEP 1 untuk get fresh token

---

## ✅ Success Criteria Checklist

- [ ] FDS login berhasil dan dapat token
- [ ] Token bisa di-decode (check di jwt.io)
- [ ] DosWallet GraphQL endpoint accessible
- [ ] Fetch hijack script running di console
- [ ] myTransactions query berhasil executed
- [ ] **HASIL: Array transactions TIDAK kosong**
- [ ] Transactions shown belong to user_id=1 in DosWallet
- [ ] Amount, type, description terlihat dengan benar

---

## 📞 Need Help?

Jika masih ada issue:
1. Screenshot hasil query
2. Copy error message (jika ada)
3. Share DosWallet logs:
   ```bash
   docker logs doswallet-transaction-service --tail 50
   ```

---

**Created:** 2026-01-09  
**Purpose:** Manual testing FDS-DosWallet GraphQL integration  
**Status:** Ready to test
