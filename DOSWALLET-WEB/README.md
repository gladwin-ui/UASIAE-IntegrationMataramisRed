# DosWallet - E-Wallet Terintegrasi

Aplikasi mobile wallet berbasis React Native dengan backend microservices menggunakan Flask dan GraphQL. Database menggunakan MySQL.

## 🏗️ Arsitektur

Aplikasi ini menggunakan arsitektur **microservices** dengan 4 service terpisah:

1. **User Service** (Port 5001) - Manajemen user, registrasi, login
2. **Wallet Service** (Port 5002) - Manajemen saldo dan poin
3. **Transaction Service** (Port 5003) - Deposit, withdraw, transfer
4. **Notification Service** (Port 5004) - Sistem notifikasi

## 📋 Prerequisites

### Untuk Docker Setup (Recommended):
- **Docker Desktop** (Windows/Mac) atau **Docker Engine** (Linux)
- **Docker Compose**

### Untuk Manual Setup:
- **Python 3.8+**
- **Node.js 16+** dan **npm/yarn**
- **MySQL 8.0+**

## 🐳 Quick Start dengan Docker

**Cara termudah - hanya 1 command:**

```bash
docker-compose up --build
```

Selesai! Semua services (MySQL + 4 microservices) sudah berjalan.

**Lihat [DOCKER_SETUP.md](DOCKER_SETUP.md) untuk panduan lengkap.**

---

## 🚀 Setup Instructions (Manual)

### 1. Database Setup

```bash
# Login ke MySQL
mysql -u root -p

# Import schema
mysql -u root -p < database/schema.sql
```

Atau jalankan SQL secara manual:
```sql
CREATE DATABASE doswallet;
USE doswallet;
-- Copy paste isi dari database/schema.sql
```

### 2. Backend Setup

#### Setup Shared Utilities

```bash
cd backend/shared
pip install -r ../user-service/requirements.txt
```

#### Setup User Service

```bash
cd backend/user-service
pip install -r requirements.txt

# Copy .env.example ke .env dan sesuaikan konfigurasi
cp ../../.env.example .env

# Jalankan service
python app.py
```

Service akan berjalan di `http://localhost:5001`

#### Setup Wallet Service

```bash
cd backend/wallet-service
pip install -r requirements.txt

# Copy .env.example ke .env dan sesuaikan konfigurasi
cp ../../.env.example .env

# Jalankan service
python app.py
```

Service akan berjalan di `http://localhost:5002`

#### Setup Transaction Service

```bash
cd backend/transaction-service
pip install -r requirements.txt

# Copy .env.example ke .env dan sesuaikan konfigurasi
cp ../../.env.example .env

# Jalankan service
python app.py
```

Service akan berjalan di `http://localhost:5003`

#### Setup Notification Service

```bash
cd backend/notification-service
pip install -r requirements.txt

# Copy .env.example ke .env dan sesuaikan konfigurasi
cp ../../.env.example .env

# Jalankan service
python app.py
```

Service akan berjalan di `http://localhost:5004`

**Note:** Untuk development, jalankan semua service secara bersamaan di terminal terpisah.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Install Expo CLI jika belum
npm install -g expo-cli

# Jalankan aplikasi
npm start
# atau
expo start
```


## 📱 Frontend

Aplikasi DosWallet tersedia dalam 2 versi frontend:

### 1. React Native (Original)
- Lokasi: `frontend/`
- Menggunakan Apollo Client untuk GraphQL
- Expo framework

### 2. Android Native (Recommended)
- Lokasi: `android/`
- Menggunakan Kotlin
- OkHttp untuk GraphQL API calls
- Material Design Components
- **Lihat [ANDROID_SETUP.md](ANDROID_SETUP.md) untuk setup lengkap**

## 📱 Fitur Aplikasi

### Authentication
- ✅ Registrasi dengan email/phone
- ✅ Login dengan email atau phone number
- ✅ JWT Authentication
- ✅ Session management

### Wallet Management
- ✅ View balance dan points
- ✅ Real-time balance update
- ✅ Transaction history

### Transactions
- ✅ Deposit
- ✅ Withdraw
- ✅ Transfer antar pengguna
- ✅ QRIS Payment (placeholder)

### Notifications
- ✅ View notifications
- ✅ Mark as read
- ✅ Unread count

## 🎨 Theme

Aplikasi menggunakan tema **biru** dengan warna utama:
- Primary: `#1E88E5`
- Primary Dark: `#1976D2`
- Primary Light: `#42A5F5`
- Secondary: `#1565C0`

## 🔧 Konfigurasi

### Environment Variables

Buat file `.env` di setiap service dengan konfigurasi:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=doswallet

JWT_SECRET=your-secret-key

USER_SERVICE_PORT=5001
WALLET_SERVICE_PORT=5002
TRANSACTION_SERVICE_PORT=5003
NOTIFICATION_SERVICE_PORT=5004

CORS_ORIGINS=*
```

### Frontend API URLs

Edit `frontend/src/services/apollo.js` untuk mengubah URL service jika diperlukan:

```javascript
const USER_SERVICE_URL = 'http://localhost:5001/graphql';
const WALLET_SERVICE_URL = 'http://localhost:5002/graphql';
// ... dst
```


## 📊 Database Schema

### Tables

1. **users** - Data pengguna
2. **wallets** - Data wallet dan saldo
3. **transactions** - Riwayat transaksi
4. **notifications** - Notifikasi pengguna

Lihat `database/schema.sql` untuk detail lengkap.

## 🧪 Testing GraphQL

Setiap service memiliki GraphQL Playground di:
- User Service: `http://localhost:5001/graphql`
- Wallet Service: `http://localhost:5002/graphql`
- Transaction Service: `http://localhost:5003/graphql`
- Notification Service: `http://localhost:5004/graphql`

### Contoh Query

**Login:**
```graphql
mutation {
  login(input: {
    email: "user@example.com"
    password: "password123"
  }) {
    token
    user {
      user_id
      name
      email
    }
    message
  }
}
```

**Get Wallet:**
```graphql
query {
  myWallet {
    balance
    points
  }
}
```

**Headers untuk authenticated requests:**
```
Authorization: Bearer <your-token>
```

## 📁 Struktur Proyek

```
doswallet/
├── backend/
│   ├── shared/              # Shared utilities
│   │   ├── config.py       # Configuration
│   │   ├── database.py     # DB connection
│   │   └── auth.py         # JWT utilities
│   ├── user-service/       # User microservice
│   ├── wallet-service/     # Wallet microservice
│   ├── transaction-service/# Transaction microservice
│   └── notification-service/# Notification microservice
├── frontend/               # React Native app
│   ├── src/
│   │   ├── screens/        # App screens
│   │   ├── components/     # Reusable components
│   │   ├── navigation/     # Navigation setup
│   │   ├── services/       # API clients
│   │   └── theme/          # Theme colors
│   └── App.js
├── database/
│   └── schema.sql          # MySQL schema
└── README.md
```

## 🐛 Troubleshooting

### Backend Issues

1. **Database connection error:**
   - Pastikan MySQL berjalan
   - Cek kredensial di `.env`
   - Pastikan database `doswallet` sudah dibuat

2. **Port already in use:**
   - Ubah port di `.env` atau hentikan service yang menggunakan port tersebut

3. **Import errors:**
   - Pastikan semua dependencies terinstall
   - Pastikan path ke `shared` directory benar

### Frontend Issues

1. **Cannot connect to backend:**
   - Pastikan semua backend service berjalan
   - Cek firewall settings
   - Pastikan CORS settings di backend mengizinkan origin frontend

2. **GraphQL errors:**
   - Pastikan token JWT valid
   - Cek network requests di React Native debugger

## 🔐 Security Notes

- **JWT Secret:** Ganti `JWT_SECRET` di production dengan secret key yang kuat
- **Password:** Password disimpan dalam bentuk hash menggunakan bcrypt
- **CORS:** Sesuaikan `CORS_ORIGINS` untuk production

## 📝 TODO / Future Improvements

- [ ] Implementasi QRIS payment yang lengkap
- [x] Integrasi dengan Food Delivery System
- [ ] Push notifications
- [ ] Biometric authentication
- [ ] Transaction export (PDF/Excel)
- [ ] Multi-language support
- [ ] Unit tests dan integration tests

## 👥 Contributors

Dibuat untuk TUBES 2 EAI - Semester 5

## 📄 License

MIT License

