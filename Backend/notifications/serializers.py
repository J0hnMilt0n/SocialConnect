from rest_framework import serializers
from .models import Notification
from accounts.serializers import UserProfileSerializer


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications."""
    sender = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = Notification
        fields = (
            'id', 'sender', 'notification_type', 'post',
            'message', 'is_read', 'created_at'
        )
        read_only_fields = fields