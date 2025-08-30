from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name'
        )

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    username_or_email = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username_or_email = attrs.get('username_or_email')
        password = attrs.get('password')

        if username_or_email and password:
            # Try to find user by email first, then by username
            user = None
            if '@' in username_or_email:
                try:
                    user = User.objects.get(email=username_or_email)
                    username = user.username
                except User.DoesNotExist:
                    pass
            else:
                username = username_or_email

            if user or username:
                user = authenticate(
                    request=self.context.get('request'),
                    username=username if not user else user.username,
                    password=password
                )

            if not user:
                raise serializers.ValidationError(
                    'Unable to log in with provided credentials.'
                )

            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')

            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError(
                'Must include "username_or_email" and "password".'
            )


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile display."""
    full_name = serializers.ReadOnlyField()
    followers_count = serializers.ReadOnlyField()
    following_count = serializers.ReadOnlyField()
    posts_count = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'bio', 'avatar_url', 'website', 'location',
            'privacy_setting', 'followers_count', 'following_count',
            'posts_count', 'created_at', 'is_verified'
        )
        read_only_fields = ('id', 'username', 'email', 'created_at', 'is_verified')


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""
    
    class Meta:
        model = User
        fields = (
            'first_name', 'last_name', 'bio', 'avatar_url',
            'website', 'location', 'privacy_setting'
        )

    def validate_bio(self, value):
        if len(value) > 160:
            raise serializers.ValidationError("Bio cannot exceed 160 characters.")
        return value


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for changing password."""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match.")
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value


class PasswordResetSerializer(serializers.Serializer):
    """Serializer for password reset request."""
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")
        return value


class UserListSerializer(serializers.ModelSerializer):
    """Serializer for user list display (admin use)."""
    full_name = serializers.ReadOnlyField()
    followers_count = serializers.ReadOnlyField()
    following_count = serializers.ReadOnlyField()
    posts_count = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'full_name', 'role',
            'is_active', 'is_verified', 'followers_count',
            'following_count', 'posts_count', 'created_at', 'last_login'
        )
        read_only_fields = fields