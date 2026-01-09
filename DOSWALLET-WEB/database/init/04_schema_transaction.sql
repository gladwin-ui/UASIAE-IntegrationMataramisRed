-- 04_schema_transaction.sql
USE doswallet_transaction_db;

CREATE TABLE IF NOT EXISTS transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(20) NOT NULL COMMENT 'deposit, withdraw, transfer',
    payment_method VARCHAR(50),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    receiver_id INT NULL,
    description TEXT,
    idempotency_key VARCHAR(100) DEFAULT NULL,
    status ENUM('pending','completed','failed') DEFAULT 'completed',
    qr_payload TEXT DEFAULT NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_date (date),
    INDEX idx_type (type),
    UNIQUE KEY unique_idempotency (idempotency_key)
);
