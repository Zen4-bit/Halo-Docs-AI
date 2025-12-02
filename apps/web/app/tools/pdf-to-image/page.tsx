'use client';

import { useState, useCallback } from 'react';
import { FileText, Download, CheckCircle2, Image, Monitor, Sparkles, Maximize2, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { SettingsSection, SettingsSlider, SettingsButtonGroup, SettingsToggle, SettingsInput } from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

const IMAGE_FORMATS = [
  { value: 'jpg', label: 'JPG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' },
];

export default function PDFToImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Output settings
  const [outputFormat, setOutputFormat] = useState('png');
  const [dpi, setDpi] = useState(150);
  const [quality, setQuality] = useState(90);
  const [pageRange, setPageRange] = useState('');
  // Image Enhancements
  const [autoCrop, setAutoCrop] = useState(false);
  const [deskew, setDeskew] = useState(false);
  const [sharpen, setSharpen] = useState(false);
  const [denoise, setDenoise] = useState(false);
  const [grayscale, setGrayscale] = useState(false);
  // Resize Options
  const [resizeWidth, setResizeWidth] = useState(0);
  const [resizeHeight, setResizeHeight] = useState(0);
  const [resizePercent, setResizePercent] = useState(100);

  const handleFilesChange = (files: File[]) => {
    const f = files[0];
    if (f) { setFile(f); setError(null); setResult(null); }
    else { setFile(null); }
  };

  const handleConvert = useCallback(async () => {
    if (!file) return;
    setProcessing(true); setError(null); setProgress(0);
    try {
      console.log('PDF to Image Settings:', {
        outputFormat, dpi, quality, pageRange, autoCrop, deskew, sharpen, denoise, grayscale, resizeWidth, resizeHeight, resizePercent
      });
      
      setProgress(5);
      const arrayBuffer = await file.arrayBuffer();
      
      // Calculate scale based on DPI (72 DPI is baseline)
      const scale = (dpi / 72) * (resizePercent / 100);
      
      setProgress(10);
      
      // Load PDF with PDF.js
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;
      
      // Parse page range or use all pages
      let pagesToConvert: number[] = [];
      if (pageRange) {
        const ranges = pageRange.split(',');
        for (const r of ranges) {
          if (r.includes('-')) {
            const parts = r.split('-').map(n => parseInt(n.trim()));
            const start = parts[0] ?? 1;
            const end = parts[1] ?? numPages;
            for (let i = start; i <= Math.min(end, numPages); i++) pagesToConvert.push(i);
          } else {
            pagesToConvert.push(parseInt(r.trim()));
          }
        }
      } else {
        pagesToConvert = Array.from({ length: numPages }, (_, i) => i + 1);
      }
      
      setProgress(15);
      
      const zip = new JSZip();
      const mimeType = outputFormat === 'png' ? 'image/png' : outputFormat === 'webp' ? 'image/webp' : 'image/jpeg';
      
      // Convert each page
      for (let i = 0; i < pagesToConvert.length; i++) {
        const pageNum = pagesToConvert[i] ?? 1;
        setProgress(15 + Math.round((i / pagesToConvert.length) * 70));
        
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');
        
        canvas.width = resizeWidth > 0 ? resizeWidth : viewport.width;
        canvas.height = resizeHeight > 0 ? resizeHeight : viewport.height;
        
        // Apply filters
        if (grayscale) ctx.filter = 'grayscale(100%)';
        if (sharpen) ctx.filter += ' contrast(1.1)';
        
        await page.render({ canvasContext: ctx, viewport }).promise;
        
        // Get image data
        const imageData = canvas.toDataURL(mimeType, quality / 100);
        const base64Data = imageData.split(',')[1];
        
        if (base64Data) {
          zip.file(`page-${pageNum}.${outputFormat}`, base64Data, { base64: true });
        }
      }
      
      setProgress(90);
      
      // Generate ZIP if multiple pages, or single image
      let resultBlob: Blob;
      let resultName: string;
      
      if (pagesToConvert.length === 1) {
        const pageNum = pagesToConvert[0] ?? 1;
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');
        
        canvas.width = resizeWidth > 0 ? resizeWidth : viewport.width;
        canvas.height = resizeHeight > 0 ? resizeHeight : viewport.height;
        if (grayscale) ctx.filter = 'grayscale(100%)';
        
        await page.render({ canvasContext: ctx, viewport }).promise;
        
        resultBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Failed')), mimeType, quality / 100);
        });
        resultName = file.name.replace('.pdf', `.${outputFormat}`);
      } else {
        resultBlob = await zip.generateAsync({ type: 'blob' });
        resultName = file.name.replace('.pdf', '-images.zip');
      }
      
      setProgress(100);
      setResult({ url: URL.createObjectURL(resultBlob), name: resultName, size: resultBlob.size });
    } catch (err: any) { 
      console.error('Conversion error:', err);
      setError(err.message || 'Failed to convert PDF'); 
    }
    finally { setProcessing(false); }
  }, [file, outputFormat, dpi, quality, pageRange, autoCrop, deskew, sharpen, denoise, grayscale, resizeWidth, resizeHeight, resizePercent]);

  const handleDownload = () => { if (result) { const a = document.createElement('a'); a.href = result.url; a.download = result.name; a.click(); } };
  const reset = () => { setFile(null); setResult(null); setError(null); setProgress(0); };
  const formatSize = (bytes: number) => bytes < 1024 ? bytes + ' B' : bytes < 1048576 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / 1048576).toFixed(2) + ' MB';

  const settingsPanel = (
    <>
      <SettingsSection title="Output Format" icon={<Image className="w-4 h-4" />}>
        <SettingsButtonGroup label="Format" options={IMAGE_FORMATS} value={outputFormat} onChange={setOutputFormat} />
      </SettingsSection>
      <SettingsSection title="Resolution" icon={<Monitor className="w-4 h-4" />}>
        <SettingsSlider label="DPI" value={dpi} onChange={setDpi} min={30} max={600} unit=" DPI" />
        {outputFormat !== 'png' && (
          <div className="mt-2"><SettingsSlider label="Quality" value={quality} onChange={setQuality} min={10} max={100} unit="%" /></div>
        )}
      </SettingsSection>
      <SettingsSection title="Pages" icon={<Hash className="w-4 h-4" />}>
        <SettingsInput label="Page range" value={pageRange} onChange={setPageRange} placeholder="e.g., 1-5 (empty = all)" />
      </SettingsSection>
      <SettingsSection title="Image Enhancements" icon={<Sparkles className="w-4 h-4" />}>
        <SettingsToggle label="Auto crop" description="Remove whitespace" checked={autoCrop} onChange={setAutoCrop} />
        <div className="mt-2"><SettingsToggle label="Deskew" description="Fix tilted pages" checked={deskew} onChange={setDeskew} /></div>
        <div className="mt-2"><SettingsToggle label="Sharpen" checked={sharpen} onChange={setSharpen} /></div>
        <div className="mt-2"><SettingsToggle label="Denoise" checked={denoise} onChange={setDenoise} /></div>
        <div className="mt-2"><SettingsToggle label="Convert to grayscale" checked={grayscale} onChange={setGrayscale} /></div>
      </SettingsSection>
      <SettingsSection title="Resize" icon={<Maximize2 className="w-4 h-4" />}>
        <SettingsSlider label="Scale" value={resizePercent} onChange={setResizePercent} min={10} max={200} unit="%" />
      </SettingsSection>
    </>
  );

  return (
    <ToolWorkspaceLayout toolName="PDF to Image" toolIcon={<Image className="w-5 h-5 text-white" />} toolColor="from-purple-500 to-violet-500" settingsPanel={settingsPanel}
      actionButton={{ label: `Convert to ${outputFormat.toUpperCase()}`, onClick: handleConvert, disabled: !file, loading: processing, loadingText: `Converting... ${progress}%`, icon: <Image className="w-5 h-5" /> }}>
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-6">
          <FileDropzone files={file ? [file] : []} onFilesChange={handleFilesChange} accept=".pdf,application/pdf" multiple={false} title="Drop PDF here" description="or click to browse • PDF files only" icon={<FileText className="w-8 h-8" />} accentColor="purple" disabled={processing} />
          {file && (
            <div className="p-6 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-red-500/20 text-red-400"><FileText className="w-6 h-6" /></div>
                <div className="flex-1"><p className="font-medium text-slate-900 dark:text-white">{file.name}</p><p className="text-sm text-slate-500 dark:text-white/40">{formatSize(file.size)}</p></div>
                <span className="text-2xl text-slate-300 dark:text-white/20">→</span>
                <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400"><Image className="w-6 h-6" /></div>
                <span className="text-purple-500 dark:text-purple-400 font-medium">.{outputFormat.toUpperCase()}</span>
              </div>
            </div>
          )}
          <AnimatePresence>{error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">{error}</motion.div>}</AnimatePresence>
          {processing && <div className="space-y-2"><div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-purple-500 to-violet-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} /></div><p className="text-xs text-slate-500 dark:text-white/40 text-center">Converting...</p></div>}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center py-8">
            <div className="inline-flex p-6 rounded-3xl bg-green-500/20 mb-6"><CheckCircle2 className="w-16 h-16 text-green-500 dark:text-green-400" /></div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Conversion Complete!</h2>
            <p className="text-slate-600 dark:text-white/60">{result.name} • {formatSize(result.size)}</p>
          </motion.div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleDownload} className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"><Download className="w-5 h-5" />Download Images</button>
            <button onClick={reset} className="px-8 py-4 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">Convert Another</button>
          </div>
        </div>
      )}
    </ToolWorkspaceLayout>
  );
}
