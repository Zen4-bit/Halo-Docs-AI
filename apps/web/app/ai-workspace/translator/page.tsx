'use client';

import { useState, useEffect } from 'react';
import { Languages, ArrowRightLeft, Loader2, Copy, Check, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import AIResponseRenderer from '@/components/ai/AIResponseRenderer';
import { useAIHistory } from '@/context/AIHistoryContext';

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
    
    // Shared history context
    const { updateCurrentSession, selectedItemData, isNewChat } = useAIHistory();
    
    // Restore session when a history item is selected
    useEffect(() => {
        if (selectedItemData) {
            try {
                if (selectedItemData.text) setText(selectedItemData.text);
                if (selectedItemData.targetLanguage) setTargetLanguage(selectedItemData.targetLanguage);
                if (selectedItemData.translatedText) setTranslatedText(selectedItemData.translatedText);
            } catch (error) {
                console.error('Error restoring translator session:', error);
            }
        }
    }, [selectedItemData]);
    
    // Handle new chat action
    useEffect(() => {
        if (isNewChat) {
            setText('');
            setTargetLanguage('Spanish');
            setTranslatedText('');
            setError('');
        }
    }, [isNewChat]);
    
    // Save to history when translation is complete
    useEffect(() => {
        if (translatedText && !loading) {
            updateCurrentSession(
                text.slice(0, 50) + (text.length > 50 ? '...' : ''),
                { text, targetLanguage, translatedText },
                translatedText.slice(0, 100)
            );
        }
    }, [translatedText, loading, updateCurrentSession]);

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

    const handleDownload = () => {
        const blob = new Blob([translatedText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'translation.txt';
        a.click();
    };

    // Listen for tool actions from header
    useEffect(() => {
        const handleToolAction = (e: CustomEvent) => {
            switch (e.detail) {
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
    }, [translatedText]);

    return (
        <div className="flex flex-col h-full pt-12 md:pt-0">
            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="max-w-[850px] mx-auto px-3 sm:px-4 py-4 space-y-4">
                {/* Language Selection */}
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium tool-text-secondary mb-2">Source</label>
                        <div className="px-4 py-3 rounded-xl tool-bg-surface tool-border border tool-text-secondary">
                            Auto-detect
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleSwap}
                        className="mt-6 p-3 rounded-xl tool-bg-surface tool-border border hover:border-primary transition-colors"
                    >
                        <ArrowRightLeft className="w-5 h-5 tool-text-muted" />
                    </button>
                    
                    <div className="flex-1">
                        <label className="block text-sm font-medium tool-text-secondary mb-2">Target Language</label>
                        <select
                            value={targetLanguage}
                            onChange={(e) => setTargetLanguage(e.target.value)}
                            className="tool-input w-full px-4 py-3 rounded-xl focus:border-primary"
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
                        <label className="block text-sm font-medium tool-text-secondary mb-2">Original Text</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Enter text to translate..."
                            rows={8}
                            className="tool-input w-full px-4 py-3 rounded-xl focus:border-primary resize-none"
                        />
                        <div className="mt-2 text-sm tool-text-muted text-right">
                            {text.length} characters
                        </div>
                    </div>

                    {/* Output */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium tool-text-secondary">Translation</label>
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
                        <div className="w-full min-h-[200px] px-4 py-3 rounded-xl tool-bg-surface tool-border border tool-text-secondary overflow-hidden">
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
                                <p className="tool-text-muted">Translation will appear here...</p>
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
                </div>
            </div>

            {/* Translate Button - Fixed at bottom */}
            <div className="flex-shrink-0 border-t border-border bg-surface/95 backdrop-blur-xl">
                <div className="max-w-[850px] mx-auto px-4 py-2">
                    <button
                        onClick={handleTranslate}
                        disabled={loading || !text.trim()}
                        className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-green-500/25"
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
        </div>
    );
}
