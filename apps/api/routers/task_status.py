"""
Task status polling endpoint for async operations
Frontend uses React Query to poll this endpoint
"""
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any

import models
from database import get_db
from routers.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    tool_used: str
    result_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None
    progress_percentage: Optional[int] = None


@router.get("/status/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(
    task_id: str,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Poll task status for async operations
    
    Frontend React Query will call this endpoint every 2 seconds
    until status is 'completed' or 'failed'
    
    Security: Verifies task belongs to authenticated user
    """
    try:
        task_uuid = uuid.UUID(task_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    
    # Query task
    task = db.query(models.ProcessingTask).filter(
        models.ProcessingTask.id == task_uuid
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Security check: Verify task belongs to user
    if task.user_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="Access denied: This task belongs to another user"
        )
    
    # Calculate progress percentage (rough estimate)
    progress = None
    if task.status == models.TaskStatus.PENDING:
        progress = 0
    elif task.status == models.TaskStatus.PROCESSING:
        progress = 50  # Could be enhanced with more granular tracking
    elif task.status == models.TaskStatus.COMPLETED:
        progress = 100
    elif task.status == models.TaskStatus.FAILED:
        progress = 0
    
    return TaskStatusResponse(
        task_id=str(task.id),
        status=task.status.value,
        tool_used=task.tool_used,
        result_data=task.result_data,
        error_message=task.error_message,
        created_at=task.created_at.isoformat(),
        completed_at=task.completed_at.isoformat() if task.completed_at else None,
        progress_percentage=progress
    )


@router.get("/list")
async def list_user_tasks(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
    status_filter: Optional[str] = None
):
    """
    List all tasks for the current user
    Optional status filter: pending, processing, completed, failed
    """
    query = db.query(models.ProcessingTask).filter(
        models.ProcessingTask.user_id == user.id
    )
    
    # Apply status filter if provided
    if status_filter:
        try:
            status_enum = models.TaskStatus(status_filter)
            query = query.filter(models.ProcessingTask.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status_filter}")
    
    # Order by most recent first
    tasks = query.order_by(
        models.ProcessingTask.created_at.desc()
    ).limit(limit).offset(offset).all()
    
    return {
        "tasks": [
            {
                "id": str(task.id),
                "tool_used": task.tool_used,
                "status": task.status.value,
                "created_at": task.created_at.isoformat(),
                "completed_at": task.completed_at.isoformat() if task.completed_at else None
            }
            for task in tasks
        ],
        "total": len(tasks)
    }
