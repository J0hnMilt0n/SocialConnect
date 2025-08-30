"""
Image upload utilities for handling base64 images and uploading to storage.
"""
import base64
import uuid
import io
import os
from PIL import Image
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import logging

logger = logging.getLogger(__name__)

def process_base64_image(base64_data: str) -> tuple[bytes, str]:
    """
    Convert base64 image data to bytes and determine file extension.
    
    Args:
        base64_data: Base64 encoded image data (with or without data URL prefix)
    
    Returns:
        tuple: (image_bytes, file_extension)
    """
    # Remove data URL prefix if present
    if base64_data.startswith('data:'):
        header, data = base64_data.split(',', 1)
        # Extract mime type from header
        mime_type = header.split(':')[1].split(';')[0]
        ext = mime_type.split('/')[-1]
        if ext == 'jpeg':
            ext = 'jpg'
    else:
        data = base64_data
        ext = 'jpg'  # Default extension
    
    # Decode base64 data
    image_bytes = base64.b64decode(data)
    
    # Validate and potentially compress image
    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            # Convert RGBA to RGB if necessary
            if img.mode == 'RGBA':
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[-1])
                img = rgb_img
            
            # Resize if too large (max 1920x1080)
            max_size = (1920, 1080)
            if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Save optimized image
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=85, optimize=True)
            image_bytes = output.getvalue()
    
    except Exception as e:
        logger.warning(f"Image processing failed: {e}, using original")
    
    return image_bytes, ext

def upload_image_local(image_bytes: bytes, file_extension: str, user_id: int) -> str:
    """
    Upload image bytes to local Django media storage.
    
    Args:
        image_bytes: Image data as bytes
        file_extension: File extension (jpg, png, etc.)
        user_id: ID of the user uploading the image
    
    Returns:
        str: URL of the uploaded image
    """
    try:
        # Generate unique filename
        filename = f"posts/{user_id}/{uuid.uuid4().hex}.{file_extension}"
        
        # Save using Django's default storage
        file_content = ContentFile(image_bytes)
        saved_path = default_storage.save(filename, file_content)
        
        # Get URL (works with both local and cloud storage)
        file_url = default_storage.url(saved_path)
        
        # For local development, make sure we have the full URL
        if not file_url.startswith('http'):
            file_url = f"http://localhost:8000{file_url}"
        
        logger.info(f"Image uploaded successfully: {file_url}")
        return file_url
        
    except Exception as e:
        logger.error(f"Failed to upload image locally: {e}")
        raise

def upload_image_to_supabase(image_bytes: bytes, file_extension: str, user_id: int) -> str:
    """
    Upload image bytes to Supabase storage.
    
    Args:
        image_bytes: Image data as bytes
        file_extension: File extension (jpg, png, etc.)
        user_id: ID of the user uploading the image
    
    Returns:
        str: Public URL of the uploaded image
    """
    try:
        from supabase import create_client
        
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        
        # Generate unique filename
        filename = f"posts/{user_id}/{uuid.uuid4().hex}.{file_extension}"
        
        # Upload to Supabase storage
        response = supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).upload(
            filename, image_bytes, file_options={"content-type": f"image/{file_extension}"}
        )
        
        if response.status_code != 200:
            raise Exception(f"Upload failed: {response.json()}")
        
        # Get public URL
        public_url = supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).get_public_url(filename)
        
        logger.info(f"Image uploaded successfully to Supabase: {public_url}")
        return public_url
        
    except Exception as e:
        logger.error(f"Failed to upload image to Supabase: {e}")
        raise

def handle_image_upload(base64_data: str, user_id: int) -> str:
    """
    Complete image upload workflow: process base64 data and upload to storage.
    
    Args:
        base64_data: Base64 encoded image data
        user_id: ID of the user uploading the image
    
    Returns:
        str: Public URL of the uploaded image
    """
    if not base64_data or not base64_data.strip():
        raise ValueError("No image data provided")
    
    # Process the base64 image
    image_bytes, file_extension = process_base64_image(base64_data)
    
    # Try Supabase first, fallback to local storage
    try:
        if (hasattr(settings, 'SUPABASE_URL') and settings.SUPABASE_URL and 
            hasattr(settings, 'SUPABASE_SERVICE_KEY') and settings.SUPABASE_SERVICE_KEY and
            not settings.SUPABASE_URL.startswith('https://your-project')):
            return upload_image_to_supabase(image_bytes, file_extension, user_id)
    except Exception as e:
        logger.warning(f"Supabase upload failed, falling back to local storage: {e}")
    
    # Fallback to local storage
    return upload_image_local(image_bytes, file_extension, user_id)