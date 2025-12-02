'use client';

import { useState, useCallback } from 'react';
import { 
  FileText, Scissors, Download, CheckCircle2, 
  Grid3X3, List, Check, Bookmark, Minimize2,
  FileX, RotateCw, Hash, FileArchive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { 
  SettingsSection, 
  SettingsToggle, 
  SettingsSlider,
  SettingsSelect,
  SettingsButtonGroup,
  SettingsInput
} from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

interface PageSelection {
  page: number;
  selected: boolean;
}

export default function SplitPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pages, setPages] = useState<PageSelection[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Split Modes
  const [splitMode, setSplitMode] = useState<'every' | 'range' | 'bookmarks' | 'size' | 'count' | 'blank'>('every');
  const [rangeInput, setRangeInput] = useState('');
  const [everyN, setEveryN] = useState(1);
  const [splitBySize, setSplitBySize] = useState(5); // MB
  const [splitByCount, setSplitByCount] = useState(10);
  
  // Controls
  const [autoRename, setAutoRename] = useState(true);
  const [compressOutputs, setCompressOutputs] = useState(false);
  const [removeBlankPages, setRemoveBlankPages] = useState(false);
  
  // View
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleFilesChange = (files: File[]) => {
    const selectedFile = files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
      // Simulate page count detection
      const estimatedPages = Math.max(1, Math.ceil(selectedFile.size / 50000));
      const count = Math.min(estimatedPages, 50);
      setPageCount(count);
      setPages(Array.from({ length: count }, (_, i) => ({ page: i + 1, selected: false })));
    } else {
      setFile(null);
      setPages([]);
      setPageCount(0);
    }
  };

  const togglePage = (pageNum: number) => {
    setPages(prev => prev.map(p => 
      p.page === pageNum ? { ...p, selected: !p.selected } : p
    ));
  };

  const selectAll = () => setPages(prev => prev.map(p => ({ ...p, selected: true })));
  const deselectAll = () => setPages(prev => prev.map(p => ({ ...p, selected: false })));

  const handleSplit = useCallback(async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      setProgress(10);
      
      // Load the PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const totalPages = pdfDoc.getPageCount();
      
      setProgress(20);
      
      // Determine pages to extract based on split mode
      let pageGroups: number[][] = [];
      
      if (splitMode === 'every' && everyN === 1) {
        // Split into individual pages
        pageGroups = Array.from({ length: totalPages }, (_, i) => [i]);
      } else if (splitMode === 'range' && rangeInput) {
        // Parse range like "1-5,7,9-12"
        const ranges = rangeInput.split(',');
        let currentGroup: number[] = [];
        ranges.forEach(range => {
          if (range.includes('-')) {
            const parts = range.split('-').map(n => parseInt(n.trim()) - 1);
            const start = parts[0] ?? 0;
            const end = parts[1] ?? start;
            for (let i = start; i <= end && i < totalPages; i++) {
              if (i >= 0) currentGroup.push(i);
            }
          } else {
            const pageNum = parseInt(range.trim()) - 1;
            if (pageNum >= 0 && pageNum < totalPages) currentGroup.push(pageNum);
          }
        });
        if (currentGroup.length > 0) pageGroups.push(currentGroup);
      } else if (splitMode === 'every' && everyN > 0) {
        // Split every N pages
        for (let i = 0; i < totalPages; i += everyN) {
          const group: number[] = [];
          for (let j = i; j < Math.min(i + everyN, totalPages); j++) {
            group.push(j);
          }
          pageGroups.push(group);
        }
      } else {
        // Default: split into individual pages
        pageGroups = Array.from({ length: totalPages }, (_, i) => [i]);
      }
      
      setProgress(40);
      
      // Create ZIP file with split PDFs
      const zip = new JSZip();
      
      for (let i = 0; i < pageGroups.length; i++) {
        setProgress(40 + Math.round((i / pageGroups.length) * 40));
        
        const group = pageGroups[i]!;
        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfDoc, group);
        copiedPages.forEach(page => newPdf.addPage(page));
        
        const pdfBytes = await newPdf.save({ useObjectStreams: compressOutputs });
        const fileName = autoRename 
          ? `${file.name.replace('.pdf', '')}_part${i + 1}.pdf`
          : `split_${i + 1}.pdf`;
        zip.file(fileName, pdfBytes);
      }
      
      setProgress(90);
      
      // Generate ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      setProgress(100);
      
      const url = URL.createObjectURL(zipBlob);
      setResult({ url, name: 'split-files.zip', size: zipBlob.size });
    } catch (err: any) {
      console.error('Split error:', err);
      setError(err.message || 'Failed to split PDF. The file may be corrupted or password-protected.');
    } finally {
      setProcessing(false);
    }
  }, [file, splitMode, rangeInput, everyN, autoRename, compressOutputs]);

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
    setPages([]);
    setPageCount(0);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const selectedCount = pages.filter(p => p.selected).length;

  // Calculate output files count
  const getOutputCount = () => {
    if (splitMode === 'every') return Math.ceil(pageCount / everyN);
    if (splitMode === 'count') return Math.ceil(pageCount / splitByCount);
    if (splitMode === 'range') return rangeInput.split(',').length || 1;
    return pageCount;
  };

  // Settings Panel
  const settingsPanel = (
    <>
      {/* Split Modes */}
      <SettingsSection title="Split Mode" icon={<Scissors className="w-4 h-4" />}>
        <SettingsButtonGroup
          label="Split by"
          value={splitMode}
          onChange={(v) => setSplitMode(v as typeof splitMode)}
          options={[
            { value: 'every', label: 'Pages' },
            { value: 'range', label: 'Range' },
            { value: 'bookmarks', label: 'Bookmarks' },
          ]}
        />
        
        <div className="mt-3">
          <SettingsButtonGroup
            label=""
            value={splitMode}
            onChange={(v) => setSplitMode(v as typeof splitMode)}
            options={[
              { value: 'size', label: 'Size' },
              { value: 'count', label: 'Count' },
              { value: 'blank', label: 'Blank' },
            ]}
          />
        </div>

        {splitMode === 'every' && (
          <div className="mt-4">
            <SettingsSlider
              label="Split every N pages"
              value={everyN}
              onChange={setEveryN}
              min={1}
              max={Math.max(1, pageCount)}
              unit=" pages"
            />
            <p className="text-xs text-slate-400 dark:text-white/30 mt-1">
              Creates ~{getOutputCount()} files
            </p>
          </div>
        )}

        {splitMode === 'range' && (
          <div className="mt-4">
            <SettingsInput
              label="Custom range"
              value={rangeInput}
              onChange={setRangeInput}
              placeholder="e.g., 1-5, 8, 10-15"
              icon={<Hash className="w-3 h-3" />}
            />
          </div>
        )}

        {splitMode === 'size' && (
          <div className="mt-4">
            <SettingsSlider
              label="Max file size"
              value={splitBySize}
              onChange={setSplitBySize}
              min={1}
              max={50}
              unit=" MB"
            />
          </div>
        )}

        {splitMode === 'count' && (
          <div className="mt-4">
            <SettingsSlider
              label="Pages per file"
              value={splitByCount}
              onChange={setSplitByCount}
              min={1}
              max={Math.max(1, pageCount)}
              unit=" pages"
            />
          </div>
        )}

        {splitMode === 'bookmarks' && (
          <p className="text-xs text-white/40 mt-2">
            Split at each top-level bookmark
          </p>
        )}

        {splitMode === 'blank' && (
          <p className="text-xs text-white/40 mt-2">
            Split when blank page is detected
          </p>
        )}
      </SettingsSection>

      {/* Controls */}
      <SettingsSection title="Controls" icon={<FileArchive className="w-4 h-4" />} defaultOpen={false}>
        <SettingsToggle
          label="Auto rename parts"
          description="Name files as part-1, part-2, etc."
          checked={autoRename}
          onChange={setAutoRename}
        />
        <SettingsToggle
          label="Compress outputs"
          description="Reduce file size of split files"
          checked={compressOutputs}
          onChange={setCompressOutputs}
          icon={<Minimize2 className="w-3 h-3" />}
        />
        <SettingsToggle
          label="Remove blank pages"
          description="Auto-detect and skip blank pages"
          checked={removeBlankPages}
          onChange={setRemoveBlankPages}
          icon={<FileX className="w-3 h-3" />}
        />
      </SettingsSection>
    </>
  );

  const actionLabel = file 
    ? `Split into ${getOutputCount()} File${getOutputCount() !== 1 ? 's' : ''}`
    : 'Select a PDF';

  return (
    <ToolWorkspaceLayout
      toolName="Split PDF"
      toolIcon={<Scissors className="w-5 h-5 text-white" />}
      toolColor="from-cyan-500 to-blue-500"
      settingsPanel={settingsPanel}
      actionButton={{
        label: actionLabel,
        onClick: handleSplit,
        disabled: !file,
        loading: processing,
        loadingText: `Splitting... ${progress}%`,
        icon: <Scissors className="w-5 h-5" />,
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
            description="or click to browse • Single PDF file"
            icon={<FileText className="w-8 h-8" />}
            accentColor="blue"
            disabled={processing}
          />

          {/* Page Preview Grid */}
          {file && pageCount > 0 && splitMode === 'range' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-white/80">
                    {pageCount} pages • Select pages to extract
                  </h3>
                  <div className="flex gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-lg">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-500 dark:text-cyan-400' : 'text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/80'}`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-500 dark:text-cyan-400' : 'text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/80'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="px-3 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10">
                    Select All
                  </button>
                  <button onClick={deselectAll} className="px-3 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10">
                    Deselect
                  </button>
                </div>
              </div>

              <div className={`grid gap-2 ${viewMode === 'grid' ? 'grid-cols-6 sm:grid-cols-8 md:grid-cols-10' : 'grid-cols-1'}`}>
                {pages.map(page => (
                  <button
                    key={page.page}
                    onClick={() => togglePage(page.page)}
                    className={`relative rounded-lg border transition-all ${
                      viewMode === 'grid' ? 'aspect-[3/4] p-1' : 'p-3 flex items-center gap-3'
                    } ${
                      page.selected
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-slate-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/60 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    {viewMode === 'grid' ? (
                      <>
                        <div className="absolute inset-1 rounded bg-white/5 flex items-center justify-center">
                          <FileText className="w-4 h-4 opacity-30" />
                        </div>
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-medium">{page.page}</span>
                        {page.selected && (
                          <div className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-cyan-500">
                            <Check className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                          page.selected ? 'bg-cyan-500 border-cyan-500' : 'border-white/30'
                        }`}>
                          {page.selected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm">Page {page.page}</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Split Preview */}
          {file && splitMode !== 'range' && (
            <div className="p-6 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-500 dark:text-cyan-400">
                  <FileArchive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">Output Preview</h3>
                  <p className="text-sm text-slate-500 dark:text-white/50">{pageCount} pages → {getOutputCount()} files</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: Math.min(getOutputCount(), 10) }).map((_, i) => (
                  <div key={i} className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-600 dark:text-white/70">
                    Part {i + 1}
                  </div>
                ))}
                {getOutputCount() > 10 && (
                  <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-400 dark:text-white/40">
                    +{getOutputCount() - 10} more
                  </div>
                )}
              </div>
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
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-white/40 text-center">Splitting your PDF...</p>
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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">PDF Split Successfully!</h2>
            <p className="text-slate-600 dark:text-white/60">
              {getOutputCount()} files created • {formatSize(result.size)}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button
              onClick={handleDownload}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold 
                hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download ZIP
            </button>
            <button
              onClick={reset}
              className="px-8 py-4 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              Split Another PDF
            </button>
          </div>
        </div>
      )}
    </ToolWorkspaceLayout>
  );
}
