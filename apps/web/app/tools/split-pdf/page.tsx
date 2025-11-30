'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  FileText, Upload, Scissors, Download, Loader2, CheckCircle2, AlertCircle,
  Settings2, Grid3X3, List, ChevronLeft, ChevronRight, Check, X
} from 'lucide-react';

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
  
  // Split options
  const [splitMode, setSplitMode] = useState<'pages' | 'range' | 'every'>('pages');
  const [rangeInput, setRangeInput] = useState('');
  const [everyN, setEveryN] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') {
      handleFile(droppedFile);
    }
  }, []);

  const handleFile = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    // Simulate page count detection (in real app, use pdf.js)
    const estimatedPages = Math.max(1, Math.ceil(selectedFile.size / 50000));
    const count = Math.min(estimatedPages, 50); // Cap at 50 for demo
    setPageCount(count);
    setPages(Array.from({ length: count }, (_, i) => ({ page: i + 1, selected: false })));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.type === 'application/pdf') {
      handleFile(selectedFile);
    }
  };

  const togglePage = (pageNum: number) => {
    setPages(prev => prev.map(p => 
      p.page === pageNum ? { ...p, selected: !p.selected } : p
    ));
  };

  const selectAll = () => {
    setPages(prev => prev.map(p => ({ ...p, selected: true })));
  };

  const deselectAll = () => {
    setPages(prev => prev.map(p => ({ ...p, selected: false })));
  };

  const selectRange = (start: number, end: number) => {
    setPages(prev => prev.map(p => ({
      ...p,
      selected: p.page >= start && p.page <= end
    })));
  };

  const parseRange = () => {
    // Parse ranges like "1-5,7,9-12"
    const selected = new Set<number>();
    const parts = rangeInput.split(',');
    parts.forEach(part => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        for (let i = start; i <= end && i <= pageCount; i++) {
          if (i > 0) selected.add(i);
        }
      } else {
        const num = parseInt(part);
        if (num > 0 && num <= pageCount) selected.add(num);
      }
    });
    setPages(prev => prev.map(p => ({ ...p, selected: selected.has(p.page) })));
  };

  const handleSplit = async () => {
    if (!file) return;
    
    const selectedPages = pages.filter(p => p.selected).map(p => p.page);
    if (selectedPages.length === 0 && splitMode === 'pages') {
      setError('Please select at least one page to extract');
      return;
    }

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('splitMode', splitMode);
      
      if (splitMode === 'pages') {
        formData.append('pages', selectedPages.join(','));
      } else if (splitMode === 'range') {
        formData.append('pageRange', rangeInput);
      } else {
        formData.append('everyNPages', String(everyN));
      }

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 200);

      const response = await fetch('/api/tools/split-pdf', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) throw new Error('Failed to split PDF');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResult({ url, name: 'split.pdf', size: blob.size });
    } catch (err: any) {
      setError(err.message || 'Failed to split PDF');
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
    setPages([]);
    setPageCount(0);
    setResult(null);
    setError(null);
    setProgress(0);
    setRangeInput('');
  };

  const selectedCount = pages.filter(p => p.selected).length;
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10" />
        <div className="relative max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/25">
              <Scissors className="w-8 h-8 text-white" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              PDF TOOL
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Split PDF</h1>
          <p className="text-lg text-zinc-400 max-w-2xl">
            Extract specific pages from your PDF document. Select pages visually or enter page ranges.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {!result ? (
          <div className="space-y-8">
            {/* Upload Zone */}
            {!file && (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="relative border-2 border-dashed border-zinc-700 hover:border-cyan-500/50 rounded-2xl p-12 transition-all duration-300 bg-zinc-900/30 hover:bg-cyan-500/5 group"
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  <div className="inline-flex p-4 rounded-2xl bg-zinc-800/50 group-hover:bg-cyan-500/20 transition-colors mb-4">
                    <Upload className="w-10 h-10 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Drop your PDF here</h3>
                  <p className="text-zinc-500">or click to browse • PDF files only</p>
                </div>
              </div>
            )}

            {/* File Info & Page Selection */}
            {file && (
              <>
                {/* File Header */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{file.name}</p>
                      <p className="text-sm text-zinc-500">{formatSize(file.size)} • {pageCount} pages</p>
                    </div>
                  </div>
                  <button
                    onClick={reset}
                    className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Split Mode Selector */}
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-amber-400" />
                    Split Mode
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      { id: 'pages', label: 'Select Pages', desc: 'Choose specific pages' },
                      { id: 'range', label: 'Page Range', desc: 'Enter range (1-5,7,9)' },
                      { id: 'every', label: 'Every N Pages', desc: 'Split at intervals' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setSplitMode(mode.id as any)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          splitMode === mode.id
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-white'
                            : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        <p className="font-medium">{mode.label}</p>
                        <p className="text-sm opacity-70">{mode.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Page Selection Grid */}
                {splitMode === 'pages' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <h3 className="font-semibold text-white">
                          Select Pages ({selectedCount} of {pageCount})
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-500 hover:text-white'}`}
                          >
                            <Grid3X3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-500 hover:text-white'}`}
                          >
                            <List className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={selectAll} className="px-3 py-1.5 rounded-lg text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                          Select All
                        </button>
                        <button onClick={deselectAll} className="px-3 py-1.5 rounded-lg text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                          Deselect All
                        </button>
                      </div>
                    </div>

                    <div className={`grid gap-3 ${viewMode === 'grid' ? 'grid-cols-5 sm:grid-cols-8 md:grid-cols-10' : 'grid-cols-1'}`}>
                      {pages.map(page => (
                        <button
                          key={page.page}
                          onClick={() => togglePage(page.page)}
                          className={`relative rounded-xl border-2 transition-all ${
                            viewMode === 'grid' ? 'aspect-[3/4] p-2' : 'p-4 flex items-center gap-4'
                          } ${
                            page.selected
                              ? 'bg-cyan-500/20 border-cyan-500 text-white'
                              : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                          }`}
                        >
                          {viewMode === 'grid' ? (
                            <>
                              <div className="absolute inset-2 rounded-lg bg-zinc-700/50 flex items-center justify-center">
                                <FileText className="w-6 h-6 opacity-30" />
                              </div>
                              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm font-medium">{page.page}</span>
                              {page.selected && (
                                <div className="absolute top-1 right-1 p-1 rounded-full bg-cyan-500">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                                page.selected ? 'bg-cyan-500 border-cyan-500' : 'border-zinc-600'
                              }`}>
                                {page.selected && <Check className="w-4 h-4 text-white" />}
                              </div>
                              <span>Page {page.page}</span>
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Range Input */}
                {splitMode === 'range' && (
                  <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                    <label className="block mb-2 text-sm font-medium text-zinc-300">
                      Enter Page Range
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={rangeInput}
                        onChange={(e) => setRangeInput(e.target.value)}
                        placeholder="e.g., 1-5, 7, 9-12"
                        className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
                      />
                      <button
                        onClick={parseRange}
                        className="px-6 py-3 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 font-medium"
                      >
                        Preview
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-zinc-500">
                      Use commas to separate, hyphens for ranges. Max: {pageCount} pages
                    </p>
                  </div>
                )}

                {/* Every N Pages */}
                {splitMode === 'every' && (
                  <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                    <label className="block mb-4 text-sm font-medium text-zinc-300">
                      Split Every N Pages
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min={1}
                        max={Math.min(10, pageCount)}
                        value={everyN}
                        onChange={(e) => setEveryN(parseInt(e.target.value))}
                        className="flex-1 accent-cyan-500"
                      />
                      <span className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 font-semibold min-w-[60px] text-center">
                        {everyN}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-zinc-500">
                      Creates {Math.ceil(pageCount / everyN)} separate PDF files
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Error */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Split Button */}
            {file && (
              <button
                onClick={handleSplit}
                disabled={processing || (splitMode === 'pages' && selectedCount === 0)}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                  processing || (splitMode === 'pages' && selectedCount === 0)
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Splitting... {progress}%
                  </>
                ) : (
                  <>
                    <Scissors className="w-6 h-6" />
                    {splitMode === 'pages' && `Extract ${selectedCount} Pages`}
                    {splitMode === 'range' && 'Split by Range'}
                    {splitMode === 'every' && `Split into ${Math.ceil(pageCount / everyN)} Files`}
                  </>
                )}
              </button>
            )}

            {/* Progress */}
            {processing && (
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          /* Success State */
          <div className="text-center py-12 space-y-6">
            <div className="inline-flex p-6 rounded-3xl bg-green-500/20 mb-4">
              <CheckCircle2 className="w-16 h-16 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">PDF Split Successfully!</h2>
            <p className="text-zinc-400">{formatSize(result.size)}</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button
                onClick={handleDownload}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Split PDF
              </button>
              <button
                onClick={reset}
                className="px-8 py-4 rounded-xl bg-zinc-800 text-zinc-300 font-semibold hover:bg-zinc-700 transition-colors"
              >
                Split Another PDF
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
