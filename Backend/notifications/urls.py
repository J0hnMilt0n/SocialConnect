from django.urls import path
from . import views

app_name = 'notifications'

urlpatterns = [
    path('', views.NotificationListView.as_view(), name='notification_list'),
    path('<int:notification_id>/read/', views.MarkNotificationReadView.as_view(), name='mark_notification_read'),
    path('mark-all-read/', views.MarkAllNotificationsReadView.as_view(), name='mark_all_notifications_read'),
    path('unread-count/', views.unread_notification_count, name='unread_notification_count'),
    
    # Admin endpoints
    path('admin/all/', views.AdminNotificationListView.as_view(), name='admin_notification_list'),
    path('admin/stats/', views.admin_notification_stats, name='admin_notification_stats'),
    path('admin/send-global/', views.send_global_notification, name='send_global_notification'),
    path('admin/<int:notification_id>/read/', views.admin_mark_notification_read, name='admin_mark_notification_read'),
]