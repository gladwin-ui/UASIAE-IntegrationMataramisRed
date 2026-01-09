# 🚀 Sequence untuk Menjalankan DOSWALLET Web

Dokumen ini berisi langkah-langkah urut untuk menjalankan project DOSWALLET Web.

## 📋 Prerequisites

Pastikan sudah terinstall:
- **Docker Desktop** (untuk opsi Docker) ATAU
- **Python 3.8+**, **Node.js 16+**, **MySQL 8.0+** (untuk opsi manual)
- **Git** (jika clone dari repository)

---

## 🐳 OPSI 1: Menggunakan Docker (RECOMMENDED - Paling Mudah)

### Langkah 1: Pastikan Docker Desktop Berjalan
- Buka **Docker Desktop** di Windows
- Tunggu sampai status menunjukkan "Docker Desktop is running"

### Langkah 2: Jalankan Database & Backend Services
```bash
# Masuk ke folder DOSWALLET
cd DOSWALLET

# Jalankan semua services (MySQL + 4 microservices)
docker-compose up --build
```

**Apa yang terjadi:**
- MySQL container akan dibuat dan database diinisialisasi otomatis
- 4 microservices akan di-build dan dijalankan:
  - User Service (Port 5001)
  - Wallet Service (Port 5002)
  - Transaction Service (Port 5003)
  - Notification Service (Port 5004)

**Tunggu sampai semua service menunjukkan status "healthy" atau "started"**

### Langkah 3: Verifikasi Backend Services
Buka browser dan cek:
- User Service: http://localhost:5001/graphql
- Wallet Service: http://localhost:5002/graphql
- Transaction Service: http://localhost:5003/graphql
- Notification Service: http://localhost:5004/graphql

Jika GraphQL Playground muncul, berarti backend sudah siap!

### Langkah 4: Setup Frontend Web
Buka **terminal baru** (biarkan Docker berjalan di terminal pertama):

```bash
# Masuk ke folder frontend-web
cd DOSWALLET/frontend-web

# Install dependencies (hanya pertama kali)
npm install

# Jalankan development server
npm run dev
```

### Langkah 5: Akses Aplikasi
- Frontend Web akan berjalan di: **http://localhost:5173** (atau port yang ditampilkan di terminal)
- Buka browser dan akses URL tersebut

---

## 🔧 OPSI 2: Manual Setup (Tanpa Docker)

### Langkah 1: Setup Database MySQL

#### Opsi A: Menggunakan Docker untuk MySQL saja
```bash
# Jalankan hanya MySQL container
docker-compose up mysql -d
```

#### Opsi B: Install MySQL Manual
1. Install MySQL 8.0+ di Windows
2. Start MySQL service
3. Login ke MySQL:
```bash
mysql -u root -p
```

4. Jalankan init scripts (dalam urutan):
```sql
source database/init/01_create_databases_and_users.sql;
source database/init/02_schema_user.sql;
source database/init/03_schema_wallet.sql;
source database/init/04_schema_transaction.sql;
source database/init/05_schema_notification.sql;
```

### Langkah 2: Setup Backend Services

#### Setup Shared Utilities
```bash
cd DOSWALLET/backend/shared
pip install -r ../user-service/requirements.txt
```

#### Jalankan Semua Services

**Opsi A: Menggunakan Script Batch (Windows)**
```bash
cd DOSWALLET/backend
start_all_services.bat
```

**Opsi B: Manual (4 Terminal Terpisah)**

**Terminal 1 - User Service:**
```bash
cd DOSWALLET/backend/user-service
pip install -r requirements.txt
python app.py
```
Service berjalan di: http://localhost:5001

**Terminal 2 - Wallet Service:**
```bash
cd DOSWALLET/backend/wallet-service
pip install -r requirements.txt
python app.py
```
Service berjalan di: http://localhost:5002

**Terminal 3 - Transaction Service:**
```bash
cd DOSWALLET/backend/transaction-service
pip install -r requirements.txt
python app.py
```
Service berjalan di: http://localhost:5003

**Terminal 4 - Notification Service:**
```bash
cd DOSWALLET/backend/notification-service
pip install -r requirements.txt
python app.py
```
Service berjalan di: http://localhost:5004

### Langkah 3: Setup Frontend Web
```bash
cd DOSWALLET/frontend-web
npm install
npm run dev
```

### Langkah 4: Akses Aplikasi
- Buka browser: **http://localhost:5173**

---

## 📊 Checklist Urutan Eksekusi

### Untuk Docker Setup:
- [ ] Docker Desktop berjalan
- [ ] `docker-compose up --build` berhasil
- [ ] Semua 4 backend services healthy
- [ ] `npm install` di frontend-web
- [ ] `npm run dev` di frontend-web
- [ ] Browser bisa akses http://localhost:5173

### Untuk Manual Setup:
- [ ] MySQL berjalan dan database ter-setup
- [ ] User Service berjalan (port 5001)
- [ ] Wallet Service berjalan (port 5002)
- [ ] Transaction Service berjalan (port 5003)
- [ ] Notification Service berjalan (port 5004)
- [ ] Frontend Web berjalan (port 5173)

---

## 🛑 Cara Menghentikan Services

### Docker:
```bash
# Tekan Ctrl+C di terminal docker-compose
# Atau:
docker-compose down
```

### Manual:
- Tutup semua terminal yang menjalankan services
- Atau tekan `Ctrl+C` di masing-masing terminal

---

## 🔍 Troubleshooting

### Backend tidak bisa connect ke database:
- Pastikan MySQL berjalan
- Cek kredensial di environment variables
- Untuk Docker: pastikan container MySQL healthy

### Port sudah digunakan:
- Cek port yang digunakan: `netstat -ano | findstr :5001`
- Hentikan process yang menggunakan port tersebut
- Atau ubah port di konfigurasi service

### Frontend tidak bisa connect ke backend:
- Pastikan semua backend services berjalan
- Cek URL di `frontend-web/src/services/apollo.js`
- Pastikan CORS settings di backend mengizinkan origin frontend

### Error "Module not found":
- Jalankan `npm install` ulang di folder frontend-web
- Untuk backend: `pip install -r requirements.txt` di setiap service

---

## 📝 Catatan Penting

1. **Database**: Jika menggunakan Docker, database akan otomatis dibuat saat pertama kali run. Jika manual, pastikan sudah menjalankan init scripts.

2. **Environment Variables**: Untuk manual setup, mungkin perlu membuat file `.env` di setiap service dengan konfigurasi database.

3. **Ports yang Digunakan**:
   - MySQL: 3310 (Docker) atau 3306 (Manual)
   - User Service: 5001
   - Wallet Service: 5002
   - Transaction Service: 5003
   - Notification Service: 5004
   - Frontend Web: 5173 (default Vite)

4. **Urutan Penting**: Database harus berjalan SEBELUM backend services. Backend services harus berjalan SEBELUM frontend.

---

## ✅ Verifikasi Akhir

Setelah semua berjalan, test dengan:
1. Buka http://localhost:5173
2. Coba register user baru
3. Coba login
4. Cek apakah wallet balance muncul

Jika semua berhasil, project sudah siap digunakan! 🎉




