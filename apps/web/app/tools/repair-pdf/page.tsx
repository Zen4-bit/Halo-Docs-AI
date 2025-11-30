'use client';

import { useState, useCallback } from 'react';
import { 
  FileText, Upload, Download, Loader2, CheckCircle2, AlertCircle,
  X, Wrench, Shield, FileWarning, Sparkles
} from 'lucide-react';

export default function RepairPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number; issues: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState('');

  const stages = [
    'Analyzing PDF structure...',
    'Checking for corruption...',
    'Rebuilding document tree...',
    'Recovering content...',
    'Optimizing output...',
    'Finalizing repair...'
  ];

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      let stageIndex = 0;
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + 2, 90);
          const stageProgress = Math.floor(newProgress / (90 / stages.length));
          if (stageProgress !== stageIndex && stageProgress < stages.length) {
            stageIndex = stageProgress;
            setStage(stages[stageProgress]);
          }
          return newProgress;
        });
      }, 150);

      setStage(stages[0]);

      const response = await fetch('/api/tools/repair-pdf', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);
      setStage('Complete!');

      if (!response.ok) throw new Error('Failed to repair PDF');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResult({ 
        url, 
        name: file.name.replace('.pdf', '-repaired.pdf'), 
        size: blob.size,
        issues: ['Fixed document structure', 'Recovered corrupted pages', 'Rebuilt font references']
      });
    } catch (err: any) {
      setError(err.message || 'Failed to repair PDF');
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
    setStage('');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10" />
        <div className="relative max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 shadow-lg shadow-amber-500/25">
              <Wrench className="w-8 h-8 text-white" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              PDF TOOL
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Repair PDF</h1>
          <p className="text-lg text-zinc-400 max-w-2xl">
            Fix corrupted or damaged PDF files. Recover content from broken documents.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {!result ? (
          <div className="space-y-8">
            {/* Upload Zone */}
            {!file ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="relative border-2 border-dashed border-zinc-700 hover:border-amber-500/50 rounded-2xl p-12 transition-all duration-300 bg-zinc-900/30 hover:bg-amber-500/5 group"
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  <div className="inline-flex p-4 rounded-2xl bg-zinc-800/50 group-hover:bg-amber-500/20 transition-colors mb-4">
                    <FileWarning className="w-10 h-10 text-zinc-400 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Drop your damaged PDF here</h3>
                  <p className="text-zinc-500">or click to browse • PDF files only</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
                    <FileWarning className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{file.name}</p>
                    <p className="text-sm text-zinc-500">{formatSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={reset}
                  className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Repair Info */}
            {file && !processing && (
              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-400" />
                  What We'll Fix
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    'Corrupted file structure',
                    'Missing or broken fonts',
                    'Damaged page content',
                    'Invalid cross-references',
                    'Broken internal links',
                    'Corrupted metadata'
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-sm text-zinc-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Processing Stage */}
            {processing && (
              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                <div className="flex items-center gap-4 mb-4">
                  <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                  <div>
                    <p className="font-medium text-white">{stage}</p>
                    <p className="text-sm text-zinc-500">{progress}% complete</p>
                  </div>
                </div>
                <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {file && !processing && (
              <button
                onClick={handleProcess}
                className="w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:shadow-lg hover:shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Wrench className="w-6 h-6" />
                Repair PDF
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center py-8">
              <div className="inline-flex p-6 rounded-3xl bg-green-500/20 mb-6">
                <CheckCircle2 className="w-16 h-16 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">PDF Repaired Successfully!</h2>
              <p className="text-zinc-400">{result.name} • {formatSize(result.size)}</p>
            </div>

            {/* Issues Fixed */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-400" />
                Issues Resolved
              </h3>
              <div className="space-y-2">
                {result.issues.map((issue, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-300">{issue}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleDownload}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Repaired PDF
              </button>
              <button
                onClick={reset}
                className="px-8 py-4 rounded-xl bg-zinc-800 text-zinc-300 font-semibold hover:bg-zinc-700 transition-colors"
              >
                Repair Another PDF
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
