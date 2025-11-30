'use client';

import { useState, useRef, useEffect, useCallback, useDeferredValue, memo } from 'react';
import { 
  MessageSquare, Send, Loader2, Paperclip, Settings2, Download, Trash2, 
  Mic, MicOff, Bot, User, Image, FileText, X, Sparkles, Thermometer,
  Copy, Check, RefreshCw, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AIResponseRenderer from '@/components/ai/AIResponseRenderer';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  file?: { name: string; type: string };
}

type Personality = 'helpful' | 'professional' | 'creative' | 'technical' | 'casual' | 'academic';

const personalities: Record<Personality, { name: string; icon: string; description: string }> = {
  helpful: { name: 'Helpful Assistant', icon: '🤖', description: 'Friendly and helpful' },
  professional: { name: 'Professional', icon: '💼', description: 'Formal and precise' },
  creative: { name: 'Creative', icon: '🎨', description: 'Imaginative and expressive' },
  technical: { name: 'Technical Expert', icon: '⚙️', description: 'Detailed and accurate' },
  casual: { name: 'Casual Friend', icon: '😊', description: 'Relaxed and fun' },
  academic: { name: 'Academic Scholar', icon: '📚', description: 'Thorough with citations' },
};

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [personality, setPersonality] = useState<Personality>('helpful');
  const [temperature, setTemperature] = useState(0.7);
  const [showSettings, setShowSettings] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedText]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      if (file.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if (!input.trim() && !attachedFile) return;

    const userMessage = input;
    const file = attachedFile;
    setInput('');
    removeFile();
    
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      file: file ? { name: file.name, type: file.type } : undefined
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setLoading(true);
    setStreamedText('');

    try {
      const formData = new FormData();
      formData.append('message', userMessage);
      formData.append('history', JSON.stringify(messages.map(m => ({ role: m.role, content: m.content }))));
      formData.append('personality', personality);
      formData.append('temperature', temperature.toString());
      formData.append('stream', 'false');
      if (file) formData.append('file', file);

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.response) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.response,
          timestamp: new Date()
        }]);
      } else if (data.error) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Error: ${data.error}`,
          timestamp: new Date()
        }]);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const copyMessage = (content: string, idx: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const exportChat = () => {
    const chatText = messages.map(m => 
      `[${m.role.toUpperCase()}] ${m.timestamp.toLocaleString()}\n${m.content}`
    ).join('\n\n---\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
  };

  const clearChat = () => {
    setMessages([]);
    setStreamedText('');
  };

  const toggleVoice = async () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + ' ' + transcript);
      setIsRecording(false);
    };
    
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">AI Chat</h1>
                <p className="text-sm text-zinc-400">Powered by Gemini • {personalities[personality].name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSettings(!showSettings)} className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all">
                <Settings2 className="w-5 h-5" />
              </button>
              <button onClick={exportChat} disabled={messages.length === 0} className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all disabled:opacity-50">
                <Download className="w-5 h-5" />
              </button>
              <button onClick={clearChat} disabled={messages.length === 0} className="p-2.5 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-all disabled:opacity-50">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mt-4 p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700 animate-in slide-in-from-top-2">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">Personality</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(personalities) as Personality[]).map(p => (
                      <button key={p} onClick={() => setPersonality(p)} className={`p-2 rounded-xl text-sm transition-all ${personality === p ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-zinc-700/50 border-zinc-600 text-zinc-400 hover:text-white'} border`}>
                        <span className="text-lg">{personalities[p].icon}</span>
                        <p className="text-xs mt-1">{personalities[p].name}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                    <Thermometer className="w-4 h-4" /> Temperature: {temperature}
                  </label>
                  <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="w-full accent-blue-500" />
                  <div className="flex justify-between text-xs text-zinc-500 mt-1">
                    <span>Precise</span><span>Creative</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="max-w-5xl mx-auto px-6 py-6 min-h-[calc(100vh-280px)]">
        {messages.length === 0 && !streaming ? (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="p-6 rounded-3xl bg-zinc-800/30 mb-6">
              <Sparkles className="w-16 h-16 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Start a Conversation</h2>
            <p className="text-zinc-400 max-w-md">Ask anything, upload documents or images, and get intelligent responses powered by Gemini AI.</p>
            <div className="flex flex-wrap gap-2 mt-6 justify-center">
              {['Explain quantum computing', 'Write a poem', 'Help me code', 'Analyze an image'].map(prompt => (
                <button key={prompt} onClick={() => setInput(prompt)} className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-all">
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${msg.role === 'user' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500'}`}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                </div>
                <div className={`flex-1 max-w-3xl min-w-0 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  {msg.file && (
                    <div className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm">
                      {msg.file.type.startsWith('image/') ? <Image className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      {msg.file.name}
                    </div>
                  )}
                  <div className={`inline-block max-w-full px-5 py-4 rounded-2xl overflow-hidden ${msg.role === 'user' ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-white' : 'bg-zinc-800/70 border border-zinc-700 text-zinc-100'}`}>
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <AIResponseRenderer content={msg.content} isStreaming={false} />
                      </div>
                    )}
                  </div>
                  <div className={`flex items-center gap-2 mt-2 text-xs text-zinc-500 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    <span>{msg.timestamp.toLocaleTimeString()}</span>
                    {msg.role === 'assistant' && (
                      <button onClick={() => copyMessage(msg.content, idx)} className="p-1 hover:text-white transition-colors">
                        {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {(loading || streaming) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 max-w-3xl min-w-0">
                  <div className="inline-block max-w-full px-5 py-4 rounded-2xl bg-zinc-800/70 border border-zinc-700 overflow-hidden">
                    {streamedText ? (
                      <div className="overflow-x-auto">
                        <AIResponseRenderer content={streamedText} isStreaming={true} />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-zinc-400">
                        <div className="flex gap-1">
                          <motion.div 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                            className="w-2 h-2 bg-blue-400 rounded-full"
                          />
                          <motion.div 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                            className="w-2 h-2 bg-cyan-400 rounded-full"
                          />
                          <motion.div 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                            className="w-2 h-2 bg-purple-400 rounded-full"
                          />
                        </div>
                        <span>Thinking...</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4">
          {/* File Preview */}
          {attachedFile && (
            <div className="mb-3 flex items-center gap-3 p-3 rounded-xl bg-zinc-800 border border-zinc-700">
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-zinc-700 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-zinc-400" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-white font-medium truncate">{attachedFile.name}</p>
                <p className="text-sm text-zinc-400">{(attachedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={removeFile} className="p-2 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-3">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".pdf,.doc,.docx,.txt,image/*" className="hidden" />
            
            <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all">
              <Paperclip className="w-5 h-5" />
            </button>
            
            <button onClick={toggleVoice} className={`p-3 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white'}`}>
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                placeholder="Type a message... (Shift+Enter for new line)"
                rows={1}
                className="w-full px-5 py-3.5 rounded-2xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={loading || (!input.trim() && !attachedFile)}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
