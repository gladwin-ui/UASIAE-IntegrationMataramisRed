"""
Notification Service Models
"""
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))
from database import execute_query

class Notification:
    @staticmethod
    def create(user_id, message):
        """Create a new notification"""
        query = """
            INSERT INTO notifications (user_id, message, read_status)
            VALUES (%s, %s, FALSE)
        """
        notification_id = execute_query(query, (user_id, message))
        return notification_id
    
    @staticmethod
    def get_by_id(notification_id):
        """Get notification by ID"""
        query = "SELECT * FROM notifications WHERE notification_id = %s"
        return execute_query(query, (notification_id,), fetch_one=True)
    
    @staticmethod
    def get_by_user_id(user_id, limit=50, offset=0, unread_only=False):
        """Get notifications by user ID"""
        if unread_only:
            query = """
                SELECT * FROM notifications 
                WHERE user_id = %s AND read_status = FALSE
                ORDER BY date DESC
                LIMIT %s OFFSET %s
            """
        else:
            query = """
                SELECT * FROM notifications 
                WHERE user_id = %s
                ORDER BY date DESC
                LIMIT %s OFFSET %s
            """
        return execute_query(query, (user_id, limit, offset), fetch_all=True)
    
    @staticmethod
    def mark_as_read(notification_id):
        """Mark notification as read"""
        query = "UPDATE notifications SET read_status = TRUE WHERE notification_id = %s"
        execute_query(query, (notification_id,))
        return True
    
    @staticmethod
    def mark_all_as_read(user_id):
        """Mark all notifications as read for a user"""
        query = "UPDATE notifications SET read_status = TRUE WHERE user_id = %s"
        execute_query(query, (user_id,))
        return True
    
    @staticmethod
    def get_unread_count(user_id):
        """Get count of unread notifications"""
        query = """
            SELECT COUNT(*) as count FROM notifications 
            WHERE user_id = %s AND read_status = FALSE
        """
        result = execute_query(query, (user_id,), fetch_one=True)
        return result['count'] if result else 0

