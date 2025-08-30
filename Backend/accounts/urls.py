from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'accounts'

urlpatterns = [
    # Authentication
    path('auth/register/', views.UserRegistrationView.as_view(), name='register'),
    path('auth/login/', views.UserLoginView.as_view(), name='login'),
    path('auth/logout/', views.UserLogoutView.as_view(), name='logout'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Password Management
    path('auth/change-password/', views.PasswordChangeView.as_view(), name='change_password'),
    path('auth/password-reset/', views.PasswordResetView.as_view(), name='password_reset'),
    
    # User Profiles
    path('users/me/', views.current_user_profile, name='current_user'),
    path('users/me/update/', views.UserProfileUpdateView.as_view(), name='update_profile'),
    path('users/me/avatar/', views.AvatarUploadView.as_view(), name='upload_avatar'),
    path('users/<int:pk>/', views.UserProfileView.as_view(), name='user_profile'),
    
    # Admin User Management
    path('users/', views.UserListView.as_view(), name='user_list'),
    path('admin/users/<int:user_id>/deactivate/', views.UserDeactivateView.as_view(), name='deactivate_user'),
]