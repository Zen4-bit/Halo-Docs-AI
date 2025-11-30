'use client';

import { useState } from 'react';
import { Lightbulb, BarChart3, FileText, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export function InsightsDashboard() {
    const [text, setText] = useState('');
    const [type, setType] = useState('general');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState<any>(null);

    const handleAnalyze = async () => {
        if (!text.trim()) return;

        setIsAnalyzing(true);
        setResults(null);

        try {
            const response = await fetch('/api/ai/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, type }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Analysis failed');

            setResults(data);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to generate insights');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Input */}
            <div className="lg:col-span-1 space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Analysis Type
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:border-primary focus:outline-none"
                        >
                            <option value="general">General Insights</option>
                            <option value="sentiment">Sentiment Analysis</option>
                            <option value="actionable">Action Items</option>
                            <option value="technical">Technical Review</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Content to Analyze
                        </label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Paste text or document content..."
                            className="w-full h-[400px] p-4 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-primary focus:outline-none resize-none"
                        />
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={!text.trim() || isAnalyzing}
                        className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-primary to-purple-500 text-white font-semibold hover:from-primary/90 hover:to-purple-500/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                        {isAnalyzing ? (
                            <>
                                <BarChart3 className="w-5 h-5 animate-spin" />
                                <span>Analyzing...</span>
                            </>
                        ) : (
                            <>
                                <Lightbulb className="w-5 h-5" />
                                <span>Generate Insights</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-2 space-y-6">
                {results ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Summary Card */}
                        <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
                            <div className="flex items-center gap-2 mb-4">
                                <FileText className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold text-white">Executive Summary</h3>
                            </div>
                            <p className="text-slate-300 leading-relaxed">
                                {results.summary}
                            </p>
                        </div>

                        {/* Insights Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {results.insights?.map((insight: any, index: number) => (
                                <div
                                    key={index}
                                    className="p-5 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-primary/30 transition-all"
                                >
                                    <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">
                                            {index + 1}
                                        </span>
                                        {insight.title}
                                    </h4>
                                    <p className="text-sm text-slate-400">
                                        {insight.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-center text-slate-500 p-12 border-2 border-dashed border-slate-800 rounded-xl">
                        <div>
                            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-medium text-slate-400 mb-2">
                                No Analysis Yet
                            </h3>
                            <p className="max-w-md mx-auto">
                                Paste your content and click "Generate Insights" to get AI-powered analysis and key takeaways.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
