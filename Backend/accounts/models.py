from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser
    
    Adds profile fields and privacy settings
    """
    ROLE_CHOICES = [
        ('user', 'User'),
        ('admin', 'Admin'),
    ]
    
    PRIVACY_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private'),
        ('followers_only', 'Followers Only'),
    ]

    # Basic Profile Information
    email = models.EmailField(unique=True)
    bio = models.TextField(max_length=160, blank=True)
    avatar_url = models.URLField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    location = models.CharField(max_length=100, blank=True)
    
    # Role and Privacy
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    privacy_setting = models.CharField(
        max_length=15, 
        choices=PRIVACY_CHOICES, 
        default='public'
    )
    
    # Account Status
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Username validation
    username_validator = RegexValidator(
        regex=r'^[a-zA-Z0-9_]{3,30}$',
        message='Username must be 3-30 characters long and contain only letters, numbers, and underscores.'
    )
    username = models.CharField(
        max_length=30,
        unique=True,
        validators=[username_validator],
        help_text='Required. 3-30 characters. Letters, digits and underscore only.',
        error_messages={
            'unique': 'A user with that username already exists.',
        },
    )

    # Required fields for user creation
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']

    def __str__(self):
        return f"@{self.username}"

    @property
    def full_name(self):
        """Return the user's full name."""
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def followers_count(self):
        """Return the number of followers."""
        return self.followers_set.count()

    @property
    def following_count(self):
        """Return the number of users this user is following."""
        return self.following_set.count()

    @property
    def posts_count(self):
        """Return the number of posts created by this user."""
        return self.posts.filter(is_active=True).count()

    def is_admin(self):
        """Check if user has admin role."""
        return self.role == 'admin'

    def can_view_profile(self, viewer):
        """Check if a viewer can see this user's profile based on privacy settings."""
        if self.privacy_setting == 'public':
            return True
        elif self.privacy_setting == 'private':
            return viewer == self
        elif self.privacy_setting == 'followers_only':
            return viewer == self or self.followers_set.filter(follower=viewer).exists()
        return False
