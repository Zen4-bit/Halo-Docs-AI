"""
Storage abstraction layer
Supports: Local storage (dev), Google Cloud Storage (production), AWS S3 (optional)
"""

import os
import uuid
from pathlib import Path
from typing import Dict, Tuple
from datetime import datetime, timedelta

# Check which storage backend to use
USE_LOCAL_STORAGE = os.getenv("USE_LOCAL_STORAGE", "true").lower() == "true"
LOCAL_STORAGE_PATH = os.getenv("LOCAL_STORAGE_PATH", "./uploads")

# Google Cloud Storage
GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME")
GCS_PROJECT_ID = os.getenv("GCS_PROJECT_ID")

# AWS S3 (fallback)
AWS_BUCKET = os.getenv("AWS_BUCKET")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")


class StorageBackend:
    """Abstract storage backend"""
    
    def generate_upload_url(
        self, filename: str, content_type: str, file_size: int
    ) -> Tuple[str, Dict, str]:
        """
        Generate presigned upload URL
        Returns: (upload_url, fields, storage_key)
        """
        raise NotImplementedError
    
    def verify_upload(self, storage_key: str) -> bool:
        """Verify file was uploaded successfully"""
        raise NotImplementedError
    
    def get_download_url(self, storage_key: str, expires_in: int = 3600) -> str:
        """Generate presigned download URL"""
        raise NotImplementedError
    
    def delete_file(self, storage_key: str) -> bool:
        """Delete file from storage"""
        raise NotImplementedError

    def store_bytes(self, filename: str, content: bytes, content_type: str = "application/octet-stream") -> str:
        """
        Persist raw bytes to storage and return the storage key.
        Default implementation raises NotImplementedError; concrete backends must implement.
        """
        raise NotImplementedError


class LocalStorage(StorageBackend):
    """Local filesystem storage (for development)"""
    
    def __init__(self):
        self.base_path = Path(LOCAL_STORAGE_PATH)
        self.base_path.mkdir(parents=True, exist_ok=True)
    
    def generate_upload_url(
        self, filename: str, content_type: str, file_size: int
    ) -> Tuple[str, Dict, str]:
        """Generate local upload endpoint"""
        # Generate unique storage key
        ext = Path(filename).suffix
        storage_key = f"{uuid.uuid4()}{ext}"
        
        # For local storage, we'll use a special upload endpoint
        upload_url = f"http://localhost:8080/api/v1/upload/local"
        
        fields = {
            "key": storage_key,
            "Content-Type": content_type,
        }
        
        return upload_url, fields, storage_key
    
    def verify_upload(self, storage_key: str) -> bool:
        """Check if file exists locally"""
        file_path = self.base_path / storage_key
        return file_path.exists()
    
    def get_download_url(self, storage_key: str, expires_in: int = 3600) -> str:
        """Get local file URL"""
        return f"http://localhost:8080/api/v1/upload/local/{storage_key}"
    
    def delete_file(self, storage_key: str) -> bool:
        """Delete local file"""
        try:
            file_path = self.base_path / storage_key
            if file_path.exists():
                file_path.unlink()
                return True
            return False
        except Exception:
            return False
    
    def get_file_path(self, storage_key: str) -> Path:
        """Get absolute file path"""
        return self.base_path / storage_key
    
    def save_file(self, storage_key: str, content: bytes) -> bool:
        """Save file content"""
        try:
            file_path = self.base_path / storage_key
            file_path.parent.mkdir(parents=True, exist_ok=True)
            file_path.write_bytes(content)
            return True
        except Exception:
            return False

    def store_bytes(self, filename: str, content: bytes, content_type: str = "application/octet-stream") -> str:
        """Persist bytes locally and return the storage key"""
        ext = Path(filename).suffix
        storage_key = f"media/{uuid.uuid4()}{ext}"
        file_path = self.base_path / storage_key
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_bytes(content)
        return storage_key


class GoogleCloudStorage(StorageBackend):
    """Google Cloud Storage backend"""
    
    def __init__(self):
        try:
            from google.cloud import storage
            self.client = storage.Client(project=GCS_PROJECT_ID)
            self.bucket = self.client.bucket(GCS_BUCKET_NAME)
        except Exception as e:
            print(f"⚠️  Google Cloud Storage not configured: {e}")
            print("   Falling back to local storage")
            raise
    
    def generate_upload_url(
        self, filename: str, content_type: str, file_size: int
    ) -> Tuple[str, Dict, str]:
        """Generate GCS signed upload URL"""
        ext = Path(filename).suffix
        storage_key = f"uploads/{uuid.uuid4()}{ext}"
        
        blob = self.bucket.blob(storage_key)
        
        # Generate signed URL for upload (valid for 10 minutes)
        upload_url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=10),
            method="PUT",
            content_type=content_type,
        )
        
        fields = {
            "Content-Type": content_type,
        }
        
        return upload_url, fields, storage_key
    
    def verify_upload(self, storage_key: str) -> bool:
        """Check if file exists in GCS"""
        blob = self.bucket.blob(storage_key)
        return blob.exists()
    
    def get_download_url(self, storage_key: str, expires_in: int = 3600) -> str:
        """Generate GCS signed download URL"""
        blob = self.bucket.blob(storage_key)
        return blob.generate_signed_url(
            version="v4",
            expiration=timedelta(seconds=expires_in),
            method="GET",
        )
    
    def delete_file(self, storage_key: str) -> bool:
        """Delete file from GCS"""
        try:
            blob = self.bucket.blob(storage_key)
            blob.delete()
            return True
        except Exception:
            return False

    def store_bytes(self, filename: str, content: bytes, content_type: str = "application/octet-stream") -> str:
        """Upload in-memory bytes to GCS"""
        ext = Path(filename).suffix
        storage_key = f"media/{uuid.uuid4()}{ext}"
        blob = self.bucket.blob(storage_key)
        blob.upload_from_string(content, content_type=content_type)
        return storage_key


class AWSS3Storage(StorageBackend):
    """AWS S3 Storage backend (optional)"""
    
    def __init__(self):
        try:
            import boto3
            self.s3_client = boto3.client(
                "s3",
                region_name=AWS_REGION,
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            )
            self.bucket = AWS_BUCKET
        except Exception as e:
            print(f"⚠️  AWS S3 not configured: {e}")
            raise
    
    def generate_upload_url(
        self, filename: str, content_type: str, file_size: int
    ) -> Tuple[str, Dict, str]:
        """Generate S3 presigned POST"""
        ext = Path(filename).suffix
        storage_key = f"uploads/{uuid.uuid4()}{ext}"
        
        presigned_post = self.s3_client.generate_presigned_post(
            Bucket=self.bucket,
            Key=storage_key,
            Fields={"Content-Type": content_type},
            Conditions=[
                {"Content-Type": content_type},
                ["content-length-range", 0, file_size + 1000],
            ],
            ExpiresIn=600,  # 10 minutes
        )
        
        return presigned_post["url"], presigned_post["fields"], storage_key
    
    def verify_upload(self, storage_key: str) -> bool:
        """Check if file exists in S3"""
        try:
            self.s3_client.head_object(Bucket=self.bucket, Key=storage_key)
            return True
        except Exception:
            return False
    
    def get_download_url(self, storage_key: str, expires_in: int = 3600) -> str:
        """Generate S3 presigned download URL"""
        return self.s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": storage_key},
            ExpiresIn=expires_in,
        )
    
    def delete_file(self, storage_key: str) -> bool:
        """Delete file from S3"""
        try:
            self.s3_client.delete_object(Bucket=self.bucket, Key=storage_key)
            return True
        except Exception:
            return False

    def store_bytes(self, filename: str, content: bytes, content_type: str = "application/octet-stream") -> str:
        """Upload raw bytes to S3 and return storage key"""
        ext = Path(filename).suffix
        storage_key = f"media/{uuid.uuid4()}{ext}"
        self.s3_client.put_object(
            Bucket=self.bucket,
            Key=storage_key,
            Body=content,
            ContentType=content_type,
        )
        return storage_key


# Initialize storage backend based on configuration
def get_storage_backend() -> StorageBackend:
    """Get configured storage backend"""
    
    if USE_LOCAL_STORAGE:
        print("Using LOCAL storage for development")
        return LocalStorage()
    
    # Try Google Cloud Storage first
    if GCS_BUCKET_NAME and GCS_PROJECT_ID:
        try:
            print("Using GOOGLE CLOUD STORAGE")
            return GoogleCloudStorage()
        except Exception:
            pass
    
    # Fallback to AWS S3
    if AWS_BUCKET:
        try:
            print("Using AWS S3")
            return AWSS3Storage()
        except Exception:
            pass
    
    # Final fallback to local storage
    print("Falling back to LOCAL storage")
    return LocalStorage()


# Global storage instance
storage = get_storage_backend()
