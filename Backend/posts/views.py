from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import logging

from .models import Post
from .serializers import PostCreateSerializer, PostSerializer, PostUpdateSerializer, PostListSerializer
from accounts.permissions import IsAdminUser, IsOwnerOrReadOnly

logger = logging.getLogger(__name__)


class PostCreateView(generics.CreateAPIView):
    """Create a new post."""
    serializer_class = PostCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """Override to return full post data in response."""
        # Use the create serializer for input validation
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create the post
        post = serializer.save()
        
        # Return full post data using PostSerializer
        response_serializer = PostSerializer(post, context={'request': request})
        headers = self.get_success_headers(response_serializer.data)
        
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class PostDetailView(generics.RetrieveAPIView):
    """Get a specific post by ID."""
    queryset = Post.objects.filter(is_active=True)
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]


class PostUpdateView(generics.UpdateAPIView):
    """Update own post."""
    queryset = Post.objects.filter(is_active=True)
    serializer_class = PostUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        # Users can only update their own posts
        return super().get_queryset().filter(author=self.request.user)


class PostDeleteView(generics.DestroyAPIView):
    """Delete own post."""
    queryset = Post.objects.filter(is_active=True)
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        # Users can only delete their own posts
        return super().get_queryset().filter(author=self.request.user)

    def perform_destroy(self, instance):
        # Soft delete by setting is_active to False
        instance.is_active = False
        instance.save()


class PostListView(generics.ListAPIView):
    """List all posts with pagination."""
    queryset = Post.objects.filter(is_active=True)
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by author if specified
        author_id = self.request.query_params.get('author', None)
        if author_id:
            queryset = queryset.filter(author_id=author_id)
        
        # Filter by category if specified
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        # Search in content
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(content__icontains=search)
        
        return queryset.order_by('-created_at')


class UserFeedView(generics.ListAPIView):
    """Get personalized feed for authenticated user."""
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Get users that current user follows
        following_users = user.following_set.values_list('following', flat=True)
        
        # Get posts from followed users + own posts
        queryset = Post.objects.filter(
            Q(author__in=following_users) | Q(author=user),
            is_active=True
        ).order_by('-created_at')
        
        return queryset


# Admin Views
class AdminPostListView(generics.ListAPIView):
    """List all posts for admin."""
    queryset = Post.objects.all()
    serializer_class = PostListSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.order_by('-created_at')


class AdminPostDeleteView(APIView):
    """Delete any post (admin only)."""
    permission_classes = [IsAdminUser]

    def delete(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id)
            post.is_active = False
            post.save()
            return Response({
                'message': f'Post by @{post.author.username} has been deleted.'
            }, status=status.HTTP_200_OK)
        except Post.DoesNotExist:
            return Response({
                'error': 'Post not found.'
            }, status=status.HTTP_404_NOT_FOUND)
