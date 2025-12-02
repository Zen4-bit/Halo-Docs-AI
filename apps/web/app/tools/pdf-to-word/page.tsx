'use client';

import { useState } from 'react';
import { FileText, Download, CheckCircle2, FileType, Layout, Languages, Table2, Image, Trash2, ScanText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { SettingsSection, SettingsToggle, SettingsButtonGroup, SettingsSelect } from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';

const OCR_LANGUAGES = [
  { value: 'eng', label: 'English' },
  { value: 'spa', label: 'Spanish' },
  { value: 'fra', label: 'French' },
  { value: 'deu', label: 'German' },
  { value: 'chi', label: 'Chinese' },
  { value: 'jpn', label: 'Japanese' },
  { value: 'kor', label: 'Korean' },
  { value: 'ara', label: 'Arabic' },
  { value: 'hin', label: 'Hindi' },
];

const CONVERSION_MODES = [
  { value: 'preserve', label: 'Preserve Layout' },
  { value: 'reflow', label: 'Editable Reflow' },
  { value: 'plain', label: 'Plain Text' },
];

const OUTPUT_FORMATS = [
  { value: 'docx', label: 'DOCX' },
  { value: 'rtf', label: 'RTF' },
  { value: 'txt', label: 'TXT' },
];

export default function PDFToWordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // OCR Settings
  const [ocrLanguage, setOcrLanguage] = useState('eng');
  const [enableOcr, setEnableOcr] = useState(false);
  const [deskew, setDeskew] = useState(true);
  // Conversion Mode
  const [conversionMode, setConversionMode] = useState('preserve');
  // Table Options
  const [detectTables, setDetectTables] = useState(true);
  const [extractTablesSeparately, setExtractTablesSeparately] = useState(false);
  // Images
  const [extractImages, setExtractImages] = useState(true);
  const [keepImagesInline, setKeepImagesInline] = useState(true);
  // Cleanup
  const [removeWatermarks, setRemoveWatermarks] = useState(false);
  const [removeHeaderFooter, setRemoveHeaderFooter] = useState(false);
  const [removeExtraSpaces, setRemoveExtraSpaces] = useState(true);
  // Output
  const [outputFormat, setOutputFormat] = useState('docx');

  const handleFilesChange = (files: File[]) => {
    const f = files[0];
    if (f) { setFile(f); setError(null); setResult(null); }
    else { setFile(null); }
  };

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true); setError(null); setProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversionMode', conversionMode);
      formData.append('outputFormat', outputFormat);
      formData.append('enableOcr', String(enableOcr));
      formData.append('ocrLanguage', ocrLanguage);
      formData.append('deskew', String(deskew));
      formData.append('detectTables', String(detectTables));
      formData.append('extractTablesSeparately', String(extractTablesSeparately));
      formData.append('extractImages', String(extractImages));
      formData.append('keepImagesInline', String(keepImagesInline));
      formData.append('removeWatermarks', String(removeWatermarks));
      formData.append('removeHeaderFooter', String(removeHeaderFooter));
      formData.append('removeExtraSpaces', String(removeExtraSpaces));
      const progressInterval = setInterval(() => setProgress(prev => Math.min(prev + 4, 90)), 200);
      const response = await fetch('/api/tools/pdf-to-word', { method: 'POST', body: formData });
      clearInterval(progressInterval); setProgress(100);
      if (!response.ok) throw new Error('Conversion failed');
      const blob = await response.blob();
      const ext = outputFormat === 'docx' ? '.docx' : outputFormat === 'rtf' ? '.rtf' : '.txt';
      setResult({ url: URL.createObjectURL(blob), name: file.name.replace('.pdf', ext), size: blob.size });
    } catch (err: any) { setError(err.message || 'Failed to convert PDF'); }
    finally { setProcessing(false); }
  };

  const handleDownload = () => { if (result) { const a = document.createElement('a'); a.href = result.url; a.download = result.name; a.click(); } };
  const reset = () => { setFile(null); setResult(null); setError(null); setProgress(0); };
  const formatSize = (bytes: number) => bytes < 1024 ? bytes + ' B' : bytes < 1048576 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / 1048576).toFixed(2) + ' MB';

  const settingsPanel = (
    <>
      <SettingsSection title="OCR Settings" icon={<ScanText className="w-4 h-4" />}>
        <SettingsToggle label="Enable OCR" description="Extract text from scanned PDFs" checked={enableOcr} onChange={setEnableOcr} />
        {enableOcr && (
          <>
            <div className="mt-2"><SettingsSelect label="OCR Language" options={OCR_LANGUAGES} value={ocrLanguage} onChange={setOcrLanguage} /></div>
            <div className="mt-2"><SettingsToggle label="Auto deskew" description="Fix tilted scans" checked={deskew} onChange={setDeskew} /></div>
          </>
        )}
      </SettingsSection>
      <SettingsSection title="Conversion Mode" icon={<Layout className="w-4 h-4" />}>
        <SettingsButtonGroup label="Mode" options={CONVERSION_MODES} value={conversionMode} onChange={setConversionMode} />
      </SettingsSection>
      <SettingsSection title="Table Options" icon={<Table2 className="w-4 h-4" />}>
        <SettingsToggle label="Detect tables" description="Identify table structures" checked={detectTables} onChange={setDetectTables} />
        <div className="mt-2"><SettingsToggle label="Extract tables separately" description="Save as separate sections" checked={extractTablesSeparately} onChange={setExtractTablesSeparately} /></div>
      </SettingsSection>
      <SettingsSection title="Images" icon={<Image className="w-4 h-4" />}>
        <SettingsToggle label="Extract images" checked={extractImages} onChange={setExtractImages} />
        <div className="mt-2"><SettingsToggle label="Keep images inline" description="Embed in document" checked={keepImagesInline} onChange={setKeepImagesInline} /></div>
      </SettingsSection>
      <SettingsSection title="Cleanup" icon={<Trash2 className="w-4 h-4" />}>
        <SettingsToggle label="Remove watermarks" checked={removeWatermarks} onChange={setRemoveWatermarks} />
        <div className="mt-2"><SettingsToggle label="Remove header/footer" checked={removeHeaderFooter} onChange={setRemoveHeaderFooter} /></div>
        <div className="mt-2"><SettingsToggle label="Remove extra spaces" checked={removeExtraSpaces} onChange={setRemoveExtraSpaces} /></div>
      </SettingsSection>
      <SettingsSection title="Output Format" icon={<FileType className="w-4 h-4" />}>
        <SettingsButtonGroup label="Format" options={OUTPUT_FORMATS} value={outputFormat} onChange={setOutputFormat} />
      </SettingsSection>
    </>
  );

  return (
    <ToolWorkspaceLayout toolName="PDF to Word" toolIcon={<FileType className="w-5 h-5 text-white" />} toolColor="from-blue-500 to-indigo-500" settingsPanel={settingsPanel}
      actionButton={{ label: 'Convert to Word', onClick: handleConvert, disabled: !file, loading: processing, loadingText: `Converting... ${progress}%`, icon: <FileType className="w-5 h-5" /> }}>
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-6">
          <FileDropzone files={file ? [file] : []} onFilesChange={handleFilesChange} accept=".pdf,application/pdf" multiple={false} title="Drop PDF here" description="or click to browse • PDF files only" icon={<FileText className="w-8 h-8" />} accentColor="blue" disabled={processing} />
          {file && (
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-red-500/20 text-red-400"><FileText className="w-6 h-6" /></div>
                <div className="flex-1"><p className="font-medium text-white">{file.name}</p><p className="text-sm text-white/40">{formatSize(file.size)}</p></div>
                <span className="text-2xl text-white/20">→</span>
                <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400"><FileType className="w-6 h-6" /></div>
                <span className="text-blue-400 font-medium">.docx</span>
              </div>
            </div>
          )}
          <AnimatePresence>{error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</motion.div>}</AnimatePresence>
          {processing && <div className="space-y-2"><div className="w-full h-2 bg-white/10 rounded-full overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} /></div><p className="text-xs text-white/40 text-center">Converting...</p></div>}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center py-8">
            <div className="inline-flex p-6 rounded-3xl bg-green-500/20 mb-6"><CheckCircle2 className="w-16 h-16 text-green-400" /></div>
            <h2 className="text-2xl font-bold text-white mb-2">Conversion Complete!</h2>
            <p className="text-white/60">{result.name} • {formatSize(result.size)}</p>
          </motion.div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleDownload} className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"><Download className="w-5 h-5" />Download Word</button>
            <button onClick={reset} className="px-8 py-4 rounded-xl bg-white/5 text-white/70 font-semibold hover:bg-white/10 transition-colors">Convert Another</button>
          </div>
        </div>
      )}
    </ToolWorkspaceLayout>
  );
}
