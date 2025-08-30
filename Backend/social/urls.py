from django.urls import path
from . import views

app_name = 'social'

urlpatterns = [
    # Follow System
    path('users/<int:user_id>/follow/', views.FollowUserView.as_view(), name='follow_user'),
    path('users/<int:user_id>/unfollow/', views.UnfollowUserView.as_view(), name='unfollow_user'),
    path('users/<int:user_id>/followers/', views.UserFollowersView.as_view(), name='user_followers'),
    path('users/<int:user_id>/following/', views.UserFollowingView.as_view(), name='user_following'),
    
    # Like System
    path('posts/<int:post_id>/like/', views.LikePostView.as_view(), name='like_post'),
    path('posts/<int:post_id>/unlike/', views.UnlikePostView.as_view(), name='unlike_post'),
    path('posts/<int:post_id>/like-status/', views.PostLikeStatusView.as_view(), name='post_like_status'),
    
    # Comment System
    path('posts/<int:post_id>/comments/', views.PostCommentsView.as_view(), name='post_comments'),
    path('comments/<int:pk>/delete/', views.CommentDeleteView.as_view(), name='delete_comment'),
    
    # Admin Comment Management
    path('admin/comments/', views.AdminCommentListView.as_view(), name='admin_comments'),
    path('admin/comments/<int:pk>/delete/', views.AdminCommentDeleteView.as_view(), name='admin_delete_comment'),
]