'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, Loader2, Paperclip, Settings2, Download, Trash2, 
  Mic, MicOff, Bot, User, Image, FileText, X, Sparkles, Thermometer,
  Copy, Check, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AIResponseRenderer from '@/components/ai/AIResponseRenderer';
import { useAIHistory } from '@/context/AIHistoryContext';

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
  const [historyOpen, setHistoryOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Shared history context
  const { updateCurrentSession, selectedItemData, isNewChat, clearSelection, currentToolItems: historyItems, clearHistory, selectItem, currentSessionId } = useAIHistory();
  
  // Track if this is a fresh session that hasn't been saved yet
  const [sessionStarted, setSessionStarted] = useState(false);
  const lastSessionIdRef = useRef<string | null>(null);
  
  // Reset sessionStarted when session changes
  useEffect(() => {
    if (currentSessionId !== lastSessionIdRef.current) {
      lastSessionIdRef.current = currentSessionId;
      setSessionStarted(false);
    }
  }, [currentSessionId]);
  
  // Track if we're in new chat mode to prevent data restore
  const isNewChatRef = useRef(false);
  
  // Handle new chat action - completely reset state (runs first)
  useEffect(() => {
    if (isNewChat) {
      isNewChatRef.current = true;
      setMessages([]);
      setInput('');
      setStreamedText('');
      setAttachedFile(null);
      setFilePreview(null);
      setSessionStarted(false);
      // Reset flag after a tick
      setTimeout(() => { isNewChatRef.current = false; }, 200);
    }
  }, [isNewChat]);
  
  // Restore session when a history item is selected (only if not in new chat mode)
  useEffect(() => {
    // Don't restore if we just clicked new chat
    if (isNewChatRef.current) return;
    
    if (selectedItemData?.messages) {
      try {
        // Restore messages with proper Date objects
        const restoredMessages = selectedItemData.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(restoredMessages);
        setSessionStarted(true); // This is an existing session
      } catch (error) {
        console.error('Error restoring chat session:', error);
      }
    }
  }, [selectedItemData]);
  
  // Save to history when conversation has content AND session has started
  useEffect(() => {
    // Only save if:
    // 1. There are messages
    // 2. Not loading/streaming
    // 3. Session has been "started" (user sent at least one message in this session)
    if (messages.length > 0 && !loading && !streaming && sessionStarted) {
      const firstUserMessage = messages.find(m => m.role === 'user');
      if (firstUserMessage) {
        updateCurrentSession(
          firstUserMessage.content,
          { messages },
          messages[messages.length - 1]?.content.slice(0, 100)
        );
      }
    }
  }, [messages, loading, streaming, updateCurrentSession, sessionStarted]);

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
    
    // Mark session as started when user sends first message
    setSessionStarted(true);
    
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      ...(file ? { file: { name: file.name, type: file.type } } : {})
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

  // Listen for tool actions from header
  useEffect(() => {
    const handleToolAction = (e: CustomEvent) => {
      switch (e.detail) {
        case 'history':
          setHistoryOpen(true);
          break;
        case 'settings':
          setShowSettings(!showSettings);
          break;
        case 'download':
          exportChat();
          break;
        case 'clear':
          clearChat();
          break;
      }
    };
    window.addEventListener('tool-action', handleToolAction as EventListener);
    return () => window.removeEventListener('tool-action', handleToolAction as EventListener);
  }, [showSettings]);

  return (
    <div className="flex flex-col h-full pt-12 md:pt-0">
      {/* Settings Panel - slides down when toggled via header */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-shrink-0 overflow-hidden border-b border-border bg-surface/50"
          >
            <div className="p-4">
              <div className="grid md:grid-cols-2 gap-4 max-w-[850px] mx-auto">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-2 block">Personality</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(Object.keys(personalities) as Personality[]).map(p => (
                      <button key={p} onClick={() => setPersonality(p)} className={`p-2 rounded-lg text-xs transition-all ${personality === p ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-surface-highlight text-text-secondary hover:text-text'} border border-border`}>
                        <span>{personalities[p].icon}</span>
                        <span className="ml-1">{personalities[p].name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-1">
                    <Thermometer className="w-3 h-3" /> Temperature: {temperature}
                  </label>
                  <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="w-full accent-primary h-1" />
                  <div className="flex justify-between text-[10px] text-text-muted mt-0.5">
                    <span>Precise</span><span>Creative</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Sidebar */}
      <AnimatePresence>
        {historyOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setHistoryOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[90vw] z-50 bg-surface border-l border-border shadow-2xl"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h3 className="font-semibold text-text flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Session History
                  </h3>
                  <div className="flex items-center gap-2">
                    <button onClick={clearHistory} className="text-xs text-text-muted hover:text-red-500 transition-colors">
                      Clear All
                    </button>
                    <button onClick={() => setHistoryOpen(false)} className="p-1.5 rounded-lg bg-surface-highlight text-text-muted hover:text-text transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {historyItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { selectItem(item.id); setHistoryOpen(false); }}
                      className="w-full p-3 rounded-lg bg-surface-highlight hover:bg-surface-highlight/80 text-left transition-all"
                    >
                      <div className="font-medium text-text text-sm truncate">{item.title}</div>
                      {item.preview && <p className="text-xs text-text-muted line-clamp-2 mt-1">{item.preview}</p>}
                      <p className="text-xs text-text-muted mt-1">{new Date(item.timestamp).toLocaleTimeString()}</p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Messages Area - Centered with max-width */}
      <div className="flex-1 overflow-y-auto min-h-0 relative">
        <div className="max-w-[850px] mx-auto px-3 sm:px-4 py-3 pb-4">
          {messages.length === 0 && !streaming ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center">
              <div className="p-4 rounded-2xl bg-surface-highlight mb-4">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-text mb-1">Start a Conversation</h2>
              <p className="text-text-secondary text-sm max-w-sm">Ask anything, upload documents, and get intelligent responses.</p>
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {['Explain quantum computing', 'Write a poem', 'Help me code'].map(prompt => (
                  <button key={prompt} onClick={() => setInput(prompt)} className="px-3 py-1.5 rounded-lg bg-surface-highlight hover:bg-surface-highlight/80 text-text-secondary text-xs transition-all">
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500'}`}>
                    {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className={`flex-1 min-w-0 max-w-[80%] ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                    {msg.file && (
                      <div className="mb-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-highlight text-text-secondary text-xs">
                        {msg.file.type.startsWith('image/') ? <Image className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                        {msg.file.name}
                      </div>
                    )}
                    <div className={`inline-block px-3.5 py-2.5 rounded-2xl ${msg.role === 'user' ? 'bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/20 text-text' : 'bg-surface-highlight border border-border text-text'}`}>
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap leading-relaxed break-words text-sm">{msg.content}</p>
                      ) : (
                        <div className="overflow-x-auto text-sm">
                          <AIResponseRenderer content={msg.content} isStreaming={false} />
                        </div>
                      )}
                    </div>
                    <div className={`flex items-center gap-1.5 mt-1 text-[10px] text-text-muted ${msg.role === 'user' ? 'justify-end' : ''}`}>
                      <span>{msg.timestamp.toLocaleTimeString()}</span>
                      {msg.role === 'assistant' && (
                        <button onClick={() => copyMessage(msg.content, idx)} className="p-0.5 hover:text-text transition-colors">
                          {copiedIdx === idx ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {(loading || streaming) && (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 max-w-[80%]">
                    <div className="inline-block px-3.5 py-2.5 rounded-2xl bg-surface-highlight border border-border">
                      {streamedText ? (
                        <div className="overflow-x-auto text-sm">
                          <AIResponseRenderer content={streamedText} isStreaming={true} />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-text-muted text-sm">
                          <div className="flex gap-1">
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
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
      </div>

      {/* Input Area - Fixed at bottom like ChatGPT */}
      <div className="flex-shrink-0 border-t border-border bg-surface/95 backdrop-blur-xl">
        <div className="max-w-[850px] mx-auto px-3 sm:px-4 py-2">
          {/* File Preview */}
          {attachedFile && (
            <div className="mb-2 flex items-center gap-2 p-2 rounded-lg bg-surface-highlight border border-border">
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="w-8 h-8 rounded object-cover" />
              ) : (
                <div className="w-8 h-8 rounded bg-surface flex items-center justify-center">
                  <FileText className="w-4 h-4 text-text-muted" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-text text-sm font-medium truncate">{attachedFile.name}</p>
              </div>
              <button onClick={removeFile} className="p-1 rounded hover:bg-surface text-text-muted hover:text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-1.5 sm:gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".pdf,.doc,.docx,.txt,image/*" className="hidden" />
            
            <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg bg-surface-highlight hover:bg-surface-highlight/80 text-text-muted hover:text-text transition-all flex-shrink-0">
              <Paperclip className="w-4 h-4" />
            </button>
            
            <button onClick={toggleVoice} className={`p-2 rounded-lg transition-all flex-shrink-0 hidden sm:block ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-surface-highlight hover:bg-surface-highlight/80 text-text-muted hover:text-text'}`}>
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                placeholder="Type a message..."
                rows={1}
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-surface-highlight border border-border text-text placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none transition-all"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={loading || (!input.trim() && !attachedFile)}
              className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
