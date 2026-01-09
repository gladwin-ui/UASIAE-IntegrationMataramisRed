# Cypress E2E Testing - Food Delivery System

## 📋 Overview

Cypress E2E testing untuk Food Delivery System, fokus pada user flow: **Pemesanan & Cek Order**.

## 🚀 Setup

### 1. Install Dependencies

```bash
cd 3-frontend
npm install
```

Cypress sudah terinstall sebagai dev dependency.

### 2. Struktur Folder

```
cypress/
├── e2e/
│   ├── 01-authentication.cy.js      # TC-001, TC-002, TC-003, TC-015
│   ├── 02-restaurant-browsing.cy.js # TC-004, TC-005, TC-006
│   ├── 03-order-flow.cy.js          # TC-007 to TC-014
│   └── 04-non-functional.cy.js     # TC-016 to TC-023
├── fixtures/
│   └── users.json                  # Test user data (customer1)
├── support/
│   ├── commands.js                 # Custom Cypress commands
│   └── e2e.js                      # Support file
└── README.md
```

## 🎯 Menjalankan Tests

### Open Cypress Test Runner (Interactive - Recommended)

```bash
npm run cy:open
```

Ini akan membuka Cypress Test Runner GUI dimana Anda bisa:
- Memilih test file yang ingin dijalankan
- Melihat test berjalan secara real-time
- Debug test dengan mudah

### Run All Tests (Headless)

```bash
npm run cy:run
```

### Run All Tests (Headed - dengan browser visible)

```bash
npm run cy:run:headed
```

### Run Specific Test File

```bash
npx cypress run --spec "cypress/e2e/01-authentication.cy.js"
```

## ⚙️ Prerequisites

Sebelum menjalankan tests, pastikan:

1. **Backend Services Running:**
   ```bash
   # Pastikan semua services running
   # API Gateway: http://localhost:3000
   # User Service: http://localhost:3001
   # Restaurant Service: http://localhost:3002
   # Order Service: http://localhost:3003
   # Payment Service: http://localhost:3004
   # Driver Service: http://localhost:3005
   ```

2. **Frontend Running:**
   ```bash
   cd 3-frontend
   npm run dev
   # Frontend: http://localhost:5173
   ```

3. **Database Initialized:**
   - Semua database harus ter-initialize dengan data sample
   - Test user harus sudah terdaftar: `customer1@example.com` / `Password123!`

## 📝 Test Cases Coverage

### Functional Tests (15 test cases)
- ✅ TC-001: User Registration
- ✅ TC-002: User Login (Valid)
- ✅ TC-003: User Login (Invalid)
- ✅ TC-004: Browse Restaurants
- ✅ TC-005: Filter Restaurants
- ✅ TC-006: View Restaurant Detail
- ✅ TC-007: Add to Cart
- ✅ TC-008: Update Cart Quantity
- ✅ TC-009: Remove from Cart
- ✅ TC-010: Create Order
- ✅ TC-011: Simulate Payment
- ✅ TC-012: View Order List
- ✅ TC-013: View Order Detail
- ✅ TC-014: Order Status Updates
- ✅ TC-015: Logout

### Non-Functional Tests (8 test cases)
- ✅ TC-016: Page Load Performance
- ✅ TC-017: API Response Time
- ✅ TC-018: Responsive Design (Mobile)
- ✅ TC-019: Responsive Design (Tablet) - Manual testing
- ✅ TC-020: Error Handling (Network)
- ✅ TC-021: Error Handling (Invalid Input)
- ✅ TC-022: Loading States
- ✅ TC-023: Browser Compatibility - Manual testing

## 🔧 Configuration

Edit `cypress.config.js` untuk mengubah:
- **Base URL:** `http://localhost:5173` (Frontend)
- **Viewport size:** 1920x1080 (default)
- **Timeout settings:** 10 seconds
- **Video/Screenshot:** Enabled

## 📊 Test Results

Setelah menjalankan tests, hasil akan tersimpan di:
- **Videos:** `cypress/videos/` (jika test fail)
- **Screenshots:** `cypress/screenshots/` (jika test fail)
- **Reports:** Console output

## 🐛 Troubleshooting

### Tests Failing?

1. **Check Backend Services:**
   ```bash
   # Pastikan semua services running
   curl http://localhost:3000/api/restaurants
   ```

2. **Check Frontend:**
   ```bash
   # Pastikan frontend running
   curl http://localhost:5173
   ```

3. **Check Test Data:**
   - Pastikan test user sudah terdaftar: `customer1@example.com` / `Password123!`
   - Pastikan ada restaurant dan menu items di database
   - Pastikan ada minimal 1 restaurant dengan ID 1

4. **Clear Browser Data:**
   ```javascript
   // Di Cypress, gunakan:
   cy.clearAuth();
   cy.clearCookies();
   cy.clearLocalStorage();
   ```

5. **Check Selectors:**
   - Jika test gagal karena selector tidak ditemukan, periksa struktur HTML
   - Gunakan Cypress Test Runner untuk inspect element
   - Update selector di test file jika perlu

### Common Issues

**Issue: "Element not found"**
- **Solution:** Periksa apakah element benar-benar ada di halaman
- Gunakan `cy.wait()` untuk menunggu element muncul
- Periksa apakah ada loading state yang perlu ditunggu

**Issue: "Test timeout"**
- **Solution:** Increase timeout di `cypress.config.js` atau per test
- Pastikan backend services responsive
- Check network requests di Cypress Test Runner

**Issue: "API request failed"**
- **Solution:** Pastikan semua backend services running
- Check API Gateway URL di `cypress.config.js`
- Verify JWT token masih valid

## 📚 Test Data

### Test User (from database init)
- **Email:** `customer1@example.com`
- **Password:** `Password123!`
- **Name:** `Customer One`
- **Phone:** `081234567893`
- **Role:** `CUSTOMER`

### Fixtures
File `cypress/fixtures/users.json` berisi:
- `customer1`: User data untuk testing
- `invalidUser`: Invalid credentials untuk negative testing
- `newUser`: New user data untuk registration testing

## 🎓 Best Practices

1. **Run tests in interactive mode first** untuk memahami flow
2. **Check test results** di Cypress Test Runner
3. **Update selectors** jika UI berubah
4. **Add waits** untuk async operations
5. **Use fixtures** untuk test data
6. **Clean up** setelah setiap test (clearAuth, clearCookies)

## 📚 Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Test Cases Document](../../docs/TEST_CASES.md)

## 👤 Author

Muhammad Rayhan Ramadhan

---

**Last Updated:** 2024

