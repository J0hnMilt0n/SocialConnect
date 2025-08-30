"""
Storage utilities for handling avatar uploads to Supabase or local media storage.
"""
import os
import uuid
from io import BytesIO
from PIL import Image
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import base64
import logging

logger = logging.getLogger(__name__)

class AvatarStorageManager:
    """Manages avatar storage to Supabase or local media directory."""
    
    def __init__(self):
        self.use_supabase = bool(settings.SUPABASE_URL and settings.SUPABASE_KEY)
        if self.use_supabase:
            try:
                from supabase import create_client, Client
                self.supabase: Client = create_client(
                    settings.SUPABASE_URL, 
                    settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_KEY
                )
                logger.info("Supabase storage initialized")
            except ImportError:
                logger.warning("Supabase client not available, falling back to local storage")
                self.use_supabase = False
        else:
            logger.info("Using local media storage")
    
    def save_avatar(self, file_data, user_id):
        """
        Save avatar to storage and return the URL.
        
        Args:
            file_data: Base64 encoded image data or file object
            user_id: User ID for file naming
            
        Returns:
            str: URL to the stored avatar
        """
        try:
            # Process the image
            image_file, filename = self._process_image(file_data, user_id)
            
            if self.use_supabase:
                return self._save_to_supabase(image_file, filename)
            else:
                return self._save_to_local(image_file, filename)
                
        except Exception as e:
            logger.error(f"Error saving avatar: {e}")
            raise
    
    def _process_image(self, file_data, user_id):
        """Process and optimize the image."""
        # Handle base64 data
        if isinstance(file_data, str) and file_data.startswith('data:image'):
            # Extract base64 data
            header, data = file_data.split(',', 1)
            image_data = base64.b64decode(data)
            image_file = BytesIO(image_data)
        else:
            image_file = file_data
        
        # Open and process image with PIL
        img = Image.open(image_file)
        
        # Convert to RGB if necessary
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        # Resize image (max 400x400)
        img.thumbnail((400, 400), Image.Resampling.LANCZOS)
        
        # Save optimized image to BytesIO
        output = BytesIO()
        img.save(output, format='JPEG', quality=85, optimize=True)
        output.seek(0)
        
        # Generate unique filename
        filename = f"avatars/user_{user_id}_{uuid.uuid4().hex[:8]}.jpg"
        
        return output, filename
    
    def _save_to_supabase(self, image_file, filename):
        """Save image to Supabase storage."""
        try:
            # Upload to Supabase storage
            result = self.supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).upload(
                filename, 
                image_file.getvalue(),
                {
                    "content-type": "image/jpeg",
                    "cache-control": "3600"
                }
            )
            
            if result.status_code == 200:
                # Get public URL
                public_url = self.supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).get_public_url(filename)
                logger.info(f"Avatar uploaded to Supabase: {filename}")
                return public_url
            else:
                raise Exception(f"Supabase upload failed: {result.status_code}")
                
        except Exception as e:
            logger.error(f"Supabase upload error: {e}")
            # Fallback to local storage
            logger.info("Falling back to local storage")
            return self._save_to_local(image_file, filename)
    
    def _save_to_local(self, image_file, filename):
        """Save image to local media directory."""
        try:
            # Ensure media directory exists
            os.makedirs(os.path.dirname(os.path.join(settings.MEDIA_ROOT, filename)), exist_ok=True)
            
            # Save file using Django's default storage
            saved_name = default_storage.save(filename, ContentFile(image_file.getvalue()))
            
            # Return full URL
            url = settings.MEDIA_URL + saved_name
            if not url.startswith('http'):
                # Add domain for absolute URL
                url = f"http://127.0.0.1:8000{url}"
            
            logger.info(f"Avatar saved locally: {saved_name}")
            return url
            
        except Exception as e:
            logger.error(f"Local storage error: {e}")
            raise
    
    def delete_avatar(self, avatar_url):
        """Delete avatar from storage."""
        try:
            if not avatar_url:
                return
            
            if self.use_supabase and settings.SUPABASE_URL in avatar_url:
                # Extract filename from Supabase URL
                filename = avatar_url.split('/')[-1]
                self.supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).remove([filename])
                logger.info(f"Avatar deleted from Supabase: {filename}")
            elif avatar_url.startswith(settings.MEDIA_URL):
                # Local file deletion
                relative_path = avatar_url.replace(settings.MEDIA_URL, '')
                if default_storage.exists(relative_path):
                    default_storage.delete(relative_path)
                    logger.info(f"Avatar deleted locally: {relative_path}")
        
        except Exception as e:
            logger.warning(f"Error deleting avatar: {e}")


# Global instance
avatar_storage = AvatarStorageManager()