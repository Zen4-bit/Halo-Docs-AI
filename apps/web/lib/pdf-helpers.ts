// Client-side PDF helpers - re-export from client module
export { 
  PDFProcessor, 
  formatFileSize, 
  validatePDFFile,
  type PDFOptions 
} from './pdf-helpers-client';

// Server-side functions are not available in the browser
// Use server actions for compress and repair operations
