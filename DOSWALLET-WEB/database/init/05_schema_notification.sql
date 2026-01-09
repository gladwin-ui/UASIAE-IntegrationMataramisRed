-- 05_schema_notification.sql
USE doswallet_notification_db;

CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_status BOOLEAN DEFAULT FALSE,
    INDEX idx_user_id (user_id),
    INDEX idx_read_status (read_status)
);
