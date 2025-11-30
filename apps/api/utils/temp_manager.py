"""
Temporary File Management Utility
Handles creation, tracking, and cleanup of temporary files
"""
import os
import shutil
import tempfile
import time
import uuid
from pathlib import Path
from typing import Optional, List
from contextlib import contextmanager
import asyncio
import atexit

class TempFileManager:
    """Manages temporary files with automatic cleanup"""
    
    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = base_dir or tempfile.gettempdir()
        self.temp_dir = Path(self.base_dir) / "halo_tools"
        self.temp_dir.mkdir(exist_ok=True)
        
        # Track all temp files for cleanup
        self.tracked_files: List[Path] = []
        self.tracked_dirs: List[Path] = []
        
        # Register cleanup on exit
        atexit.register(self.cleanup_all)
    
    def create_temp_file(self, suffix: str = "", prefix: str = "halo_") -> Path:
        """Create a temporary file and track it"""
        unique_id = str(uuid.uuid4())[:8]
        timestamp = int(time.time())
        filename = f"{prefix}{timestamp}_{unique_id}{suffix}"
        filepath = self.temp_dir / filename
        
        # Create empty file
        filepath.touch()
        self.tracked_files.append(filepath)
        
        return filepath
    
    def create_temp_dir(self, prefix: str = "halo_") -> Path:
        """Create a temporary directory and track it"""
        unique_id = str(uuid.uuid4())[:8]
        timestamp = int(time.time())
        dirname = f"{prefix}{timestamp}_{unique_id}"
        dirpath = self.temp_dir / dirname
        dirpath.mkdir(exist_ok=True)
        
        self.tracked_dirs.append(dirpath)
        return dirpath
    
    def cleanup_file(self, filepath: Path, force: bool = False):
        """Delete a specific temporary file"""
        try:
            if filepath.exists():
                if filepath.is_file():
                    filepath.unlink()
                elif filepath.is_dir():
                    shutil.rmtree(filepath)
                
                # Remove from tracking
                if filepath in self.tracked_files:
                    self.tracked_files.remove(filepath)
                if filepath in self.tracked_dirs:
                    self.tracked_dirs.remove(filepath)
                    
        except Exception as e:
            if not force:
                raise e
    
    def cleanup_all(self):
        """Clean up all tracked temporary files"""
        # Clean up files
        for filepath in self.tracked_files[:]:
            try:
                self.cleanup_file(filepath, force=True)
            except:
                pass
        
        # Clean up directories
        for dirpath in self.tracked_dirs[:]:
            try:
                self.cleanup_file(dirpath, force=True)
            except:
                pass
        
        # Clean old files (older than 1 hour)
        self.cleanup_old_files(max_age_hours=1)
    
    def cleanup_old_files(self, max_age_hours: int = 1):
        """Clean up files older than specified hours"""
        if not self.temp_dir.exists():
            return
        
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        
        for item in self.temp_dir.iterdir():
            try:
                if item.is_file() or item.is_dir():
                    # Check modification time
                    age = current_time - item.stat().st_mtime
                    if age > max_age_seconds:
                        if item.is_file():
                            item.unlink()
                        else:
                            shutil.rmtree(item)
            except:
                pass
    
    @contextmanager
    def temp_file(self, suffix: str = "", prefix: str = "halo_"):
        """Context manager for temporary file"""
        filepath = self.create_temp_file(suffix=suffix, prefix=prefix)
        try:
            yield filepath
        finally:
            self.cleanup_file(filepath, force=True)
    
    @contextmanager
    def temp_directory(self, prefix: str = "halo_"):
        """Context manager for temporary directory"""
        dirpath = self.create_temp_dir(prefix=prefix)
        try:
            yield dirpath
        finally:
            self.cleanup_file(dirpath, force=True)
    
    async def async_cleanup_file(self, filepath: Path, delay_seconds: int = 60):
        """Asynchronously cleanup file after delay"""
        await asyncio.sleep(delay_seconds)
        self.cleanup_file(filepath, force=True)
    
    def get_temp_path(self, filename: str) -> Path:
        """Get path for a temp file without creating it"""
        return self.temp_dir / filename


# Global instance
temp_manager = TempFileManager()
