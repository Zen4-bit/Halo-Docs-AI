"""
Image Processing Utility
Advanced image operations using Pillow and Sharp-equivalent operations
"""
import io
from pathlib import Path
from typing import Optional, Dict, Any, Tuple
from PIL import Image, ImageOps, ImageFilter, ImageEnhance
import pillow_heif

# Register HEIF opener
pillow_heif.register_heif_opener()

class ImageProcessor:
    """Advanced image processing operations"""
    
    # Supported formats
    FORMATS = {
        'jpeg': 'JPEG',
        'jpg': 'JPEG',
        'png': 'PNG',
        'webp': 'WEBP',
        'gif': 'GIF',
        'bmp': 'BMP',
        'tiff': 'TIFF'
    }
    
    @staticmethod
    def compress_image(
        input_file: Path,
        output_file: Path,
        options: Optional[Dict[str, Any]] = None
    ) -> Path:
        """
        Compress image with quality control
        Options:
            - quality: int (1-100, default: 85)
            - format: str (output format)
            - progressive: bool (for JPEG)
            - optimize: bool
            - max_width: int (resize if larger)
            - max_height: int (resize if larger)
            - strip_metadata: bool
        """
        options = options or {}
        quality = options.get('quality', 85)
        output_format = options.get('format', '').upper()
        
        try:
            with Image.open(input_file) as img:
                # Convert RGBA to RGB if saving as JPEG
                if output_format == 'JPEG' and img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                
                # Resize if max dimensions specified
                max_width = options.get('max_width')
                max_height = options.get('max_height')
                if max_width or max_height:
                    img = ImageProcessor._resize_maintain_aspect(
                        img, max_width, max_height
                    )
                
                # Strip metadata
                data = list(img.getdata())
                image_without_exif = Image.new(img.mode, img.size)
                image_without_exif.putdata(data)
                img = image_without_exif
                
                # Save with compression
                save_kwargs = {
                    'quality': quality,
                    'optimize': options.get('optimize', True)
                }
                
                if output_format == 'JPEG':
                    save_kwargs['progressive'] = options.get('progressive', True)
                elif output_format == 'PNG':
                    save_kwargs['compress_level'] = 9
                elif output_format == 'WEBP':
                    save_kwargs['method'] = 6
                
                img.save(output_file, format=output_format or img.format, **save_kwargs)
                
            return output_file
            
        except Exception as e:
            raise Exception(f"Image compression failed: {str(e)}")
    
    @staticmethod
    def crop_image(
        input_file: Path,
        output_file: Path,
        options: Optional[Dict[str, Any]] = None
    ) -> Path:
        """
        Crop image
        Options:
            - x: int (left position)
            - y: int (top position)
            - width: int (crop width)
            - height: int (crop height)
            - mode: 'pixels' | 'percentage' | 'center' | 'smart'
            - aspect_ratio: str (e.g., '16:9', '4:3')
        """
        options = options or {}
        
        try:
            with Image.open(input_file) as img:
                mode = options.get('mode', 'pixels')
                
                if mode == 'pixels':
                    # Direct pixel coordinates
                    x = options.get('x', 0)
                    y = options.get('y', 0)
                    width = options.get('width', img.width)
                    height = options.get('height', img.height)
                    crop_box = (x, y, x + width, y + height)
                
                elif mode == 'percentage':
                    # Percentage-based crop
                    x_pct = options.get('x', 0) / 100
                    y_pct = options.get('y', 0) / 100
                    width_pct = options.get('width', 100) / 100
                    height_pct = options.get('height', 100) / 100
                    
                    x = int(img.width * x_pct)
                    y = int(img.height * y_pct)
                    width = int(img.width * width_pct)
                    height = int(img.height * height_pct)
                    crop_box = (x, y, x + width, y + height)
                
                elif mode == 'center':
                    # Center crop with specified dimensions
                    width = options.get('width', img.width)
                    height = options.get('height', img.height)
                    
                    left = (img.width - width) // 2
                    top = (img.height - height) // 2
                    crop_box = (left, top, left + width, top + height)
                
                elif mode == 'smart':
                    # Smart crop maintaining aspect ratio
                    aspect_ratio = options.get('aspect_ratio', '1:1')
                    target_ratio = ImageProcessor._parse_aspect_ratio(aspect_ratio)
                    current_ratio = img.width / img.height
                    
                    if current_ratio > target_ratio:
                        # Image is wider, crop width
                        new_width = int(img.height * target_ratio)
                        left = (img.width - new_width) // 2
                        crop_box = (left, 0, left + new_width, img.height)
                    else:
                        # Image is taller, crop height
                        new_height = int(img.width / target_ratio)
                        top = (img.height - new_height) // 2
                        crop_box = (0, top, img.width, top + new_height)
                
                else:
                    raise ValueError(f"Invalid crop mode: {mode}")
                
                cropped = img.crop(crop_box)
                
                # Preserve format
                output_format = options.get('format', img.format)
                cropped.save(output_file, format=output_format)
                
            return output_file
            
        except Exception as e:
            raise Exception(f"Image crop failed: {str(e)}")
    
    @staticmethod
    def resize_image(
        input_file: Path,
        output_file: Path,
        options: Optional[Dict[str, Any]] = None
    ) -> Path:
        """
        Resize image
        Options:
            - width: int (target width)
            - height: int (target height)
            - mode: 'fit' | 'fill' | 'stretch' | 'thumbnail'
            - maintain_aspect: bool (default: True)
            - upscale: bool (allow upscaling, default: True)
            - quality: int (1-100)
            - format: str (output format)
        """
        options = options or {}
        
        try:
            with Image.open(input_file) as img:
                target_width = options.get('width')
                target_height = options.get('height')
                mode = options.get('mode', 'fit')
                maintain_aspect = options.get('maintain_aspect', True)
                upscale = options.get('upscale', True)
                
                if not target_width and not target_height:
                    raise ValueError("Must specify at least width or height")
                
                # Calculate dimensions
                if mode == 'fit':
                    # Fit inside bounds, maintaining aspect ratio
                    resized = ImageProcessor._resize_fit(
                        img, target_width, target_height, upscale
                    )
                
                elif mode == 'fill':
                    # Fill bounds, crop if necessary
                    resized = ImageProcessor._resize_fill(
                        img, target_width, target_height
                    )
                
                elif mode == 'stretch':
                    # Stretch to exact dimensions
                    if not target_width:
                        target_width = img.width
                    if not target_height:
                        target_height = img.height
                    resized = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
                
                elif mode == 'thumbnail':
                    # Thumbnail mode (maintain aspect, no upscale)
                    if not target_width:
                        target_width = img.width
                    if not target_height:
                        target_height = img.height
                    img.thumbnail((target_width, target_height), Image.Resampling.LANCZOS)
                    resized = img
                
                else:
                    raise ValueError(f"Invalid resize mode: {mode}")
                
                # Save with options
                quality = options.get('quality', 90)
                output_format = options.get('format', img.format)
                
                # Convert RGBA to RGB if saving as JPEG
                if output_format == 'JPEG' and resized.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', resized.size, (255, 255, 255))
                    if resized.mode == 'P':
                        resized = resized.convert('RGBA')
                    background.paste(resized, mask=resized.split()[-1] if resized.mode == 'RGBA' else None)
                    resized = background
                
                resized.save(output_file, format=output_format, quality=quality, optimize=True)
                
            return output_file
            
        except Exception as e:
            raise Exception(f"Image resize failed: {str(e)}")
    
    @staticmethod
    def _resize_fit(img: Image.Image, target_width: Optional[int], target_height: Optional[int], upscale: bool) -> Image.Image:
        """Resize to fit within bounds"""
        if not target_width:
            target_width = int(img.width * (target_height / img.height))
        if not target_height:
            target_height = int(img.height * (target_width / img.width))
        
        # Don't upscale if not allowed
        if not upscale and (target_width > img.width or target_height > img.height):
            return img
        
        img.thumbnail((target_width, target_height), Image.Resampling.LANCZOS)
        return img
    
    @staticmethod
    def _resize_fill(img: Image.Image, target_width: int, target_height: int) -> Image.Image:
        """Resize to fill bounds, cropping if necessary"""
        img_ratio = img.width / img.height
        target_ratio = target_width / target_height
        
        if img_ratio > target_ratio:
            # Image is wider, scale by height
            new_height = target_height
            new_width = int(new_height * img_ratio)
        else:
            # Image is taller, scale by width
            new_width = target_width
            new_height = int(new_width / img_ratio)
        
        resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Crop to target size
        left = (new_width - target_width) // 2
        top = (new_height - target_height) // 2
        return resized.crop((left, top, left + target_width, top + target_height))
    
    @staticmethod
    def _resize_maintain_aspect(img: Image.Image, max_width: Optional[int], max_height: Optional[int]) -> Image.Image:
        """Resize maintaining aspect ratio"""
        if max_width and img.width > max_width:
            ratio = max_width / img.width
            new_size = (max_width, int(img.height * ratio))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        if max_height and img.height > max_height:
            ratio = max_height / img.height
            new_size = (int(img.width * ratio), max_height)
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        return img
    
    @staticmethod
    def _parse_aspect_ratio(ratio_str: str) -> float:
        """Parse aspect ratio string like '16:9' to float"""
        parts = ratio_str.split(':')
        if len(parts) != 2:
            raise ValueError(f"Invalid aspect ratio format: {ratio_str}")
        return float(parts[0]) / float(parts[1])
    
    @staticmethod
    def get_image_info(image_path: Path) -> Dict[str, Any]:
        """Get image information"""
        with Image.open(image_path) as img:
            info = {
                'width': img.width,
                'height': img.height,
                'format': img.format,
                'mode': img.mode,
                'size_bytes': image_path.stat().st_size
            }
        return info
