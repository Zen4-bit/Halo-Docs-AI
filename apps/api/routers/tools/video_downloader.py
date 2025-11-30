"""
Video Downloader Tool Endpoint
Download videos from URLs using yt-dlp
"""
from fastapi import APIRouter, Form, HTTPException
from fastapi.responses import FileResponse
from typing import Optional

from utils.temp_manager import temp_manager
from utils.video_processor import VideoProcessor
from utils.response_helper import ResponseHelper

router = APIRouter(prefix="/video-downloader", tags=["Media Tools"])

@router.post("")
async def download_video(
    url: str = Form(..., description="Video URL to download"),
    format: str = Form("mp4", description="Output format: mp4, webm, mkv"),
    quality: str = Form("best", description="Quality: best, 1080p, 720p, 480p, 360p, worst"),
    audio_only: bool = Form(False, description="Download audio only (MP3)"),
    max_filesize: Optional[int] = Form(None, description="Maximum file size in MB")
):
    """
    Download videos from various platforms
    
    **Supported Platforms:**
    - YouTube
    - Vimeo
    - Facebook
    - Twitter
    - Instagram
    - TikTok
    - And 1000+ more sites
    
    **Features:**
    - Multiple quality options
    - Format selection
    - Audio-only download
    - File size limit
    - Fast downloads
    
    **Quality Options:**
    - **best**: Highest available quality
    - **1080p**: Full HD
    - **720p**: HD
    - **480p**: SD
    - **360p**: Lower quality
    - **worst**: Lowest quality
    
    **Audio Only:** Downloads as MP3 file
    
    **Note:** Download time depends on video size and your internet connection
    """
    
    try:
        # Check if yt-dlp is available
        if not VideoProcessor.check_ytdlp():
            raise HTTPException(
                status_code=500,
                detail="yt-dlp not installed. Install with: pip install yt-dlp"
            )
        
        if format.lower() not in ['mp4', 'webm', 'mkv'] and not audio_only:
            raise HTTPException(status_code=400, detail="Invalid format. Use mp4, webm, or mkv")
        
        if quality not in ['best', 'worst', '1080p', '720p', '480p', '360p']:
            raise HTTPException(status_code=400, detail="Invalid quality")
        
        # Create output file
        extension = 'mp3' if audio_only else format.lower()
        output_file = temp_manager.create_temp_file(suffix=f"_video.{extension}")
        
        # Download options
        options = {
            'format': format.lower(),
            'quality': quality,
            'audio_only': audio_only,
        }
        
        if max_filesize:
            options['max_filesize'] = max_filesize
        
        # Download video
        downloaded_file = VideoProcessor.download_video(url, output_file, options)
        
        # Return file
        filename = f"video.{extension}" if audio_only else f"video.{format.lower()}"
        return ResponseHelper.file_response(
            downloaded_file,
            filename=filename
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@router.post("/info-url")
async def get_video_info(
    url: str = Form(..., description="Video URL to get info")
):
    """Get video information without downloading"""
    try:
        if not VideoProcessor.check_ytdlp():
            raise HTTPException(
                status_code=500,
                detail="yt-dlp not installed"
            )
        
        info = VideoProcessor.get_video_info(url)
        return ResponseHelper.success_json("Video info retrieved", data=info)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get info: {str(e)}")

@router.get("/info")
async def get_info():
    """Get tool information"""
    return {
        "name": "Video Downloader",
        "description": "Download videos from 1000+ websites",
        "features": [
            "Support for 1000+ sites",
            "Multiple quality options",
            "Format selection",
            "Audio-only mode",
            "File size limit",
            "Fast downloads"
        ],
        "supported_platforms": [
            "YouTube", "Vimeo", "Facebook", "Twitter",
            "Instagram", "TikTok", "Dailymotion", "Reddit",
            "And 1000+ more"
        ],
        "quality_options": {
            "best": "Highest available",
            "1080p": "Full HD",
            "720p": "HD",
            "480p": "SD",
            "360p": "Lower",
            "worst": "Lowest"
        },
        "requirements": ["yt-dlp must be installed"],
        "options": {
            "url": "string - Video URL (required)",
            "format": "string - Output format (mp4/webm/mkv)",
            "quality": "string - Video quality",
            "audio_only": "bool - Download audio only",
            "max_filesize": "int - Max file size in MB"
        }
    }
