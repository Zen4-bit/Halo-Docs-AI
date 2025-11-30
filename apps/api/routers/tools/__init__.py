"""
Tools Router Module
All document, PDF, Office, and Media tool endpoints
"""
from fastapi import APIRouter

# ============== PDF Tools ==============
from .merge_pdf import router as merge_pdf_router
from .split_pdf import router as split_pdf_router
from .compress_pdf import router as compress_pdf_router
from .pdf_to_word import router as pdf_to_word_router
from .pdf_to_excel import router as pdf_to_excel_router
from .pdf_to_image import router as pdf_to_image_router
from .repair_pdf import router as repair_pdf_router
from .add_watermark import router as add_watermark_router
from .add_page_numbers import router as add_page_numbers_router
from .rotate_pdf import router as rotate_pdf_router

# ============== Office Tools ==============
from .word_to_pdf import router as word_to_pdf_router
from .excel_to_pdf import router as excel_to_pdf_router
from .ppt_to_pdf import router as ppt_to_pdf_router

# ============== Media Tools ==============
from .image_compressor import router as image_compressor_router
from .video_downloader import router as video_downloader_router
from .png_compressor import router as png_compressor_router
from .jpeg_compressor import router as jpeg_compressor_router
from .webp_compressor import router as webp_compressor_router
from .gif_compressor import router as gif_compressor_router
from .crop_image import router as crop_image_router
from .crop_png import router as crop_png_router
from .crop_webp import router as crop_webp_router
from .crop_jpg import router as crop_jpg_router
from .image_resizer import router as image_resizer_router
from .resize_png import router as resize_png_router
from .resize_jpg import router as resize_jpg_router
from .resize_webp import router as resize_webp_router
from .bulk_resize import router as bulk_resize_router

# Main tools router
tools_router = APIRouter(prefix="/api/tools", tags=["Tools"])

# ============== Register PDF Tools (10) ==============
tools_router.include_router(merge_pdf_router)
tools_router.include_router(split_pdf_router)
tools_router.include_router(compress_pdf_router)
tools_router.include_router(pdf_to_word_router)
tools_router.include_router(pdf_to_excel_router)
tools_router.include_router(pdf_to_image_router)
tools_router.include_router(repair_pdf_router)
tools_router.include_router(add_watermark_router)
tools_router.include_router(add_page_numbers_router)
tools_router.include_router(rotate_pdf_router)

# ============== Register Office Tools (3) ==============
tools_router.include_router(word_to_pdf_router)
tools_router.include_router(excel_to_pdf_router)
tools_router.include_router(ppt_to_pdf_router)

# ============== Register Media Tools (15) ==============
tools_router.include_router(image_compressor_router)
tools_router.include_router(video_downloader_router)
tools_router.include_router(png_compressor_router)
tools_router.include_router(jpeg_compressor_router)
tools_router.include_router(webp_compressor_router)
tools_router.include_router(gif_compressor_router)
tools_router.include_router(crop_image_router)
tools_router.include_router(crop_png_router)
tools_router.include_router(crop_webp_router)
tools_router.include_router(crop_jpg_router)
tools_router.include_router(image_resizer_router)
tools_router.include_router(resize_png_router)
tools_router.include_router(resize_jpg_router)
tools_router.include_router(resize_webp_router)
tools_router.include_router(bulk_resize_router)


# ============== Health Check ==============
@tools_router.get("/health")
async def health_check():
    """Health check for tools endpoints"""
    return {
        "status": "healthy",
        "message": "All 28 tools are operational",
        "tools": {
            "pdf_tools": 10,
            "office_tools": 3,
            "media_tools": 15,
            "total": 28
        }
    }


# ============== List All Tools ==============
@tools_router.get("")
async def list_all_tools():
    """List all available tools"""
    return {
        "total_tools": 28,
        "categories": {
            "pdf_tools": {
                "count": 10,
                "tools": [
                    {"name": "Merge PDF", "endpoint": "/api/tools/merge-pdf"},
                    {"name": "Split PDF", "endpoint": "/api/tools/split-pdf"},
                    {"name": "Compress PDF", "endpoint": "/api/tools/compress-pdf"},
                    {"name": "PDF to Word", "endpoint": "/api/tools/pdf-to-word"},
                    {"name": "PDF to Excel", "endpoint": "/api/tools/pdf-to-excel"},
                    {"name": "PDF to Image", "endpoint": "/api/tools/pdf-to-image"},
                    {"name": "Repair PDF", "endpoint": "/api/tools/repair-pdf"},
                    {"name": "Add Watermark", "endpoint": "/api/tools/add-watermark"},
                    {"name": "Add Page Numbers", "endpoint": "/api/tools/add-page-numbers"},
                    {"name": "Rotate PDF", "endpoint": "/api/tools/rotate-pdf"}
                ]
            },
            "office_tools": {
                "count": 3,
                "tools": [
                    {"name": "Word to PDF", "endpoint": "/api/tools/word-to-pdf"},
                    {"name": "Excel to PDF", "endpoint": "/api/tools/excel-to-pdf"},
                    {"name": "PPT to PDF", "endpoint": "/api/tools/ppt-to-pdf"}
                ]
            },
            "media_tools": {
                "count": 15,
                "tools": [
                    {"name": "Image Compressor", "endpoint": "/api/tools/image-compressor"},
                    {"name": "Video Downloader", "endpoint": "/api/tools/video-downloader"},
                    {"name": "PNG Compressor", "endpoint": "/api/tools/png-compressor"},
                    {"name": "JPEG Compressor", "endpoint": "/api/tools/jpeg-compressor"},
                    {"name": "WebP Compressor", "endpoint": "/api/tools/webp-compressor"},
                    {"name": "GIF Compressor", "endpoint": "/api/tools/gif-compressor"},
                    {"name": "Crop Image", "endpoint": "/api/tools/crop-image"},
                    {"name": "Crop PNG", "endpoint": "/api/tools/crop-png"},
                    {"name": "Crop WebP", "endpoint": "/api/tools/crop-webp"},
                    {"name": "Crop JPG", "endpoint": "/api/tools/crop-jpg"},
                    {"name": "Image Resizer", "endpoint": "/api/tools/image-resizer"},
                    {"name": "Resize PNG", "endpoint": "/api/tools/resize-png"},
                    {"name": "Resize JPG", "endpoint": "/api/tools/resize-jpg"},
                    {"name": "Resize WebP", "endpoint": "/api/tools/resize-webp"},
                    {"name": "Bulk Resize", "endpoint": "/api/tools/bulk-resize"}
                ]
            }
        }
    }
