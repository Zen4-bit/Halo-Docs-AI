'use client';

import { useState } from 'react';
import { 
  FileText, Download, CheckCircle2, FileType2, Type, Layout,
  Minimize2, BookOpen, FileCheck, Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { 
  SettingsSection, 
  SettingsToggle, 
  SettingsSlider,
  SettingsSelect,
  SettingsButtonGroup
} from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';

export default function WordToPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Layout & Formatting
  const [preserveLayout, setPreserveLayout] = useState(true);
  const [embedFonts, setEmbedFonts] = useState(true);
  const [highQuality, setHighQuality] = useState(true);
  
  // Page Settings
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'legal'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margins, setMargins] = useState<'normal' | 'narrow' | 'wide'>('normal');
  
  // Compression
  const [compression, setCompression] = useState<'none' | 'low' | 'medium' | 'high'>('medium');

  const handleFilesChange = (files: File[]) => {
    const selectedFile = files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    } else {
      setFile(null);
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('preserveLayout', String(preserveLayout));
      formData.append('embedFonts', String(embedFonts));
      formData.append('highQuality', String(highQuality));
      formData.append('pageSize', pageSize);
      formData.append('orientation', orientation);
      formData.append('margins', margins);
      formData.append('compression', compression);

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 4, 90));
      }, 200);

      const response = await fetch('/api/tools/word-to-pdf', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) throw new Error('Conversion failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResult({ url, name: file.name.replace(/\.(doc|docx)$/i, '.pdf'), size: blob.size });
    } catch (err: any) {
      setError(err.message || 'Failed to convert document');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      const a = document.createElement('a');
      a.href = result.url;
      a.download = result.name;
      a.click();
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  // Settings Panel
  const settingsPanel = (
    <>
      {/* Layout & Formatting */}
      <SettingsSection title="Formatting" icon={<Layout className="w-4 h-4" />}>
        <SettingsToggle
          label="Preserve layout"
          description="Keep original document formatting"
          checked={preserveLayout}
          onChange={setPreserveLayout}
        />
        <SettingsToggle
          label="Embed fonts"
          description="Include fonts in the PDF"
          checked={embedFonts}
          onChange={setEmbedFonts}
          icon={<Type className="w-3 h-3" />}
        />
        <SettingsToggle
          label="High quality"
          description="Best quality images and text"
          checked={highQuality}
          onChange={setHighQuality}
        />
      </SettingsSection>

      {/* Page Settings */}
      <SettingsSection title="Page Settings" icon={<BookOpen className="w-4 h-4" />} defaultOpen={false}>
        <SettingsButtonGroup
          label="Page size"
          value={pageSize}
          onChange={(v) => setPageSize(v as typeof pageSize)}
          options={[
            { value: 'a4', label: 'A4' },
            { value: 'letter', label: 'Letter' },
            { value: 'legal', label: 'Legal' },
          ]}
        />
        <div className="mt-3">
          <SettingsButtonGroup
            label="Orientation"
            value={orientation}
            onChange={(v) => setOrientation(v as typeof orientation)}
            options={[
              { value: 'portrait', label: 'Portrait' },
              { value: 'landscape', label: 'Landscape' },
            ]}
          />
        </div>
        <div className="mt-3">
          <SettingsButtonGroup
            label="Margins"
            value={margins}
            onChange={(v) => setMargins(v as typeof margins)}
            options={[
              { value: 'narrow', label: 'Narrow' },
              { value: 'normal', label: 'Normal' },
              { value: 'wide', label: 'Wide' },
            ]}
          />
        </div>
      </SettingsSection>

      {/* Compression */}
      <SettingsSection title="Compression" icon={<Minimize2 className="w-4 h-4" />} defaultOpen={false}>
        <SettingsButtonGroup
          label="Level"
          value={compression}
          onChange={(v) => setCompression(v as typeof compression)}
          options={[
            { value: 'none', label: 'None' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Med' },
            { value: 'high', label: 'High' },
          ]}
        />
        <p className="text-xs text-slate-400 dark:text-white/30 mt-2">Higher compression = smaller file size</p>
      </SettingsSection>
    </>
  );

  return (
    <ToolWorkspaceLayout
      toolName="Word to PDF"
      toolIcon={<FileType2 className="w-5 h-5 text-white" />}
      toolColor="from-blue-600 to-blue-400"
      settingsPanel={settingsPanel}
      actionButton={{
        label: 'Convert to PDF',
        onClick: handleConvert,
        disabled: !file,
        loading: processing,
        loadingText: `Converting... ${progress}%`,
        icon: <FileText className="w-5 h-5" />,
      }}
    >
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* File Dropzone */}
          <FileDropzone
            files={file ? [file] : []}
            onFilesChange={handleFilesChange}
            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            multiple={false}
            title="Drop Word document here"
            description="or click to browse • DOC, DOCX files"
            icon={<FileType2 className="w-8 h-8" />}
            accentColor="blue"
            disabled={processing}
          />

          {/* Conversion Preview */}
          {file && (
            <div className="p-6 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <div className="p-4 rounded-xl bg-blue-500/20 text-blue-400 inline-block mb-2">
                    <FileType2 className="w-8 h-8" />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-white/60">.{file.name.split('.').pop()?.toUpperCase()}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-slate-300 dark:bg-white/20" />
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-slate-400 dark:text-white/40"
                  >
                    →
                  </motion.div>
                  <div className="w-8 h-0.5 bg-slate-300 dark:bg-white/20" />
                </div>
                
                <div className="text-center">
                  <div className="p-4 rounded-xl bg-red-500/20 text-red-400 inline-block mb-2">
                    <FileText className="w-8 h-8" />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-white/60">.PDF</p>
                </div>
              </div>
              
              <p className="text-xs text-slate-400 dark:text-white/30 text-center mt-4">
                {formatSize(file.size)} • {pageSize.toUpperCase()} • {orientation}
              </p>
            </div>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress */}
          {processing && (
            <div className="space-y-2">
              <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-white/40 text-center">Converting your document...</p>
            </div>
          )}
        </div>
      ) : (
        /* Success State */
        <div className="max-w-lg mx-auto text-center py-12 space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex p-6 rounded-3xl bg-green-500/20"
          >
            <CheckCircle2 className="w-16 h-16 text-green-500 dark:text-green-400" />
          </motion.div>
          
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Conversion Complete!</h2>
            <p className="text-slate-600 dark:text-white/60">{result.name} • {formatSize(result.size)}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button
              onClick={handleDownload}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold 
                hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
            <button
              onClick={reset}
              className="px-8 py-4 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              Convert Another
            </button>
          </div>
        </div>
      )}
    </ToolWorkspaceLayout>
  );
}
