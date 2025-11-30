'use client';

import { useState } from 'react';
import { Languages, ArrowRightLeft, Loader2, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import AIResponseRenderer from '@/components/ai/AIResponseRenderer';

const LANGUAGES = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
    'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Russian',
    'Dutch', 'Polish', 'Swedish', 'Turkish', 'Vietnamese', 'Thai',
    'Indonesian', 'Greek', 'Hebrew', 'Czech', 'Romanian', 'Hungarian'
];

export default function TranslatorPage() {
    const [text, setText] = useState('');
    const [targetLanguage, setTargetLanguage] = useState('Spanish');
    const [translatedText, setTranslatedText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleTranslate = async () => {
        if (!text.trim()) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/ai/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, targetLanguage }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Translation failed');
            }

            setTranslatedText(data.translation || data.translatedText || data.translated_text || data.response || '');
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
        if (translatedText) {
            setText(translatedText);
            setTranslatedText('');
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <Languages className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">AI Translator</h1>
                    <p className="text-slate-400">Translate text between 100+ languages</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Language Selection */}
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Source</label>
                        <div className="px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
                            Auto-detect
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleSwap}
                        className="mt-6 p-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-primary transition-colors"
                    >
                        <ArrowRightLeft className="w-5 h-5 text-slate-400" />
                    </button>
                    
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Target Language</label>
                        <select
                            value={targetLanguage}
                            onChange={(e) => setTargetLanguage(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-primary focus:outline-none"
                        >
                            {LANGUAGES.map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Text Areas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Original Text</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Enter text to translate..."
                            rows={8}
                            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-primary focus:outline-none resize-none"
                        />
                        <div className="mt-2 text-sm text-slate-500 text-right">
                            {text.length} characters
                        </div>
                    </div>

                    {/* Output */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-slate-400">Translation</label>
                            {translatedText && (
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            )}
                        </div>
                        <div className="w-full min-h-[200px] px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-300 overflow-hidden">
                            {loading ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-3 text-slate-400"
                                >
                                    <div className="flex gap-1">
                                        <motion.div 
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                            className="w-2 h-2 bg-green-400 rounded-full"
                                        />
                                        <motion.div 
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                            className="w-2 h-2 bg-emerald-400 rounded-full"
                                        />
                                        <motion.div 
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                            className="w-2 h-2 bg-teal-400 rounded-full"
                                        />
                                    </div>
                                    Translating...
                                </motion.div>
                            ) : translatedText ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-x-auto"
                                >
                                    <AIResponseRenderer content={translatedText} isStreaming={false} />
                                </motion.div>
                            ) : (
                                <p className="text-slate-500">Translation will appear here...</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                        {error}
                    </div>
                )}

                {/* Translate Button */}
                <button
                    onClick={handleTranslate}
                    disabled={loading || !text.trim()}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Translating...
                        </>
                    ) : (
                        <>
                            <Languages className="w-5 h-5" />
                            Translate
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
