"""
Video Processing Utility
Video download and processing using yt-dlp and ffmpeg
"""
import subprocess
import json
from pathlib import Path
from typing import Optional, Dict, Any, List
import re

class VideoProcessor:
    """Video processing operations"""
    
    @staticmethod
    def check_ytdlp() -> bool:
        """Check if yt-dlp is installed"""
        try:
            result = subprocess.run(
                ['yt-dlp', '--version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return False
    
    @staticmethod
    def check_ffmpeg() -> bool:
        """Check if ffmpeg is installed"""
        try:
            result = subprocess.run(
                ['ffmpeg', '-version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return False
    
    @staticmethod
    def download_video(
        url: str,
        output_path: Path,
        options: Optional[Dict[str, Any]] = None
    ) -> Path:
        """
        Download video from URL using yt-dlp
        Options:
            - format: 'mp4' | 'webm' | 'mkv' (default: 'mp4')
            - quality: 'best' | 'worst' | '720p' | '1080p' | '480p' (default: 'best')
            - audio_only: bool (download audio only)
            - subtitles: bool (download subtitles)
            - max_filesize: int (in MB)
        """
        options = options or {}
        
        # Validate URL
        if not VideoProcessor._is_valid_url(url):
            raise ValueError("Invalid video URL")
        
        try:
            # Build yt-dlp command
            cmd = ['yt-dlp']
            
            # Audio only mode
            if options.get('audio_only', False):
                cmd.extend([
                    '-x',  # Extract audio
                    '--audio-format', 'mp3',
                    '--audio-quality', '0'  # Best quality
                ])
            else:
                # Video download
                format_type = options.get('format', 'mp4')
                quality = options.get('quality', 'best')
                
                # Format selection
                if quality == 'best':
                    format_string = 'bestvideo+bestaudio/best'
                elif quality == 'worst':
                    format_string = 'worstvideo+worstaudio/worst'
                elif quality in ['720p', '1080p', '480p', '360p']:
                    height = quality[:-1]
                    format_string = f'bestvideo[height<={height}]+bestaudio/best[height<={height}]'
                else:
                    format_string = 'bestvideo+bestaudio/best'
                
                cmd.extend([
                    '-f', format_string,
                    '--merge-output-format', format_type
                ])
            
            # Max filesize
            if 'max_filesize' in options:
                max_size = options['max_filesize']
                cmd.extend(['--max-filesize', f'{max_size}M'])
            
            # Subtitles
            if options.get('subtitles', False):
                cmd.extend(['--write-sub', '--sub-lang', 'en'])
            
            # Output template
            cmd.extend([
                '-o', str(output_path),
                '--no-playlist',  # Don't download playlists
                '--no-warnings',
                url
            ])
            
            # Execute download
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=600  # 10 minute timeout
            )
            
            if result.returncode != 0:
                raise Exception(f"Download failed: {result.stderr}")
            
            # yt-dlp might add extension, find the actual file
            if not output_path.exists():
                # Look for files with similar name
                parent = output_path.parent
                stem = output_path.stem
                matches = list(parent.glob(f"{stem}.*"))
                if matches:
                    output_path = matches[0]
                else:
                    raise Exception("Downloaded file not found")
            
            return output_path
            
        except FileNotFoundError:
            raise Exception("yt-dlp not found. Please install with: pip install yt-dlp")
        except subprocess.TimeoutExpired:
            raise Exception("Download timed out after 10 minutes")
        except Exception as e:
            raise Exception(f"Video download failed: {str(e)}")
    
    @staticmethod
    def get_video_info(url: str) -> Dict[str, Any]:
        """Get video information without downloading"""
        try:
            cmd = [
                'yt-dlp',
                '--dump-json',
                '--no-playlist',
                url
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                raise Exception(f"Failed to get video info: {result.stderr}")
            
            info = json.loads(result.stdout)
            
            return {
                'title': info.get('title', 'Unknown'),
                'duration': info.get('duration', 0),
                'width': info.get('width', 0),
                'height': info.get('height', 0),
                'filesize': info.get('filesize', 0),
                'ext': info.get('ext', 'mp4'),
                'formats': [
                    {
                        'format_id': f.get('format_id'),
                        'ext': f.get('ext'),
                        'quality': f.get('quality'),
                        'filesize': f.get('filesize')
                    }
                    for f in info.get('formats', [])
                ]
            }
            
        except Exception as e:
            raise Exception(f"Failed to get video info: {str(e)}")
    
    @staticmethod
    def _is_valid_url(url: str) -> bool:
        """Validate video URL"""
        # Basic URL validation
        url_pattern = re.compile(
            r'^https?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        
        return url_pattern.match(url) is not None
    
    @staticmethod
    def convert_video_format(
        input_file: Path,
        output_file: Path,
        options: Optional[Dict[str, Any]] = None
    ) -> Path:
        """
        Convert video format using ffmpeg
        Options:
            - codec: str (video codec, e.g., 'libx264', 'libx265')
            - audio_codec: str (audio codec, e.g., 'aac', 'mp3')
            - quality: int (CRF value, 0-51, lower is better)
            - resolution: str (e.g., '1920x1080', '1280x720')
        """
        options = options or {}
        
        try:
            cmd = ['ffmpeg', '-i', str(input_file)]
            
            # Video codec
            codec = options.get('codec', 'libx264')
            cmd.extend(['-c:v', codec])
            
            # Audio codec
            audio_codec = options.get('audio_codec', 'aac')
            cmd.extend(['-c:a', audio_codec])
            
            # Quality (CRF)
            quality = options.get('quality', 23)
            cmd.extend(['-crf', str(quality)])
            
            # Resolution
            if 'resolution' in options:
                cmd.extend(['-s', options['resolution']])
            
            # Output
            cmd.extend(['-y', str(output_file)])  # -y to overwrite
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=600
            )
            
            if result.returncode != 0:
                raise Exception(f"FFmpeg conversion failed: {result.stderr}")
            
            return output_file
            
        except FileNotFoundError:
            raise Exception("FFmpeg not found. Please install FFmpeg.")
        except Exception as e:
            raise Exception(f"Video conversion failed: {str(e)}")
