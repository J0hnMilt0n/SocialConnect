from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.files.storage import default_storage
from utils.storage import storage_service


class ImageUploadView(APIView):
    """
    Upload image to Supabase Storage and return public URL.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            if 'image' not in request.FILES:
                return Response({
                    'error': 'No image file provided.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            image_file = request.FILES['image']
            
            # Validate image
            is_valid, error_message = storage_service.validate_image(image_file)
            if not is_valid:
                return Response({
                    'error': error_message
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Upload image
            public_url = storage_service.upload_image(image_file)
            
            if public_url:
                return Response({
                    'message': 'Image uploaded successfully.',
                    'url': public_url
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'error': 'Failed to upload image.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            return Response({
                'error': f'Upload failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AvatarUploadView(APIView):
    """
    Upload user avatar image.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            if 'avatar' not in request.FILES:
                return Response({
                    'error': 'No avatar file provided.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            avatar_file = request.FILES['avatar']
            
            # Validate image
            is_valid, error_message = storage_service.validate_image(avatar_file)
            if not is_valid:
                return Response({
                    'error': error_message
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Delete old avatar if exists
            user = request.user
            if user.avatar_url:
                storage_service.delete_file(user.avatar_url)
            
            # Upload new avatar
            public_url = storage_service.upload_image(avatar_file, folder='avatars')
            
            if public_url:
                # Update user avatar URL
                user.avatar_url = public_url
                user.save(update_fields=['avatar_url'])
                
                return Response({
                    'message': 'Avatar uploaded successfully.',
                    'avatar_url': public_url
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Failed to upload avatar.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            return Response({
                'error': f'Avatar upload failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)