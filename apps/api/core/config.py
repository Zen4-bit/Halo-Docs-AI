"""
Configuration management for Vertex AI integration
"""
import os
from typing import Optional
from pydantic import BaseSettings, Field
from functools import lru_cache


class VertexAIConfig(BaseSettings):
    """Vertex AI configuration settings"""
    
    # Google Cloud Project Settings
    project_id: Optional[str] = Field(default="halo-docs-ai", env="GOOGLE_CLOUD_PROJECT")
    location: str = Field(default="us-central1", env="VERTEX_AI_LOCATION")
    service_account: Optional[str] = Field(default=None, env="VERTEX_AI_SERVICE_ACCOUNT")
    
    # API Keys and Authentication
    vertex_ai_api_key: Optional[str] = Field(default=None, env="VERTEX_AI_API_KEY")
    google_application_credentials: Optional[str] = Field(default=None, env="GOOGLE_APPLICATION_CREDENTIALS")
    
    # Model Configuration
    image_generation_model: str = Field(default="imagegeneration@005", env="VERTEX_IMAGE_MODEL")
    video_generation_model: str = Field(default="video@001", env="VERTEX_VIDEO_MODEL")
    
    # Service Configuration
    max_concurrent_requests: int = Field(default=10, env="VERTEX_MAX_CONCURRENT_REQUESTS")
    request_timeout: int = Field(default=300, env="VERTEX_REQUEST_TIMEOUT")
    retry_attempts: int = Field(default=3, env="VERTEX_RETRY_ATTEMPTS")
    
    # Rate Limiting
    rate_limit_per_minute: int = Field(default=60, env="VERTEX_RATE_LIMIT_PER_MINUTE")
    rate_limit_per_hour: int = Field(default=1000, env="VERTEX_RATE_LIMIT_PER_HOUR")
    
    # Storage and Processing
    max_image_size: int = Field(default=50 * 1024 * 1024, env="VERTEX_MAX_IMAGE_SIZE")  # 50MB
    max_video_size: int = Field(default=500 * 1024 * 1024, env="VERTEX_MAX_VIDEO_SIZE")  # 500MB
    
    # Security
    enable_encryption: bool = Field(default=True, env="VERTEX_ENABLE_ENCRYPTION")
    encryption_key: Optional[str] = Field(default=None, env="VERTEX_ENCRYPTION_KEY")
    
    # Monitoring
    enable_logging: bool = Field(default=True, env="VERTEX_ENABLE_LOGGING")
    log_level: str = Field(default="INFO", env="VERTEX_LOG_LEVEL")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


class SecurityConfig(BaseSettings):
    """Security configuration for Vertex AI services"""
    
    # JWT and Authentication
    jwt_secret: str = Field(..., env="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    jwt_expiration_minutes: int = Field(default=30, env="JWT_EXPIRATION_MINUTES")
    
    # API Key Management
    api_key_header: str = Field(default="X-API-Key", env="API_KEY_HEADER")
    require_api_key: bool = Field(default=True, env="REQUIRE_API_KEY")
    
    # CORS and Security Headers
    cors_origins: list = Field(default=["*"], env="CORS_ORIGINS")
    enable_cors: bool = Field(default=True, env="ENABLE_CORS")
    
    # Rate Limiting
    global_rate_limit: int = Field(default=100, env="GLOBAL_RATE_LIMIT")
    per_user_rate_limit: int = Field(default=20, env="PER_USER_RATE_LIMIT")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_vertex_ai_config() -> VertexAIConfig:
    """Get cached Vertex AI configuration"""
    return VertexAIConfig()


@lru_cache()
def get_security_config() -> SecurityConfig:
    """Get cached security configuration"""
    return SecurityConfig()


# Global configuration instances
vertex_config = get_vertex_ai_config()
security_config = get_security_config()