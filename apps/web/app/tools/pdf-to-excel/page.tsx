'use client';

import { useState } from 'react';
import { FileText, Download, CheckCircle2, Table2, FileSpreadsheet, Grid3X3, Rows3, Files } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { SettingsSection, SettingsToggle, SettingsButtonGroup } from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';

const EXTRACTION_MODES = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'manual', label: 'Manual Selection' },
];

const OUTPUT_FORMATS = [
  { value: 'xlsx', label: 'XLSX' },
  { value: 'csv', label: 'CSV' },
];

const SHEET_OPTIONS = [
  { value: 'one-per-table', label: 'One/Table' },
  { value: 'combine', label: 'Combine All' },
];

export default function PDFToExcelPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Table Extraction
  const [extractionMode, setExtractionMode] = useState('auto');
  // Cell Handling
  const [mergeCells, setMergeCells] = useState(true);
  const [unwrapMultiline, setUnwrapMultiline] = useState(true);
  const [numberDetection, setNumberDetection] = useState(true);
  const [removeEmptyRows, setRemoveEmptyRows] = useState(true);
  // Output
  const [outputFormat, setOutputFormat] = useState('xlsx');
  const [sheetOption, setSheetOption] = useState('one-per-table');

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
      formData.append('extractionMode', extractionMode);
      formData.append('mergeCells', String(mergeCells));
      formData.append('unwrapMultiline', String(unwrapMultiline));
      formData.append('numberDetection', String(numberDetection));
      formData.append('removeEmptyRows', String(removeEmptyRows));
      formData.append('outputFormat', outputFormat);
      formData.append('sheetOption', sheetOption);
      const progressInterval = setInterval(() => setProgress(prev => Math.min(prev + 4, 90)), 200);
      const response = await fetch('/api/tools/pdf-to-excel', { method: 'POST', body: formData });
      clearInterval(progressInterval); setProgress(100);
      if (!response.ok) throw new Error('Conversion failed');
      const blob = await response.blob();
      const ext = outputFormat === 'xlsx' ? '.xlsx' : '.csv';
      setResult({ url: URL.createObjectURL(blob), name: file.name.replace('.pdf', ext), size: blob.size });
    } catch (err: any) { setError(err.message || 'Failed to convert PDF'); }
    finally { setProcessing(false); }
  };

  const handleDownload = () => { if (result) { const a = document.createElement('a'); a.href = result.url; a.download = result.name; a.click(); } };
  const reset = () => { setFile(null); setResult(null); setError(null); setProgress(0); };
  const formatSize = (bytes: number) => bytes < 1024 ? bytes + ' B' : bytes < 1048576 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / 1048576).toFixed(2) + ' MB';

  const settingsPanel = (
    <>
      <SettingsSection title="Table Extraction" icon={<Table2 className="w-4 h-4" />}>
        <SettingsButtonGroup label="Mode" options={EXTRACTION_MODES} value={extractionMode} onChange={setExtractionMode} />
      </SettingsSection>
      <SettingsSection title="Cell Handling" icon={<Grid3X3 className="w-4 h-4" />}>
        <SettingsToggle label="Merge cells" description="Combine split cells" checked={mergeCells} onChange={setMergeCells} />
        <div className="mt-2"><SettingsToggle label="Unwrap multi-line" description="Single line per cell" checked={unwrapMultiline} onChange={setUnwrapMultiline} /></div>
        <div className="mt-2"><SettingsToggle label="Number detection" description="Auto-format numbers" checked={numberDetection} onChange={setNumberDetection} /></div>
        <div className="mt-2"><SettingsToggle label="Remove empty rows" checked={removeEmptyRows} onChange={setRemoveEmptyRows} /></div>
      </SettingsSection>
      <SettingsSection title="Output Format" icon={<FileSpreadsheet className="w-4 h-4" />}>
        <SettingsButtonGroup label="Format" options={OUTPUT_FORMATS} value={outputFormat} onChange={setOutputFormat} />
      </SettingsSection>
      <SettingsSection title="Multi-Sheet Options" icon={<Files className="w-4 h-4" />}>
        <SettingsButtonGroup label="Sheets" options={SHEET_OPTIONS} value={sheetOption} onChange={setSheetOption} />
      </SettingsSection>
    </>
  );

  return (
    <ToolWorkspaceLayout toolName="PDF to Excel" toolIcon={<FileSpreadsheet className="w-5 h-5 text-white" />} toolColor="from-emerald-500 to-green-500" settingsPanel={settingsPanel}
      actionButton={{ label: 'Convert to Excel', onClick: handleConvert, disabled: !file, loading: processing, loadingText: `Extracting... ${progress}%`, icon: <FileSpreadsheet className="w-5 h-5" /> }}>
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-6">
          <FileDropzone files={file ? [file] : []} onFilesChange={handleFilesChange} accept=".pdf,application/pdf" multiple={false} title="Drop PDF here" description="or click to browse • PDF files only" icon={<FileText className="w-8 h-8" />} accentColor="green" disabled={processing} />
          {file && (
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-red-500/20 text-red-400"><FileText className="w-6 h-6" /></div>
                <div className="flex-1"><p className="font-medium text-white">{file.name}</p><p className="text-sm text-white/40">{formatSize(file.size)}</p></div>
                <span className="text-2xl text-white/20">→</span>
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400"><FileSpreadsheet className="w-6 h-6" /></div>
                <span className="text-emerald-400 font-medium">.xlsx</span>
              </div>
            </div>
          )}
          <AnimatePresence>{error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</motion.div>}</AnimatePresence>
          {processing && <div className="space-y-2"><div className="w-full h-2 bg-white/10 rounded-full overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-emerald-500 to-green-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} /></div><p className="text-xs text-white/40 text-center">Extracting tables...</p></div>}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center py-8">
            <div className="inline-flex p-6 rounded-3xl bg-green-500/20 mb-6"><CheckCircle2 className="w-16 h-16 text-green-400" /></div>
            <h2 className="text-2xl font-bold text-white mb-2">Tables Extracted!</h2>
            <p className="text-white/60">{result.name} • {formatSize(result.size)}</p>
          </motion.div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleDownload} className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"><Download className="w-5 h-5" />Download Excel</button>
            <button onClick={reset} className="px-8 py-4 rounded-xl bg-white/5 text-white/70 font-semibold hover:bg-white/10 transition-colors">Convert Another</button>
          </div>
        </div>
      )}
    </ToolWorkspaceLayout>
  );
}
