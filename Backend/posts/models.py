from django.db import models
from django.conf import settings
from django.core.validators import MaxLengthValidator


class Post(models.Model):
    """
    Post model for user-generated content
    """
    CATEGORY_CHOICES = [
        ('general', 'General'),
        ('announcement', 'Announcement'),
        ('question', 'Question'),
    ]

    # Core Content
    content = models.TextField(
        max_length=280,
        validators=[MaxLengthValidator(280)],
        help_text="Maximum 280 characters"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='posts'
    )
    
    # Media
    image_url = models.URLField(blank=True, null=True)
    
    # Categorization
    category = models.CharField(
        max_length=15,
        choices=CATEGORY_CHOICES,
        default='general'
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Engagement Counters
    like_count = models.PositiveIntegerField(default=0)
    comment_count = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'posts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['author', '-created_at']),
            models.Index(fields=['is_active', '-created_at']),
        ]

    def __str__(self):
        return f"Post by @{self.author.username}: {self.content[:50]}..."

    def update_like_count(self):
        """Update the like count based on actual likes."""
        self.like_count = self.likes.count()
        self.save(update_fields=['like_count'])

    def update_comment_count(self):
        """Update the comment count based on active comments."""
        self.comment_count = self.comments.filter(is_active=True).count()
        self.save(update_fields=['comment_count'])
