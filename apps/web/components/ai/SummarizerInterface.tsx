'use client';

import { useState } from 'react';
import { FileText, AlignLeft, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const LENGTHS = [
    { value: 'short', label: 'Short' },
    { value: 'medium', label: 'Medium' },
    { value: 'long', label: 'Long' },
];

const FORMATS = [
    { value: 'paragraph', label: 'Paragraph' },
    { value: 'bullets', label: 'Bullet Points' },
    { value: 'executive', label: 'Executive Summary' },
];

export function SummarizerInterface() {
    const [text, setText] = useState('');
    const [length, setLength] = useState('medium');
    const [format, setFormat] = useState('paragraph');
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summary, setSummary] = useState('');
    const [copied, setCopied] = useState(false);

    const handleSummarize = async () => {
        if (!text.trim()) return;

        setIsSummarizing(true);
        setSummary('');

        try {
            const response = await fetch('/api/ai/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, length, format }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Summarization failed');

            setSummary(data.summary);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to summarize text');
        } finally {
            setIsSummarizing(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Copied to clipboard');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Controls */}
            <div className="lg:col-span-1 space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Summary Length
                        </label>
                        <div className="flex gap-2">
                            {LENGTHS.map((l) => (
                                <button
                                    key={l.value}
                                    onClick={() => setLength(l.value)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${length === l.value
                                        ? 'bg-primary text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    {l.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Format
                        </label>
                        <div className="space-y-2">
                            {FORMATS.map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => setFormat(f.value)}
                                    className={`w-full text-left p-3 rounded-lg transition-all ${format === f.value
                                        ? 'bg-primary/20 border-2 border-primary'
                                        : 'bg-slate-800/50 border-2 border-transparent hover:bg-slate-800'
                                        }`}
                                >
                                    <span className="text-white font-medium">{f.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleSummarize}
                        disabled={!text.trim() || isSummarizing}
                        className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-primary to-purple-500 text-white font-semibold hover:from-primary/90 hover:to-purple-500/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                        {isSummarizing ? (
                            <>
                                <AlignLeft className="w-5 h-5 animate-spin" />
                                <span>Summarizing...</span>
                            </>
                        ) : (
                            <>
                                <FileText className="w-5 h-5" />
                                <span>Summarize</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Editor */}
            <div className="lg:col-span-2 grid grid-rows-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Original Text</label>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste text to summarize..."
                        className="w-full h-full min-h-[200px] p-4 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-primary focus:outline-none resize-none"
                    />
                </div>

                <div className="space-y-2 relative">
                    <label className="text-sm font-medium text-white">Summary</label>
                    <textarea
                        readOnly
                        value={summary}
                        placeholder="Summary will appear here..."
                        className="w-full h-full min-h-[200px] p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-300 placeholder-slate-600 focus:outline-none resize-none"
                    />
                    {summary && (
                        <button
                            onClick={handleCopy}
                            className="absolute top-10 right-4 p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
