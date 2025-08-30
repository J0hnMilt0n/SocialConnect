from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin configuration for Notification model."""
    
    list_display = (
        'recipient', 'sender', 'notification_type',
        'message_preview', 'is_read', 'created_at'
    )
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('recipient__username', 'sender__username', 'message')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
    
    fieldsets = (
        ('Notification Details', {
            'fields': ('recipient', 'sender', 'notification_type', 'message')
        }),
        ('Related Content', {
            'fields': ('post',)
        }),
        ('Status', {
            'fields': ('is_read',)
        }),
        ('Timestamp', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def message_preview(self, obj):
        return obj.message[:50] + '...' if len(obj.message) > 50 else obj.message
    message_preview.short_description = 'Message Preview'
