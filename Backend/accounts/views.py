from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth import update_session_auth_hash
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.template.loader import render_to_string
from django.utils import timezone

from .models import User
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    UserProfileUpdateSerializer, PasswordChangeSerializer, PasswordResetSerializer,
    UserListSerializer
)
from .permissions import IsAdminOrOwner, IsAdminUser
from .storage import avatar_storage


class UserRegistrationView(APIView):
    """User registration endpoint."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            # Get user profile data
            profile_serializer = UserProfileSerializer(user)
            
            return Response({
                'message': 'User registered successfully.',
                'user': profile_serializer.data,
                'tokens': {
                    'access': str(access_token),
                    'refresh': str(refresh),
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(APIView):
    """User login endpoint."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Update last login
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            # Get user profile data
            profile_serializer = UserProfileSerializer(user)
            
            return Response({
                'message': 'Login successful.',
                'user': profile_serializer.data,
                'tokens': {
                    'access': str(access_token),
                    'refresh': str(refresh),
                }
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLogoutView(APIView):
    """User logout endpoint."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({
                'message': 'Logout successful.'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Invalid token.'
            }, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveAPIView):
    """Get user profile by ID."""
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        user = super().get_object()
        # Check privacy settings
        if not user.can_view_profile(self.request.user):
            raise permissions.PermissionDenied("You don't have permission to view this profile.")
        return user


class UserProfileUpdateView(generics.UpdateAPIView):
    """Update own user profile."""
    serializer_class = UserProfileUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class AvatarUploadView(APIView):
    """Upload user avatar."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            user = request.user
            
            # Get avatar data from request
            avatar_data = None
            if 'avatar' in request.FILES:
                # File upload
                avatar_data = request.FILES['avatar']
            elif 'avatar_data' in request.data:
                # Base64 data
                avatar_data = request.data['avatar_data']
            else:
                return Response({
                    'error': 'No avatar data provided. Send either "avatar" file or "avatar_data" base64.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Delete old avatar if exists
            if user.avatar_url:
                avatar_storage.delete_avatar(user.avatar_url)
            
            # Save new avatar
            avatar_url = avatar_storage.save_avatar(avatar_data, user.id)
            
            # Update user model
            user.avatar_url = avatar_url
            user.save(update_fields=['avatar_url'])
            
            # Return updated profile
            serializer = UserProfileSerializer(user)
            return Response({
                'message': 'Avatar uploaded successfully.',
                'user': serializer.data,
                'avatar_url': avatar_url
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Avatar upload failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PasswordChangeView(APIView):
    """Change user password."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            # Update session to prevent logout
            update_session_auth_hash(request, user)
            
            return Response({
                'message': 'Password changed successfully.'
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetView(APIView):
    """Request password reset."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.get(email=email)
            
            # Generate password reset token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Send email (placeholder - implement according to your email service)
            reset_link = f"http://localhost:3000/reset-password/{uid}/{token}/"
            
            # For development, just return the reset link
            if settings.DEBUG:
                return Response({
                    'message': 'Password reset link generated.',
                    'reset_link': reset_link  # Remove in production
                }, status=status.HTTP_200_OK)
            
            # TODO: Send actual email in production
            # send_mail(
            #     'Password Reset',
            #     f'Click this link to reset your password: {reset_link}',
            #     settings.EMAIL_HOST_USER,
            #     [email],
            #     fail_silently=False,
            # )
            
            return Response({
                'message': 'Password reset email sent.'
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserListView(generics.ListAPIView):
    """List all users (admin only) or search users."""
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserListSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                username__icontains=search
            ) | queryset.filter(
                first_name__icontains=search
            ) | queryset.filter(
                last_name__icontains=search
            )
        return queryset.order_by('-created_at')


class UserDeactivateView(APIView):
    """Deactivate user (admin only)."""
    permission_classes = [IsAdminUser]
    
    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            user.is_active = False
            user.save()
            return Response({
                'message': f'User @{user.username} has been deactivated.'
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found.'
            }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user_profile(request):
    """Get current authenticated user's profile."""
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data)
