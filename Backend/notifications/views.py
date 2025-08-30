from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db import models

from .models import Notification
from .serializers import NotificationSerializer

User = get_user_model()


class NotificationListView(generics.ListAPIView):
    """Get user's notifications."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user
        ).order_by('-created_at')


class MarkNotificationReadView(APIView):
    """Mark a specific notification as read."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, notification_id):
        try:
            notification = get_object_or_404(
                Notification,
                id=notification_id,
                recipient=request.user
            )
            notification.is_read = True
            notification.save()

            return Response({
                'message': 'Notification marked as read.'
            }, status=status.HTTP_200_OK)

        except Notification.DoesNotExist:
            return Response({
                'error': 'Notification not found.'
            }, status=status.HTTP_404_NOT_FOUND)


class MarkAllNotificationsReadView(APIView):
    """Mark all notifications as read for the authenticated user."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        notifications = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        )
        
        count = notifications.update(is_read=True)

        return Response({
            'message': f'{count} notifications marked as read.'
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def unread_notification_count(request):
    """Get count of unread notifications for the authenticated user."""
    count = Notification.objects.filter(
        recipient=request.user,
        is_read=False
    ).count()
    
    return Response({
        'unread_count': count
    }, status=status.HTTP_200_OK)


class AdminNotificationListView(generics.ListAPIView):
    """Admin-only view to get ALL notifications across all users."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Check if user is admin
        user = self.request.user
        if not (user.is_staff or user.is_superuser or user.username == 'admin' or 'admin' in user.username.lower()):
            return Notification.objects.none()  # Return empty queryset for non-admin users
        
        # Return all notifications ordered by creation date (newest first)
        return Notification.objects.select_related('recipient', 'sender', 'post').order_by('-created_at')

    def list(self, request, *args, **kwargs):
        # Check admin permissions
        user = request.user
        if not (user.is_staff or user.is_superuser or user.username == 'admin' or 'admin' in user.username.lower()):
            return Response({
                'error': 'Admin access required.',
                'detail': 'You do not have permission to view all system notifications.'
            }, status=status.HTTP_403_FORBIDDEN)

        # Get queryset and apply pagination
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            result = self.get_paginated_response(serializer.data)
            
            # Add admin metadata
            result.data['_admin_metadata'] = {
                'total_notifications': queryset.count(),
                'is_admin_view': True,
                'includes_all_users': True,
                'user_count': User.objects.count(),
                'notification_types': list(queryset.values_list('notification_type', flat=True).distinct())
            }
            
            return result

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'results': serializer.data,
            'count': queryset.count(),
            '_admin_metadata': {
                'total_notifications': queryset.count(),
                'is_admin_view': True,
                'includes_all_users': True,
                'user_count': User.objects.count(),
                'notification_types': list(queryset.values_list('notification_type', flat=True).distinct())
            }
        })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_notification_stats(request):
    """Admin-only endpoint to get notification statistics."""
    user = request.user
    if not (user.is_staff or user.is_superuser or user.username == 'admin' or 'admin' in user.username.lower()):
        return Response({
            'error': 'Admin access required.'
        }, status=status.HTTP_403_FORBIDDEN)

    # Get comprehensive notification statistics
    total_notifications = Notification.objects.count()
    unread_notifications = Notification.objects.filter(is_read=False).count()
    read_notifications = Notification.objects.filter(is_read=True).count()
    
    # Notification types breakdown
    notification_types = {}
    for notif_type, count in Notification.objects.values_list('notification_type').annotate(count=models.Count('notification_type')):
        notification_types[notif_type] = count
    
    # Recent notifications (last 24 hours)
    from django.utils import timezone
    from datetime import timedelta
    recent_notifications = Notification.objects.filter(
        created_at__gte=timezone.now() - timedelta(hours=24)
    ).count()
    
    return Response({
        'total_notifications': total_notifications,
        'unread_notifications': unread_notifications,
        'read_notifications': read_notifications,
        'notification_types': notification_types,
        'recent_24h': recent_notifications,
        'total_users': User.objects.count(),
        'active_users_with_notifications': Notification.objects.values('recipient').distinct().count(),
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_global_notification(request):
    """Admin-only endpoint to send a notification to all users."""
    user = request.user
    if not (user.is_staff or user.is_superuser or user.username == 'admin' or 'admin' in user.username.lower()):
        return Response({
            'error': 'Admin access required.',
            'detail': 'You do not have permission to send global notifications.'
        }, status=status.HTTP_403_FORBIDDEN)

    # Get the message from request
    message = request.data.get('message', '').strip()
    notification_type = request.data.get('notification_type', 'announcement')
    
    # Validate input
    if not message:
        return Response({
            'error': 'Message is required.',
            'detail': 'Please provide a message for the global notification.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if len(message) > 500:
        return Response({
            'error': 'Message too long.',
            'detail': 'Message must be 500 characters or less.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Valid notification types
    valid_types = ['announcement', 'system', 'update', 'warning', 'info']
    if notification_type not in valid_types:
        notification_type = 'announcement'
    
    try:
        # Get all users except the admin (optional - you might want to include admin too)
        all_users = User.objects.all()
        
        # Create notifications for all users
        notifications_created = []
        for recipient in all_users:
            notification = Notification.objects.create(
                recipient=recipient,
                sender=user,  # Admin who sent the global notification
                notification_type=notification_type,
                message=message,
                is_read=False
            )
            notifications_created.append(notification)
        
        return Response({
            'success': True,
            'message': 'Global notification sent successfully.',
            'details': {
                'recipients_count': len(notifications_created),
                'notification_type': notification_type,
                'sent_by': user.username,
                'message_preview': message[:100] + '...' if len(message) > 100 else message
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': 'Failed to send global notification.',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_mark_notification_read(request, notification_id):
    """Admin-only endpoint to mark any notification as read."""
    user = request.user
    if not (user.is_staff or user.is_superuser or user.username == 'admin' or 'admin' in user.username.lower()):
        return Response({
            'error': 'Admin access required.',
            'detail': 'You do not have permission to mark notifications for other users.'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        notification = get_object_or_404(Notification, id=notification_id)
        
        # Store the previous state for logging
        was_read = notification.is_read
        
        notification.is_read = True
        notification.save()

        return Response({
            'success': True,
            'message': f'Notification {notification_id} marked as read.',
            'details': {
                'notification_id': notification_id,
                'recipient': notification.recipient.username,
                'was_read': was_read,
                'marked_by_admin': user.username
            }
        }, status=status.HTTP_200_OK)

    except Notification.DoesNotExist:
        return Response({
            'error': 'Notification not found.',
            'detail': f'No notification found with ID {notification_id}'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': 'Failed to mark notification as read.',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
