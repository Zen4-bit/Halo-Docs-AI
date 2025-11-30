"""
PDF Utilities Service
Handles traditional PDF operations
"""
import logging
import os
import tempfile
from typing import List, Optional
import PyPDF2
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from io import BytesIO

logger = logging.getLogger(__name__)

class PDFUtilsService:
    """Service for PDF utility operations"""
    
    async def merge_pdfs(self, file_paths: List[str]) -> str:
        """
        Merge multiple PDF files
        
        Args:
            file_paths: List of PDF file paths
        
        Returns:
            Path to merged PDF
        """
        try:
            merger = PyPDF2.PdfMerger()
            
            for pdf_path in file_paths:
                merger.append(pdf_path)
            
            output_path = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf").name
            merger.write(output_path)
            merger.close()
            
            logger.info(f"Merged {len(file_paths)} PDFs into {output_path}")
            return output_path
        
        except Exception as e:
            logger.error(f"PDF merge error: {str(e)}")
            raise
    
    async def split_pdf(
        self,
        file_path: str,
        pages: Optional[str] = None,
        split_by: str = "range"
    ) -> List[str]:
        """
        Split PDF into multiple files
        
        Args:
            file_path: Path to PDF file
            pages: Page range (e.g., "1-3,5,7-9")
            split_by: Split method (range, pages, size)
        
        Returns:
            List of output file paths
        """
        try:
            reader = PyPDF2.PdfReader(file_path)
            output_files = []
            
            if split_by == "range" and pages:
                # Parse page ranges
                page_numbers = self._parse_page_range(pages, len(reader.pages))
                
                writer = PyPDF2.PdfWriter()
                for page_num in page_numbers:
                    writer.add_page(reader.pages[page_num])
                
                output_path = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf").name
                with open(output_path, 'wb') as output_file:
                    writer.write(output_file)
                output_files.append(output_path)
            
            elif split_by == "pages":
                # Split into individual pages
                for i, page in enumerate(reader.pages):
                    writer = PyPDF2.PdfWriter()
                    writer.add_page(page)
                    
                    output_path = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf").name
                    with open(output_path, 'wb') as output_file:
                        writer.write(output_file)
                    output_files.append(output_path)
            
            logger.info(f"Split PDF into {len(output_files)} files")
            return output_files
        
        except Exception as e:
            logger.error(f"PDF split error: {str(e)}")
            raise
    
    async def compress_pdf(
        self,
        file_path: str,
        quality: str = "medium"
    ) -> str:
        """
        Compress PDF to reduce file size
        
        Args:
            file_path: Path to PDF file
            quality: Compression quality (low, medium, high)
        
        Returns:
            Path to compressed PDF
        """
        try:
            reader = PyPDF2.PdfReader(file_path)
            writer = PyPDF2.PdfWriter()
            
            for page in reader.pages:
                page.compress_content_streams()
                writer.add_page(page)
            
            output_path = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf").name
            with open(output_path, 'wb') as output_file:
                writer.write(output_file)
            
            logger.info(f"Compressed PDF: {file_path} -> {output_path}")
            return output_path
        
        except Exception as e:
            logger.error(f"PDF compression error: {str(e)}")
            raise
    
    async def rotate_pdf(
        self,
        file_path: str,
        angle: int = 90,
        pages: Optional[str] = None
    ) -> str:
        """
        Rotate PDF pages
        
        Args:
            file_path: Path to PDF file
            angle: Rotation angle (90, 180, 270)
            pages: Page range to rotate (None = all pages)
        
        Returns:
            Path to rotated PDF
        """
        try:
            reader = PyPDF2.PdfReader(file_path)
            writer = PyPDF2.PdfWriter()
            
            # Determine which pages to rotate
            if pages:
                page_numbers = self._parse_page_range(pages, len(reader.pages))
            else:
                page_numbers = range(len(reader.pages))
            
            for i, page in enumerate(reader.pages):
                if i in page_numbers:
                    page.rotate(angle)
                writer.add_page(page)
            
            output_path = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf").name
            with open(output_path, 'wb') as output_file:
                writer.write(output_file)
            
            logger.info(f"Rotated PDF by {angle} degrees")
            return output_path
        
        except Exception as e:
            logger.error(f"PDF rotation error: {str(e)}")
            raise
    
    async def add_watermark(
        self,
        file_path: str,
        text: str,
        opacity: float = 0.3,
        position: str = "center"
    ) -> str:
        """
        Add watermark to PDF
        
        Args:
            file_path: Path to PDF file
            text: Watermark text
            opacity: Watermark opacity (0-1)
            position: Watermark position
        
        Returns:
            Path to watermarked PDF
        """
        try:
            reader = PyPDF2.PdfReader(file_path)
            writer = PyPDF2.PdfWriter()
            
            # Create watermark
            watermark_buffer = BytesIO()
            c = canvas.Canvas(watermark_buffer, pagesize=letter)
            c.setFillAlpha(opacity)
            
            # Position watermark
            if position == "center":
                c.drawCentredString(300, 400, text)
            elif position == "diagonal":
                c.saveState()
                c.translate(300, 400)
                c.rotate(45)
                c.drawCentredString(0, 0, text)
                c.restoreState()
            
            c.save()
            watermark_buffer.seek(0)
            watermark_pdf = PyPDF2.PdfReader(watermark_buffer)
            watermark_page = watermark_pdf.pages[0]
            
            # Apply watermark to all pages
            for page in reader.pages:
                page.merge_page(watermark_page)
                writer.add_page(page)
            
            output_path = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf").name
            with open(output_path, 'wb') as output_file:
                writer.write(output_file)
            
            logger.info(f"Added watermark to PDF")
            return output_path
        
        except Exception as e:
            logger.error(f"Watermark error: {str(e)}")
            raise
    
    async def ocr_pdf(self, file_path: str) -> str:
        """
        Extract text from scanned PDF using OCR
        
        Args:
            file_path: Path to PDF file
        
        Returns:
            Extracted text
        """
        try:
            # This is a placeholder - actual OCR requires pytesseract and pdf2image
            # For now, try regular text extraction
            reader = PyPDF2.PdfReader(file_path)
            text = ""
            
            for page in reader.pages:
                text += page.extract_text() + "\n\n"
            
            if not text.strip():
                logger.warning("No text extracted. OCR libraries may be needed.")
                return "No text could be extracted. This may be a scanned document requiring OCR."
            
            return text.strip()
        
        except Exception as e:
            logger.error(f"OCR error: {str(e)}")
            raise
    
    async def add_page_numbers(
        self,
        file_path: str,
        position: str = "bottom-center",
        start_number: int = 1
    ) -> str:
        """
        Add page numbers to PDF
        
        Args:
            file_path: Path to PDF file
            position: Number position
            start_number: Starting page number
        
        Returns:
            Path to numbered PDF
        """
        try:
            reader = PyPDF2.PdfReader(file_path)
            writer = PyPDF2.PdfWriter()
            
            for i, page in enumerate(reader.pages):
                # Create page number overlay
                packet = BytesIO()
                c = canvas.Canvas(packet, pagesize=letter)
                
                page_num = start_number + i
                if position == "bottom-center":
                    c.drawCentredString(300, 30, str(page_num))
                elif position == "bottom-right":
                    c.drawString(550, 30, str(page_num))
                elif position == "top-center":
                    c.drawCentredString(300, 770, str(page_num))
                
                c.save()
                packet.seek(0)
                
                overlay_pdf = PyPDF2.PdfReader(packet)
                page.merge_page(overlay_pdf.pages[0])
                writer.add_page(page)
            
            output_path = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf").name
            with open(output_path, 'wb') as output_file:
                writer.write(output_file)
            
            logger.info(f"Added page numbers to PDF")
            return output_path
        
        except Exception as e:
            logger.error(f"Page numbering error: {str(e)}")
            raise
    
    async def repair_pdf(self, file_path: str) -> str:
        """
        Attempt to repair a damaged PDF
        
        Args:
            file_path: Path to PDF file
        
        Returns:
            Path to repaired PDF
        """
        try:
            reader = PyPDF2.PdfReader(file_path, strict=False)
            writer = PyPDF2.PdfWriter()
            
            for page in reader.pages:
                writer.add_page(page)
            
            output_path = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf").name
            with open(output_path, 'wb') as output_file:
                writer.write(output_file)
            
            logger.info(f"Repaired PDF: {file_path}")
            return output_path
        
        except Exception as e:
            logger.error(f"PDF repair error: {str(e)}")
            raise
    
    def _parse_page_range(self, page_range: str, total_pages: int) -> List[int]:
        """Parse page range string into list of page numbers"""
        pages = []
        parts = page_range.split(',')
        
        for part in parts:
            if '-' in part:
                start, end = map(int, part.split('-'))
                pages.extend(range(start - 1, min(end, total_pages)))
            else:
                page_num = int(part) - 1
                if 0 <= page_num < total_pages:
                    pages.append(page_num)
        
        return sorted(set(pages))
