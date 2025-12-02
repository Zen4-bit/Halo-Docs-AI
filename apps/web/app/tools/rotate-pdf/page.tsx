'use client';

import { useState, useCallback } from 'react';
import { 
  FileText, Download, CheckCircle2, 
  RotateCw, RotateCcw, FlipHorizontal,
  Wand2, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { 
  SettingsSection, 
  SettingsToggle, 
  SettingsButtonGroup,
  SettingsInput
} from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';
import { PDFDocument, degrees } from 'pdf-lib';

export default function RotatePDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Rotation settings
  const [rotation, setRotation] = useState<'90' | '180' | '270'>('90');
  const [pageSelection, setPageSelection] = useState<'all' | 'odd' | 'even' | 'range'>('all');
  const [customRange, setCustomRange] = useState('');
  const [autoRotate, setAutoRotate] = useState(false);

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

  const handleProcess = useCallback(async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      setProgress(10);
      
      // Load the PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      
      setProgress(30);
      
      // Get rotation angle
      const rotationAngle = parseInt(rotation);
      
      // Get pages to rotate
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;
      
      // Determine which pages to rotate
      let pagesToRotate: number[] = [];
      if (pageSelection === 'all') {
        pagesToRotate = Array.from({ length: totalPages }, (_, i) => i);
      } else if (pageSelection === 'odd') {
        pagesToRotate = Array.from({ length: totalPages }, (_, i) => i).filter(i => i % 2 === 0);
      } else if (pageSelection === 'even') {
        pagesToRotate = Array.from({ length: totalPages }, (_, i) => i).filter(i => i % 2 === 1);
      } else if (pageSelection === 'range' && customRange) {
        // Parse range like "1-5,7,9-12"
        const ranges = customRange.split(',');
        ranges.forEach(range => {
          if (range.includes('-')) {
            const parts = range.split('-').map(n => parseInt(n.trim()) - 1);
            const start = parts[0] ?? 0;
            const end = parts[1] ?? start;
            for (let i = start; i <= end && i < totalPages; i++) {
              if (i >= 0) pagesToRotate.push(i);
            }
          } else {
            const pageNum = parseInt(range.trim()) - 1;
            if (pageNum >= 0 && pageNum < totalPages) pagesToRotate.push(pageNum);
          }
        });
      }
      
      setProgress(50);
      
      // Rotate selected pages
      pagesToRotate.forEach(pageIndex => {
        const page = pages[pageIndex];
        if (page) {
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees(currentRotation + rotationAngle));
        }
      });
      
      setProgress(80);
      
      // Save the PDF
      const rotatedBytes = await pdfDoc.save();
      
      setProgress(100);
      
      // Create blob and URL
      const blob = new Blob([new Uint8Array(rotatedBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResult({ url, name: file.name.replace('.pdf', '-rotated.pdf'), size: blob.size });
    } catch (err: any) {
      console.error('Rotation error:', err);
      setError(err.message || 'Failed to rotate PDF. The file may be corrupted or password-protected.');
    } finally {
      setProcessing(false);
    }
  }, [file, rotation, pageSelection, customRange]);

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

  const getRotationLabel = () => {
    switch (rotation) {
      case '90': return '90° Clockwise';
      case '180': return '180° Flip';
      case '270': return '270° Counter-clockwise';
      default: return rotation;
    }
  };

  // Settings Panel
  const settingsPanel = (
    <>
      {/* Rotation */}
      <SettingsSection title="Rotation" icon={<RotateCw className="w-4 h-4" />}>
        <SettingsButtonGroup
          label="Angle"
          value={rotation}
          onChange={(v) => setRotation(v as typeof rotation)}
          options={[
            { value: '90', label: '90°', icon: <RotateCw className="w-3 h-3" /> },
            { value: '180', label: '180°', icon: <FlipHorizontal className="w-3 h-3" /> },
            { value: '270', label: '270°', icon: <RotateCcw className="w-3 h-3" /> },
          ]}
        />
        
        <SettingsToggle
          label="Auto-rotate"
          description="Detect and fix page orientation automatically"
          checked={autoRotate}
          onChange={setAutoRotate}
          icon={<Wand2 className="w-3 h-3" />}
        />
      </SettingsSection>

      {/* Page Selection */}
      <SettingsSection title="Pages" icon={<Hash className="w-4 h-4" />}>
        <SettingsButtonGroup
          label="Apply to"
          value={pageSelection}
          onChange={(v) => setPageSelection(v as typeof pageSelection)}
          options={[
            { value: 'all', label: 'All' },
            { value: 'odd', label: 'Odd' },
            { value: 'even', label: 'Even' },
            { value: 'range', label: 'Range' },
          ]}
        />
        
        {pageSelection === 'range' && (
          <div className="mt-3">
            <SettingsInput
              label="Page range"
              value={customRange}
              onChange={setCustomRange}
              placeholder="e.g., 1-5, 8, 10-15"
              icon={<Hash className="w-3 h-3" />}
            />
          </div>
        )}
      </SettingsSection>
    </>
  );

  return (
    <ToolWorkspaceLayout
      toolName="Rotate PDF"
      toolIcon={<RotateCw className="w-5 h-5 text-white" />}
      toolColor="from-pink-500 to-rose-500"
      settingsPanel={settingsPanel}
      actionButton={{
        label: 'Rotate PDF',
        onClick: handleProcess,
        disabled: !file,
        loading: processing,
        loadingText: `Rotating... ${progress}%`,
        icon: <RotateCw className="w-5 h-5" />,
      }}
    >
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* File Dropzone */}
          <FileDropzone
            files={file ? [file] : []}
            onFilesChange={handleFilesChange}
            accept=".pdf,application/pdf"
            multiple={false}
            title="Drop PDF file here"
            description="or click to browse • PDF files only"
            icon={<FileText className="w-8 h-8" />}
            accentColor="purple"
            disabled={processing}
          />

          {/* Visual Rotation Preview */}
          {file && (
            <div className="p-6 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <h3 className="text-sm font-medium text-slate-700 dark:text-white/80 mb-4">Rotation Preview</h3>
              
              <div className="grid grid-cols-3 gap-6">
                {(['90', '180', '270'] as const).map((angle) => {
                  const isSelected = rotation === angle;
                  const Icon = angle === '90' ? RotateCw : angle === '270' ? RotateCcw : FlipHorizontal;
                  const label = angle === '90' ? 'Clockwise' : angle === '270' ? 'Counter-clockwise' : 'Flip';
                  
                  return (
                    <button
                      key={angle}
                      onClick={() => setRotation(angle)}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'bg-pink-500/20 border-pink-500/50'
                          : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                      }`}
                    >
                      {/* Visual Preview */}
                      <div className="relative w-16 h-20 mx-auto mb-3 bg-white rounded shadow-lg overflow-hidden">
                        <motion.div 
                          className="absolute inset-1 border-2 border-gray-300 rounded"
                          animate={{ rotate: parseInt(angle) }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="w-full h-1.5 bg-gray-200 mt-0.5" />
                          <div className="w-3/4 h-1 bg-gray-200 mt-0.5 ml-0.5" />
                          <div className="w-1/2 h-1 bg-gray-200 mt-0.5 ml-0.5" />
                        </motion.div>
                      </div>
                      
                      <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? 'text-pink-500 dark:text-pink-400' : 'text-slate-400 dark:text-white/40'}`} />
                      <p className={`text-lg font-bold ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-white/60'}`}>
                        {angle}°
                      </p>
                      <p className="text-xs text-slate-400 dark:text-white/40">{label}</p>
                    </button>
                  );
                })}
              </div>
              
              <p className="text-xs text-slate-400 dark:text-white/30 text-center mt-4">
                {pageSelection === 'all' ? 'All pages' : pageSelection === 'range' ? `Pages: ${customRange || 'specify range'}` : `${pageSelection.charAt(0).toUpperCase() + pageSelection.slice(1)} pages`} will be rotated {getRotationLabel()}
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
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-white/40 text-center">Rotating your PDF...</p>
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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">PDF Rotated Successfully!</h2>
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
              Rotate Another PDF
            </button>
          </div>
        </div>
      )}
    </ToolWorkspaceLayout>
  );
}
