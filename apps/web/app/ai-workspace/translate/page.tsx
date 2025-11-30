'use client';

import { useState, useRef } from 'react';
import { 
  Languages, ArrowRightLeft, Loader2, Copy, Check, Upload, X,
  Settings2, ChevronDown, Download, FileText, Image, Globe, MessageSquare
} from 'lucide-react';

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian',
  'Chinese (Simplified)', 'Chinese (Traditional)', 'Japanese', 'Korean', 'Arabic',
  'Hindi', 'Bengali', 'Urdu', 'Turkish', 'Vietnamese', 'Thai', 'Indonesian', 'Malay',
  'Filipino', 'Dutch', 'Polish', 'Ukrainian', 'Czech', 'Romanian', 'Hungarian',
  'Greek', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Hebrew', 'Persian',
  'Swahili', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Gujarati',
  'Punjabi', 'Nepali', 'Sinhala', 'Georgian', 'Armenian', 'Azerbaijani',
  'Albanian', 'Serbian', 'Croatian', 'Bosnian', 'Slovenian', 'Slovak', 'Bulgarian',
  'Lithuanian', 'Latvian', 'Estonian', 'Icelandic', 'Irish', 'Welsh', 'Basque',
  'Catalan', 'Galician', 'Latin', 'Esperanto'
];

const TONES = [
  { id: 'neutral', label: 'Neutral', description: 'Standard translation' },
  { id: 'formal', label: 'Formal', description: 'Professional & business' },
  { id: 'informal', label: 'Informal', description: 'Casual & friendly' },
  { id: 'academic', label: 'Academic', description: 'Scholarly language' },
  { id: 'business', label: 'Business', description: 'Corporate tone' },
];

export default function TranslatePage() {
  const [text, setText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [tone, setTone] = useState('neutral');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [preserveFormatting, setPreserveFormatting] = useState(true);
  const [sentenceBySentence, setSentenceBySentence] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleTranslate = async () => {
    if (!text.trim() && !attachedFile) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      if (text) formData.append('text', text);
      formData.append('target_language', targetLanguage);
      formData.append('source_language', sourceLanguage);
      formData.append('tone', tone);
      formData.append('preserve_formatting', String(preserveFormatting));
      formData.append('sentence_by_sentence', String(sentenceBySentence));
      if (attachedFile) formData.append('file', attachedFile);

      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Translation failed');
      }

      setTranslatedText(data.translation || data.translatedText || data.translated_text || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwap = () => {
    if (translatedText && sourceLanguage !== 'auto') {
      setText(translatedText);
      setTranslatedText('');
      const temp = sourceLanguage;
      setSourceLanguage(targetLanguage);
      setTargetLanguage(temp);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([translatedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translation-${targetLanguage.toLowerCase()}.txt`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/25">
              <Languages className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI Translator</h1>
              <p className="text-zinc-400">Translate text, documents & images in 70+ languages</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Language Selection */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-zinc-300 mb-2 block">Source Language</label>
            <select value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-green-500 focus:outline-none">
              <option value="auto">🔍 Auto-detect</option>
              {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          </div>
          
          <button onClick={handleSwap} className="mt-6 p-3 rounded-xl bg-zinc-800 border border-zinc-700 hover:border-green-500 hover:bg-green-500/10 transition-all">
            <ArrowRightLeft className="w-5 h-5 text-zinc-400" />
          </button>
          
          <div className="flex-1">
            <label className="text-sm font-medium text-zinc-300 mb-2 block">Target Language</label>
            <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-green-500 focus:outline-none">
              {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          </div>
        </div>

        {/* Upload Zone */}
        <div onClick={() => fileInputRef.current?.click()} className="relative border-2 border-dashed border-zinc-700 hover:border-green-500/50 rounded-2xl p-6 transition-all cursor-pointer bg-zinc-900/30 hover:bg-green-500/5 group">
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,image/*" onChange={handleFileSelect} className="hidden" />
          
          {attachedFile ? (
            <div className="flex items-center gap-4">
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-green-400" />
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
              <Upload className="w-10 h-10 text-zinc-500 group-hover:text-green-400 mx-auto mb-2 transition-colors" />
              <p className="text-white font-medium">Upload document or image to translate</p>
              <p className="text-sm text-zinc-500">PDF, DOCX, TXT, or images with text</p>
            </div>
          )}
        </div>

        {/* Text Areas */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Input */}
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-2 block">Original Text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter or paste text to translate..."
              rows={10}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-500 focus:border-green-500 focus:outline-none resize-none"
            />
            <div className="mt-2 text-xs text-zinc-500 text-right">{text.length.toLocaleString()} characters</div>
          </div>

          {/* Output */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-zinc-300">Translation</label>
              {translatedText && (
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white">
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button onClick={handleDownload} className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="w-full min-h-[280px] px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-200 overflow-auto">
              {loading ? (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Translating...
                </div>
              ) : translatedText ? (
                <p className="whitespace-pre-wrap leading-relaxed">{translatedText}</p>
              ) : (
                <p className="text-zinc-500">Translation will appear here...</p>
              )}
            </div>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
          <button onClick={() => setShowOptions(!showOptions)} className="w-full flex items-center justify-between text-white">
            <span className="flex items-center gap-2 font-medium"><Settings2 className="w-5 h-5 text-green-400" /> Translation Options</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
          </button>
          
          {showOptions && (
            <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4">
              {/* Tone Selection */}
              <div>
                <label className="text-sm text-zinc-400 mb-3 block flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Tone</label>
                <div className="grid grid-cols-5 gap-2">
                  {TONES.map(t => (
                    <button key={t.id} onClick={() => setTone(t.id)} className={`p-2 rounded-xl border text-center transition-all ${tone === t.id ? 'bg-green-500/20 border-green-500/50 text-white' : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}>
                      <p className="text-sm font-medium">{t.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 cursor-pointer">
                  <input type="checkbox" checked={preserveFormatting} onChange={(e) => setPreserveFormatting(e.target.checked)} className="w-4 h-4 rounded accent-green-500" />
                  <span className="text-sm text-zinc-300">Preserve formatting</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 cursor-pointer">
                  <input type="checkbox" checked={sentenceBySentence} onChange={(e) => setSentenceBySentence(e.target.checked)} className="w-4 h-4 rounded accent-green-500" />
                  <span className="text-sm text-zinc-300">Sentence-by-sentence</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">{error}</div>}

        {/* Translate Button */}
        <button
          onClick={handleTranslate}
          disabled={loading || (!text.trim() && !attachedFile)}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
        >
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Translating...</> : <><Globe className="w-5 h-5" />Translate</>}
        </button>
      </main>
    </div>
  );
}
