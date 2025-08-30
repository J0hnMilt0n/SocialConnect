from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.conf import settings
import logging

from social.models import Follow, Like, Comment
from .models import Notification

logger = logging.getLogger('socialconnect')


@receiver(post_save, sender=Follow)
def create_follow_notification(sender, instance, created, **kwargs):
    """Create notification when someone follows a user."""
    if created:
        try:
            Notification.create_follow_notification(
                instance.follower, 
                instance.following
            )
            logger.info(f"Follow notification created: {instance.follower} -> {instance.following}")
        except Exception as e:
            logger.error(f"Error creating follow notification: {e}")


@receiver(post_save, sender=Like)
def create_like_notification(sender, instance, created, **kwargs):
    """Create notification when someone likes a post."""
    if created:
        try:
            Notification.create_like_notification(
                instance.user, 
                instance.post
            )
            logger.info(f"Like notification created: {instance.user} liked {instance.post}")
        except Exception as e:
            logger.error(f"Error creating like notification: {e}")


@receiver(post_save, sender=Comment)
def create_comment_notification(sender, instance, created, **kwargs):
    """Create notification when someone comments on a post."""
    if created:
        try:
            Notification.create_comment_notification(
                instance.author, 
                instance.post, 
                instance.content
            )
            logger.info(f"Comment notification created: {instance.author} commented on {instance.post}")
        except Exception as e:
            logger.error(f"Error creating comment notification: {e}")


# Optional: Supabase Real-time integration
def send_realtime_notification(notification):
    """
    Send notification to Supabase Real-time.
    This function should be called after a notification is created.
    """
    try:
        if hasattr(settings, 'SUPABASE_URL') and settings.SUPABASE_URL:
            # Import Supabase client here to avoid import errors if not configured
            from supabase import create_client
            
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            
            # Insert notification into Supabase table for real-time updates
            notification_data = {
                'recipient_id': notification.recipient.id,
                'sender_id': notification.sender.id,
                'notification_type': notification.notification_type,
                'message': notification.message,
                'post_id': notification.post.id if notification.post else None,
                'is_read': notification.is_read,
                'created_at': notification.created_at.isoformat(),
            }
            
            # Insert into Supabase notifications table
            result = supabase.table('realtime_notifications').insert(notification_data).execute()
            logger.info(f"Real-time notification sent: {result}")
            
    except Exception as e:
        logger.error(f"Error sending real-time notification: {e}")


@receiver(post_save, sender=Notification)
def handle_notification_created(sender, instance, created, **kwargs):
    """Handle notification creation for real-time updates."""
    if created:
        # Send to Supabase Real-time (optional)
        send_realtime_notification(instance)