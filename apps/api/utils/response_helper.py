"""
Response Helper Utility
Standardized responses for all tool endpoints
"""
from typing import Optional, Dict, Any
from fastapi import Response
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from pathlib import Path
import mimetypes

class ResponseHelper:
    """Helper for creating standardized API responses"""
    
    @staticmethod
    def success_json(
        message: str,
        data: Optional[Dict[str, Any]] = None,
        status_code: int = 200
    ) -> JSONResponse:
        """Return success JSON response"""
        response_data = {
            "success": True,
            "message": message
        }
        if data:
            response_data["data"] = data
        
        return JSONResponse(
            content=response_data,
            status_code=status_code
        )
    
    @staticmethod
    def error_json(
        message: str,
        error_code: Optional[str] = None,
        status_code: int = 400
    ) -> JSONResponse:
        """Return error JSON response"""
        response_data = {
            "success": False,
            "error": message
        }
        if error_code:
            response_data["error_code"] = error_code
        
        return JSONResponse(
            content=response_data,
            status_code=status_code
        )
    
    @staticmethod
    def file_response(
        filepath: Path,
        filename: Optional[str] = None,
        media_type: Optional[str] = None,
        as_attachment: bool = True
    ) -> FileResponse:
        """Return file download response"""
        if not filename:
            filename = filepath.name
        
        if not media_type:
            media_type, _ = mimetypes.guess_type(str(filepath))
            if not media_type:
                media_type = "application/octet-stream"
        
        headers = {}
        if as_attachment:
            headers["Content-Disposition"] = f'attachment; filename="{filename}"'
        
        return FileResponse(
            path=str(filepath),
            filename=filename,
            media_type=media_type,
            headers=headers
        )
    
    @staticmethod
    def stream_response(
        generator,
        media_type: str = "application/octet-stream",
        filename: Optional[str] = None
    ) -> StreamingResponse:
        """Return streaming response"""
        headers = {}
        if filename:
            headers["Content-Disposition"] = f'attachment; filename="{filename}"'
        
        return StreamingResponse(
            generator,
            media_type=media_type,
            headers=headers
        )
    
    @staticmethod
    def processing_response(
        task_id: str,
        estimated_time: Optional[int] = None,
        status_url: Optional[str] = None
    ) -> JSONResponse:
        """Return processing status response for async tasks"""
        data = {
            "success": True,
            "message": "Processing started",
            "task_id": task_id,
            "status": "processing"
        }
        
        if estimated_time:
            data["estimated_time_seconds"] = estimated_time
        
        if status_url:
            data["status_url"] = status_url
        
        return JSONResponse(content=data, status_code=202)
    
    @staticmethod
    def get_mime_type(filename: str) -> str:
        """Get MIME type for filename"""
        mime_type, _ = mimetypes.guess_type(filename)
        return mime_type or "application/octet-stream"
