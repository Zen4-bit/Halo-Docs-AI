"""
PDF Processing Utility
Advanced PDF operations using PyPDF2, pypdf, and pikepdf
"""
import io
import os
import subprocess
from pathlib import Path
from typing import List, Optional, Tuple, Dict, Any
from PyPDF2 import PdfReader, PdfWriter, PdfMerger
import pypdf
import pikepdf
from PIL import Image
import img2pdf

class PDFProcessor:
    """Advanced PDF processing operations"""
    
    @staticmethod
    def merge_pdfs(
        input_files: List[Path],
        output_path: Path,
        options: Optional[Dict[str, Any]] = None
    ) -> Path:
        """
        Merge multiple PDFs into one
        Options:
            - remove_metadata: bool (remove all metadata)
            - add_bookmarks: bool (add bookmarks for each file)
            - preserve_forms: bool (preserve form fields)
        """
        options = options or {}
        merger = PdfMerger()
        
        try:
            for idx, pdf_file in enumerate(input_files):
                if options.get('add_bookmarks', False):
                    bookmark_name = pdf_file.stem
                    merger.append(str(pdf_file), outline_item=bookmark_name)
                else:
                    merger.append(str(pdf_file))
            
            # Write merged PDF
            merger.write(str(output_path))
            merger.close()
            
            # Remove metadata if requested
            if options.get('remove_metadata', False):
                PDFProcessor._remove_metadata(output_path)
            
            return output_path
            
        except Exception as e:
            raise Exception(f"PDF merge failed: {str(e)}")
    
    @staticmethod
    def split_pdf(
        input_file: Path,
        output_dir: Path,
        options: Optional[Dict[str, Any]] = None
    ) -> List[Path]:
        """
        Split PDF into multiple files
        Options:
            - mode: 'pages' | 'ranges' | 'every_n'
            - pages: List[int] (specific pages to extract)
            - ranges: List[Tuple[int, int]] (page ranges)
            - every_n: int (split every N pages)
            - preserve_metadata: bool
        """
        options = options or {}
        mode = options.get('mode', 'pages')
        
        reader = PdfReader(str(input_file))
        total_pages = len(reader.pages)
        output_files = []
        
        try:
            if mode == 'pages':
                # Extract specific pages
                pages = options.get('pages', list(range(total_pages)))
                for page_num in pages:
                    if 0 <= page_num < total_pages:
                        writer = PdfWriter()
                        writer.add_page(reader.pages[page_num])
                        
                        output_file = output_dir / f"page_{page_num + 1}.pdf"
                        with open(output_file, 'wb') as f:
                            writer.write(f)
                        output_files.append(output_file)
            
            elif mode == 'ranges':
                # Extract page ranges
                ranges = options.get('ranges', [(0, total_pages)])
                for idx, (start, end) in enumerate(ranges):
                    writer = PdfWriter()
                    for page_num in range(start, min(end, total_pages)):
                        writer.add_page(reader.pages[page_num])
                    
                    output_file = output_dir / f"range_{idx + 1}_{start + 1}-{end}.pdf"
                    with open(output_file, 'wb') as f:
                        writer.write(f)
                    output_files.append(output_file)
            
            elif mode == 'every_n':
                # Split every N pages
                every_n = options.get('every_n', 1)
                for idx in range(0, total_pages, every_n):
                    writer = PdfWriter()
                    end = min(idx + every_n, total_pages)
                    for page_num in range(idx, end):
                        writer.add_page(reader.pages[page_num])
                    
                    output_file = output_dir / f"split_{(idx // every_n) + 1}.pdf"
                    with open(output_file, 'wb') as f:
                        writer.write(f)
                    output_files.append(output_file)
            
            return output_files
            
        except Exception as e:
            raise Exception(f"PDF split failed: {str(e)}")
    
    @staticmethod
    def compress_pdf(
        input_file: Path,
        output_file: Path,
        options: Optional[Dict[str, Any]] = None
    ) -> Path:
        """
        Compress PDF using Ghostscript
        Options:
            - quality: 'low' | 'medium' | 'high' | 'max' (default: 'medium')
            - remove_metadata: bool
            - remove_annotations: bool
            - grayscale: bool (convert to grayscale)
        """
        options = options or {}
        quality = options.get('quality', 'medium')
        
        # Ghostscript quality settings
        quality_settings = {
            'low': '/screen',      # 72 dpi
            'medium': '/ebook',    # 150 dpi
            'high': '/printer',    # 300 dpi
            'max': '/prepress'     # 300 dpi with color preservation
        }
        
        gs_quality = quality_settings.get(quality, '/ebook')
        
        # Build Ghostscript command
        gs_cmd = [
            'gs',
            '-sDEVICE=pdfwrite',
            '-dCompatibilityLevel=1.4',
            f'-dPDFSETTINGS={gs_quality}',
            '-dNOPAUSE',
            '-dQUIET',
            '-dBATCH',
            f'-sOutputFile={output_file}',
        ]
        
        # Additional options
        if options.get('grayscale', False):
            gs_cmd.extend([
                '-sColorConversionStrategy=Gray',
                '-dProcessColorModel=/DeviceGray'
            ])
        
        if options.get('remove_annotations', False):
            gs_cmd.append('-dPrinted=false')
        
        gs_cmd.append(str(input_file))
        
        try:
            # Try Ghostscript first
            result = subprocess.run(gs_cmd, capture_output=True, text=True, timeout=300)
            if result.returncode != 0:
                raise Exception(f"Ghostscript error: {result.stderr}")
            
            # Remove metadata if requested
            if options.get('remove_metadata', False):
                PDFProcessor._remove_metadata(output_file)
            
            return output_file
            
        except FileNotFoundError:
            # Fallback to pikepdf compression
            return PDFProcessor._compress_with_pikepdf(input_file, output_file, options)
        except Exception as e:
            raise Exception(f"PDF compression failed: {str(e)}")
    
    @staticmethod
    def _compress_with_pikepdf(
        input_file: Path,
        output_file: Path,
        options: Dict[str, Any]
    ) -> Path:
        """Fallback compression using pikepdf"""
        with pikepdf.open(input_file) as pdf:
            if options.get('remove_metadata', False):
                pdf.docinfo.clear()
                if '/Metadata' in pdf.Root:
                    del pdf.Root.Metadata
            
            pdf.save(
                output_file,
                compress_streams=True,
                object_stream_mode=pikepdf.ObjectStreamMode.generate
            )
        
        return output_file
    
    @staticmethod
    def pdf_to_images(
        input_file: Path,
        output_dir: Path,
        options: Optional[Dict[str, Any]] = None
    ) -> List[Path]:
        """
        Convert PDF pages to images
        Options:
            - format: 'png' | 'jpg' | 'webp' (default: 'png')
            - dpi: int (default: 300)
            - quality: int (for jpg, 1-100)
            - pages: List[int] (specific pages, default: all)
        """
        options = options or {}
        image_format = options.get('format', 'png').lower()
        dpi = options.get('dpi', 300)
        quality = options.get('quality', 95)
        
        try:
            # Use pdf2image
            from pdf2image import convert_from_path
            
            pages = options.get('pages')
            if pages:
                images = convert_from_path(
                    str(input_file),
                    dpi=dpi,
                    first_page=min(pages) + 1,
                    last_page=max(pages) + 1
                )
            else:
                images = convert_from_path(str(input_file), dpi=dpi)
            
            output_files = []
            for idx, image in enumerate(images):
                page_num = pages[idx] if pages and idx < len(pages) else idx
                output_file = output_dir / f"page_{page_num + 1}.{image_format}"
                
                if image_format == 'jpg':
                    image.save(output_file, 'JPEG', quality=quality, optimize=True)
                elif image_format == 'webp':
                    image.save(output_file, 'WEBP', quality=quality)
                else:
                    image.save(output_file, 'PNG', optimize=True)
                
                output_files.append(output_file)
            
            return output_files
            
        except ImportError:
            raise Exception("pdf2image library not installed. Install with: pip install pdf2image")
        except Exception as e:
            raise Exception(f"PDF to image conversion failed: {str(e)}")
    
    @staticmethod
    def _remove_metadata(pdf_path: Path):
        """Remove all metadata from PDF"""
        with pikepdf.open(pdf_path, allow_overwriting_input=True) as pdf:
            pdf.docinfo.clear()
            if '/Metadata' in pdf.Root:
                del pdf.Root.Metadata
            pdf.save()
    
    @staticmethod
    def get_pdf_info(pdf_path: Path) -> Dict[str, Any]:
        """Get PDF information"""
        reader = PdfReader(str(pdf_path))
        info = {
            'pages': len(reader.pages),
            'metadata': dict(reader.metadata) if reader.metadata else {},
            'encrypted': reader.is_encrypted,
            'size_bytes': pdf_path.stat().st_size
        }
        return info
