"""
SQLAlchemy database models for HALO Docs AI
Implements the three core tables: User, Document, ProcessingTask
"""
import uuid
import os
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum as SQLEnum, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum

from database import Base, DATABASE_URL

# Determine if we're using SQLite
USE_SQLITE = DATABASE_URL.startswith("sqlite")


# Enums for type safety
class SubscriptionTier(str, enum.Enum):
    FREE = "free"
    PRO = "pro"
    TEAM = "team"


class UploadStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class User(Base):
    """
    User model - Shadow representation of Clerk users
    Links authentication (Clerk) to local database for relational integrity
    """
    __tablename__ = "users"

    if USE_SQLITE:
        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    else:
        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    clerk_id = Column(String, unique=True, nullable=True, index=True)  # Optional for local auth
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True)  # For local authentication (bcrypt hash)
    full_name = Column(String, nullable=True)
    subscription_tier = Column(
        SQLEnum(SubscriptionTier, name='subscription_tier_enum'),
        default=SubscriptionTier.FREE,
        nullable=False
    )
    created_at = Column(DateTime, default=func.now(), nullable=False)

    # Relationships
    documents = relationship("Document", back_populates="owner", cascade="all, delete-orphan")
    tasks = relationship("ProcessingTask", back_populates="user", cascade="all, delete-orphan")
    chat_conversations = relationship("ChatConversation", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, tier={self.subscription_tier})>"


class Document(Base):
    """
    Document model - Represents user-uploaded files
    Does NOT store file content - only metadata and S3 pointer
    """
    __tablename__ = "documents"

    if USE_SQLITE:
        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
        user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    else:
        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
        user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    filename = Column(String, nullable=False)  # Original filename (e.g., "report.pdf")
    s3_key = Column(String, unique=True, nullable=False, index=True)  # Unique S3 object key
    file_size = Column(Integer, nullable=False)  # Size in bytes
    mime_type = Column(String, nullable=False)  # e.g., "application/pdf"
    upload_status = Column(
        SQLEnum(UploadStatus, name='upload_status_enum'),
        default=UploadStatus.PENDING,
        nullable=False
    )
    created_at = Column(DateTime, default=func.now(), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="documents")
    tasks = relationship("ProcessingTask", back_populates="original_document")

    def __repr__(self):
        return f"<Document(id={self.id}, filename={self.filename}, status={self.upload_status})>"


class ProcessingTask(Base):
    """
    ProcessingTask model - Central job tracker for async operations
    Frontend polls this table's status field
    Celery workers update result_data upon completion
    """
    __tablename__ = "processing_tasks"

    if USE_SQLITE:
        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
        user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
        original_document_id = Column(String, ForeignKey("documents.id"), nullable=False, index=True)
        result_data = Column(Text, nullable=True)  # JSON as text for SQLite
    else:
        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
        user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
        original_document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False, index=True)
        result_data = Column(JSONB, nullable=True)  # Stores final output as JSON
    
    tool_used = Column(String, nullable=False)  # e.g., "summarize", "translate", "redact"
    status = Column(
        SQLEnum(TaskStatus, name='task_status_enum'),
        default=TaskStatus.PENDING,
        nullable=False,
        index=True  # Critical for polling queries
    )
    error_message = Column(String, nullable=True)  # Stores error details if status=failed
    created_at = Column(DateTime, default=func.now(), nullable=False)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="tasks")
    original_document = relationship("Document", back_populates="tasks")

    def __repr__(self):
        return f"<ProcessingTask(id={self.id}, tool={self.tool_used}, status={self.status})>"


class ChatRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatConversation(Base):
    """
    ChatConversation model - Represents a threaded chat between a user and the assistant.
    """
    __tablename__ = "chat_conversations"

    if USE_SQLITE:
        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
        user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    else:
        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
        user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False, default="New chat")
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="chat_conversations")
    messages = relationship(
        "ChatMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at"
    )

    def __repr__(self):
        return f"<ChatConversation(id={self.id}, user_id={self.user_id}, title={self.title})>"


class ChatMessage(Base):
    """
    ChatMessage model - Stores individual messages within a conversation.
    """
    __tablename__ = "chat_messages"

    if USE_SQLITE:
        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
        conversation_id = Column(String, ForeignKey("chat_conversations.id"), nullable=False, index=True)
    else:
        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
        conversation_id = Column(UUID(as_uuid=True), ForeignKey("chat_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    role = Column(SQLEnum(ChatRole, name="chat_role_enum"), nullable=False)
    content = Column(Text, nullable=False)
    token_count = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    conversation = relationship("ChatConversation", back_populates="messages")

    def __repr__(self):
        return f"<ChatMessage(id={self.id}, conversation_id={self.conversation_id}, role={self.role})>"
