'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export interface HistoryItem {
  id: string;
  title: string;
  timestamp: Date;
  preview?: string;
  data: any;
  toolPath: string;
}

interface AIHistoryContextType {
  items: HistoryItem[];
  currentToolItems: HistoryItem[];
  currentSessionId: string | null;
  updateCurrentSession: (title: string, data: any, preview?: string) => void;
  startNewSession: () => string;
  getItem: (id: string) => HistoryItem | undefined;
  removeItem: (id: string) => void;
  clearHistory: () => void;
  selectItem: (id: string) => void;
  selectedItemId: string | null;
  selectedItemData: any | null;
  clearSelection: () => void;
  newChat: () => void;
  isNewChat: boolean;
}

const AIHistoryContext = createContext<AIHistoryContextType | null>(null);

const STORAGE_KEY = 'ai_workspace_history';
const MAX_ITEMS_PER_TOOL = 10;

// Map paths to tool keys
const getToolKey = (pathname: string): string => {
  if (pathname.includes('/chat')) return 'chat';
  if (pathname.includes('/document-summary')) return 'summary';
  if (pathname.includes('/translator')) return 'translator';
  if (pathname.includes('/rewriter')) return 'rewriter';
  if (pathname.includes('/insights')) return 'insights';
  if (pathname.includes('/image-studio')) return 'image-studio';
  return 'unknown';
};

export function AIHistoryProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemData, setSelectedItemData] = useState<any | null>(null);
  const [isNewChat, setIsNewChat] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const currentToolPath = pathname.startsWith('/ai-workspace/') ? pathname : '';
  const prevToolPathRef = React.useRef(currentToolPath);

  // Reset session when switching tools
  useEffect(() => {
    if (currentToolPath && currentToolPath !== prevToolPathRef.current) {
      prevToolPathRef.current = currentToolPath;
      // Generate new session ID when switching tools
      setCurrentSessionId(null);
      setSelectedItemId(null);
      setSelectedItemData(null);
    }
  }, [currentToolPath]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const itemsWithDates = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        setItems(itemsWithDates);
      }
    } catch (error) {
      console.error('Error loading AI history:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded && items.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.error('Error saving AI history:', error);
      }
    }
  }, [items, isLoaded]);

  // Filter items for current tool
  const currentToolItems = items.filter(item => {
    const itemToolKey = getToolKey(item.toolPath);
    const currentToolKey = getToolKey(currentToolPath);
    return itemToolKey === currentToolKey;
  });

  // Start a new session - generates new ID, returns it
  const startNewSession = useCallback((): string => {
    const newId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentSessionId(newId);
    setSelectedItemId(null);
    setSelectedItemData(null);
    return newId;
  }, []);

  // Update the current session (creates if doesn't exist, updates if exists)
  const updateCurrentSession = useCallback((title: string, data: any, preview?: string) => {
    // If no current session, start one
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCurrentSessionId(sessionId);
    }

    const truncatedTitle = title.slice(0, 50) + (title.length > 50 ? '...' : '');
    const truncatedPreview = preview?.slice(0, 100) || '';

    setItems((prev) => {
      const toolKey = getToolKey(currentToolPath);
      const existingIndex = prev.findIndex(item => item.id === sessionId);

      if (existingIndex !== -1) {
        // Update existing session
        const updated = [...prev];
        updated[existingIndex] = {
          id: sessionId!,
          title: truncatedTitle,
          timestamp: new Date(),
          preview: truncatedPreview,
          data,
          toolPath: currentToolPath,
        };
        return updated.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      } else {
        // Create new session entry
        const newItem: HistoryItem = {
          id: sessionId!,
          title: truncatedTitle,
          timestamp: new Date(),
          preview: truncatedPreview,
          data,
          toolPath: currentToolPath,
        };

        // Limit items per tool
        const toolItems = prev.filter(item => getToolKey(item.toolPath) === toolKey);
        const otherItems = prev.filter(item => getToolKey(item.toolPath) !== toolKey);
        const updatedToolItems = [newItem, ...toolItems.slice(0, MAX_ITEMS_PER_TOOL - 1)];
        
        return [...updatedToolItems, ...otherItems].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }
    });
  }, [currentToolPath, currentSessionId]);

  const getItem = useCallback((id: string): HistoryItem | undefined => {
    return items.find((item) => item.id === id);
  }, [items]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedItemId === id) {
      setSelectedItemId(null);
      setSelectedItemData(null);
    }
    // If removing the current session, reset session ID
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  }, [selectedItemId, currentSessionId]);

  const clearHistory = useCallback(() => {
    const toolKey = getToolKey(currentToolPath);
    setItems((prev) => prev.filter(item => getToolKey(item.toolPath) !== toolKey));
    setSelectedItemId(null);
    setSelectedItemData(null);
    setCurrentSessionId(null);
  }, [currentToolPath]);

  const selectItem = useCallback((id: string) => {
    try {
      const item = items.find((item) => item.id === id);
      if (item && item.data) {
        setSelectedItemId(id);
        setSelectedItemData(item.data);
        setCurrentSessionId(id); // Resume this session
        setIsNewChat(false);
      } else {
        // Show toast for invalid item
        console.warn('Invalid history item:', id);
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: { message: 'Could not load this history item', type: 'error' } 
        }));
      }
    } catch (error) {
      console.error('Error selecting history item:', error);
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: 'Error loading history', type: 'error' } 
      }));
    }
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedItemId(null);
    setSelectedItemData(null);
    setIsNewChat(false);
  }, []);

  const newChat = useCallback(() => {
    // Generate new session ID for the new chat
    const newId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentSessionId(newId);
    setSelectedItemId(null);
    setSelectedItemData(null);
    setIsNewChat(true);
    // Reset isNewChat after a tick so components can react to it
    setTimeout(() => setIsNewChat(false), 100);
  }, []);

  return (
    <AIHistoryContext.Provider value={{
      items,
      currentToolItems,
      currentSessionId,
      updateCurrentSession,
      startNewSession,
      getItem,
      removeItem,
      clearHistory,
      selectItem,
      selectedItemId,
      selectedItemData,
      clearSelection,
      newChat,
      isNewChat,
    }}>
      {children}
    </AIHistoryContext.Provider>
  );
}

export function useAIHistory() {
  const context = useContext(AIHistoryContext);
  if (!context) {
    throw new Error('useAIHistory must be used within an AIHistoryProvider');
  }
  return context;
}
