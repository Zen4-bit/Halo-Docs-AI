"""
Google Cloud Storage service for HALO Docs AI
Handles file uploads, downloads, and signed URL generation
"""
import os
import uuid
from datetime import timedelta
from typing import Optional, Tuple
from google.cloud import storage
from google.oauth2 import service_account
import logging

logger = logging.getLogger(__name__)


class GCSService:
    """
    Google Cloud Storage service wrapper
    Provides signed URLs for secure file uploads/downloads
    """
    
    def __init__(self):
        self.bucket_name = os.getenv("GCS_BUCKET_NAME", "halo-docs-uploads")
        self.project_id = os.getenv("GCS_PROJECT_ID")
        self.credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        self.use_local_storage = os.getenv("USE_LOCAL_STORAGE", "true").lower() == "true"
        
        if not self.use_local_storage:
            self._initialize_gcs_client()
        else:
            logger.info("Using local storage mode (GCS disabled)")
            self.client = None
            self.bucket = None
    
    def _initialize_gcs_client(self):
        """Initialize GCS client with service account credentials"""
        try:
            if self.credentials_path and os.path.exists(self.credentials_path):
                credentials = service_account.Credentials.from_service_account_file(
                    self.credentials_path
                )
                self.client = storage.Client(
                    credentials=credentials,
                    project=self.project_id
                )
            else:
                # Use default credentials (for Cloud Run, GCE, etc.)
                self.client = storage.Client(project=self.project_id)
            
            self.bucket = self.client.bucket(self.bucket_name)
            logger.info(f"GCS client initialized for bucket: {self.bucket_name}")
        except Exception as e:
            logger.error(f"Failed to initialize GCS client: {str(e)}")
            raise
    
    def generate_upload_url(
        self,
        user_id: str,
        filename: str,
        content_type: str,
        expiration_minutes: int = 15
    ) -> Tuple[str, str]:
        """
        Generate a signed URL for uploading a file to GCS
        
        Args:
            user_id: User ID for organizing files
            filename: Original filename
            content_type: MIME type of the file
            expiration_minutes: URL expiration time in minutes
        
        Returns:
            Tuple of (signed_url, gcs_path)
        """
        if self.use_local_storage:
            # Return mock URL for local development
            gcs_path = f"uploads/{user_id}/{uuid.uuid4()}/{filename}"
            return f"http://localhost:8080/api/v1/upload/local/{gcs_path}", gcs_path
        
        # Generate unique GCS path
        unique_id = str(uuid.uuid4())
        gcs_path = f"uploads/{user_id}/{unique_id}/{filename}"
        
        # Get blob reference
        blob = self.bucket.blob(gcs_path)
        
        # Generate signed URL for PUT operation
        signed_url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=expiration_minutes),
            method="PUT",
            content_type=content_type
        )
        
        logger.info(f"Generated upload URL for: {gcs_path}")
        return signed_url, gcs_path
    
    def generate_download_url(
        self,
        gcs_path: str,
        expiration_minutes: int = 60
    ) -> str:
        """
        Generate a signed URL for downloading a file from GCS
        
        Args:
            gcs_path: Path to the file in GCS
            expiration_minutes: URL expiration time in minutes
        
        Returns:
            Signed download URL
        """
        if self.use_local_storage:
            # Return local file URL
            return f"http://localhost:8080/api/v1/download/local/{gcs_path}"
        
        # Get blob reference
        blob = self.bucket.blob(gcs_path)
        
        # Check if file exists
        if not blob.exists():
            raise FileNotFoundError(f"File not found in GCS: {gcs_path}")
        
        # Generate signed URL for GET operation
        signed_url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=expiration_minutes),
            method="GET"
        )
        
        logger.info(f"Generated download URL for: {gcs_path}")
        return signed_url
    
    def upload_file_from_memory(
        self,
        file_content: bytes,
        gcs_path: str,
        content_type: str
    ) -> str:
        """
        Upload file content directly to GCS
        
        Args:
            file_content: File content as bytes
            gcs_path: Destination path in GCS
            content_type: MIME type
        
        Returns:
            GCS path of uploaded file
        """
        if self.use_local_storage:
            # Save to local filesystem
            local_path = os.path.join(
                os.getenv("LOCAL_STORAGE_PATH", "./uploads"),
                gcs_path
            )
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            with open(local_path, "wb") as f:
                f.write(file_content)
            logger.info(f"Saved file locally: {local_path}")
            return gcs_path
        
        # Upload to GCS
        blob = self.bucket.blob(gcs_path)
        blob.upload_from_string(file_content, content_type=content_type)
        
        logger.info(f"Uploaded file to GCS: {gcs_path}")
        return gcs_path
    
    def download_file_to_memory(self, gcs_path: str) -> bytes:
        """
        Download file from GCS to memory
        
        Args:
            gcs_path: Path to the file in GCS
        
        Returns:
            File content as bytes
        """
        if self.use_local_storage:
            # Read from local filesystem
            local_path = os.path.join(
                os.getenv("LOCAL_STORAGE_PATH", "./uploads"),
                gcs_path
            )
            with open(local_path, "rb") as f:
                return f.read()
        
        # Download from GCS
        blob = self.bucket.blob(gcs_path)
        
        if not blob.exists():
            raise FileNotFoundError(f"File not found in GCS: {gcs_path}")
        
        return blob.download_as_bytes()
    
    def delete_file(self, gcs_path: str) -> bool:
        """
        Delete a file from GCS
        
        Args:
            gcs_path: Path to the file in GCS
        
        Returns:
            True if deleted successfully
        """
        if self.use_local_storage:
            # Delete from local filesystem
            local_path = os.path.join(
                os.getenv("LOCAL_STORAGE_PATH", "./uploads"),
                gcs_path
            )
            if os.path.exists(local_path):
                os.remove(local_path)
                logger.info(f"Deleted local file: {local_path}")
                return True
            return False
        
        # Delete from GCS
        blob = self.bucket.blob(gcs_path)
        
        if blob.exists():
            blob.delete()
            logger.info(f"Deleted file from GCS: {gcs_path}")
            return True
        
        return False
    
    def file_exists(self, gcs_path: str) -> bool:
        """
        Check if a file exists in GCS
        
        Args:
            gcs_path: Path to the file in GCS
        
        Returns:
            True if file exists
        """
        if self.use_local_storage:
            local_path = os.path.join(
                os.getenv("LOCAL_STORAGE_PATH", "./uploads"),
                gcs_path
            )
            return os.path.exists(local_path)
        
        blob = self.bucket.blob(gcs_path)
        return blob.exists()


# Singleton instance
gcs_service = GCSService()
