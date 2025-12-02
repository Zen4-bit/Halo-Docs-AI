'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  FileText, Loader2, Copy, Check, Zap, Upload, X, Image, 
  Settings2, Globe, ListOrdered, Hash, Heart, Users, Tag,
  Download, ChevronDown, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import AIResponseRenderer from '@/components/ai/AIResponseRenderer';
import { useAIHistory } from '@/context/AIHistoryContext';

const SUMMARY_LEVELS = [
  { id: 'short', label: 'Short', description: '2-3 sentences', icon: '⚡' },
  { id: 'medium', label: 'Medium', description: '1-2 paragraphs', icon: '📝' },
  { id: 'detailed', label: 'Detailed', description: 'Full analysis', icon: '📖' },
];

const SUMMARY_STYLES = [
  { id: 'paragraph', label: 'Paragraph', icon: '📄' },
  { id: 'bullets', label: 'Bullet Points', icon: '•' },
  { id: 'numbered', label: 'Numbered', icon: '1.' },
  { id: 'executive', label: 'Executive', icon: '💼' },
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian',
  'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Dutch', 'Polish', 'Turkish'
];

export default function DocumentSummaryPage() {
  const [text, setText] = useState('');
  const [level, setLevel] = useState('medium');
  const [style, setStyle] = useState('paragraph');
  const [language, setLanguage] = useState('English');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  
  // Extraction options
  const [extractTopics, setExtractTopics] = useState(false);
  const [extractSentiment, setExtractSentiment] = useState(false);
  const [extractEntities, setExtractEntities] = useState(false);
  
  // Results
  const [topics, setTopics] = useState<string[]>([]);
  const [sentiment, setSentiment] = useState<string>('');
  const [entities, setEntities] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Shared history context
  const { updateCurrentSession, selectedItemData, isNewChat } = useAIHistory();
  
  // Restore session when a history item is selected
  useEffect(() => {
    if (selectedItemData) {
      try {
        if (selectedItemData.text) setText(selectedItemData.text);
        if (selectedItemData.summary) setSummary(selectedItemData.summary);
        if (selectedItemData.topics) setTopics(selectedItemData.topics);
        if (selectedItemData.sentiment) setSentiment(selectedItemData.sentiment);
        if (selectedItemData.entities) setEntities(selectedItemData.entities);
      } catch (error) {
        console.error('Error restoring summary session:', error);
      }
    }
  }, [selectedItemData]);
  
  // Handle new chat action
  useEffect(() => {
    if (isNewChat) {
      setText('');
      setSummary('');
      setTopics([]);
      setSentiment('');
      setEntities(null);
      setError('');
      setAttachedFile(null);
      setFilePreview(null);
    }
  }, [isNewChat]);
  
  // Save to history when summary is complete
  useEffect(() => {
    if (summary && !loading) {
      updateCurrentSession(
        text.slice(0, 50) + (text.length > 50 ? '...' : ''),
        { text, summary, topics, sentiment, entities },
        summary.slice(0, 100)
      );
    }
  }, [summary, loading, updateCurrentSession]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      if (file.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
        // Read text files
        if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          file.text().then(content => setText(content));
        }
      }
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSummarize = async () => {
    if (!text.trim() && !attachedFile) return;

    setLoading(true);
    setError('');
    setSummary('');
    setTopics([]);
    setSentiment('');
    setEntities(null);

    try {
      const formData = new FormData();
      if (text) formData.append('text', text);
      formData.append('level', level);
      formData.append('style', style);
      formData.append('language', language);
      formData.append('extract_topics', String(extractTopics));
      formData.append('extract_sentiment', String(extractSentiment));
      formData.append('extract_entities', String(extractEntities));
      if (attachedFile) formData.append('file', attachedFile);

      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Summarization failed');
      }

      setSummary(data.summary || data.response || '');
      
      // Parse additional extractions if present
      if (data.topics) setTopics(Array.isArray(data.topics) ? data.topics : []);
      if (data.sentiment) setSentiment(data.sentiment);
      if (data.entities) setEntities(data.entities);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    let content = `# Summary\n\n${summary}`;
    if (topics.length) content += `\n\n## Topics\n${topics.map(t => `- ${t}`).join('\n')}`;
    if (sentiment) content += `\n\n## Sentiment\n${sentiment}`;
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'summary.md';
    a.click();
  };

  // Listen for tool actions from header
  useEffect(() => {
    const handleToolAction = (e: CustomEvent) => {
      switch (e.detail) {
        case 'upload':
          fileInputRef.current?.click();
          break;
        case 'analyze':
          handleSummarize();
          break;
        case 'copy':
          handleCopy();
          break;
        case 'download':
          handleDownload();
          break;
      }
    };
    window.addEventListener('tool-action', handleToolAction as EventListener);
    return () => window.removeEventListener('tool-action', handleToolAction as EventListener);
  }, [summary]);

  return (
    <div className="flex flex-col h-full pt-12 md:pt-0">
      <main className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-[850px] mx-auto px-3 sm:px-4 py-4 space-y-4">
        {/* Upload Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="tool-upload-zone cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 group"
        >
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.md,image/*" onChange={handleFileSelect} className="hidden" />
          
          {attachedFile ? (
            <div className="flex items-center gap-4">
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="w-20 h-20 rounded-xl object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-zinc-800 flex items-center justify-center">
                  <FileText className="w-10 h-10 text-purple-400" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-white font-medium">{attachedFile.name}</p>
                <p className="text-sm text-zinc-400">{(attachedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); removeFile(); }} className="p-2 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-red-400">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="w-12 h-12 text-zinc-500 group-hover:text-purple-400 mx-auto mb-3 transition-colors" />
              <p className="text-white font-medium mb-1">Drop a document or image</p>
              <p className="text-sm text-zinc-500">PDF, DOCX, TXT, MD, or images</p>
            </div>
          )}
        </div>

        {/* Text Input */}
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Or paste your text here..."
            rows={8}
            className="w-full px-5 py-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
          />
          <div className="absolute bottom-3 right-3 text-xs text-zinc-500">{text.length.toLocaleString()} characters</div>
        </div>

        {/* Summary Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Level Selection */}
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-3 block">Summary Length</label>
            <div className="grid grid-cols-3 gap-2">
              {SUMMARY_LEVELS.map(l => (
                <button key={l.id} onClick={() => setLevel(l.id)} className={`p-3 rounded-xl border text-center transition-all ${level === l.id ? 'bg-purple-500/20 border-purple-500/50 text-white' : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}>
                  <span className="text-lg">{l.icon}</span>
                  <p className="text-sm font-medium mt-1">{l.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Style Selection */}
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-3 block">Output Style</label>
            <div className="grid grid-cols-4 gap-2">
              {SUMMARY_STYLES.map(s => (
                <button key={s.id} onClick={() => setStyle(s.id)} className={`p-3 rounded-xl border text-center transition-all ${style === s.id ? 'bg-purple-500/20 border-purple-500/50 text-white' : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}>
                  <span className="text-lg">{s.icon}</span>
                  <p className="text-xs mt-1">{s.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
          <button onClick={() => setShowOptions(!showOptions)} className="w-full flex items-center justify-between text-white">
            <span className="flex items-center gap-2 font-medium"><Settings2 className="w-5 h-5 text-purple-400" /> Advanced Options</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
          </button>
          
          {showOptions && (
            <div className="mt-4 grid md:grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
              {/* Language */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 flex items-center gap-2"><Globe className="w-4 h-4" /> Output Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white">
                  {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                </select>
              </div>
              
              {/* Extractions */}
              <div className="space-y-3">
                <label className="text-sm text-zinc-400 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Extract Additional Info</label>
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 cursor-pointer">
                  <input type="checkbox" checked={extractTopics} onChange={(e) => setExtractTopics(e.target.checked)} className="w-4 h-4 rounded accent-purple-500" />
                  <Tag className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-zinc-300">Topics & Themes</span>
                </label>
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 cursor-pointer">
                  <input type="checkbox" checked={extractSentiment} onChange={(e) => setExtractSentiment(e.target.checked)} className="w-4 h-4 rounded accent-purple-500" />
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span className="text-sm text-zinc-300">Sentiment Analysis</span>
                </label>
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 cursor-pointer">
                  <input type="checkbox" checked={extractEntities} onChange={(e) => setExtractEntities(e.target.checked)} className="w-4 h-4 rounded accent-purple-500" />
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-zinc-300">Named Entities</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">{error}</div>}

        {/* Results */}
        {summary && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {/* Main Summary */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" /> Summary
                </h3>
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button onClick={handleDownload} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-zinc-200 overflow-x-auto">
                <AIResponseRenderer content={summary} isStreaming={false} />
              </div>
            </div>

            {/* Extracted Info Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Topics */}
              {topics.length > 0 && (
                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <h4 className="font-medium text-white flex items-center gap-2 mb-3"><Tag className="w-4 h-4 text-purple-400" /> Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {topics.map((topic, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">{topic}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sentiment */}
              {sentiment && (
                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <h4 className="font-medium text-white flex items-center gap-2 mb-3"><Heart className="w-4 h-4 text-pink-400" /> Sentiment</h4>
                  <p className="text-zinc-300">{sentiment}</p>
                </div>
              )}

              {/* Entities */}
              {entities && (
                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <h4 className="font-medium text-white flex items-center gap-2 mb-3"><Users className="w-4 h-4 text-blue-400" /> Entities</h4>
                  <p className="text-zinc-300 text-sm">{JSON.stringify(entities, null, 2)}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
        </div>
      </main>

      {/* Summarize Button - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-border bg-surface/95 backdrop-blur-xl">
        <div className="max-w-[850px] mx-auto px-4 py-2">
          <button
            onClick={handleSummarize}
            disabled={loading || (!text.trim() && !attachedFile)}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <><Zap className="w-5 h-5" />Generate Summary</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
