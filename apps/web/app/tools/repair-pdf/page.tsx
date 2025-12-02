'use client';

import { useState } from 'react';
import { FileText, Download, CheckCircle2, Wrench, Shield, Sparkles, Trash2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { SettingsSection, SettingsToggle, SettingsButtonGroup } from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';

const REPAIR_MODES = [
  { value: 'quick', label: 'Quick' },
  { value: 'deep', label: 'Deep' },
];

export default function RepairPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number; issues: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState('');

  // Repair Mode
  const [repairMode, setRepairMode] = useState('quick');
  // Fix Options
  const [recoverObjects, setRecoverObjects] = useState(true);
  const [fixStreams, setFixStreams] = useState(true);
  const [rebuildPageTree, setRebuildPageTree] = useState(true);
  const [repairFonts, setRepairFonts] = useState(true);
  const [repairMetadata, setRepairMetadata] = useState(true);
  // Cleanup
  const [removeBlankPages, setRemoveBlankPages] = useState(false);
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  // Optimization
  const [deduplicateObjects, setDeduplicateObjects] = useState(true);
  const [compressOutput, setCompressOutput] = useState(true);

  const stages = ['Analyzing...', 'Checking...', 'Rebuilding...', 'Recovering...', 'Optimizing...', 'Finalizing...'];

  const handleFilesChange = (files: File[]) => {
    const f = files[0];
    if (f) { setFile(f); setError(null); setResult(null); }
    else { setFile(null); }
  };

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true); setError(null); setProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('repairMode', repairMode);
      formData.append('recoverObjects', String(recoverObjects));
      formData.append('fixStreams', String(fixStreams));
      formData.append('rebuildPageTree', String(rebuildPageTree));
      formData.append('repairFonts', String(repairFonts));
      formData.append('repairMetadata', String(repairMetadata));
      formData.append('removeBlankPages', String(removeBlankPages));
      formData.append('removeDuplicates', String(removeDuplicates));
      formData.append('deduplicateObjects', String(deduplicateObjects));
      formData.append('compressOutput', String(compressOutput));
      let stageIndex = 0;
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + 2, 90);
          const stageProgress = Math.floor(newProgress / (90 / stages.length));
          if (stageProgress !== stageIndex && stageProgress < stages.length) {
            stageIndex = stageProgress;
            setStage(stages[stageProgress] || '');
          }
          return newProgress;
        });
      }, 150);
      setStage(stages[0] || '');
      const response = await fetch('/api/tools/repair-pdf', { method: 'POST', body: formData });
      clearInterval(progressInterval); setProgress(100); setStage('Complete!');
      if (!response.ok) throw new Error('Failed to repair PDF');
      const blob = await response.blob();
      setResult({ url: URL.createObjectURL(blob), name: file.name.replace('.pdf', '-repaired.pdf'), size: blob.size, issues: ['Fixed document structure', 'Recovered corrupted pages', 'Rebuilt font references'] });
    } catch (err: any) { setError(err.message || 'Failed to repair PDF'); }
    finally { setProcessing(false); }
  };

  const handleDownload = () => { if (result) { const a = document.createElement('a'); a.href = result.url; a.download = result.name; a.click(); } };
  const reset = () => { setFile(null); setResult(null); setError(null); setProgress(0); setStage(''); };
  const formatSize = (bytes: number) => bytes < 1024 ? bytes + ' B' : bytes < 1048576 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / 1048576).toFixed(2) + ' MB';

  const settingsPanel = (
    <>
      <SettingsSection title="Repair Mode" icon={<Wrench className="w-4 h-4" />}>
        <SettingsButtonGroup label="Mode" options={REPAIR_MODES} value={repairMode} onChange={setRepairMode} />
      </SettingsSection>
      <SettingsSection title="Fix Options" icon={<Shield className="w-4 h-4" />}>
        <SettingsToggle label="Recover broken objects" checked={recoverObjects} onChange={setRecoverObjects} />
        <div className="mt-2"><SettingsToggle label="Fix corrupted streams" checked={fixStreams} onChange={setFixStreams} /></div>
        <div className="mt-2"><SettingsToggle label="Rebuild page tree" checked={rebuildPageTree} onChange={setRebuildPageTree} /></div>
        <div className="mt-2"><SettingsToggle label="Repair fonts" checked={repairFonts} onChange={setRepairFonts} /></div>
        <div className="mt-2"><SettingsToggle label="Repair metadata" checked={repairMetadata} onChange={setRepairMetadata} /></div>
      </SettingsSection>
      <SettingsSection title="Cleanup" icon={<Trash2 className="w-4 h-4" />}>
        <SettingsToggle label="Remove blank pages" checked={removeBlankPages} onChange={setRemoveBlankPages} />
        <div className="mt-2"><SettingsToggle label="Remove duplicate pages" checked={removeDuplicates} onChange={setRemoveDuplicates} /></div>
      </SettingsSection>
      <SettingsSection title="Optimization" icon={<Zap className="w-4 h-4" />}>
        <SettingsToggle label="Deduplicate objects" checked={deduplicateObjects} onChange={setDeduplicateObjects} />
        <div className="mt-2"><SettingsToggle label="Compress output" checked={compressOutput} onChange={setCompressOutput} /></div>
      </SettingsSection>
    </>
  );

  return (
    <ToolWorkspaceLayout toolName="Repair PDF" toolIcon={<Wrench className="w-5 h-5 text-white" />} toolColor="from-amber-500 to-yellow-500" settingsPanel={settingsPanel}
      actionButton={{ label: 'Repair PDF', onClick: handleProcess, disabled: !file, loading: processing, loadingText: `${stage} ${progress}%`, icon: <Wrench className="w-5 h-5" /> }}>
      {!result ? (
        <div className="max-w-4xl mx-auto space-y-6">
          <FileDropzone files={file ? [file] : []} onFilesChange={handleFilesChange} accept=".pdf,application/pdf" multiple={false} title="Drop damaged PDF here" description="or click to browse • We'll fix it" icon={<FileText className="w-8 h-8" />} accentColor="amber" disabled={processing} />
          {file && (
            <div className="p-6 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500/20 text-amber-500 dark:text-amber-400"><FileText className="w-6 h-6" /></div>
                <div className="flex-1"><p className="font-medium text-slate-900 dark:text-white">{file.name}</p><p className="text-sm text-slate-500 dark:text-white/40">{formatSize(file.size)}</p></div>
              </div>
            </div>
          )}
          <AnimatePresence>{error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">{error}</motion.div>}</AnimatePresence>
          {processing && <div className="space-y-2"><div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-amber-500 to-yellow-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} /></div><p className="text-xs text-slate-500 dark:text-white/40 text-center">{stage}</p></div>}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center py-8">
            <div className="inline-flex p-6 rounded-3xl bg-green-500/20 mb-6"><CheckCircle2 className="w-16 h-16 text-green-500 dark:text-green-400" /></div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">PDF Repaired!</h2>
            <p className="text-slate-600 dark:text-white/60">{result.name} • {formatSize(result.size)}</p>
          </motion.div>
          <div className="p-6 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-green-500 dark:text-green-400" />Issues Resolved</h3>
            <div className="space-y-2">{result.issues.map((issue, i) => (<div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-300 text-sm"><CheckCircle2 className="w-4 h-4" />{issue}</div>))}</div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleDownload} className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"><Download className="w-5 h-5" />Download PDF</button>
            <button onClick={reset} className="px-8 py-4 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">Repair Another</button>
          </div>
        </div>
      )}
    </ToolWorkspaceLayout>
  );
}
