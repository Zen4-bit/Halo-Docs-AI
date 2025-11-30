'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Loader2,
  Plus,
  Send,
  MessageSquare,
  Trash2,
  Edit2,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

import {
  ChatConversationSummary,
  ChatConversationDetail,
  ChatMessage,
  createChatConversation,
  deleteChatConversation,
  getChatConversation,
  listChatConversations,
  renameChatConversation,
  sendChatMessage,
  streamChatMessage,
} from '@/lib/api-client';

const suggestedPrompts = [
  'Summarize the key points from our latest financial report.',
  'Draft a follow-up email thanking the client and outlining next steps.',
  'Turn these meeting notes into bullet-point action items.',
  'Explain this technical concept in simple language for a new hire.',
];

type StreamingAssistantState = {
  id: string;
  content: string;
  created_at: string;
};

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-surface">
      <div className="glass px-8 py-6 rounded-2xl flex items-center gap-3 text-white/80">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>{message}</span>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return <GuestChatPage />;
}

function GuestChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<StreamingAssistantState | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const guestChatEndpoint = useMemo(() => '/api/chat/message', []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const handlePromptClick = useCallback((prompt: string) => {
    setInputValue(prompt);
  }, []);

  const handleSendMessage = useCallback(
    async (event?: React.FormEvent) => {
      if (event) event.preventDefault();

      const content = inputValue.trim();
      if (!content || isSending) {
        return;
      }

      const timestamp = Date.now();
      const userMessage: ChatMessage = {
        id: `guest-user-${timestamp}`,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      };

      const historyPayload = [...messages, userMessage].map(({ role, content }) => ({ role, content }));

      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      setError(null);
      setIsSending(true);
      setStreamingMessage({
        id: `guest-stream-${timestamp}`,
        content: '',
        created_at: new Date().toISOString(),
      });

      try {
        const response = await fetch(guestChatEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: historyPayload,
            stream: false,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `Request failed with status ${response.status}`);
        }

        const data = await response.json();
        const assistantText =
          data?.message?.content ||
          'I was unable to generate a response. Please try asking in a different way.';

        const assistantMessage: ChatMessage = {
          id: `guest-assistant-${Date.now()}`,
          role: 'assistant',
          content: assistantText,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err: any) {
        console.error(err);
        setError(err?.message || 'Failed to generate response.');
        setMessages((prev) => [
          ...prev,
          {
            id: `guest-error-${Date.now()}`,
            role: 'assistant',
            content: 'Sorry, I hit a snag while thinking. Please try again.',
            created_at: new Date().toISOString(),
          },
        ]);
      } finally {
        setStreamingMessage(null);
        setIsSending(false);
      }
    },
    [guestChatEndpoint, inputValue, isSending, messages]
  );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-black text-white">
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-violet-500/40 to-brand/30 opacity-20" />
      <div className="absolute inset-y-0 right-0 -z-10 blur-3xl opacity-40">
        <div className="h-full w-[60vw] bg-gradient-to-br from-brand/10 via-violet-500/20 to-transparent" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/70">
            <Sparkles className="h-4 w-4 text-brand" />
            Halo-AI Playground
          </div>
          <h1 className="text-3xl font-display font-semibold sm:text-4xl">Chat with Halo-AI</h1>
          <p className="text-white/60">
            Ask questions, brainstorm ideas, or explore documents instantly. Sign in to save your history and
            unlock team features.
          </p>
        </header>

        <section className="mt-4 flex-1 overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg shadow-brand/20 sm:mt-6">
          <div className="relative h-full">
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/5 via-transparent to-transparent" />
            <div className="h-full overflow-y-auto px-4 py-6 space-y-6 sm:px-6 sm:py-8">
              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              {messages.length === 0 && !streamingMessage ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handlePromptClick(prompt)}
                      className="group rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-white/30 hover:bg-white/10 hover:shadow-lg hover:shadow-brand/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-brand/20 p-2 text-brand">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <span className="text-sm text-white/70">Try this prompt</span>
                      </div>
                      <p className="mt-3 text-white/90 leading-relaxed">{prompt}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-2xl rounded-2xl px-5 py-4 shadow-sm ${
                          message.role === 'user'
                            ? 'bg-brand text-white'
                            : 'glass border border-white/10 text-white/90'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        <p className="mt-2 text-xs text-white/60">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}

                  {streamingMessage && (
                    <div className="flex justify-start">
                      <div className="glass border border-white/10 rounded-2xl px-5 py-4 max-w-2xl text-white/90">
                        <span className="inline-flex items-center gap-2 text-white/60">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Thinking...
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </section>

        <footer className="mt-6">
          <form onSubmit={handleSendMessage} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-2xl border border-white/20 bg-white/5 px-4 py-3">
                <textarea
                  rows={1}
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder="Ask Halo-AI anything..."
                  className="w-full bg-transparent text-white focus:outline-none resize-none"
                  disabled={isSending}
                />
              </div>
              <button
                type="submit"
                disabled={!inputValue.trim() || isSending}
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-brand via-violet-500 to-rose-500 px-5 py-3 font-semibold text-white shadow-brand/40 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition hover:scale-[1.02]"
              >
                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-xs text-white/40">
              Conversations are temporary in guest mode. Sign in to save them across sessions.
            </p>
          </form>
        </footer>
      </div>
    </div>
  );
}

function AuthenticatedChatPage({ token, userFullName }: { token: string; userFullName?: string | null }) {
  const [conversations, setConversations] = useState<ChatConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<StreamingAssistantState | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const autoCreatedConversationRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamControllerRef = useRef<AbortController | null>(null);

  const currentConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const loadConversations = useCallback(
    async (preferredConversationId?: string) => {
      if (!token) {
        return;
      }
      setIsLoadingConversations(true);
      setError(null);

      try {
        let loaded = await listChatConversations(token);

        if (loaded.length === 0 && !autoCreatedConversationRef.current) {
          try {
            const newlyCreated = await createChatConversation({}, token);
            loaded = [newlyCreated];
            autoCreatedConversationRef.current = true;
          } catch (creationError) {
            console.error('Failed to auto-create chat conversation', creationError);
          }
        }

        setConversations(loaded);

        const hasPreferred = preferredConversationId && loaded.some((c) => c.id === preferredConversationId);
        const stillValidActive =
          activeConversationId && loaded.some((conversation) => conversation.id === activeConversationId);

        const nextActiveId =
          (hasPreferred && preferredConversationId) ||
          (stillValidActive && activeConversationId) ||
          (loaded[0]?.id ?? null);

        setActiveConversationId(nextActiveId);

        if (!nextActiveId) {
          setMessages([]);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load conversations. Please try again.');
      } finally {
        setIsLoadingConversations(false);
      }
    },
    [token, activeConversationId]
  );

  const loadConversationMessages = useCallback(
    async (conversationId: string) => {
      if (!token) return;

      setIsLoadingMessages(true);
      setError(null);

      try {
        const detail: ChatConversationDetail = await getChatConversation(conversationId, token);
        setMessages(detail.messages);
        setStreamingMessage(null);
        setTitleDraft(detail.conversation.title);
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === detail.conversation.id ? detail.conversation : conversation
          )
        );
      } catch (err) {
        console.error(err);
        setError('Failed to load conversation. Please try again.');
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [token]
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeConversationId && token) {
      loadConversationMessages(activeConversationId);
    }
  }, [activeConversationId, token, loadConversationMessages]);

  useEffect(() => {
    if (currentConversation && !isRenaming) {
      setTitleDraft(currentConversation.title);
    }
  }, [currentConversation, isRenaming]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  useEffect(() => {
    return () => {
      streamControllerRef.current?.abort();
    };
  }, []);

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      if (conversationId === activeConversationId) return;
      setActiveConversationId(conversationId);
      setIsSidebarOpen(false);
    },
    [activeConversationId]
  );

  const handleCreateConversation = useCallback(async () => {
    if (!token) return;
    setError(null);
    setIsSending(false);

    try {
      const conversation = await createChatConversation({}, token);
      await loadConversations(conversation.id);
      setIsSidebarOpen(false);
    } catch (err) {
      console.error(err);
      setError('Unable to start a new conversation. Please try again.');
    }
  }, [token, loadConversations]);

  const handleDeleteConversation = useCallback(
    async (conversationId: string) => {
      if (!token) return;

      try {
        await deleteChatConversation(conversationId, token);
        setConversations((prev) => prev.filter((conversation) => conversation.id !== conversationId));

        if (conversationId === activeConversationId) {
          const remaining = conversations.filter((conversation) => conversation.id !== conversationId);
          const nextActive = remaining[0]?.id ?? null;
          setActiveConversationId(nextActive);
          setMessages([]);
          if (nextActive) {
            await loadConversationMessages(nextActive);
          }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to delete conversation.');
      }
    },
    [token, activeConversationId, conversations, loadConversationMessages]
  );

  const handleRenameConversation = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!token || !activeConversationId) return;

      const trimmed = titleDraft.trim();
      if (!trimmed) {
        setTitleDraft(currentConversation?.title ?? 'New chat');
        setIsRenaming(false);
        return;
      }

      try {
        const updated = await renameChatConversation(activeConversationId, trimmed, token);
        setConversations((prev) =>
          prev.map((conversation) => (conversation.id === updated.id ? updated : conversation))
        );
        setTitleDraft(updated.title);
        setIsRenaming(false);
      } catch (err) {
        console.error(err);
        setError('Failed to rename conversation.');
      }
    },
    [token, activeConversationId, titleDraft, currentConversation]
  );

  const appendAssistantMessage = useCallback((message: ChatMessage, conversation: ChatConversationSummary) => {
    setMessages((prev) => [...prev, message]);
    setConversations((prev) =>
      prev
        .map((item) => (item.id === conversation.id ? conversation : item))
        .sort((a, b) => (a.id === conversation.id ? -1 : b.id === conversation.id ? 1 : 0))
    );
    setTitleDraft(conversation.title);
  }, []);

  const handleStreamResponse = useCallback(
    async (conversationId: string, prompt: string) => {
      if (!token) return;

      const controller = new AbortController();
      streamControllerRef.current?.abort();
      streamControllerRef.current = controller;

      const response = await streamChatMessage(conversationId, { content: prompt }, token, controller.signal);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      if (!response.body) {
        const fallback = await sendChatMessage(conversationId, { content: prompt }, token);
        appendAssistantMessage(fallback.message, fallback.conversation);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      const streamingId = `stream-${Date.now()}`;

      setStreamingMessage({
        id: streamingId,
        content: '',
        created_at: new Date().toISOString(),
      });

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const segments = buffer.split('\n\n');
          buffer = segments.pop() ?? '';

          for (const segment of segments) {
            const trimmed = segment.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;
            const jsonPayload = trimmed.replace(/^data:\s*/, '');
            if (!jsonPayload) continue;

            let parsed: any;
            try {
              parsed = JSON.parse(jsonPayload);
            } catch {
              continue;
            }

            if (parsed.type === 'chunk') {
              const chunk = parsed.content ?? '';
              setStreamingMessage((prev) =>
                prev
                  ? { ...prev, content: prev.content + chunk }
                  : { id: streamingId, content: chunk, created_at: new Date().toISOString() }
              );
            } else if (parsed.type === 'end') {
              setStreamingMessage(null);
              if (parsed.message && parsed.conversation) {
                appendAssistantMessage(parsed.message, parsed.conversation);
              }
            } else if (parsed.type === 'error') {
              throw new Error(parsed.error || 'Stream error');
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    },
    [token, appendAssistantMessage]
  );

  const handleSendMessage = useCallback(
    async (event?: React.FormEvent) => {
      if (event) {
        event.preventDefault();
      }

      if (!inputValue.trim() || !token || !activeConversationId || isSending) {
        return;
      }

      const content = inputValue.trim();
      setInputValue('');
      setError(null);
      setIsSending(true);

      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        await handleStreamResponse(activeConversationId, content);
      } catch (err: any) {
        console.error(err);
        setStreamingMessage(null);
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: 'I encountered an error while processing your request. Please try again.',
            created_at: new Date().toISOString(),
          },
        ]);
        setError(err?.message || 'Failed to generate response.');
      } finally {
        setIsSending(false);
      }
    },
    [inputValue, token, activeConversationId, isSending, handleStreamResponse]
  );

  const handlePromptClick = useCallback((prompt: string) => {
    setInputValue(prompt);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-black text-white">
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-violet-500/40 to-brand/30 opacity-20" />
      <div className="absolute inset-y-0 right-0 -z-10 blur-3xl opacity-40">
        <div className="h-full w-[50vw] bg-gradient-to-br from-brand/10 via-violet-500/20 to-transparent" />
      </div>

      <div className="flex min-h-screen flex-col md:flex-row">
        <aside
          className={`${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } fixed md:static inset-y-0 left-0 z-40 w-72 bg-surface-1/80 backdrop-blur-xl border-r border-white/10 transition-transform duration-200`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-brand/30 flex items-center justify-center text-brand">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-white/60 uppercase tracking-wide">Conversations</p>
                <p className="text-base font-semibold text-white">
                  {userFullName ? `${userFullName.split(' ')[0]}'s AI` : 'Halo-AI'}
                </p>
              </div>
            </div>
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close conversation list"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-5 py-4">
            <button
              onClick={handleCreateConversation}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand via-violet-500 to-rose-500 px-4 py-3 font-semibold shadow-lg shadow-brand/40 transition hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1"
            >
              <Plus className="h-4 w-4" />
              New chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-6 space-y-1">
            {isLoadingConversations ? (
              <div className="flex items-center justify-center h-40 text-white/60">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-white/50 px-4 py-10">
                <p className="text-sm">No conversations yet. Start a new chat to begin.</p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const isActive = conversation.id === activeConversationId;
                return (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation.id)}
                    className={`w-full text-left rounded-xl px-4 py-3 transition ${
                      isActive ? 'bg-white/10 border border-white/20 shadow-inner shadow-brand/20' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold truncate">{conversation.title}</h3>
                      <button
                        className="p-1 rounded-lg hover:bg-white/10 transition text-white/60 hover:text-white"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteConversation(conversation.id);
                        }}
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-white/50 mt-1 line-clamp-2 leading-relaxed">
                      {conversation.last_message_preview
                        ? conversation.last_message_preview
                        : conversation.message_count > 0
                        ? 'Continue where you left off'
                        : 'No messages yet'}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className="flex flex-1 flex-col">
          <header className="flex w-full items-center justify-between gap-4 px-4 py-5 border-b border-white/10 backdrop-blur-xl bg-surface-1/60 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open conversation list"
              >
                <Menu className="h-5 w-5" />
              </button>

              {currentConversation ? (
                isRenaming ? (
                  <form onSubmit={handleRenameConversation} className="flex items-center gap-2">
                    <input
                      className="bg-transparent border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                      value={titleDraft}
                      onChange={(event) => setTitleDraft(event.target.value)}
                      autoFocus
                      onBlur={() => setIsRenaming(false)}
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-lg bg-brand/80 hover:bg-brand text-white text-sm transition"
                    >
                      Save
                    </button>
                  </form>
                ) : (
                  <div>
                    <h1 className="text-2xl font-display font-semibold">{currentConversation.title}</h1>
                    <p className="text-sm text-white/60 mt-1">
                      {currentConversation.message_count === 0
                        ? 'Start the conversation with a prompt below.'
                        : `Last updated ${new Date(currentConversation.updated_at).toLocaleString()}`}
                    </p>
                  </div>
                )
              ) : (
                <div>
                  <h1 className="text-2xl font-display font-semibold">Halo-AI Workspace</h1>
                  <p className="text-sm text-white/60 mt-1">Start a conversation to begin.</p>
                </div>
              )}
            </div>

            {currentConversation && !isRenaming && (
              <button
                onClick={() => setIsRenaming(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm text-white/70 hover:text-white hover:border-white/40 transition"
              >
                <Edit2 className="h-4 w-4" />
                Rename
              </button>
            )}
          </header>

          <section className="relative flex-1 overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/5 via-transparent to-transparent" />
            <div className="h-full overflow-y-auto px-4 py-6 space-y-6 sm:px-6 sm:py-8">
              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full text-white/60">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading conversation...
                </div>
              ) : messages.length === 0 && !streamingMessage ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handlePromptClick(prompt)}
                      className="group rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-white/30 hover:bg-white/10 hover:shadow-lg hover:shadow-brand/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-brand/20 p-2 text-brand">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <span className="text-sm text-white/70">Try this prompt</span>
                      </div>
                      <p className="mt-3 text-white/90 leading-relaxed">{prompt}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-2xl rounded-2xl px-5 py-4 shadow-sm ${
                          message.role === 'user'
                            ? 'bg-brand text-white'
                            : 'glass border border-white/10 text-white/90'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        <p className="mt-2 text-xs text-white/60">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}

                  {streamingMessage && (
                    <div className="flex justify-start">
                      <div className="glass border border-white/10 rounded-2xl px-5 py-4 max-w-2xl text-white/90">
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {streamingMessage.content || (
                            <span className="inline-flex items-center gap-2 text-white/60">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Generating response...
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div ref={messagesEndRef} />
            </div>
          </section>

          <footer className="border-t border-white/10 bg-surface-1/60 backdrop-blur-xl px-4 py-5 sm:px-6">
            <form onSubmit={handleSendMessage} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-2xl border border-white/20 bg-white/5 px-4 py-3">
                  <textarea
                    rows={1}
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    placeholder="Ask Halo-AI anything about your documents or workflows..."
                    className="w-full bg-transparent text-white focus:outline-none resize-none"
                    disabled={isSending}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isSending}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-brand via-violet-500 to-rose-500 px-5 py-3 font-semibold text-white shadow-brand/40 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition hover:scale-[1.02]"
                >
                  {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-white/40">
                Halo-AI can help summarize documents, draft polished outputs, translate content, and more.
              </p>
            </form>
          </footer>
        </main>
      </div>
    </div>
  );
}
