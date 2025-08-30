from django.urls import path
from . import views

app_name = 'posts'

urlpatterns = [
    # Post CRUD
    path('', views.PostCreateView.as_view(), name='create_post'),
    path('list/', views.PostListView.as_view(), name='list_posts'),
    path('<int:pk>/', views.PostDetailView.as_view(), name='post_detail'),
    path('<int:pk>/update/', views.PostUpdateView.as_view(), name='update_post'),
    path('<int:pk>/delete/', views.PostDeleteView.as_view(), name='delete_post'),
    
    # Feed
    path('feed/', views.UserFeedView.as_view(), name='user_feed'),
    
    # Admin Post Management
    path('admin/', views.AdminPostListView.as_view(), name='admin_post_list'),
    path('admin/<int:post_id>/delete/', views.AdminPostDeleteView.as_view(), name='admin_delete_post'),
]