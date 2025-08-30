from django.contrib import admin
from .models import Follow, Like, Comment


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    """Admin configuration for Follow model."""
    
    list_display = ('follower', 'following', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('follower__username', 'following__username')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    """Admin configuration for Like model."""
    
    list_display = ('user', 'post_preview', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'post__content')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
    
    def post_preview(self, obj):
        return f"Post by @{obj.post.author.username}: {obj.post.content[:30]}..."
    post_preview.short_description = 'Post'


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    """Admin configuration for Comment model."""
    
    list_display = (
        'author', 'post_preview', 'content_preview', 
        'is_active', 'created_at'
    )
    list_filter = ('is_active', 'created_at')
    search_fields = ('author__username', 'content', 'post__content')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
    
    def post_preview(self, obj):
        return f"Post by @{obj.post.author.username}"
    post_preview.short_description = 'Post'
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content Preview'
