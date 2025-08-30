from django.contrib import admin
from .models import Post


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    """Admin configuration for Post model."""
    
    list_display = (
        'id', 'author', 'content_preview', 'category',
        'like_count', 'comment_count', 'is_active', 'created_at'
    )
    list_filter = ('category', 'is_active', 'created_at')
    search_fields = ('content', 'author__username', 'author__email')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'like_count', 'comment_count')
    
    fieldsets = (
        ('Content', {
            'fields': ('content', 'image_url', 'category')
        }),
        ('Author', {
            'fields': ('author',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Engagement', {
            'fields': ('like_count', 'comment_count'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content Preview'
