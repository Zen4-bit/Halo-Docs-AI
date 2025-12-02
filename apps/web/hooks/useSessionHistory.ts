'use client';

import { useState, useEffect, useCallback } from 'react';

export interface HistoryItem {
  id: string;
  title: string;
  timestamp: Date;
  preview?: string;
  data: any;
}

interface UseSessionHistoryOptions {
  key: string;
  maxItems?: number;
}

export function useSessionHistory<T = any>({ key, maxItems = 10 }: UseSessionHistoryOptions) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load history from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`history_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const itemsWithDates = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        setItems(itemsWithDates);
      }
    } catch (error) {
      console.error('Error loading session history:', error);
    }
    setIsLoaded(true);
  }, [key]);

  // Save history to sessionStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        sessionStorage.setItem(`history_${key}`, JSON.stringify(items));
      } catch (error) {
        console.error('Error saving session history:', error);
      }
    }
  }, [items, key, isLoaded]);

  const addItem = useCallback((title: string, data: T, preview?: string) => {
    const newItem: HistoryItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      timestamp: new Date(),
      preview: preview || '',
      data,
    };

    setItems((prev) => {
      const updated = [newItem, ...prev.slice(0, maxItems - 1)];
      return updated;
    });

    return newItem.id;
  }, [maxItems]);

  const getItem = useCallback((id: string): HistoryItem | undefined => {
    return items.find((item) => item.id === id);
  }, [items]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setItems([]);
    sessionStorage.removeItem(`history_${key}`);
  }, [key]);

  const updateItem = useCallback((id: string, updates: Partial<Omit<HistoryItem, 'id'>>) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...updates, timestamp: updates.timestamp || item.timestamp }
          : item
      )
    );
  }, []);

  return {
    items,
    isLoaded,
    addItem,
    getItem,
    removeItem,
    clearHistory,
    updateItem,
  };
}

// Specific hooks for different AI tools
export function useChatHistory() {
  return useSessionHistory<{ messages: any[] }>({
    key: 'ai_chat',
    maxItems: 10,
  });
}

export function useSummaryHistory() {
  return useSessionHistory<{ text: string; summary: string }>({
    key: 'ai_summary',
    maxItems: 10,
  });
}

export function useTranslatorHistory() {
  return useSessionHistory<{ source: string; target: string; text: string; result: string }>({
    key: 'ai_translator',
    maxItems: 10,
  });
}

export function useRewriterHistory() {
  return useSessionHistory<{ original: string; rewritten: string; style: string }>({
    key: 'ai_rewriter',
    maxItems: 10,
  });
}

export function useInsightsHistory() {
  return useSessionHistory<{ text: string; insights: any }>({
    key: 'ai_insights',
    maxItems: 10,
  });
}

export function useImageStudioHistory() {
  return useSessionHistory<{ prompt: string; imageUrl?: string }>({
    key: 'ai_image_studio',
    maxItems: 5,
  });
}
