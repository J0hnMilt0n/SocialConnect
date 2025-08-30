"""
URL configuration for SocialConnect project.

A comprehensive social media backend application using Django REST Framework.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from utils.admin_views import admin_stats
from notifications.views import AdminNotificationListView, admin_notification_stats

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints with specific prefixes to avoid conflicts
    path('api/', include('accounts.urls')),
    path('api/posts/', include('posts.urls')),
    path('api/', include('social.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/', include('utils.urls')),
    
    # Admin endpoints (direct admin routes)
    path('api/admin/notifications/', AdminNotificationListView.as_view(), name='admin_notifications'),
    path('api/admin/notifications/stats/', admin_notification_stats, name='admin_notification_stats'),
    
    # Admin stats
    path('api/admin/stats/', admin_stats, name='admin_stats'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
