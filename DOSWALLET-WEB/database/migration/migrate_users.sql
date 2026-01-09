-- migrate_users.sql
-- FIXED VERSION
-- Copy users table from old `doswallet` DB into `doswallet_user_db`

SET @rows_before = (SELECT COUNT(1) FROM doswallet.users);

INSERT INTO doswallet_user_db.users (user_id, name, email, phone, password, created_at, updated_at)
SELECT user_id, name, email, phone, password, created_at, updated_at FROM doswallet.users
ON DUPLICATE KEY UPDATE
 name = VALUES(name), email = VALUES(email), phone = VALUES(phone), password = VALUES(password), updated_at = VALUES(updated_at);

-- PERBAIKAN: Ambil count-nya saja ke dalam variabel
SELECT COUNT(1) INTO @rows_after FROM doswallet_user_db.users;

-- Tampilkan status (opsional)
SELECT 'users_migrated' AS status, @rows_after AS row_count;

-- Bandingkan
SELECT @rows_before AS source_rows, @rows_after AS target_rows;