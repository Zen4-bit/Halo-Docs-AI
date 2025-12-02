'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Lightbulb, Loader2, Copy, Check, Upload, X, FileText, Image,
  Settings2, ChevronDown, Download, Heart, Users, Tag, Target,
  MessageSquare, Zap, Brain, TrendingUp, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import AIResponseRenderer from '@/components/ai/AIResponseRenderer';
import { useAIHistory } from '@/context/AIHistoryContext';

const PROFILES = [
  { id: 'general', label: 'General', icon: '🔍', description: 'Overall analysis' },
  { id: 'business', label: 'Business', icon: '💼', description: 'Business implications' },
  { id: 'legal', label: 'Legal', icon: '⚖️', description: 'Legal considerations' },
  { id: 'academic', label: 'Academic', icon: '📚', description: 'Research insights' },
  { id: 'marketing', label: 'Marketing', icon: '📈', description: 'Marketing insights' },
  { id: 'technical', label: 'Technical', icon: '⚙️', description: 'Technical details' },
];

const EXTRACTIONS = [
  { id: 'sentiment', label: 'Sentiment', icon: Heart, color: 'text-pink-400' },
  { id: 'emotions', label: 'Emotions', icon: Brain, color: 'text-purple-400' },
  { id: 'keyPoints', label: 'Key Points', icon: Target, color: 'text-blue-400' },
  { id: 'entities', label: 'Entities', icon: Users, color: 'text-green-400' },
  { id: 'topics', label: 'Topics', icon: Tag, color: 'text-yellow-400' },
  { id: 'intent', label: 'Intent', icon: MessageSquare, color: 'text-cyan-400' },
  { id: 'actionable', label: 'Actions', icon: Zap, color: 'text-orange-400' },
];

export default function InsightsPage() {
  const [text, setText] = useState('');
  const [profile, setProfile] = useState('general');
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  // Extraction toggles
  const [extractSentiment, setExtractSentiment] = useState(true);
  const [extractEmotions, setExtractEmotions] = useState(true);
  const [extractKeyPoints, setExtractKeyPoints] = useState(true);
  const [extractEntities, setExtractEntities] = useState(true);
  const [extractTopics, setExtractTopics] = useState(true);
  const [extractIntent, setExtractIntent] = useState(true);
  const [extractActionable, setExtractActionable] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Shared history context
  const { updateCurrentSession, selectedItemData, isNewChat } = useAIHistory();
  
  // Restore session when a history item is selected
  useEffect(() => {
    if (selectedItemData) {
      try {
        if (selectedItemData.text) setText(selectedItemData.text);
        if (selectedItemData.profile) setProfile(selectedItemData.profile);
        if (selectedItemData.insights) setInsights(selectedItemData.insights);
      } catch (error) {
        console.error('Error restoring insights session:', error);
      }
    }
  }, [selectedItemData]);
  
  // Handle new chat action
  useEffect(() => {
    if (isNewChat) {
      setText('');
      setProfile('general');
      setInsights(null);
      setError('');
      setAttachedFile(null);
      setFilePreview(null);
    }
  }, [isNewChat]);
  
  // Save to history when insights are complete
  useEffect(() => {
    if (insights && !loading) {
      const insightsStr = typeof insights === 'string' ? insights : JSON.stringify(insights);
      updateCurrentSession(
        text.slice(0, 50) + (text.length > 50 ? '...' : ''),
        { text, profile, insights },
        insightsStr.slice(0, 100)
      );
    }
  }, [insights, loading, updateCurrentSession]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      if (file.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
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

  const handleAnalyze = async () => {
    if (!text.trim() && !attachedFile) return;

    setLoading(true);
    setError('');
    setInsights(null);

    try {
      const formData = new FormData();
      if (text) formData.append('text', text);
      formData.append('analysis_profile', profile);
      formData.append('extract_sentiment', String(extractSentiment));
      formData.append('extract_emotions', String(extractEmotions));
      formData.append('extract_key_points', String(extractKeyPoints));
      formData.append('extract_entities', String(extractEntities));
      formData.append('extract_topics', String(extractTopics));
      formData.append('extract_intent', String(extractIntent));
      formData.append('actionable_insights', String(extractActionable));
      if (attachedFile) formData.append('file', attachedFile);

      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setInsights(data.insights || data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const textToCopy = typeof insights === 'string' ? insights : JSON.stringify(insights, null, 2);
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = typeof insights === 'string' ? insights : JSON.stringify(insights, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'insights-analysis.json';
    a.click();
  };

  const renderInsightValue = (value: any): string => {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object' && value !== null) return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <div className="flex flex-col h-full pt-12 md:pt-0">
      <main className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-[850px] mx-auto px-3 sm:px-4 py-4 space-y-4">
        {/* Upload Zone */}
        <div onClick={() => fileInputRef.current?.click()} className="tool-upload-zone cursor-pointer hover:border-yellow-500/50 hover:bg-yellow-500/5 group">
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,image/*" onChange={handleFileSelect} className="hidden" />
          
          {attachedFile ? (
            <div className="flex items-center gap-4">
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-xl tool-bg-highlight flex items-center justify-center">
                  <FileText className="w-8 h-8 text-yellow-400" />
                </div>
              )}
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
              <Upload className="w-10 h-10 tool-text-muted group-hover:text-yellow-400 mx-auto mb-2 transition-colors" />
              <p className="tool-text font-medium">Upload document or image for analysis</p>
              <p className="text-sm text-zinc-500">PDF, DOCX, TXT, or images</p>
            </div>
          )}
        </div>

        {/* Analysis Profile */}
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-3 block">Analysis Profile</label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {PROFILES.map(p => (
              <button key={p.id} onClick={() => setProfile(p.id)} className={`p-3 rounded-xl border text-center transition-all ${profile === p.id ? 'bg-yellow-500/20 border-yellow-500/50 text-white' : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}>
                <span className="text-xl">{p.icon}</span>
                <p className="text-xs mt-1">{p.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Text Input */}
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-2 block">Content to Analyze</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your text here for comprehensive analysis..."
            rows={8}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-500 focus:border-yellow-500 focus:outline-none resize-none"
          />
          <div className="mt-2 text-xs text-zinc-500 text-right">{text.length.toLocaleString()} characters</div>
        </div>

        {/* Extraction Options */}
        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
          <button onClick={() => setShowOptions(!showOptions)} className="w-full flex items-center justify-between text-white">
            <span className="flex items-center gap-2 font-medium"><Settings2 className="w-5 h-5 text-yellow-400" /> Extraction Options</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
          </button>
          
          {showOptions && (
            <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-2 md:grid-cols-4 gap-3">
              {EXTRACTIONS.map(ext => {
                const Icon = ext.icon;
                const isChecked = {
                  sentiment: extractSentiment,
                  emotions: extractEmotions,
                  keyPoints: extractKeyPoints,
                  entities: extractEntities,
                  topics: extractTopics,
                  intent: extractIntent,
                  actionable: extractActionable,
                }[ext.id];
                const setChecked = {
                  sentiment: setExtractSentiment,
                  emotions: setExtractEmotions,
                  keyPoints: setExtractKeyPoints,
                  entities: setExtractEntities,
                  topics: setExtractTopics,
                  intent: setExtractIntent,
                  actionable: setExtractActionable,
                }[ext.id];
                
                return (
                  <label key={ext.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 cursor-pointer hover:bg-zinc-800">
                    <input type="checkbox" checked={isChecked} onChange={(e) => setChecked?.(e.target.checked)} className="w-4 h-4 rounded accent-yellow-500" />
                    <Icon className={`w-4 h-4 ${ext.color}`} />
                    <span className="text-sm text-zinc-300">{ext.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Error */}
        {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2"><AlertCircle className="w-5 h-5" />{error}</div>}

        {/* Results */}
        {insights && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" /> Analysis Results
              </h3>
              <div className="flex gap-2">
                <button onClick={handleCopy} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white">
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button onClick={handleDownload} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Results Grid */}
            {typeof insights === 'object' ? (
              <div className="grid md:grid-cols-2 gap-4">
                {insights.summary && (
                  <div className="md:col-span-2 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                    <h4 className="font-medium text-white mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-400" />Summary</h4>
                    <p className="text-zinc-300 leading-relaxed">{insights.summary}</p>
                  </div>
                )}
                
                {insights.sentiment && (
                  <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                    <h4 className="font-medium text-white mb-2 flex items-center gap-2"><Heart className="w-4 h-4 text-pink-400" />Sentiment</h4>
                    <p className="text-zinc-300">{renderInsightValue(insights.sentiment)}</p>
                  </div>
                )}

                {insights.emotions && (
                  <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                    <h4 className="font-medium text-white mb-2 flex items-center gap-2"><Brain className="w-4 h-4 text-purple-400" />Emotions</h4>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(insights.emotions) ? insights.emotions : [insights.emotions]).map((e: string, i: number) => (
                        <span key={i} className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">{e}</span>
                      ))}
                    </div>
                  </div>
                )}

                {insights.key_points && (
                  <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                    <h4 className="font-medium text-white mb-2 flex items-center gap-2"><Target className="w-4 h-4 text-blue-400" />Key Points</h4>
                    <ul className="space-y-1 text-zinc-300 text-sm">
                      {(Array.isArray(insights.key_points) ? insights.key_points : [insights.key_points]).map((p: string, i: number) => (
                        <li key={i}>• {p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {insights.topics && (
                  <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                    <h4 className="font-medium text-white mb-2 flex items-center gap-2"><Tag className="w-4 h-4 text-yellow-400" />Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(insights.topics) ? insights.topics : [insights.topics]).map((t: string, i: number) => (
                        <span key={i} className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-sm">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {insights.actionable_insights && (
                  <div className="md:col-span-2 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                    <h4 className="font-medium text-white mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-orange-400" />Actionable Insights</h4>
                    <ul className="space-y-1 text-zinc-300 text-sm">
                      {(Array.isArray(insights.actionable_insights) ? insights.actionable_insights : [insights.actionable_insights]).map((a: string, i: number) => (
                        <li key={i}>✓ {a}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {insights.raw_analysis && (
                  <div className="md:col-span-2 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                    <h4 className="font-medium text-white mb-2">Raw Analysis</h4>
                    <div className="text-zinc-300 text-sm overflow-x-auto">
                      <AIResponseRenderer content={insights.raw_analysis} isStreaming={false} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 overflow-x-auto"
              >
                <AIResponseRenderer content={String(insights)} isStreaming={false} />
              </motion.div>
            )}
          </div>
        )}
        </div>
      </main>

      {/* Analyze Button - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-border bg-surface/95 backdrop-blur-xl">
        <div className="max-w-[850px] mx-auto px-4 py-2">
          <button
            onClick={handleAnalyze}
            disabled={loading || (!text.trim() && !attachedFile)}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold hover:shadow-lg hover:shadow-yellow-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Analyzing...</> : <><TrendingUp className="w-5 h-5" />Generate Insights</>}
          </button>
        </div>
      </div>
    </div>
  );
}
