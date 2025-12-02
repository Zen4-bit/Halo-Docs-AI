'use client';

import { useState } from 'react';
import { 
  FileText, Download, CheckCircle2, 
  Lock, Unlock, Key, Shield, Eye, EyeOff,
  Printer, Copy, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ToolWorkspaceLayout, { 
  SettingsSection, 
  SettingsToggle, 
  SettingsInput,
  SettingsButtonGroup
} from '@/components/tools/ToolWorkspaceLayout';
import FileDropzone from '@/components/tools/FileDropzone';

export default function PDFPasswordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Mode
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  
  // Password settings
  const [openPassword, setOpenPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Permissions (when adding)
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowCopying, setAllowCopying] = useState(false);
  const [allowEditing, setAllowEditing] = useState(false);
  const [allowAnnotations, setAllowAnnotations] = useState(true);

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

    // Validation
    if (mode === 'add') {
      if (!openPassword && !ownerPassword) {
        setError('Please set at least one password');
        return;
      }
      if (openPassword && openPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', mode);
      
      if (mode === 'add') {
        formData.append('openPassword', openPassword);
        formData.append('ownerPassword', ownerPassword || openPassword);
        formData.append('allowPrinting', String(allowPrinting));
        formData.append('allowCopying', String(allowCopying));
        formData.append('allowEditing', String(allowEditing));
        formData.append('allowAnnotations', String(allowAnnotations));
      } else {
        formData.append('currentPassword', currentPassword);
      }

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 4, 90));
      }, 200);

      const response = await fetch('/api/tools/pdf-password', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to process PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const suffix = mode === 'add' ? '-protected' : '-unprotected';
      setResult({ url, name: file.name.replace('.pdf', `${suffix}.pdf`), size: blob.size });
    } catch (err: any) {
      setError(err.message || 'Failed to process PDF');
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
    setOpenPassword('');
    setConfirmPassword('');
    setOwnerPassword('');
    setCurrentPassword('');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  // Settings Panel
  const settingsPanel = (
    <>
      {/* Mode Selection */}
      <SettingsSection title="Action" icon={<Key className="w-4 h-4" />}>
        <SettingsButtonGroup
          label="What do you want to do?"
          value={mode}
          onChange={(v) => setMode(v as 'add' | 'remove')}
          options={[
            { value: 'add', label: 'Add Password', icon: <Lock className="w-3 h-3" /> },
            { value: 'remove', label: 'Remove', icon: <Unlock className="w-3 h-3" /> },
          ]}
        />
      </SettingsSection>

      {mode === 'add' ? (
        <>
          {/* Add Password */}
          <SettingsSection title="Password" icon={<Lock className="w-4 h-4" />}>
            <div className="space-y-3">
              <div className="relative">
                <SettingsInput
                  label="Document open password"
                  value={openPassword}
                  onChange={setOpenPassword}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password to open PDF"
                  icon={<Key className="w-3 h-3" />}
                />
              </div>
              <SettingsInput
                label="Confirm password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/70"
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showPassword ? 'Hide' : 'Show'} password
              </button>
            </div>
          </SettingsSection>

          {/* Permissions */}
          <SettingsSection title="Permissions" icon={<Shield className="w-4 h-4" />} defaultOpen={false}>
            <SettingsToggle
              label="Allow printing"
              description="Users can print the document"
              checked={allowPrinting}
              onChange={setAllowPrinting}
              icon={<Printer className="w-3 h-3" />}
            />
            <SettingsToggle
              label="Allow copying"
              description="Users can copy text and images"
              checked={allowCopying}
              onChange={setAllowCopying}
              icon={<Copy className="w-3 h-3" />}
            />
            <SettingsToggle
              label="Allow editing"
              description="Users can modify the document"
              checked={allowEditing}
              onChange={setAllowEditing}
              icon={<Edit3 className="w-3 h-3" />}
            />
            <SettingsToggle
              label="Allow annotations"
              description="Users can add comments"
              checked={allowAnnotations}
              onChange={setAllowAnnotations}
            />
          </SettingsSection>
        </>
      ) : (
        /* Remove Password */
        <SettingsSection title="Current Password" icon={<Unlock className="w-4 h-4" />}>
          <SettingsInput
            label="Enter current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            type={showPassword ? 'text' : 'password'}
            placeholder="Current PDF password"
            icon={<Key className="w-3 h-3" />}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/70 mt-2"
          >
            {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showPassword ? 'Hide' : 'Show'} password
          </button>
        </SettingsSection>
      )}
    </>
  );

  return (
    <ToolWorkspaceLayout
      toolName={mode === 'add' ? 'Add PDF Password' : 'Remove PDF Password'}
      toolIcon={mode === 'add' ? <Lock className="w-5 h-5 text-white" /> : <Unlock className="w-5 h-5 text-white" />}
      toolColor={mode === 'add' ? 'from-violet-500 to-purple-500' : 'from-emerald-500 to-teal-500'}
      settingsPanel={settingsPanel}
      actionButton={{
        label: mode === 'add' ? 'Protect PDF' : 'Remove Password',
        onClick: handleProcess,
        disabled: !file,
        loading: processing,
        loadingText: `Processing... ${progress}%`,
        icon: mode === 'add' ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />,
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
            accentColor={mode === 'add' ? 'purple' : 'green'}
            disabled={processing}
          />

          {/* Info Panel */}
          {file && (
            <div className="p-6 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-xl ${mode === 'add' ? 'bg-violet-500/20 text-violet-500 dark:text-violet-400' : 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400'}`}>
                  {mode === 'add' ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">{file.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-white/50">{formatSize(file.size)}</p>
                </div>
              </div>

              {mode === 'add' && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className={`p-3 rounded-lg border ${allowPrinting ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'}`}>
                    <div className="flex items-center gap-2 text-sm">
                      <Printer className="w-4 h-4" />
                      Printing {allowPrinting ? 'allowed' : 'blocked'}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border ${allowCopying ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'}`}>
                    <div className="flex items-center gap-2 text-sm">
                      <Copy className="w-4 h-4" />
                      Copying {allowCopying ? 'allowed' : 'blocked'}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border ${allowEditing ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'}`}>
                    <div className="flex items-center gap-2 text-sm">
                      <Edit3 className="w-4 h-4" />
                      Editing {allowEditing ? 'allowed' : 'blocked'}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border ${allowAnnotations ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'}`}>
                    <div className="flex items-center gap-2 text-sm">
                      <Edit3 className="w-4 h-4" />
                      Annotations {allowAnnotations ? 'allowed' : 'blocked'}
                    </div>
                  </div>
                </div>
              )}
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
                  className={`h-full bg-gradient-to-r ${mode === 'add' ? 'from-violet-500 to-purple-500' : 'from-emerald-500 to-teal-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-white/40 text-center">
                {mode === 'add' ? 'Encrypting your PDF...' : 'Removing password protection...'}
              </p>
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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {mode === 'add' ? 'PDF Protected Successfully!' : 'Password Removed Successfully!'}
            </h2>
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
              Download PDF
            </button>
            <button
              onClick={reset}
              className="px-8 py-4 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              Process Another PDF
            </button>
          </div>
        </div>
      )}
    </ToolWorkspaceLayout>
  );
}
