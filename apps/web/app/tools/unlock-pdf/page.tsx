'use client';

import { useState } from 'react';
import { 
  FileText, Download, CheckCircle2, 
  Unlock, Key, Shield, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { 
  SettingsSection, 
  SettingsToggle, 
  SettingsInput
} from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';

export default function UnlockPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Password settings
  const [password, setPassword] = useState('');
  const [removeRestrictions, setRemoveRestrictions] = useState(true);
  const [removeWatermarks, setRemoveWatermarks] = useState(false);

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

  const handleProcess = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('password', password);
      formData.append('removeRestrictions', String(removeRestrictions));
      formData.append('removeWatermarks', String(removeWatermarks));

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 4, 90));
      }, 200);

      const response = await fetch('/api/tools/unlock-pdf', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to unlock PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResult({ url, name: file.name.replace('.pdf', '-unlocked.pdf'), size: blob.size });
    } catch (err: any) {
      setError(err.message || 'Failed to unlock PDF. Please check the password.');
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
    setPassword('');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  // Settings Panel
  const settingsPanel = (
    <>
      {/* Password */}
      <SettingsSection title="Password" icon={<Key className="w-4 h-4" />}>
        <SettingsInput
          label="PDF Password"
          value={password}
          onChange={setPassword}
          type="password"
          placeholder="Enter password if protected"
          icon={<Key className="w-3 h-3" />}
        />
        <p className="text-xs text-slate-400 dark:text-white/30 mt-1">
          Leave empty if PDF only has restrictions (no open password)
        </p>
      </SettingsSection>

      {/* Options */}
      <SettingsSection title="Options" icon={<Shield className="w-4 h-4" />}>
        <SettingsToggle
          label="Remove restrictions"
          description="Remove print, copy, and edit restrictions"
          checked={removeRestrictions}
          onChange={setRemoveRestrictions}
          icon={<Unlock className="w-3 h-3" />}
        />
        <SettingsToggle
          label="Remove watermarks"
          description="Attempt to remove visible watermarks"
          checked={removeWatermarks}
          onChange={setRemoveWatermarks}
        />
      </SettingsSection>
    </>
  );

  return (
    <ToolWorkspaceLayout
      toolName="Unlock PDF"
      toolIcon={<Unlock className="w-5 h-5 text-white" />}
      toolColor="from-emerald-500 to-teal-500"
      settingsPanel={settingsPanel}
      actionButton={{
        label: 'Unlock PDF',
        onClick: handleProcess,
        disabled: !file,
        loading: processing,
        loadingText: `Unlocking... ${progress}%`,
        icon: <Unlock className="w-5 h-5" />,
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
            title="Drop protected PDF here"
            description="or click to browse • PDF files only"
            icon={<FileText className="w-8 h-8" />}
            accentColor="green"
            disabled={processing}
          />

          {/* Info Box */}
          {file && (
            <div className="p-6 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-500 dark:text-emerald-400">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900 dark:text-white mb-1">
                    {file.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-white/50 mb-3">
                    {formatSize(file.size)}
                  </p>
                  
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Only unlock PDFs you have permission to access</span>
                    </div>
                  </div>
                </div>
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
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-white/40 text-center">Removing PDF protection...</p>
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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">PDF Unlocked Successfully!</h2>
            <p className="text-slate-600 dark:text-white/60">
              {result.name} • {formatSize(result.size)}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button
              onClick={handleDownload}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold 
                hover:shadow-lg hover:shadow-green-500/25 transition-all inline-flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Unlocked PDF
            </button>
            <button
              onClick={reset}
              className="px-8 py-4 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              Unlock Another PDF
            </button>
          </div>
        </div>
      )}
    </ToolWorkspaceLayout>
  );
}
