from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta

from accounts.models import User
from posts.models import Post
from social.models import Follow, Like, Comment
from notifications.models import Notification
from accounts.permissions import IsAdminUser


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stats(request):
    """
    Get basic statistics for admin dashboard.
    """
    # Get today's date for filtering
    today = timezone.now().date()
    yesterday = today - timedelta(days=1)
    
    # User statistics
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    new_users_today = User.objects.filter(created_at__date=today).count()
    users_logged_in_today = User.objects.filter(last_login__date=today).count()
    
    # Post statistics
    total_posts = Post.objects.count()
    active_posts = Post.objects.filter(is_active=True).count()
    posts_today = Post.objects.filter(created_at__date=today).count()
    
    # Engagement statistics
    total_likes = Like.objects.count()
    likes_today = Like.objects.filter(created_at__date=today).count()
    
    total_comments = Comment.objects.filter(is_active=True).count()
    comments_today = Comment.objects.filter(
        created_at__date=today,
        is_active=True
    ).count()
    
    total_follows = Follow.objects.count()
    follows_today = Follow.objects.filter(created_at__date=today).count()
    
    # Top users by followers
    top_users_by_followers = User.objects.annotate(
        followers_count=Count('followers_set')
    ).order_by('-followers_count')[:5]
    
    # Top posts by likes
    top_posts_by_likes = Post.objects.filter(is_active=True).annotate(
        likes_count=Count('likes')
    ).order_by('-likes_count')[:5]
    
    # Recent activity (last 7 days)
    week_ago = today - timedelta(days=7)
    
    recent_users = User.objects.filter(created_at__date__gte=week_ago).count()
    recent_posts = Post.objects.filter(created_at__date__gte=week_ago).count()
    recent_likes = Like.objects.filter(created_at__date__gte=week_ago).count()
    recent_comments = Comment.objects.filter(
        created_at__date__gte=week_ago,
        is_active=True
    ).count()
    
    stats = {
        'overview': {
            'total_users': total_users,
            'active_users': active_users,
            'total_posts': total_posts,
            'active_posts': active_posts,
            'total_likes': total_likes,
            'total_comments': total_comments,
            'total_follows': total_follows,
        },
        'today': {
            'new_users': new_users_today,
            'users_logged_in': users_logged_in_today,
            'new_posts': posts_today,
            'new_likes': likes_today,
            'new_comments': comments_today,
            'new_follows': follows_today,
        },
        'recent_activity': {
            'new_users_week': recent_users,
            'new_posts_week': recent_posts,
            'new_likes_week': recent_likes,
            'new_comments_week': recent_comments,
        },
        'top_users': [
            {
                'id': user.id,
                'username': user.username,
                'full_name': user.full_name,
                'followers_count': user.followers_count,
                'posts_count': user.posts_count,
            }
            for user in top_users_by_followers
        ],
        'top_posts': [
            {
                'id': post.id,
                'content': post.content[:100] + '...' if len(post.content) > 100 else post.content,
                'author': post.author.username,
                'likes_count': post.like_count,
                'comments_count': post.comment_count,
                'created_at': post.created_at,
            }
            for post in top_posts_by_likes
        ]
    }
    
    return Response(stats)