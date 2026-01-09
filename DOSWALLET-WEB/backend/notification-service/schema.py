"""
Notification Service GraphQL Schema
"""
import graphene
from graphene import ObjectType, String, Int, Field, List, Boolean
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))
from auth import verify_token, get_token_from_request
from models import Notification

class NotificationType(ObjectType):
    notification_id = Int()
    user_id = Int()
    message = String()
    date = String()
    read_status = Boolean()

class Query(ObjectType):
    my_notifications = List(NotificationType, limit=Int(), offset=Int(), unread_only=Boolean())
    notification = Field(NotificationType, notification_id=Int(required=True))
    unread_count = Int()
    
    def resolve_my_notifications(self, info, limit=50, offset=0, unread_only=False):
        """Get current user's notifications"""
        token = get_token_from_request()
        if not token:
            return []
        
        payload = verify_token(token)
        if not payload:
            return []
        
        return Notification.get_by_user_id(payload['user_id'], limit, offset, unread_only)
    
    def resolve_notification(self, info, notification_id):
        """Get notification by ID"""
        return Notification.get_by_id(notification_id)
    
    def resolve_unread_count(self, info):
        """Get unread notification count"""
        token = get_token_from_request()
        if not token:
            return 0
        
        payload = verify_token(token)
        if not payload:
            return 0
        
        return Notification.get_unread_count(payload['user_id'])

class CreateNotification(graphene.Mutation):
    class Arguments:
        user_id = Int(required=True)
        message = String(required=True)
    
    Output = NotificationType
    
    def mutate(self, info, user_id, message):
        """Create a notification"""
        notification_id = Notification.create(user_id, message)
        return Notification.get_by_id(notification_id)

class MarkAsRead(graphene.Mutation):
    class Arguments:
        notification_id = Int(required=True)
    
    Output = NotificationType
    
    def mutate(self, info, notification_id):
        """Mark notification as read"""
        Notification.mark_as_read(notification_id)
        return Notification.get_by_id(notification_id)

class MarkAllAsRead(graphene.Mutation):
    Output = Boolean
    
    def mutate(self, info):
        """Mark all notifications as read"""
        token = get_token_from_request()
        if not token:
            raise Exception("Authentication required")
        
        payload = verify_token(token)
        if not payload:
            raise Exception("Invalid token")
        
        Notification.mark_all_as_read(payload['user_id'])
        return True

class Mutation(ObjectType):
    create_notification = CreateNotification.Field()
    mark_as_read = MarkAsRead.Field()
    mark_all_as_read = MarkAllAsRead.Field()

schema = graphene.Schema(query=Query, mutation=Mutation)

