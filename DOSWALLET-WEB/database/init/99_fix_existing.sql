-- 99_fix_existing.sql
-- Ensure per-service DB users exist and have privileges (safe to run against an existing MySQL instance)

-- User Service
CREATE USER IF NOT EXISTS 'dos_user'@'%' IDENTIFIED BY 'dos_user_pass';
ALTER USER 'dos_user'@'%' IDENTIFIED BY 'dos_user_pass';
GRANT ALL PRIVILEGES ON doswallet_user_db.* TO 'dos_user'@'%';

-- Wallet Service
CREATE USER IF NOT EXISTS 'dos_wallet'@'%' IDENTIFIED BY 'dos_wallet_pass';
ALTER USER 'dos_wallet'@'%' IDENTIFIED BY 'dos_wallet_pass';
GRANT ALL PRIVILEGES ON doswallet_wallet_db.* TO 'dos_wallet'@'%';

-- Transaction Service
CREATE USER IF NOT EXISTS 'dos_tx'@'%' IDENTIFIED BY 'dos_tx_pass';
ALTER USER 'dos_tx'@'%' IDENTIFIED BY 'dos_tx_pass';
GRANT ALL PRIVILEGES ON doswallet_transaction_db.* TO 'dos_tx'@'%';

-- Notification Service
CREATE USER IF NOT EXISTS 'dos_notify'@'%' IDENTIFIED BY 'dos_notify_pass';
ALTER USER 'dos_notify'@'%' IDENTIFIED BY 'dos_notify_pass';
GRANT ALL PRIVILEGES ON doswallet_notification_db.* TO 'dos_notify'@'%';

FLUSH PRIVILEGES;
