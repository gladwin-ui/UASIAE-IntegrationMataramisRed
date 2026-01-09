-- migrate_wallets.sql
-- FIXED KEYWORD ERROR

INSERT INTO doswallet_wallet_db.wallets (wallet_id, user_id, balance, points, created_at, updated_at)
SELECT wallet_id, user_id, balance, points, created_at, updated_at FROM doswallet.wallets
ON DUPLICATE KEY UPDATE balance = VALUES(balance), points = VALUES(points), updated_at = VALUES(updated_at);

-- Ganti 'AS rows' menjadi 'AS total_migrated' agar tidak bentrok dengan keyword MySQL
SELECT 'wallets_migrated' AS status, COUNT(1) AS total_migrated FROM doswallet_wallet_db.wallets;