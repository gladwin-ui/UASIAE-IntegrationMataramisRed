-- migrate_notifications.sql
-- FIXED KEYWORD ERROR

INSERT INTO doswallet_notification_db.notifications (notification_id, user_id, message, date, read_status)
SELECT notification_id, user_id, message, date, read_status FROM doswallet.notifications
ON DUPLICATE KEY UPDATE message=VALUES(message), read_status=VALUES(read_status), date=VALUES(date);

SELECT 'notifications_migrated' AS status, COUNT(1) AS total_migrated FROM doswallet_notification_db.notifications;