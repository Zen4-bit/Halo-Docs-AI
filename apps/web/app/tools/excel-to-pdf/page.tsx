'use client';

import { useState } from 'react';
import { 
  FileText, Download, CheckCircle2, Table2, Maximize2, 
  Grid3X3, BookOpen, Printer, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { 
  SettingsSection, 
  SettingsToggle, 
  SettingsButtonGroup,
  SettingsInput
} from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';

export default function ExcelToPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Layout
  const [fitToPage, setFitToPage] = useState(true);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'legal'>('a4');
  
  // Sheet Options
  const [sheetRange, setSheetRange] = useState('');
  const [gridlines, setGridlines] = useState(true);
  const [headers, setHeaders] = useState(true);
  
  // Print Settings
  const [repeatRows, setRepeatRows] = useState(false);
  const [centerOnPage, setCenterOnPage] = useState(true);

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
      formData.append('fitToPage', String(fitToPage));
      formData.append('orientation', orientation);
      formData.append('pageSize', pageSize);
      formData.append('gridlines', String(gridlines));
      formData.append('headers', String(headers));
      formData.append('repeatRows', String(repeatRows));
      formData.append('centerOnPage', String(centerOnPage));
      if (sheetRange) formData.append('sheetRange', sheetRange);

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 4, 90));
      }, 200);

      const response = await fetch('/api/tools/excel-to-pdf', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) throw new Error('Conversion failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResult({ url, name: file.name.replace(/\.(xls|xlsx)$/i, '.pdf'), size: blob.size });
    } catch (err: any) {
      setError(err.message || 'Failed to convert spreadsheet');
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
      {/* Layout */}
      <SettingsSection title="Layout" icon={<Maximize2 className="w-4 h-4" />}>
        <SettingsToggle
          label="Fit to page"
          description="Scale content to fit PDF pages"
          checked={fitToPage}
          onChange={setFitToPage}
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
            label="Page size"
            value={pageSize}
            onChange={(v) => setPageSize(v as typeof pageSize)}
            options={[
              { value: 'a4', label: 'A4' },
              { value: 'letter', label: 'Letter' },
              { value: 'legal', label: 'Legal' },
            ]}
          />
        </div>
      </SettingsSection>

      {/* Sheet Options */}
      <SettingsSection title="Sheet Options" icon={<Grid3X3 className="w-4 h-4" />} defaultOpen={false}>
        <SettingsInput
          label="Sheet range"
          value={sheetRange}
          onChange={setSheetRange}
          placeholder="All sheets"
          icon={<Hash className="w-3 h-3" />}
        />
        <p className="text-xs text-slate-400 dark:text-white/30 mb-3">e.g., Sheet1, Sheet3</p>
        
        <SettingsToggle
          label="Show gridlines"
          description="Print cell borders"
          checked={gridlines}
          onChange={setGridlines}
        />
        <SettingsToggle
          label="Show headers"
          description="Print row/column headers"
          checked={headers}
          onChange={setHeaders}
        />
      </SettingsSection>

      {/* Print Settings */}
      <SettingsSection title="Print Settings" icon={<Printer className="w-4 h-4" />} defaultOpen={false}>
        <SettingsToggle
          label="Repeat header rows"
          description="Print headers on every page"
          checked={repeatRows}
          onChange={setRepeatRows}
        />
        <SettingsToggle
          label="Center on page"
          description="Center content horizontally"
          checked={centerOnPage}
          onChange={setCenterOnPage}
        />
      </SettingsSection>
    </>
  );

  return (
    <ToolWorkspaceLayout
      toolName="Excel to PDF"
      toolIcon={<Table2 className="w-5 h-5 text-white" />}
      toolColor="from-green-600 to-emerald-500"
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
            accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            multiple={false}
            title="Drop Excel file here"
            description="or click to browse • XLS, XLSX files"
            icon={<Table2 className="w-8 h-8" />}
            accentColor="green"
            disabled={processing}
          />

          {/* Conversion Preview */}
          {file && (
            <div className="p-6 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <div className="p-4 rounded-xl bg-green-500/20 text-green-400 inline-block mb-2">
                    <Table2 className="w-8 h-8" />
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
                  <p className="text-sm text-white/60">.PDF</p>
                </div>
              </div>
              
              <p className="text-xs text-slate-400 dark:text-white/30 text-center mt-4">
                {formatSize(file.size)} • {orientation} • {pageSize.toUpperCase()}
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
                  className="h-full bg-gradient-to-r from-green-600 to-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-white/40 text-center">Converting your spreadsheet...</p>
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
