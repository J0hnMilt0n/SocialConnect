from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for custom User model."""
    
    list_display = (
        'username', 'email', 'full_name', 'role', 
        'is_active', 'is_verified', 'created_at'
    )
    list_filter = (
        'role', 'is_active', 'is_verified', 'privacy_setting', 'created_at'
    )
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-created_at',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile Information', {
            'fields': ('bio', 'avatar_url', 'website', 'location')
        }),
        ('SocialConnect Settings', {
            'fields': ('role', 'privacy_setting', 'is_verified')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    def full_name(self, obj):
        return obj.full_name
    full_name.short_description = 'Full Name'
