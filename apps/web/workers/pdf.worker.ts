// PDF Worker for client-side PDF processing
import { PDFDocument } from 'pdf-lib';

interface PDFTask {
    type: 'merge' | 'split' | 'compress' | 'extract-pages';
    buffer: ArrayBuffer;
    buffers?: ArrayBuffer[]; // For merge
    options: any;
    taskId: string;
}

// Handle messages from main thread
self.addEventListener('message', async (e: MessageEvent) => {
    const task: PDFTask = e.data;

    try {
        let result: ArrayBuffer;

        switch (task.type) {
            case 'merge':
                result = await mergePDFs(task.buffers || []);
                break;
            case 'split':
                result = await splitPDF(task.buffer, task.options);
                break;
            case 'compress':
                result = await compressPDF(task.buffer);
                break;
            case 'extract-pages':
                result = await extractPages(task.buffer, task.options.pages);
                break;
            default:
                throw new Error(`Unknown PDF operation: ${task.type}`);
        }

        self.postMessage({
            type: 'complete',
            data: { result },
            taskId: task.taskId,
        });
    } catch (error: any) {
        self.postMessage({
            type: 'error',
            data: { message: error.message },
            taskId: task.taskId,
        });
    }
});

async function mergePDFs(buffers: ArrayBuffer[]): Promise<ArrayBuffer> {
    const mergedPdf = await PDFDocument.create();

    for (const buffer of buffers) {
        const pdf = await PDFDocument.load(buffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    return mergedPdfBytes.buffer.slice(0) as ArrayBuffer;
}

async function splitPDF(
    buffer: ArrayBuffer,
    options: { startPage: number; endPage: number }
): Promise<ArrayBuffer> {
    const pdf = await PDFDocument.load(buffer);
    const newPdf = await PDFDocument.create();

    const { startPage, endPage } = options;
    const pageIndices = Array.from(
        { length: endPage - startPage + 1 },
        (_, i) => startPage + i - 1 // Convert to 0-indexed
    );

    const copiedPages = await newPdf.copyPages(pdf, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    return pdfBytes.buffer.slice(0) as ArrayBuffer;
}

async function compressPDF(buffer: ArrayBuffer): Promise<ArrayBuffer> {
    const pdf = await PDFDocument.load(buffer);

    // Remove metadata to reduce size
    pdf.setTitle('');
    pdf.setAuthor('');
    pdf.setSubject('');
    pdf.setKeywords([]);
    pdf.setProducer('');
    pdf.setCreator('');

    // Save with compression
    const pdfBytes = await pdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
    });

    return pdfBytes.buffer.slice(0) as ArrayBuffer;
}

async function extractPages(
    buffer: ArrayBuffer,
    pages: number[]
): Promise<ArrayBuffer> {
    const pdf = await PDFDocument.load(buffer);
    const newPdf = await PDFDocument.create();

    // Convert to 0-indexed
    const pageIndices = pages.map((p) => p - 1);

    const copiedPages = await newPdf.copyPages(pdf, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    return pdfBytes.buffer.slice(0) as ArrayBuffer;
}

// Export to prevent TS errors
export { };
