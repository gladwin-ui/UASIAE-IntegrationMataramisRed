# Setup Database DosWallet (Per-Service Databases)

## 🚀 Ringkasan Singkat
Untuk mengurangi blast radius dan meningkatkan isolasi, kita menggunakan *one MySQL server* namun membuat **satu database per service** (User, Wallet, Transaction, Notification). Init scripts otomatis membuat database, users, dan schema ketika MySQL container pertama kali berjalan.

## Cara cepat (Docker Compose)
1. Pastikan `docker-compose.yml` sudah diperbarui (compose akan mount `./database/init` ke `/docker-entrypoint-initdb.d`).
2. Jalankan:

```bash
docker-compose up -d
```

Init scripts akan:
- Membuat database:
  - `doswallet_user_db`
  - `doswallet_wallet_db`
  - `doswallet_transaction_db`
  - `doswallet_notification_db`
- Membuat user per-service dan memberikan hak **HANYA** ke DB miliknya
- Membuat tabel schema di masing-masing DB

### Opsi 2: Menggunakan MySQL Workbench (GUI)

1. **Buka MySQL Workbench**
2. **Connect** ke MySQL server Anda
3. **File > Open SQL Script**
4. Pilih file `schema.sql`
5. Klik **Execute** (⚡ icon) atau tekan `Ctrl+Shift+Enter`

### Opsi 3: Menggunakan Command Line (Jika MySQL di PATH)

```bash
# Login ke MySQL
mysql -u root -p

# Di dalam MySQL, jalankan:
source database/schema.sql

# Atau copy-paste isi schema.sql langsung
```

### Opsi 4: Manual dengan XAMPP/WAMP

#### XAMPP:
1. Start **Apache** dan **MySQL** di XAMPP Control Panel
2. Buka **phpMyAdmin** (http://localhost/phpmyadmin)
3. Klik **New** untuk membuat database baru
4. Nama database: `doswallet`
5. Pilih database `doswallet`
6. Klik tab **SQL**
7. Copy-paste isi `schema.sql`
8. Klik **Go**

#### WAMP:
1. Start **WAMP** server
2. Buka **phpMyAdmin** (http://localhost/phpmyadmin)
3. Ikuti langkah yang sama seperti XAMPP

## Manual (MySQL Workbench / Command Line / XAMPP)

Jika Anda ingin menjalankan SQL manual atau dengan GUI, jalankan init scripts yang ada di `database/init` dalam urutan numerik:

```sql
source database/init/01_create_databases_and_users.sql;
source database/init/02_schema_user.sql;
source database/init/03_schema_wallet.sql;
source database/init/04_schema_transaction.sql;
source database/init/05_schema_notification.sql;
```

## 📋 Checklist Setup

- [ ] MySQL terinstall atau menggunakan Docker
- [ ] Docker Compose membuat semua DB dan users via `database/init`
- [ ] Tabel di masing-masing DB sudah dibuat
- [ ] Kredensial per-service dicatat untuk konfigurasi backend

## ⚠️ Troubleshooting & Tips

- Jika terjadi error `Access Denied`, jalankan perintah `SHOW GRANTS FOR 'dos_user'@'%';` untuk memverifikasi hak akses.
- Jika database sudah ada dari setup lama, gunakan `DROP DATABASE IF EXISTS <db_name>;` dan jalankan ulang init scripts pada environment testing.
- Periksa urutan file pada `./database/init` (MySQL mengeksekusi urutan alfabet).

## 🔧 Konfigurasi Backend

Setiap service membaca `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` dari environment. Contoh per-service env pada `docker-compose.yml` sudah disesuaikan.

Jika Anda menjalankan service lokal tanpa docker, set `.env` sesuai service yang sedang Anda jalankan (lihat contoh di file `backend/.env`).

## Mempertahankan responsifitas dan ketersediaan 🔧
- Gunakan connection pools (sudah ada) dan sesuaikan `DB_POOL_SIZE` per service jika perlu.
- Batasi pool size agar total koneksi tidak melebihi kapasitas MySQL.
- Untuk production, pertimbangkan resource limits pada container DB (CPU/memory) dan gunakan monitoring (Grafana/Prometheus).
- Load testing terlebih dahulu untuk menentukan **DB_POOL_SIZE** dan resource yang sesuai.

## ✅ Verifikasi Setup

Jalankan query ini untuk verifikasi per-service:

```sql
USE doswallet_user_db; SHOW TABLES;
USE doswallet_wallet_db; SHOW TABLES;
USE doswallet_transaction_db; SHOW TABLES;
USE doswallet_notification_db; SHOW TABLES;
```

## Migrasi data (dari single DB ke per-service DB) — langkah aman
1. **Backup** database lama (`doswallet`) terlebih dahulu.
2. Pilih urutan migrasi: **users → wallets → transactions → notifications**.
3. Ada helper otomatis untuk Windows dan Unix:
   - PowerShell: `powershell -ExecutionPolicy Bypass -File .\database\migration\run_all_migrations.ps1`
   - Bash: `./database/migration/run_all_migrations.sh` (chmod +x the file first)

   Helper akan:
   - Menjalankan `database/init/01_create_databases_and_users.sql` untuk membuat DB & user bila belum ada.
   - Menjalankan file SQL migrasi di `database/migration/` berurutan.
   - Menampilkan row counts per table untuk verifikasi.

   Jika Anda ingin menjalankan manual per-file, gunakan:
```powershell
Get-Content ".\database\migration\migrate_users.sql" -Raw | docker exec -i doswallet-mysql sh -c "mysql -u root -pdoswallet123"
```

Contoh manual (users):
```sql
INSERT INTO doswallet_user_db.users (user_id, name, email, phone, password, created_at, updated_at)
SELECT user_id, name, email, phone, password, created_at, updated_at FROM doswallet.users
ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), phone=VALUES(phone), password=VALUES(password), updated_at=VALUES(updated_at);
```

4. Verifikasi data dan hitung checksum/row count (contoh):
```sql
SELECT COUNT(1) FROM doswallet.users;
SELECT COUNT(1) FROM doswallet_user_db.users;
```

5. Sesuaikan `DB_POOL_SIZE` bila diperlukan pada `docker-compose.yml` dan restart service:
```bash
docker-compose restart user-service wallet-service transaction-service notification-service
```

6. Uji fungsional (register/login/transfer/smoke tests) dan monitor DB metrics.

---

## Rekomendasi default `DB_POOL_SIZE` (awal, sesuaikan berdasarkan load)
- user-service: 5
- wallet-service: 8
- transaction-service: 12
- notification-service: 3

**Pastikan** total pool size masih di bawah `max_connections` MySQL. Sesuaikan berdasarkan hasil load testing.

---

## Smoke tests (singkat)
1. API health:
```bash
curl -s http://localhost:5001/health
curl -s http://localhost:5002/health
```
2. Create user & login (GraphQL / REST call) — verifikasi entry di `doswallet_user_db.users`.
3. Create wallet/deposit/transfer — verifikasi relevant records in `doswallet_wallet_db` and `doswallet_transaction_db`.
4. Check notifications insertion in `doswallet_notification_db`.

If anything fails, check service logs with:
```bash
docker-compose logs <service> --tail=200
```

Selamat — Anda sekarang menggunakan desain *one service, one database* pada satu MySQL server dengan risiko yang lebih rendah dan kontrol per-service. 🎉

