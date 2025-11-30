'use client';

import { useState, useRef } from 'react';
import { 
  Image, Wand2, Loader2, Download, RefreshCw, Upload, X, Sparkles,
  Palette, Eye, Zap, Settings2, Copy, Check, ImagePlus, Eraser, ZoomIn,
  ImageIcon, ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import AIResponseRenderer from '@/components/ai/AIResponseRenderer';

const STYLES = [
  { id: 'realistic', label: 'Realistic', icon: '📸', description: 'Photorealistic quality' },
  { id: 'anime', label: 'Anime', icon: '🎨', description: 'Japanese animation style' },
  { id: 'cyberpunk', label: 'Cyberpunk', icon: '🌃', description: 'Futuristic neon aesthetic' },
  { id: '3d', label: '3D Render', icon: '🎮', description: 'Octane/Unreal quality' },
  { id: 'watercolor', label: 'Watercolor', icon: '🖌️', description: 'Traditional painting' },
  { id: 'oil_painting', label: 'Oil Painting', icon: '🖼️', description: 'Classical art style' },
  { id: 'neon', label: 'Neon', icon: '✨', description: 'Glowing vibrant colors' },
  { id: 'minimalist', label: 'Minimalist', icon: '⬜', description: 'Clean modern design' },
];

const FEATURES = [
  { id: 'generate', label: 'Generate Image', icon: Wand2, description: 'Create image from prompt', requiresImage: false },
  { id: 'analyze', label: 'Analyze Image', icon: Eye, description: 'Get detailed AI description', requiresImage: true },
  { id: 'enhance', label: 'Enhance Prompt', icon: Sparkles, description: 'AI-improve your prompt', requiresImage: false },
  { id: 'variations', label: 'Generate Variations', icon: ImagePlus, description: 'Create image variants', requiresImage: true },
];

const SIZE_OPTIONS = [
  { id: 'square', label: 'Square', width: 1024, height: 1024, icon: '⬜' },
  { id: 'landscape', label: 'Landscape', width: 1344, height: 768, icon: '🖼️' },
  { id: 'portrait', label: 'Portrait', width: 768, height: 1344, icon: '📱' },
];

export default function ImageStudioPage() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedImageMime, setGeneratedImageMime] = useState<string>('image/png');
  const [selectedSize, setSelectedSize] = useState('square');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [enhanceBeforeGenerate, setEnhanceBeforeGenerate] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setAnalysis('');
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setAnalysis('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setActiveFeature('generate');
    setError('');
    setGeneratedImage(null);

    try {
      const sizeConfig = SIZE_OPTIONS.find(s => s.id === selectedSize) ?? SIZE_OPTIONS[0];
      
      const response = await fetch('/api/ai/image-studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style,
          enhance_prompt: enhanceBeforeGenerate,
          width: sizeConfig?.width ?? 1024,
          height: sizeConfig?.height ?? 1024,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.image) {
        setGeneratedImage(data.image);
        setGeneratedImageMime(data.mime_type || 'image/png');
        if (data.prompt_used) {
          setEnhancedPrompt(data.prompt_used);
        }
      } else if (data.fallback && data.enhanced_prompt) {
        // Fallback: show enhanced prompt if image generation failed
        setEnhancedPrompt(data.enhanced_prompt);
        setError(data.error || 'Image generation is not available. Use the enhanced prompt with an external image generator.');
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setActiveFeature(null);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setActiveFeature('enhance');
    setError('');

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('style', style);

      const response = await fetch('/api/ai/image-studio/enhance-prompt', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.enhanced) {
        setEnhancedPrompt(data.enhanced);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setActiveFeature(null);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!uploadedImage) return;
    
    setLoading(true);
    setActiveFeature('analyze');
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadedImage);
      formData.append('prompt', 'Describe this image in detail including composition, colors, style, subjects, mood, and lighting.');

      const response = await fetch('/api/ai/image-studio/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setActiveFeature(null);
    }
  };

  const handleGenerateVariations = async () => {
    if (!uploadedImage) return;
    
    setLoading(true);
    setActiveFeature('variations');
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadedImage);
      formData.append('prompt', prompt || 'Generate a creative variation');

      const response = await fetch('/api/ai/image-studio/variations', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.variation_prompt) {
        setEnhancedPrompt(data.variation_prompt);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setActiveFeature(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const useEnhancedPrompt = () => {
    setPrompt(enhancedPrompt);
    setEnhancedPrompt('');
  };

  const downloadGeneratedImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = `data:${generatedImageMime};base64,${generatedImage}`;
    link.download = `generated-image-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/25">
              <Image className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI Image Studio</h1>
              <p className="text-zinc-400">Analyze, enhance prompts & generate variations with Gemini Vision</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Upload Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative border-2 border-dashed border-zinc-700 hover:border-orange-500/50 rounded-2xl p-8 transition-all cursor-pointer bg-zinc-900/30 hover:bg-orange-500/5 group"
        >
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          
          {imagePreview ? (
            <div className="flex items-center gap-6">
              <img src={imagePreview} alt="Preview" className="w-32 h-32 rounded-xl object-cover" />
              <div className="flex-1">
                <p className="text-white font-medium">{uploadedImage?.name}</p>
                <p className="text-sm text-zinc-400">{uploadedImage && (uploadedImage.size / 1024).toFixed(1)} KB</p>
                <p className="text-xs text-orange-400 mt-2">Click features below to analyze or create variations</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); removeImage(); }} className="p-2 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-red-400">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="w-12 h-12 text-zinc-500 group-hover:text-orange-400 mx-auto mb-3 transition-colors" />
              <p className="text-white font-medium mb-1">Drop an image to analyze or create variations</p>
              <p className="text-sm text-zinc-500">PNG, JPG, WebP supported</p>
            </div>
          )}
        </div>

        {/* Feature Buttons */}
        <div className="grid md:grid-cols-4 gap-4">
          {FEATURES.map(feature => {
            const Icon = feature.icon;
            const isActive = activeFeature === feature.id;
            const needsPrompt = feature.id === 'generate' || feature.id === 'enhance';
            const needsImage = feature.requiresImage;
            const isDisabled = (needsPrompt && !prompt.trim()) || (needsImage && !uploadedImage);
            
            return (
              <button
                key={feature.id}
                onClick={() => {
                  if (feature.id === 'generate') handleGenerateImage();
                  else if (feature.id === 'analyze') handleAnalyzeImage();
                  else if (feature.id === 'enhance') handleEnhancePrompt();
                  else if (feature.id === 'variations') handleGenerateVariations();
                }}
                disabled={loading || isDisabled}
                className={`p-4 rounded-2xl border text-left transition-all ${isActive ? 'bg-orange-500/20 border-orange-500/50' : feature.id === 'generate' ? 'bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30 hover:border-orange-500/50' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-3">
                  {isActive && loading ? (
                    <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
                  ) : (
                    <Icon className={`w-6 h-6 ${isActive || feature.id === 'generate' ? 'text-orange-400' : 'text-zinc-400'}`} />
                  )}
                  <div>
                    <p className="font-medium text-white">{feature.label}</p>
                    <p className="text-xs text-zinc-500">{feature.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Prompt Input */}
        <div className="relative">
          <label className="text-sm font-medium text-zinc-300 mb-2 block">Image Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to create..."
            rows={4}
            className="w-full px-5 py-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
          />
        </div>

        {/* Style Selection */}
        <div>
          <label className="text-sm font-medium text-zinc-300 mb-3 block flex items-center gap-2">
            <Palette className="w-4 h-4 text-orange-400" /> Style Preset
          </label>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {STYLES.map(s => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={`p-3 rounded-xl border text-center transition-all ${style === s.id ? 'bg-orange-500/20 border-orange-500/50 text-white' : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}
                title={s.description}
              >
                <span className="text-xl">{s.icon}</span>
                <p className="text-xs mt-1 truncate">{s.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)} 
            className="w-full flex items-center justify-between text-white"
          >
            <span className="flex items-center gap-2 font-medium">
              <Settings2 className="w-5 h-5 text-orange-400" /> Generation Options
            </span>
            <ChevronDown className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
          
          {showAdvanced && (
            <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4">
              {/* Size Selection */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Image Size</label>
                <div className="grid grid-cols-3 gap-2">
                  {SIZE_OPTIONS.map(size => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size.id)}
                      className={`p-3 rounded-xl border text-center transition-all ${selectedSize === size.id ? 'bg-orange-500/20 border-orange-500/50 text-white' : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}
                    >
                      <span className="text-xl">{size.icon}</span>
                      <p className="text-xs mt-1">{size.label}</p>
                      <p className="text-xs text-zinc-500">{size.width}x{size.height}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Enhance Toggle */}
              <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={enhanceBeforeGenerate} 
                  onChange={(e) => setEnhanceBeforeGenerate(e.target.checked)} 
                  className="w-4 h-4 rounded accent-orange-500" 
                />
                <Sparkles className="w-5 h-5 text-orange-400" />
                <div>
                  <span className="text-sm text-zinc-300">Auto-enhance prompt</span>
                  <p className="text-xs text-zinc-500">AI will improve your prompt before generating</p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Error */}
        {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">{error}</div>}

        {/* Generated Image */}
        {generatedImage && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-orange-400" /> Generated Image
              </h3>
              <div className="flex gap-2">
                <button onClick={downloadGeneratedImage} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white" title="Download">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={() => setGeneratedImage(null)} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400" title="Remove">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex justify-center">
              <img 
                src={`data:${generatedImageMime};base64,${generatedImage}`} 
                alt="Generated" 
                className="max-w-full max-h-[600px] rounded-xl shadow-2xl shadow-black/50" 
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button 
                onClick={handleGenerateImage} 
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-orange-500/20 text-orange-400 text-sm hover:bg-orange-500/30 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Regenerate
              </button>
            </div>
          </motion.div>
        )}

        {/* Analysis Result */}
        {analysis && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-orange-400" /> Image Analysis
              </h3>
              <button onClick={() => copyToClipboard(analysis)} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-zinc-300 overflow-x-auto">
              <AIResponseRenderer content={analysis} isStreaming={false} />
            </div>
            <button onClick={() => setPrompt(analysis)} className="mt-4 px-4 py-2 rounded-xl bg-orange-500/20 text-orange-400 text-sm hover:bg-orange-500/30 transition-colors">
              Use as Prompt
            </button>
          </motion.div>
        )}

        {/* Enhanced Prompt */}
        {enhancedPrompt && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-400" /> Enhanced Prompt
              </h3>
              <button onClick={() => copyToClipboard(enhancedPrompt)} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-zinc-300 overflow-x-auto">
              <AIResponseRenderer content={enhancedPrompt} isStreaming={false} />
            </div>
            <button onClick={useEnhancedPrompt} className="mt-4 px-4 py-2 rounded-xl bg-orange-500/20 text-orange-400 text-sm hover:bg-orange-500/30 transition-colors">
              Use This Prompt
            </button>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !analysis && !enhancedPrompt && !generatedImage && !error && (
          <div className="p-12 rounded-2xl bg-zinc-800/30 border border-zinc-700/50 text-center">
            <Wand2 className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
            <p className="text-zinc-400 mb-2">Enter a prompt to generate an image, or upload an image to analyze</p>
            <p className="text-sm text-zinc-500">Gemini will create images from text and help you enhance your prompts</p>
          </div>
        )}
      </main>
    </div>
  );
}
