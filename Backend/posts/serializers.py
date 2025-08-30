from rest_framework import serializers
from .models import Post
from accounts.serializers import UserProfileSerializer
from utils.image_upload import handle_image_upload
import logging

logger = logging.getLogger(__name__)


class PostCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating posts."""
    image_data = serializers.CharField(write_only=True, required=False, allow_blank=True, help_text="Base64 encoded image data")
    
    class Meta:
        model = Post
        fields = ('content', 'image_url', 'image_data', 'category')
        extra_kwargs = {
            'image_url': {'read_only': True}  # This will be set automatically from image_data
        }
    
    def validate_content(self, value):
        if len(value.strip()) == 0:
            raise serializers.ValidationError("Content cannot be empty.")
        return value

    def create(self, validated_data):
        image_data = validated_data.pop('image_data', None)
        validated_data['author'] = self.context['request'].user
        
        # Handle image upload if provided
        if image_data and image_data.strip():
            try:
                logger.info("Processing image upload...")
                image_url = handle_image_upload(image_data, validated_data['author'].id)
                validated_data['image_url'] = image_url
                logger.info(f"Image uploaded successfully: {image_url}")
            except Exception as e:
                logger.error(f"Image upload failed: {e}")
                # Continue without image rather than failing the post
                pass
        
        return super().create(validated_data)


class PostSerializer(serializers.ModelSerializer):
    """Serializer for displaying posts."""
    author = UserProfileSerializer(read_only=True)
    is_liked_by_user = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = (
            'id', 'content', 'author', 'image_url', 'category',
            'like_count', 'comment_count', 'is_active',
            'created_at', 'updated_at', 'is_liked_by_user'
        )
        read_only_fields = (
            'id', 'author', 'like_count', 'comment_count',
            'created_at', 'updated_at'
        )

    def get_is_liked_by_user(self, obj):
        """Check if the current user has liked this post."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False


class PostUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating posts."""
    
    class Meta:
        model = Post
        fields = ('content', 'image_url', 'category')
    
    def validate_content(self, value):
        if len(value.strip()) == 0:
            raise serializers.ValidationError("Content cannot be empty.")
        return value


class PostListSerializer(serializers.ModelSerializer):
    """Serializer for listing posts with minimal data."""
    author = serializers.StringRelatedField()
    
    class Meta:
        model = Post
        fields = (
            'id', 'content', 'author', 'category',
            'like_count', 'comment_count', 'created_at'
        )