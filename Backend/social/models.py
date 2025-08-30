from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


class Follow(models.Model):
    """
    Follow relationship model
    """
    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='following_set'
    )
    following = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='followers_set'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'follows'
        unique_together = ('follower', 'following')
        indexes = [
            models.Index(fields=['follower']),
            models.Index(fields=['following']),
        ]

    def __str__(self):
        return f"@{self.follower.username} follows @{self.following.username}"

    def clean(self):
        """Validate that users cannot follow themselves."""
        if self.follower == self.following:
            raise ValidationError("Users cannot follow themselves.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class Like(models.Model):
    """
    Like model for posts
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='likes'
    )
    post = models.ForeignKey(
        'posts.Post',
        on_delete=models.CASCADE,
        related_name='likes'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'likes'
        unique_together = ('user', 'post')
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['post']),
        ]

    def __str__(self):
        return f"@{self.user.username} liked post by @{self.post.author.username}"


class Comment(models.Model):
    """
    Comment model for posts
    """
    content = models.TextField(max_length=200)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    post = models.ForeignKey(
        'posts.Post',
        on_delete=models.CASCADE,
        related_name='comments'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'comments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['post', '-created_at']),
            models.Index(fields=['author']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"Comment by @{self.author.username}: {self.content[:30]}..."
