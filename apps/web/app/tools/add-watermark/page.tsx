'use client';

import { useState, useCallback } from 'react';
import { FileText, Download, CheckCircle2, Droplet, Type, Palette, Image, RotateCw, Files } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { SettingsSection, SettingsSlider, SettingsButtonGroup, SettingsInput, SettingsToggle, SettingsSelect } from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

const POSITIONS = [
  { value: 'center', label: 'Center' },
  { value: 'diagonal', label: 'Diagonal' },
  { value: 'header', label: 'Top' },
  { value: 'footer', label: 'Bottom' },
];

const COLORS = [
  { value: 'gray', label: 'Gray' },
  { value: 'red', label: 'Red' },
  { value: 'blue', label: 'Blue' },
  { value: 'black', label: 'Black' },
];

const FONT_FAMILIES = [
  { value: 'helvetica', label: 'Helvetica' },
  { value: 'times', label: 'Times' },
  { value: 'courier', label: 'Courier' },
];

const PAGE_OPTIONS = [
  { value: 'all', label: 'All Pages' },
  { value: 'odd', label: 'Odd Pages' },
  { value: 'even', label: 'Even Pages' },
  { value: 'range', label: 'Range' },
];

export default function AddWatermarkPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Text Watermark
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [fontFamily, setFontFamily] = useState('helvetica');
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState('gray');
  const [opacity, setOpacity] = useState(30);
  const [rotation, setRotation] = useState(0);
  // Image Watermark
  const [useImageWatermark, setUseImageWatermark] = useState(false);
  const [imageSize, setImageSize] = useState(100);
  const [tileWatermark, setTileWatermark] = useState(false);
  // Position
  const [position, setPosition] = useState('center');
  // Apply to Pages
  const [pageOption, setPageOption] = useState('all');
  const [pageRange, setPageRange] = useState('');

  const handleFilesChange = (files: File[]) => {
    const f = files[0];
    if (f) { setFile(f); setError(null); setResult(null); }
    else { setFile(null); }
  };

  const handleProcess = useCallback(async () => {
    if (!file || !watermarkText.trim()) { setError('Please provide watermark text'); return; }
    setProcessing(true); setError(null); setProgress(0);
    try {
      console.log('Add Watermark Settings:', {
        watermarkText, fontFamily, fontSize, color, opacity, rotation,
        useImageWatermark, imageSize, tileWatermark, position, pageOption, pageRange
      });
      
      setProgress(10);
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      
      setProgress(20);
      
      // Get font
      const font = fontFamily === 'courier' 
        ? await pdfDoc.embedFont(StandardFonts.Courier)
        : fontFamily === 'times' 
          ? await pdfDoc.embedFont(StandardFonts.TimesRoman)
          : await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // Get color RGB
      const colorMap: { [key: string]: [number, number, number] } = {
        gray: [0.6, 0.6, 0.6],
        red: [0.93, 0.27, 0.27],
        blue: [0.23, 0.51, 0.96],
        black: [0, 0, 0]
      };
      const [r, g, b] = colorMap[color] ?? [0.6, 0.6, 0.6];
      
      setProgress(30);
      
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;
      
      // Determine which pages to watermark
      let pagesToWatermark: number[] = [];
      if (pageOption === 'all') {
        pagesToWatermark = pages.map((_, i) => i);
      } else if (pageOption === 'odd') {
        pagesToWatermark = pages.map((_, i) => i).filter(i => i % 2 === 0);
      } else if (pageOption === 'even') {
        pagesToWatermark = pages.map((_, i) => i).filter(i => i % 2 === 1);
      } else if (pageOption === 'range' && pageRange) {
        const parts = pageRange.split('-').map(n => parseInt(n.trim()) - 1);
        const start = parts[0] ?? 0;
        const end = parts[1] ?? start;
        for (let i = start; i <= Math.min(end, totalPages - 1); i++) pagesToWatermark.push(i);
      }
      
      setProgress(40);
      
      // Add watermark to each page
      for (let i = 0; i < pagesToWatermark.length; i++) {
        const pageIndex = pagesToWatermark[i] ?? 0;
        const page = pages[pageIndex];
        if (!page) continue;
        
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
        
        // Calculate position
        let x = (width - textWidth) / 2;
        let y = height / 2;
        let rot = rotation;
        
        if (position === 'header') { y = height - 50; rot = 0; }
        else if (position === 'footer') { y = 30; rot = 0; }
        else if (position === 'diagonal') { rot = -45; }
        
        page.drawText(watermarkText, {
          x, y,
          size: fontSize,
          font,
          color: rgb(r, g, b),
          opacity: opacity / 100,
          rotate: degrees(rot),
        });
        
        setProgress(40 + Math.round((i / pagesToWatermark.length) * 50));
      }
      
      setProgress(95);
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      
      setProgress(100);
      setResult({ url: URL.createObjectURL(blob), name: file.name.replace('.pdf', '-watermarked.pdf'), size: blob.size });
    } catch (err: any) { 
      console.error('Watermark error:', err);
      setError(err.message || 'Failed to add watermark'); 
    }
    finally { setProcessing(false); }
  }, [file, watermarkText, fontFamily, fontSize, color, opacity, rotation, useImageWatermark, imageSize, tileWatermark, position, pageOption, pageRange]);

  const handleDownload = () => { if (result) { const a = document.createElement('a'); a.href = result.url; a.download = result.name; a.click(); } };
  const reset = () => { setFile(null); setResult(null); setError(null); setProgress(0); };
  const formatSize = (bytes: number) => bytes < 1024 ? bytes + ' B' : bytes < 1048576 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / 1048576).toFixed(2) + ' MB';
  const getColorHex = (c: string) => c === 'gray' ? '#9ca3af' : c === 'red' ? '#ef4444' : c === 'blue' ? '#3b82f6' : '#000';

  const settingsPanel = (
    <>
      <SettingsSection title="Text Watermark" icon={<Type className="w-4 h-4" />}>
        <SettingsInput label="Text" value={watermarkText} onChange={setWatermarkText} placeholder="CONFIDENTIAL" />
        <div className="mt-2"><SettingsSelect label="Font" options={FONT_FAMILIES} value={fontFamily} onChange={setFontFamily} /></div>
        <div className="mt-2"><SettingsSlider label="Size" value={fontSize} onChange={setFontSize} min={12} max={200} unit="px" /></div>
        <div className="mt-2"><SettingsButtonGroup label="Color" options={COLORS} value={color} onChange={setColor} /></div>
        <div className="mt-2"><SettingsSlider label="Opacity" value={opacity} onChange={setOpacity} min={10} max={100} unit="%" /></div>
        <div className="mt-2"><SettingsSlider label="Rotation" value={rotation} onChange={setRotation} min={-180} max={180} unit="°" /></div>
      </SettingsSection>
      <SettingsSection title="Image Watermark" icon={<Image className="w-4 h-4" />}>
        <SettingsToggle label="Use image watermark" checked={useImageWatermark} onChange={setUseImageWatermark} />
        {useImageWatermark && (
          <>
            <div className="mt-2"><SettingsSlider label="Size" value={imageSize} onChange={setImageSize} min={10} max={200} unit="%" /></div>
            <div className="mt-2"><SettingsToggle label="Tile watermark" description="Repeat across page" checked={tileWatermark} onChange={setTileWatermark} /></div>
          </>
        )}
      </SettingsSection>
      <SettingsSection title="Position" icon={<Droplet className="w-4 h-4" />}>
        <SettingsButtonGroup label="Placement" options={POSITIONS} value={position} onChange={setPosition} />
      </SettingsSection>
      <SettingsSection title="Apply to Pages" icon={<Files className="w-4 h-4" />}>
        <SettingsButtonGroup label="Pages" options={PAGE_OPTIONS} value={pageOption} onChange={setPageOption} />
        {pageOption === 'range' && (
          <div className="mt-2"><SettingsInput label="Range" value={pageRange} onChange={setPageRange} placeholder="e.g., 1-5, 8" /></div>
        )}
      </SettingsSection>
    </>
  );

  return (
    <ToolWorkspaceLayout toolName="Add Watermark" toolIcon={<Droplet className="w-5 h-5 text-white" />} toolColor="from-sky-500 to-blue-500" settingsPanel={settingsPanel}
      actionButton={{ label: 'Add Watermark', onClick: handleProcess, disabled: !file || !watermarkText.trim(), loading: processing, loadingText: `Adding... ${progress}%`, icon: <Droplet className="w-5 h-5" /> }}>
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-6">
          <FileDropzone files={file ? [file] : []} onFilesChange={handleFilesChange} accept=".pdf,application/pdf" multiple={false} title="Drop PDF here" description="or click to browse • PDF files only" icon={<FileText className="w-8 h-8" />} accentColor="blue" disabled={processing} />
          {file && (
            <div className="p-6 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <h3 className="text-sm font-medium text-slate-700 dark:text-white/80 mb-4">Watermark Preview</h3>
              <div className="relative aspect-[3/4] max-w-xs mx-auto bg-white rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`font-bold text-center whitespace-nowrap ${position === 'diagonal' ? '-rotate-45' : ''}`} style={{ fontSize: `${fontSize / 3}px`, color: getColorHex(color), opacity: opacity / 100 }}>
                    {watermarkText || 'WATERMARK'}
                  </span>
                </div>
                <div className="absolute inset-4 border-2 border-dashed border-gray-300 rounded" />
              </div>
            </div>
          )}
          <AnimatePresence>{error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">{error}</motion.div>}</AnimatePresence>
          {processing && <div className="space-y-2"><div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-sky-500 to-blue-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} /></div><p className="text-xs text-slate-500 dark:text-white/40 text-center">Adding watermark...</p></div>}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center py-8">
            <div className="inline-flex p-6 rounded-3xl bg-green-500/20 mb-6"><CheckCircle2 className="w-16 h-16 text-green-500 dark:text-green-400" /></div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Watermark Added!</h2>
            <p className="text-slate-600 dark:text-white/60">{result.name} • {formatSize(result.size)}</p>
          </motion.div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleDownload} className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"><Download className="w-5 h-5" />Download PDF</button>
            <button onClick={reset} className="px-8 py-4 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">Add Another</button>
          </div>
        </div>
      )}
    </ToolWorkspaceLayout>
  );
}
