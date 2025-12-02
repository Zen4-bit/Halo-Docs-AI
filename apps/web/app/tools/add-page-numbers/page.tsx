'use client';

import { useState, useCallback } from 'react';
import { FileText, Download, CheckCircle2, Hash, Settings2, Type, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { SettingsSection, SettingsSlider, SettingsToggle, SettingsButtonGroup, SettingsSelect } from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const POSITIONS = [
  { value: 'bottom-center', label: 'Bottom-C' },
  { value: 'bottom-left', label: 'Bottom-L' },
  { value: 'bottom-right', label: 'Bottom-R' },
  { value: 'top-center', label: 'Top-C' },
  { value: 'top-left', label: 'Top-L' },
  { value: 'top-right', label: 'Top-R' },
];

const FORMATS = [
  { value: 'number', label: '1, 2, 3' },
  { value: 'page-of-total', label: 'Page X/Y' },
  { value: 'roman', label: 'I, II, III' },
  { value: 'alpha', label: 'A, B, C' },
];

const FONT_FAMILIES = [
  { value: 'helvetica', label: 'Helvetica' },
  { value: 'times', label: 'Times' },
  { value: 'courier', label: 'Courier' },
];

const COLORS = [
  { value: 'black', label: 'Black' },
  { value: 'gray', label: 'Gray' },
  { value: 'blue', label: 'Blue' },
  { value: 'red', label: 'Red' },
];

export default function AddPageNumbersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Position
  const [position, setPosition] = useState('bottom-center');
  // Start & Skip
  const [startNumber, setStartNumber] = useState(1);
  const [skipPages, setSkipPages] = useState(0);
  // Format
  const [formatStyle, setFormatStyle] = useState('number');
  // Font Settings
  const [fontFamily, setFontFamily] = useState('helvetica');
  const [fontSize, setFontSize] = useState(12);
  const [fontColor, setFontColor] = useState('black');
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);

  const handleFilesChange = (files: File[]) => {
    const f = files[0];
    if (f) { setFile(f); setError(null); setResult(null); }
    else { setFile(null); }
  };

  const handleProcess = useCallback(async () => {
    if (!file) return;
    setProcessing(true); setError(null); setProgress(0);
    try {
      console.log('Add Page Numbers Settings:', {
        position, formatStyle, startNumber, skipPages, fontFamily, fontSize, fontColor, bold, italic
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
        black: [0, 0, 0],
        gray: [0.5, 0.5, 0.5],
        blue: [0.23, 0.51, 0.96],
        red: [0.93, 0.27, 0.27]
      };
      const [r, g, b] = colorMap[fontColor] ?? [0, 0, 0];
      
      setProgress(30);
      
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;
      
      // Format number helper
      const formatNumber = (num: number, total: number): string => {
        if (formatStyle === 'page-of-total') return `Page ${num} of ${total}`;
        if (formatStyle === 'roman') {
          const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
          return romanNumerals[num - 1] ?? String(num);
        }
        if (formatStyle === 'alpha') {
          return String.fromCharCode(64 + num);
        }
        return String(num);
      };
      
      // Add page numbers
      for (let i = 0; i < totalPages; i++) {
        if (i < skipPages) continue;
        
        const page = pages[i];
        if (!page) continue;
        
        const { width, height } = page.getSize();
        const pageNum = startNumber + (i - skipPages);
        const text = formatNumber(pageNum, totalPages - skipPages);
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        
        // Calculate position
        let x = (width - textWidth) / 2; // default center
        let y = 30; // default bottom
        
        if (position.includes('left')) x = 40;
        if (position.includes('right')) x = width - textWidth - 40;
        if (position.includes('top')) y = height - 40;
        
        page.drawText(text, {
          x, y,
          size: fontSize,
          font,
          color: rgb(r, g, b),
        });
        
        setProgress(30 + Math.round(((i + 1) / totalPages) * 60));
      }
      
      setProgress(95);
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      
      setProgress(100);
      setResult({ url: URL.createObjectURL(blob), name: file.name.replace('.pdf', '-numbered.pdf'), size: blob.size });
    } catch (err: any) { 
      console.error('Page numbers error:', err);
      setError(err.message || 'Failed to add page numbers'); 
    }
    finally { setProcessing(false); }
  }, [file, position, formatStyle, startNumber, skipPages, fontFamily, fontSize, fontColor, bold, italic]);

  const handleDownload = () => { if (result) { const a = document.createElement('a'); a.href = result.url; a.download = result.name; a.click(); } };
  const reset = () => { setFile(null); setResult(null); setError(null); setProgress(0); };
  const formatSize = (bytes: number) => bytes < 1024 ? bytes + ' B' : bytes < 1048576 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / 1048576).toFixed(2) + ' MB';

  const settingsPanel = (
    <>
      <SettingsSection title="Position" icon={<Settings2 className="w-4 h-4" />}>
        <SettingsButtonGroup label="Placement" options={POSITIONS} value={position} onChange={setPosition} />
      </SettingsSection>
      <SettingsSection title="Numbering" icon={<Hash className="w-4 h-4" />}>
        <SettingsSlider label="Start number" value={startNumber} onChange={setStartNumber} min={1} max={100} />
        <div className="mt-2"><SettingsSlider label="Skip first X pages" value={skipPages} onChange={setSkipPages} min={0} max={10} /></div>
      </SettingsSection>
      <SettingsSection title="Format" icon={<Hash className="w-4 h-4" />}>
        <SettingsButtonGroup label="Style" options={FORMATS} value={formatStyle} onChange={setFormatStyle} />
      </SettingsSection>
      <SettingsSection title="Font Settings" icon={<Type className="w-4 h-4" />}>
        <SettingsSelect label="Font family" options={FONT_FAMILIES} value={fontFamily} onChange={setFontFamily} />
        <div className="mt-2"><SettingsSlider label="Size" value={fontSize} onChange={setFontSize} min={8} max={24} unit="pt" /></div>
        <div className="mt-2"><SettingsButtonGroup label="Color" options={COLORS} value={fontColor} onChange={setFontColor} /></div>
        <div className="mt-2 flex gap-4">
          <SettingsToggle label="Bold" checked={bold} onChange={setBold} />
          <SettingsToggle label="Italic" checked={italic} onChange={setItalic} />
        </div>
      </SettingsSection>
    </>
  );

  return (
    <ToolWorkspaceLayout toolName="Add Page Numbers" toolIcon={<Hash className="w-5 h-5 text-white" />} toolColor="from-indigo-500 to-purple-500" settingsPanel={settingsPanel}
      actionButton={{ label: 'Add Page Numbers', onClick: handleProcess, disabled: !file, loading: processing, loadingText: `Adding... ${progress}%`, icon: <Hash className="w-5 h-5" /> }}>
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-6">
          <FileDropzone files={file ? [file] : []} onFilesChange={handleFilesChange} accept=".pdf,application/pdf" multiple={false} title="Drop PDF here" description="or click to browse • PDF files only" icon={<FileText className="w-8 h-8" />} accentColor="purple" disabled={processing} />
          {file && (
            <div className="p-6 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-500 dark:text-indigo-400"><FileText className="w-6 h-6" /></div>
                <div className="flex-1"><p className="font-medium text-slate-900 dark:text-white">{file.name}</p><p className="text-sm text-slate-500 dark:text-white/40">{formatSize(file.size)}</p></div>
              </div>
            </div>
          )}
          <AnimatePresence>{error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">{error}</motion.div>}</AnimatePresence>
          {processing && <div className="space-y-2"><div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} /></div><p className="text-xs text-slate-500 dark:text-white/40 text-center">Adding page numbers...</p></div>}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center py-8">
            <div className="inline-flex p-6 rounded-3xl bg-green-500/20 mb-6"><CheckCircle2 className="w-16 h-16 text-green-500 dark:text-green-400" /></div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Page Numbers Added!</h2>
            <p className="text-slate-600 dark:text-white/60">{result.name} • {formatSize(result.size)}</p>
          </motion.div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleDownload} className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"><Download className="w-5 h-5" />Download PDF</button>
            <button onClick={reset} className="px-8 py-4 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">Number Another</button>
          </div>
        </div>
      )}
    </ToolWorkspaceLayout>
  );
}
