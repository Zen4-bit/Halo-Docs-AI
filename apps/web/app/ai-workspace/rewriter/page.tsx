'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Loader2, Copy, Check, Upload, X, FileText,
  Settings2, ChevronDown, Download, Smile, ArrowDownWideNarrow, ArrowUpWideNarrow, Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import AIResponseRenderer from '@/components/ai/AIResponseRenderer';
import { useAIHistory } from '@/context/AIHistoryContext';

const LEVELS = [
  { id: 'light', label: 'Light', description: 'Minimal changes', icon: '✨' },
  { id: 'medium', label: 'Medium', description: 'Balanced rewrite', icon: '🔄' },
  { id: 'aggressive', label: 'Aggressive', description: 'Complete rephrase', icon: '⚡' },
];

const TONES = [
  { id: 'neutral', label: 'Neutral', icon: '😐' },
  { id: 'formal', label: 'Formal', icon: '👔' },
  { id: 'friendly', label: 'Friendly', icon: '😊' },
  { id: 'academic', label: 'Academic', icon: '📚' },
  { id: 'seo', label: 'SEO', icon: '🔍' },
  { id: 'storytelling', label: 'Storytelling', icon: '📖' },
  { id: 'persuasive', label: 'Persuasive', icon: '💪' },
];

const LENGTH_OPTIONS = [
  { id: 'shorter', label: 'Shorter', icon: ArrowDownWideNarrow },
  { id: 'same', label: 'Same Length', icon: null },
  { id: 'longer', label: 'Longer', icon: ArrowUpWideNarrow },
];

export default function RewriterPage() {
  const [text, setText] = useState('');
  const [level, setLevel] = useState('medium');
  const [tone, setTone] = useState('neutral');
  const [lengthChange, setLengthChange] = useState('same');
  const [useEmoji, setUseEmoji] = useState(false);
  const [plagiarismSafe, setPlagiarismSafe] = useState(false);
  const [rewrittenText, setRewrittenText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Shared history context
  const { updateCurrentSession, selectedItemData, isNewChat } = useAIHistory();
  
  // Restore session when a history item is selected
  useEffect(() => {
    if (selectedItemData) {
      try {
        if (selectedItemData.text) setText(selectedItemData.text);
        if (selectedItemData.level) setLevel(selectedItemData.level);
        if (selectedItemData.tone) setTone(selectedItemData.tone);
        if (selectedItemData.rewrittenText) setRewrittenText(selectedItemData.rewrittenText);
      } catch (error) {
        console.error('Error restoring rewriter session:', error);
      }
    }
  }, [selectedItemData]);
  
  // Handle new chat action
  useEffect(() => {
    if (isNewChat) {
      setText('');
      setLevel('medium');
      setTone('neutral');
      setRewrittenText('');
      setError('');
      setAttachedFile(null);
    }
  }, [isNewChat]);
  
  // Save to history when rewrite is complete
  useEffect(() => {
    if (rewrittenText && !loading) {
      updateCurrentSession(
        text.slice(0, 50) + (text.length > 50 ? '...' : ''),
        { text, level, tone, rewrittenText },
        rewrittenText.slice(0, 100)
      );
    }
  }, [rewrittenText, loading, updateCurrentSession]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        file.text().then(content => setText(content));
      }
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRewrite = async () => {
    if (!text.trim() && !attachedFile) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      if (text) formData.append('text', text);
      formData.append('level', level);
      formData.append('tone', tone);
      formData.append('length_change', lengthChange);
      formData.append('use_emoji', String(useEmoji));
      formData.append('plagiarism_safe', String(plagiarismSafe));
      if (attachedFile) formData.append('file', attachedFile);

      const response = await fetch('/api/ai/rewrite', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Rewrite failed');
      }

      setRewrittenText(data.rewritten || data.rewrittenText || data.rewritten_text || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rewrittenText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([rewrittenText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rewritten-text.txt';
    a.click();
  };

  const handleUseResult = () => {
    if (rewrittenText) {
      setText(rewrittenText);
      setRewrittenText('');
    }
  };

  return (
    <div className="flex flex-col h-full pt-12 md:pt-0">
      <main className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-[850px] mx-auto px-3 sm:px-4 py-4 space-y-4">
        {/* Upload Zone */}
        <div onClick={() => fileInputRef.current?.click()} className="tool-upload-zone cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 group">
          <input ref={fileInputRef} type="file" accept=".txt,.doc,.docx" onChange={handleFileSelect} className="hidden" />
          
          {attachedFile ? (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl tool-bg-highlight flex items-center justify-center">
                <FileText className="w-7 h-7 text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="tool-text font-medium">{attachedFile.name}</p>
                <p className="text-sm tool-text-secondary">{(attachedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); removeFile(); }} className="p-2 rounded-lg hover:tool-bg-highlight tool-text-muted hover:text-red-400">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="w-10 h-10 tool-text-muted group-hover:text-violet-400 mx-auto mb-2 transition-colors" />
              <p className="tool-text font-medium">Upload a document to rewrite</p>
              <p className="text-sm text-zinc-500">TXT, DOC, DOCX supported</p>
            </div>
          )}
        </div>

        {/* Rewrite Level */}
        <div>
          <label className="text-sm font-medium tool-text-secondary mb-3 block">Rewrite Level</label>
          <div className="grid grid-cols-3 gap-3">
            {LEVELS.map(l => (
              <button key={l.id} onClick={() => setLevel(l.id)} className={`p-4 rounded-xl border text-center transition-all ${level === l.id ? 'bg-violet-500/20 border-violet-500/50 tool-text' : 'tool-bg-surface tool-border tool-text-secondary hover:border-violet-500/30'}`}>
                <span className="text-2xl">{l.icon}</span>
                <p className="font-medium mt-1">{l.label}</p>
                <p className="text-xs tool-text-muted mt-1">{l.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Tone Selection */}
        <div>
          <label className="text-sm font-medium tool-text-secondary mb-3 block">Tone Style</label>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
            {TONES.map(t => (
              <button key={t.id} onClick={() => setTone(t.id)} className={`p-3 rounded-xl border text-center transition-all ${tone === t.id ? 'bg-violet-500/20 border-violet-500/50 tool-text' : 'tool-bg-surface tool-border tool-text-secondary hover:border-violet-500/30'}`}>
                <span className="text-lg">{t.icon}</span>
                <p className="text-xs mt-1">{t.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Length Control */}
        <div>
          <label className="text-sm font-medium tool-text-secondary mb-3 block">Output Length</label>
          <div className="grid grid-cols-3 gap-3">
            {LENGTH_OPTIONS.map(opt => {
              const Icon = opt.icon;
              return (
                <button key={opt.id} onClick={() => setLengthChange(opt.id)} className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${lengthChange === opt.id ? 'bg-violet-500/20 border-violet-500/50 tool-text' : 'tool-bg-surface tool-border tool-text-secondary hover:border-violet-500/30'}`}>
                  {Icon && <Icon className="w-5 h-5" />}
                  <span className="font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="p-4 rounded-2xl tool-bg-surface tool-border border">
          <button onClick={() => setShowOptions(!showOptions)} className="w-full flex items-center justify-between tool-text">
            <span className="flex items-center gap-2 font-medium"><Settings2 className="w-5 h-5 text-violet-400" /> Advanced Options</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
          </button>
          
          {showOptions && (
            <div className="mt-4 pt-4 tool-border border-t flex flex-wrap gap-4">
              <label className="flex items-center gap-3 p-3 rounded-xl tool-bg-highlight cursor-pointer">
                <input type="checkbox" checked={useEmoji} onChange={(e) => setUseEmoji(e.target.checked)} className="w-4 h-4 rounded accent-violet-500" />
                <Smile className="w-5 h-5 text-yellow-400" />
                <span className="text-sm tool-text-secondary">Add Emojis</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl tool-bg-highlight cursor-pointer">
                <input type="checkbox" checked={plagiarismSafe} onChange={(e) => setPlagiarismSafe(e.target.checked)} className="w-4 h-4 rounded accent-violet-500" />
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-sm tool-text-secondary">Plagiarism-Safe</span>
              </label>
            </div>
          )}
        </div>

        {/* Text Areas */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Input */}
          <div>
            <label className="text-sm font-medium tool-text-secondary mb-2 block">Original Text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter or paste text to rewrite..."
              rows={10}
              className="tool-input w-full px-4 py-3 rounded-xl focus:border-violet-500 resize-none"
            />
            <div className="mt-2 text-xs text-zinc-500 text-right">{text.length.toLocaleString()} characters</div>
          </div>

          {/* Output */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-zinc-300">Rewritten Text</label>
              {rewrittenText && (
                <div className="flex gap-2">
                  <button onClick={handleUseResult} className="px-2 py-1 rounded-lg text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white">Use as input</button>
                  <button onClick={handleCopy} className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white">
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button onClick={handleDownload} className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="w-full min-h-[280px] px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-200 overflow-hidden">
              {loading ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 text-zinc-400"
                >
                  <div className="flex gap-1">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 bg-violet-400 rounded-full"
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 bg-purple-400 rounded-full"
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 bg-pink-400 rounded-full"
                    />
                  </div>
                  Rewriting...
                </motion.div>
              ) : rewrittenText ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-x-auto"
                >
                  <AIResponseRenderer content={rewrittenText} isStreaming={false} />
                </motion.div>
              ) : (
                <p className="text-zinc-500">Rewritten text will appear here...</p>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">{error}</div>}
        </div>
      </main>

      {/* Rewrite Button - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-border bg-surface/95 backdrop-blur-xl">
        <div className="max-w-[850px] mx-auto px-4 py-2">
          <button
            onClick={handleRewrite}
            disabled={loading || (!text.trim() && !attachedFile)}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold hover:shadow-lg hover:shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Rewriting...</> : <><Sparkles className="w-5 h-5" />Rewrite Text</>}
          </button>
        </div>
      </div>
    </div>
  );
}
