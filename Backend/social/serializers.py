from rest_framework import serializers
from .models import Follow, Like, Comment
from accounts.serializers import UserProfileSerializer


class FollowSerializer(serializers.ModelSerializer):
    """Serializer for follow relationships."""
    follower = UserProfileSerializer(read_only=True)
    following = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = Follow
        fields = ('id', 'follower', 'following', 'created_at')
        read_only_fields = ('id', 'created_at')


class FollowCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating follow relationships."""
    
    class Meta:
        model = Follow
        fields = ('following',)

    def create(self, validated_data):
        validated_data['follower'] = self.context['request'].user
        return super().create(validated_data)

    def validate_following(self, value):
        follower = self.context['request'].user
        if follower == value:
            raise serializers.ValidationError("You cannot follow yourself.")
        
        if Follow.objects.filter(follower=follower, following=value).exists():
            raise serializers.ValidationError("You are already following this user.")
        
        return value


class LikeSerializer(serializers.ModelSerializer):
    """Serializer for likes."""
    user = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = Like
        fields = ('id', 'user', 'post', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')


class CommentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating comments."""
    
    class Meta:
        model = Comment
        fields = ('content',)

    def validate_content(self, value):
        if len(value.strip()) == 0:
            raise serializers.ValidationError("Comment content cannot be empty.")
        return value

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        validated_data['post'] = self.context['post']
        return super().create(validated_data)


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for displaying comments."""
    author = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = Comment
        fields = ('id', 'content', 'author', 'post', 'created_at', 'is_active')
        read_only_fields = ('id', 'author', 'post', 'created_at')