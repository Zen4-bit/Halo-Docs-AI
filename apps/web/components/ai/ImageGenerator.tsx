'use client';

import { useState } from 'react';
import { Sparkles, Image as ImageIcon, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function ImageGenerator() {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [size, setSize] = useState('1024x1024');
    const [style, setStyle] = useState('vivid');

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setGeneratedImage(null);

        try {
            const response = await fetch('/api/ai/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, size, style }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Generation failed');

            setGeneratedImage(data.url);
            toast.success('Image generated successfully!');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to generate image');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Controls */}
            <div className="lg:col-span-1 space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Prompt
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the image you want to create..."
                            className="w-full h-32 px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-primary focus:outline-none resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Size
                            </label>
                            <select
                                value={size}
                                onChange={(e) => setSize(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:border-primary focus:outline-none"
                            >
                                <option value="1024x1024">Square (1:1)</option>
                                <option value="1024x1792">Portrait (9:16)</option>
                                <option value="1792x1024">Landscape (16:9)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Style
                            </label>
                            <select
                                value={style}
                                onChange={(e) => setStyle(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:border-primary focus:outline-none"
                            >
                                <option value="vivid">Vivid</option>
                                <option value="natural">Natural</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || isGenerating}
                        className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-primary to-purple-500 text-white font-semibold hover:from-primary/90 hover:to-purple-500/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                        {isGenerating ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                <span>Generate Image</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Preview */}
            <div className="lg:col-span-2 bg-slate-900/50 rounded-xl border border-slate-800 flex items-center justify-center min-h-[400px] p-6 relative overflow-hidden">
                {generatedImage ? (
                    <div className="relative group w-full h-full flex items-center justify-center">
                        <img
                            src={generatedImage}
                            alt={prompt}
                            className="max-w-full max-h-[600px] rounded-lg shadow-2xl"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <a
                                href={generatedImage}
                                download={`generated-${Date.now()}.png`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3 rounded-full bg-white text-slate-900 hover:bg-primary hover:text-white transition-colors"
                            >
                                <Download className="w-6 h-6" />
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-slate-500">
                        <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Enter a prompt to generate an image</p>
                    </div>
                )}
            </div>
        </div>
    );
}
