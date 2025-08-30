from django.db import models
from django.conf import settings


class Notification(models.Model):
    """
    Notification model for real-time notifications using Supabase
    """
    NOTIFICATION_TYPES = [
        ('follow', 'Follow'),
        ('like', 'Like'),
        ('comment', 'Comment'),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications_received'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications_sent'
    )
    notification_type = models.CharField(
        max_length=10,
        choices=NOTIFICATION_TYPES
    )
    post = models.ForeignKey(
        'posts.Post',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="Related post for post-specific notifications"
    )
    message = models.CharField(max_length=200)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['is_read']),
            models.Index(fields=['notification_type']),
        ]

    def __str__(self):
        return f"Notification for @{self.recipient.username}: {self.message}"

    @classmethod
    def create_follow_notification(cls, follower, following):
        """Create a notification when someone follows a user."""
        message = f"@{follower.username} started following you"
        return cls.objects.create(
            recipient=following,
            sender=follower,
            notification_type='follow',
            message=message
        )

    @classmethod
    def create_like_notification(cls, user, post):
        """Create a notification when someone likes a post."""
        if user != post.author:  # Don't notify if user likes their own post
            message = f"@{user.username} liked your post"
            return cls.objects.create(
                recipient=post.author,
                sender=user,
                notification_type='like',
                post=post,
                message=message
            )

    @classmethod
    def create_comment_notification(cls, user, post, comment_content):
        """Create a notification when someone comments on a post."""
        if user != post.author:  # Don't notify if user comments on their own post
            message = f"@{user.username} commented on your post"
            return cls.objects.create(
                recipient=post.author,
                sender=user,
                notification_type='comment',
                post=post,
                message=message
            )
