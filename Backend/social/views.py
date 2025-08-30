from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.db import IntegrityError

from .models import Follow, Like, Comment
from posts.models import Post
from accounts.models import User
from .serializers import (
    FollowSerializer, FollowCreateSerializer, LikeSerializer,
    CommentCreateSerializer, CommentSerializer
)
from accounts.permissions import IsOwnerOrReadOnly
from notifications.models import Notification


# Follow Views
class FollowUserView(APIView):
    """Follow a user."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        try:
            user_to_follow = get_object_or_404(User, id=user_id, is_active=True)
            
            if request.user == user_to_follow:
                return Response({
                    'error': 'You cannot follow yourself.'
                }, status=status.HTTP_400_BAD_REQUEST)

            follow, created = Follow.objects.get_or_create(
                follower=request.user,
                following=user_to_follow
            )

            if created:
                # Create notification
                Notification.create_follow_notification(request.user, user_to_follow)
                
                return Response({
                    'message': f'You are now following @{user_to_follow.username}.'
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'message': f'You are already following @{user_to_follow.username}.'
                }, status=status.HTTP_200_OK)

        except IntegrityError:
            return Response({
                'error': 'Follow relationship already exists.'
            }, status=status.HTTP_400_BAD_REQUEST)


class UnfollowUserView(APIView):
    """Unfollow a user."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, user_id):
        try:
            user_to_unfollow = get_object_or_404(User, id=user_id, is_active=True)
            
            follow = Follow.objects.get(
                follower=request.user,
                following=user_to_unfollow
            )
            follow.delete()

            return Response({
                'message': f'You have unfollowed @{user_to_unfollow.username}.'
            }, status=status.HTTP_200_OK)

        except Follow.DoesNotExist:
            return Response({
                'error': 'You are not following this user.'
            }, status=status.HTTP_400_BAD_REQUEST)


class UserFollowersView(generics.ListAPIView):
    """Get user's followers."""
    serializer_class = FollowSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs['user_id']
        user = get_object_or_404(User, id=user_id, is_active=True)
        return Follow.objects.filter(following=user).order_by('-created_at')


class UserFollowingView(generics.ListAPIView):
    """Get users that a user is following."""
    serializer_class = FollowSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs['user_id']
        user = get_object_or_404(User, id=user_id, is_active=True)
        return Follow.objects.filter(follower=user).order_by('-created_at')


# Like Views
class LikePostView(APIView):
    """Like a post."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, post_id):
        try:
            post = get_object_or_404(Post, id=post_id, is_active=True)
            
            like, created = Like.objects.get_or_create(
                user=request.user,
                post=post
            )

            if created:
                # Update post like count
                post.update_like_count()
                
                # Create notification (if not own post)
                Notification.create_like_notification(request.user, post)
                
                return Response({
                    'message': 'Post liked successfully.',
                    'like_count': post.like_count
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'message': 'You have already liked this post.',
                    'like_count': post.like_count
                }, status=status.HTTP_200_OK)

        except IntegrityError:
            return Response({
                'error': 'Like already exists.'
            }, status=status.HTTP_400_BAD_REQUEST)


class UnlikePostView(APIView):
    """Unlike a post."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, post_id):
        try:
            post = get_object_or_404(Post, id=post_id, is_active=True)
            
            like = Like.objects.get(user=request.user, post=post)
            like.delete()

            # Update post like count
            post.update_like_count()

            return Response({
                'message': 'Post unliked successfully.',
                'like_count': post.like_count
            }, status=status.HTTP_200_OK)

        except Like.DoesNotExist:
            return Response({
                'error': 'You have not liked this post.'
            }, status=status.HTTP_400_BAD_REQUEST)


class PostLikeStatusView(APIView):
    """Check if user has liked a post."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, post_id):
        post = get_object_or_404(Post, id=post_id, is_active=True)
        is_liked = Like.objects.filter(user=request.user, post=post).exists()
        
        return Response({
            'is_liked': is_liked,
            'like_count': post.like_count
        }, status=status.HTTP_200_OK)


# Comment Views
class PostCommentsView(generics.ListCreateAPIView):
    """Get comments for a post or add a new comment."""
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        post_id = self.kwargs['post_id']
        post = get_object_or_404(Post, id=post_id, is_active=True)
        return Comment.objects.filter(post=post, is_active=True).order_by('-created_at')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CommentCreateSerializer
        return CommentSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        post_id = self.kwargs['post_id']
        context['post'] = get_object_or_404(Post, id=post_id, is_active=True)
        return context

    def perform_create(self, serializer):
        post = self.get_serializer_context()['post']
        comment = serializer.save()
        
        # Update post comment count
        post.update_comment_count()
        
        # Create notification (if not own post)
        Notification.create_comment_notification(
            self.request.user, 
            post, 
            comment.content
        )


class CommentDeleteView(generics.DestroyAPIView):
    """Delete own comment."""
    queryset = Comment.objects.filter(is_active=True)
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return super().get_queryset().filter(author=self.request.user)

    def perform_destroy(self, instance):
        # Soft delete by setting is_active to False
        instance.is_active = False
        instance.save()
        
        # Update post comment count
        instance.post.update_comment_count()


class AdminCommentListView(generics.ListAPIView):
    """Admin view to get all comments."""
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # For now, return all comments (both active and inactive)
        # In production, you'd want to check if user is admin
        return Comment.objects.all().order_by('-created_at')


class AdminCommentDeleteView(generics.DestroyAPIView):
    """Admin view to delete any comment."""
    queryset = Comment.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_destroy(self, instance):
        # Hard delete for admin
        instance.delete()
        
        # Update post comment count
        instance.post.update_comment_count()
