-- 01_create_databases_and_users.sql

-- Create per-service databases
CREATE DATABASE IF NOT EXISTS doswallet_user_db;
CREATE DATABASE IF NOT EXISTS doswallet_wallet_db;
CREATE DATABASE IF NOT EXISTS doswallet_transaction_db;
CREATE DATABASE IF NOT EXISTS doswallet_notification_db;

-- Create per-service users and grant them access only to their DB
CREATE USER IF NOT EXISTS 'dos_user'@'%' IDENTIFIED BY 'dos_user_pass';
GRANT ALL PRIVILEGES ON doswallet_user_db.* TO 'dos_user'@'%';

CREATE USER IF NOT EXISTS 'dos_wallet'@'%' IDENTIFIED BY 'dos_wallet_pass';
GRANT ALL PRIVILEGES ON doswallet_wallet_db.* TO 'dos_wallet'@'%';

CREATE USER IF NOT EXISTS 'dos_tx'@'%' IDENTIFIED BY 'dos_tx_pass';
GRANT ALL PRIVILEGES ON doswallet_transaction_db.* TO 'dos_tx'@'%';

CREATE USER IF NOT EXISTS 'dos_notify'@'%' IDENTIFIED BY 'dos_notify_pass';
GRANT ALL PRIVILEGES ON doswallet_notification_db.* TO 'dos_notify'@'%';

FLUSH PRIVILEGES;
