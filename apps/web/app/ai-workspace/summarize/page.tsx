'use client';

import { useState } from 'react';
import { FileText, Loader2, Copy, Check, Zap } from 'lucide-react';

const SUMMARY_TYPES = [
    { id: 'concise', label: 'Concise', description: 'Brief overview' },
    { id: 'detailed', label: 'Detailed', description: 'Comprehensive summary' },
    { id: 'bullet', label: 'Bullet Points', description: 'Key points as list' },
    { id: 'executive', label: 'Executive', description: 'Business summary' },
];

export default function SummarizePage() {
    const [text, setText] = useState('');
    const [summaryType, setSummaryType] = useState('concise');
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleSummarize = async () => {
        if (!text.trim()) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/ai/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, type: summaryType }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Summarization failed');
            }

            setSummary(data.summary);
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const content = await file.text();
            setText(content);
        } catch (err) {
            setError('Failed to read file');
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Document Summary</h1>
                    <p className="text-slate-400">AI-powered text summarization</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Summary Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-3">Summary Type</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {SUMMARY_TYPES.map(type => (
                            <button
                                key={type.id}
                                onClick={() => setSummaryType(type.id)}
                                className={`p-4 rounded-xl border text-left transition-all ${
                                    summaryType === type.id
                                        ? 'border-purple-500 bg-purple-500/10 text-white'
                                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                                }`}
                            >
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs opacity-70 mt-1">{type.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* File Upload */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Upload Document (optional)</label>
                    <input
                        type="file"
                        accept=".txt,.md,.doc,.docx,.pdf"
                        onChange={handleFileUpload}
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-white file:cursor-pointer"
                    />
                </div>

                {/* Text Input */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Text to Summarize</label>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste your text here or upload a document..."
                        rows={10}
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none resize-none"
                    />
                    <div className="mt-2 text-sm text-slate-500 text-right">
                        {text.length} characters
                    </div>
                </div>

                {/* Summarize Button */}
                <button
                    onClick={handleSummarize}
                    disabled={loading || !text.trim()}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Summarizing...
                        </>
                    ) : (
                        <>
                            <Zap className="w-5 h-5" />
                            Generate Summary
                        </>
                    )}
                </button>

                {/* Error */}
                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                        {error}
                    </div>
                )}

                {/* Results */}
                {summary && (
                    <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-purple-500" />
                                Summary
                            </h3>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                        <div className="prose prose-invert max-w-none">
                            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{summary}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
