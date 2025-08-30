import os
import uuid
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import logging

logger = logging.getLogger('socialconnect')


class SupabaseStorageService:
    """
    Service for handling file uploads to Supabase Storage.
    """
    
    def __init__(self):
        self.supabase_url = getattr(settings, 'SUPABASE_URL', '')
        self.supabase_key = getattr(settings, 'SUPABASE_KEY', '')
        self.storage_bucket = getattr(settings, 'SUPABASE_STORAGE_BUCKET', 'socialconnect-media')
        
    def upload_image(self, file, folder='images'):
        """
        Upload an image file to Supabase Storage.
        
        Args:
            file: Django UploadedFile object
            folder: Folder path in the bucket
            
        Returns:
            str: Public URL of uploaded file or None if failed
        """
        try:
            if not self.supabase_url or not self.supabase_key:
                logger.warning("Supabase not configured, using local storage")
                return self._save_locally(file, folder)
            
            # Import Supabase client here to avoid import errors if not configured
            from supabase import create_client
            
            supabase = create_client(self.supabase_url, self.supabase_key)
            
            # Generate unique filename
            file_extension = os.path.splitext(file.name)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = f"{folder}/{unique_filename}"
            
            # Upload to Supabase Storage
            file_content = file.read()
            
            result = supabase.storage.from_(self.storage_bucket).upload(
                file_path, 
                file_content,
                file_options={
                    'content-type': file.content_type
                }
            )
            
            if result:
                # Get public URL
                public_url = supabase.storage.from_(self.storage_bucket).get_public_url(file_path)
                logger.info(f"File uploaded successfully: {public_url}")
                return public_url
            else:
                logger.error("Failed to upload file to Supabase")
                return None
                
        except Exception as e:
            logger.error(f"Error uploading to Supabase Storage: {e}")
            # Fallback to local storage
            return self._save_locally(file, folder)
    
    def _save_locally(self, file, folder):
        """
        Fallback method to save file locally.
        """
        try:
            file_extension = os.path.splitext(file.name)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = f"{folder}/{unique_filename}"
            
            # Save using Django's default storage
            path = default_storage.save(file_path, ContentFile(file.read()))
            return default_storage.url(path)
            
        except Exception as e:
            logger.error(f"Error saving file locally: {e}")
            return None
    
    def delete_file(self, file_url):
        """
        Delete a file from Supabase Storage.
        
        Args:
            file_url: Public URL of the file to delete
        """
        try:
            if not self.supabase_url or not self.supabase_key:
                logger.warning("Supabase not configured")
                return False
            
            from supabase import create_client
            
            supabase = create_client(self.supabase_url, self.supabase_key)
            
            # Extract file path from URL
            # This assumes the URL format: https://project.supabase.co/storage/v1/object/public/bucket/path
            if f"/{self.storage_bucket}/" in file_url:
                file_path = file_url.split(f"/{self.storage_bucket}/")[1]
                
                result = supabase.storage.from_(self.storage_bucket).remove([file_path])
                
                if result:
                    logger.info(f"File deleted successfully: {file_path}")
                    return True
                else:
                    logger.error(f"Failed to delete file: {file_path}")
                    return False
            else:
                logger.warning(f"Invalid file URL format: {file_url}")
                return False
                
        except Exception as e:
            logger.error(f"Error deleting file from Supabase Storage: {e}")
            return False
    
    def validate_image(self, file):
        """
        Validate uploaded image file.
        
        Args:
            file: Django UploadedFile object
            
        Returns:
            tuple: (is_valid, error_message)
        """
        # Check file size (2MB max)
        max_size = 2 * 1024 * 1024  # 2MB
        if file.size > max_size:
            return False, "File size cannot exceed 2MB."
        
        # Check file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png']
        if file.content_type not in allowed_types:
            return False, "Only JPEG and PNG files are allowed."
        
        # Check file extension
        allowed_extensions = ['.jpg', '.jpeg', '.png']
        file_extension = os.path.splitext(file.name)[1].lower()
        if file_extension not in allowed_extensions:
            return False, "Only .jpg, .jpeg, and .png files are allowed."
        
        return True, ""


# Global instance
storage_service = SupabaseStorageService()