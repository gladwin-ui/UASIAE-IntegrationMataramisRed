# 🚀 STEP-BY-STEP: Test DosWallet GraphQL (PASTI BERHASIL!)

> **VERIFIED WORKING** - Ikuti langkah ini PERSIS seperti yang tertulis!

---

## ⚠️ PENTING: FAQ Error yang Sering Muncul

### **1. Error: "favicon.ico 401 UNAUTHORIZED"**
**JAWABAN: ABAIKAN! Ini NORMAL!**  
Browser otomatis coba load favicon icon. Error ini TIDAK mempengaruhi query Anda.

### **2. myTransactions return `[]` (kosong)**
**PENYEBAB:** Token Authorization BELUM di-inject!  
**SOLUSI:** Pastikan jalankan fetch hijack script (langkah 3 di bawah) SEBELUM klik Execute!

---

## 📋 LANGKAH TESTING (Copy-Paste Satu Per Satu!)

### **LANGKAH 1: Login di FDS - Get Token** 🔐

1. **Buka tab baru** di browser → http://localhost:4001/graphql

2. **Paste query ini** di panel kiri:
```graphql
mutation {
  login(email: "customer1@example.com", password: "password") {
    token
  }
}
```

3. **Klik tombol Execute** (▶️ atau Ctrl+Enter)

4. **COPY TOKEN** dari hasil response (string panjang yang dimulai `eyJ...`)

**Contoh hasil:**
```json
{
  "data": {
    "login": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjdXN0b21lcjFAZXhhbXBsZS5jb20iLCJyb2xlIjoiQ1VTVE9NRVIiLCJpZCI6NSwiZXhwIjoxNzY3OTIxNjc2fQ.MhjQ0ZDo6MIFAzhBgmE2ux6dGE4mIeugA2cLmEfjBi0"
    }
  }
}
```

✅ **SAVE TOKEN INI!** Copy ke Notepad/TextEdit untuk langkah berikutnya.

---

### **LANGKAH 2: Buka DosWallet GraphQL** 🏦

1. **Buka tab baru** → http://localhost:5003/graphql

2. Anda akan lihat GraphiQL interface (versi lama tanpa header panel)

---

### **LANGKAH 3: Inject Token via Browser Console** 🔧

**INI LANGKAH PALING PENTING!** Jika skip, query akan return empty!

1. **Buka DevTools:**
   - **Windows/Linux:** Tekan `F12` atau `Ctrl+Shift+I`
   - **Mac:** Tekan `Cmd+Option+I`

2. **Klik tab "Console"** di bagian atas DevTools

3. **PASTE CODE INI** (ganti `YOUR_TOKEN_HERE` dengan token dari Langkah 1):

```javascript
// PASTE TOKEN ANDA DI BARIS BERIKUT:
const FDS_TOKEN = "YOUR_TOKEN_HERE";

// Check jika sudah hijacked untuk prevent recursion
if (!window._fetchHijacked) {
  window._originalFetch = window.fetch;
  window._fetchHijacked = true;

  window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : input.url;
    
    // Skip favicon, hanya inject di GraphQL requests
    if (!url.includes('favicon') && (url.includes('/graphql') || url === '/graphql')) {
      init = init || {};
      init.headers = init.headers || {};
      
      if (init.headers instanceof Headers) {
        init.headers.set('Authorization', 'Bearer ' + FDS_TOKEN);
      } else {
        init.headers['Authorization'] = 'Bearer ' + FDS_TOKEN;
      }
      
      console.log('🔐 Authorization header added!');
    }
    
    return window._originalFetch(input, init);
  };

  console.log("✅ Fetch hijacked! Token will be sent with all GraphQL requests.");
  console.log("🔑 Token preview:", FDS_TOKEN.substring(0, 30) + "...");
} else {
  console.log("⚠️ Already hijacked. If you want to update token, reload page first.");
}
```

4. **Tekan Enter**

5. **Verify di console:**
   - ✅ Harus muncul: `"✅ Fetch hijacked! Token will be sent with all GraphQL requests."`
   - ✅ Harus muncul: `"🔑 Token preview: eyJhbGciOiJIUzI1NiIsInR5cCI6..."`

**JIKA TIDAK MUNCUL:** Coba reload page (F5) dan ulangi dari awal!

---

### **LANGKAH 4: Run Query myTransactions** 📊

1. **Klik di panel query** (sebelah kiri) di GraphiQL

2. **Clear semua**, lalu paste:
```graphql
query {
  myTransactions(limit: 5) {
    transaction_id
    user_id
    amount
    type
    description
    status
  }
}
```

3. **Klik Execute** (▶️ tombol)

4. **Lihat hasil** di panel kanan

---

## ✅ HASIL YANG BENAR

Jika berhasil, Anda akan lihat:

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

**Total:** Harus ada 10 transaksi untuk customer1@example.com

---

## ❌ TROUBLESHOOTING - Jika Masih Kosong

### **Problem 1: Return `{"data": {"myTransactions": []}}`**

**CEK 1:** Apakah script console sudah dijalankan?
- Cek di console, harus ada message: `"✅ Fetch hijacked!"`
- Jika tidak ada, ulangi Langkah 3

**CEK 2:** Apakah token sudah expired?
- Token valid 24 jam
- Jika sudah lebih dari 24 jam, login ulang (Langkah 1) untuk get token baru

**CEK 3:** Cek browser console untuk melihat apakah ada error lain
- Buka tab Console
- Lihat ada error merah selain favicon.ico

---

### **Problem 2: Error "Fetch already hijacked"**

**SOLUSI:**
1. Reload page (F5)
2. Ulangi Langkah 3 dengan token fresh

---

### **Problem 3: Console bilang "Authorization header added!" tapi tetap kosong**

**CEK Database:**
Jalankan command ini di terminal untuk verify data ada:

```bash
docker exec doswallet-mysql mysql -uroot -pdoswallet123 doswallet_transaction_db \\
  -e "SELECT COUNT(*) as total FROM transactions t \\
      JOIN doswallet_user_db.users u ON t.user_id = u.user_id \\
      WHERE u.email = 'customer1@example.com';"
```

Expected: Harus return `total: 10`

**Jika database kosong**, create order baru di FDS dan pay dengan DosWallet untuk create transaction!

---

## 🔍 Verify Fix Sudah Deployed

Cek apakah fix sudah active di container:

```bash
# Cek SECRET_KEY
docker exec doswallet-transaction-service python3 -c \\
  "import os; print('JWT_SECRET:', os.getenv('JWT_SECRET', 'NOT_SET')[:30])"

# Expected: "JWT_SECRET: kunci_rahasia_project_ini_h..."
```

Jika masih `doswallet-secret-key...`, restart service:
```bash
cd /Users/rayyyhann/Documents/UASIAE/DOSWALLET-WEB
docker-compose restart dw-transaction-service
```

---

## 💡 Tips Sukses

1. **SELALU jalankan fetch hijack script SEBELUM execute query!**
2. Ignore error favicon.ico 401 - itu normal!
3. Token valid 24 jam, setelah itu login ulang
4. Jika masih bingung, reload page dan start from scratch
5. Pastikan Docker containers all running (`docker ps`)

---

## 🎯 Checklist Sukses

Beri checkmark saat berhasil:

- [ ] Login di FDS berhasil, token di-copy
- [ ] Buka http://localhost:5003/graphql
- [ ] Buka DevTools Console (F12)
- [ ] Fetch hijack script berhasil run (ada ✅ message)
- [ ] Query myTransactions executed
- [ ] Hasil menunjukkan array of transactions (BUKAN empty!)
- [ ] Ignore error favicon.ico 401

---

**Jika semua checklist ✅, SELAMAT! Integration berhasil!** 🎉

**Still having issues?** Screenshot:
1. Console output (after running hijack script)
2. Query result panel
3. Kirim ke saya untuk debug lebih lanjut!
