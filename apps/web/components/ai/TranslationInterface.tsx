'use client';

import { useState } from 'react';
import { Languages, ArrowRight, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ru', name: 'Russian' },
];

export function TranslationInterface() {
    const [text, setText] = useState('');
    const [targetLang, setTargetLang] = useState('es');
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedText, setTranslatedText] = useState('');
    const [copied, setCopied] = useState(false);

    const handleTranslate = async () => {
        if (!text.trim()) return;

        setIsTranslating(true);
        setTranslatedText('');

        try {
            const response = await fetch('/api/ai/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, targetLanguage: targetLang }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Translation failed');

            setTranslatedText(data.translatedText);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to translate text');
        } finally {
            setIsTranslating(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(translatedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Copied to clipboard');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Input */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">Original Text</label>
                    <span className="text-xs text-slate-400">Auto-detect language</span>
                </div>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter text to translate..."
                    className="w-full h-[300px] p-4 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-primary focus:outline-none resize-none"
                />
            </div>

            {/* Output */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">Translation</label>
                    <div className="flex items-center gap-2">
                        <select
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-2 py-1 focus:border-primary focus:outline-none"
                        >
                            {LANGUAGES.map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.name}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleTranslate}
                            disabled={!text.trim() || isTranslating}
                            className="px-3 py-1 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isTranslating ? 'Translating...' : 'Translate'}
                            <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
                <div className="relative h-[300px]">
                    <textarea
                        readOnly
                        value={translatedText}
                        placeholder="Translation will appear here..."
                        className="w-full h-full p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-300 placeholder-slate-600 focus:outline-none resize-none"
                    />
                    {translatedText && (
                        <button
                            onClick={handleCopy}
                            className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
