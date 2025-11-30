"""
Office Document Processing Utility
Convert Office documents using LibreOffice/unoconv or online APIs
"""
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any
import tempfile
import os

class OfficeProcessor:
    """Office document conversion operations"""
    
    @staticmethod
    def check_libreoffice() -> bool:
        """Check if LibreOffice is installed"""
        try:
            result = subprocess.run(
                ['soffice', '--version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return False
    
    @staticmethod
    def word_to_pdf(
        input_file: Path,
        output_file: Path,
        options: Optional[Dict[str, Any]] = None
    ) -> Path:
        """
        Convert Word document to PDF
        Options:
            - quality: 'high' | 'medium' | 'low'
            - preserve_links: bool
            - preserve_bookmarks: bool
        """
        return OfficeProcessor._convert_to_pdf(input_file, output_file, 'writer', options)
    
    @staticmethod
    def excel_to_pdf(
        input_file: Path,
        output_file: Path,
        options: Optional[Dict[str, Any]] = None
    ) -> Path:
        """
        Convert Excel spreadsheet to PDF
        Options:
            - sheet_name: str (specific sheet to convert)
            - landscape: bool (page orientation)
            - fit_to_page: bool
        """
        return OfficeProcessor._convert_to_pdf(input_file, output_file, 'calc', options)
    
    @staticmethod
    def ppt_to_pdf(
        input_file: Path,
        output_file: Path,
        options: Optional[Dict[str, Any]] = None
    ) -> Path:
        """
        Convert PowerPoint presentation to PDF
        Options:
            - include_notes: bool
            - slides_per_page: int (1, 2, 4, 6, 9)
            - quality: 'high' | 'medium' | 'low'
        """
        return OfficeProcessor._convert_to_pdf(input_file, output_file, 'impress', options)
    
    @staticmethod
    def pdf_to_word(
        input_file: Path,
        output_file: Path,
        options: Optional[Dict[str, Any]] = None
    ) -> Path:
        """
        Convert PDF to Word document
        Options:
            - format: 'docx' | 'doc'
            - preserve_formatting: bool
        """
        options = options or {}
        output_format = options.get('format', 'docx')
        
        # Use LibreOffice for PDF to Word conversion
        try:
            cmd = [
                'soffice',
                '--headless',
                '--convert-to', f'{output_format}:writer_pdf_import',
                '--outdir', str(output_file.parent),
                str(input_file)
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode != 0:
                raise Exception(f"LibreOffice conversion failed: {result.stderr}")
            
            # LibreOffice creates file with same name but different extension
            temp_output = output_file.parent / f"{input_file.stem}.{output_format}"
            if temp_output.exists() and temp_output != output_file:
                temp_output.rename(output_file)
            
            return output_file
            
        except FileNotFoundError:
            raise Exception("LibreOffice not found. Please install LibreOffice.")
        except Exception as e:
            raise Exception(f"PDF to Word conversion failed: {str(e)}")
    
    @staticmethod
    def pdf_to_excel(
        input_file: Path,
        output_file: Path,
        options: Optional[Dict[str, Any]] = None
    ) -> Path:
        """
        Convert PDF to Excel spreadsheet
        Note: This is a basic conversion. Complex PDFs may not convert well.
        Options:
            - format: 'xlsx' | 'xls'
        """
        options = options or {}
        output_format = options.get('format', 'xlsx')
        
        try:
            # Import here to make it optional
            import tabula
            
            # Extract tables from PDF
            tables = tabula.read_pdf(str(input_file), pages='all', multiple_tables=True)
            
            if not tables:
                raise Exception("No tables found in PDF")
            
            # Write to Excel
            with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
                for idx, table in enumerate(tables):
                    sheet_name = f'Table_{idx + 1}'
                    table.to_excel(writer, sheet_name=sheet_name, index=False)
            
            return output_file
            
        except ImportError:
            raise Exception("tabula-py not installed. Install with: pip install tabula-py")
        except Exception as e:
            raise Exception(f"PDF to Excel conversion failed: {str(e)}")
    
    @staticmethod
    def _convert_to_pdf(
        input_file: Path,
        output_file: Path,
        filter_type: str,
        options: Optional[Dict[str, Any]] = None
    ) -> Path:
        """Generic LibreOffice conversion to PDF"""
        options = options or {}
        
        try:
            # Build LibreOffice command
            cmd = [
                'soffice',
                '--headless',
                '--convert-to', 'pdf',
                '--outdir', str(output_file.parent),
                str(input_file)
            ]
            
            # Add filter options
            filter_options = []
            
            if filter_type == 'writer':
                # Word options
                if options.get('preserve_links', True):
                    filter_options.append('ExportLinks=1')
                if options.get('preserve_bookmarks', True):
                    filter_options.append('ExportBookmarks=1')
            
            elif filter_type == 'calc':
                # Excel options
                if options.get('landscape', False):
                    filter_options.append('PageOrientation=1')
            
            elif filter_type == 'impress':
                # PowerPoint options
                quality = options.get('quality', 'high')
                quality_map = {'high': '90', 'medium': '75', 'low': '50'}
                filter_options.append(f'Quality={quality_map.get(quality, "90")}')
            
            if filter_options:
                cmd[3] = f'pdf:writer_pdf_Export:{";".join(filter_options)}'
            
            # Execute conversion
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode != 0:
                raise Exception(f"LibreOffice conversion failed: {result.stderr}")
            
            # LibreOffice creates file with same name but .pdf extension
            temp_output = output_file.parent / f"{input_file.stem}.pdf"
            if temp_output.exists() and temp_output != output_file:
                temp_output.rename(output_file)
            
            if not output_file.exists():
                raise Exception("Conversion completed but output file not found")
            
            return output_file
            
        except FileNotFoundError:
            raise Exception("LibreOffice not found. Please install LibreOffice (soffice command).")
        except subprocess.TimeoutExpired:
            raise Exception("Conversion timed out after 5 minutes")
        except Exception as e:
            raise Exception(f"Office to PDF conversion failed: {str(e)}")
    
    @staticmethod
    def get_document_info(doc_path: Path) -> Dict[str, Any]:
        """Get document information"""
        info = {
            'filename': doc_path.name,
            'size_bytes': doc_path.stat().st_size,
            'extension': doc_path.suffix
        }
        return info
