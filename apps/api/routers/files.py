"""
File upload and download router
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
from uuid import uuid4
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Storage directory
STORAGE = Path("./storage")
STORAGE.mkdir(parents=True, exist_ok=True)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a file and return its ID
    """
    try:
        # Generate unique file ID
        file_id = str(uuid4())
        file_extension = Path(file.filename).suffix if file.filename else ""
        dest_path = STORAGE / f"{file_id}{file_extension}"
        
        # Save file
        content = await file.read()
        with dest_path.open("wb") as f:
            f.write(content)
        
        logger.info(f"File uploaded: {file_id} ({file.filename})")
        
        return {
            "id": file_id,
            "filename": file.filename,
            "path": str(dest_path),
            "size": len(content)
        }
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/download/{file_id}")
async def download_file(file_id: str):
    """
    Download a file by ID
    """
    try:
        # Find file with this ID
        matching_files = list(STORAGE.glob(f"{file_id}*"))
        
        if not matching_files:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_path = matching_files[0]
        
        return FileResponse(
            path=file_path,
            filename=file_path.name,
            media_type="application/octet-stream"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


def find_file_path(file_id: str) -> Path:
    """
    Helper function to find file path by ID
    """
    matching_files = list(STORAGE.glob(f"{file_id}*"))
    if not matching_files:
        raise HTTPException(status_code=404, detail=f"File not found: {file_id}")
    return matching_files[0]
