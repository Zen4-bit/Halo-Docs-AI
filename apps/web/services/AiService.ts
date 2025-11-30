/**
 * HALO Platform - AI Service
 * Server-Connected AI Processing for AI Workspace Tools
 * 
 * Architecture: ONLY AI tools connect to backend (API keys required)
 * All other tools (PDF, Office, Media) use client-side processing
 */

import { apiClient } from '@/lib/api-client';
import type {
  AiChatOptions,
  AiSummaryOptions,
  AiTranslateOptions,
  AiImproveOptions,
  AiChatEnhancedOptions,
  AiSummaryEnhancedOptions,
  AiImageOptions,
  AiRewriterOptions,
  AiInsightsOptions,
  ServiceResponse,
} from '@/types/tool-options';

/**
 * AI Chat Message Interface
 */
export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

/**
 * AI Service Response
 */
export interface AiServiceResult {
  response: string;
  tokensUsed?: number;
  model?: string;
}

/**
 * AiService - Server-connected AI processing
 * ONLY for AI Workspace tools (Chat, Summary, Translator, Content Improver)
 */
export class AiService {
  // ============================================================================
  // AI CHAT
  // ============================================================================

  /**
   * Send chat message to AI backend
   * @param message - User message
   * @param conversationHistory - Previous messages
   * @param options - Chat options
   */
  static async chat(
    message: string,
    conversationHistory: AiChatMessage[] = [],
    options: Partial<AiChatOptions> = {}
  ): Promise<ServiceResponse<AiServiceResult>> {
    const startTime = Date.now();

    try {
      // Default options
      const chatOptions: AiChatOptions = {
        contextLength: options.contextLength || 10,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 2048,
      };

      // Prepare conversation history in backend format
      const formattedHistory = conversationHistory
        .slice(-chatOptions.contextLength)
        .map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          content: msg.content,
        }));

      // Call backend API
      const response = await apiClient('/chat', {
        method: 'POST',
        body: {
          message,
          conversation_history: formattedHistory,
          temperature: chatOptions.temperature,
          max_tokens: chatOptions.maxTokens,
        },
      });

      return {
        success: true,
        data: {
          response: response.response || response.message,
          tokensUsed: response.tokens_used,
          model: response.model,
        },
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get AI response',
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Stream chat response (for real-time updates)
   * @param message - User message
   * @param conversationHistory - Previous messages
   * @param options - Chat options
   * @param onChunk - Callback for each response chunk
   */
  static async streamChat(
    message: string,
    conversationHistory: AiChatMessage[] = [],
    options: Partial<AiChatOptions> = {},
    onChunk: (chunk: string) => void
  ): Promise<ServiceResponse<AiServiceResult>> {
    const startTime = Date.now();

    try {
      const chatOptions: AiChatOptions = {
        contextLength: options.contextLength || 10,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 2048,
      };

      const formattedHistory = conversationHistory
        .slice(-chatOptions.contextLength)
        .map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          content: msg.content,
        }));

      // Make streaming request
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversation_history: formattedHistory,
          temperature: chatOptions.temperature,
          max_tokens: chatOptions.maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`Stream request failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Stream reader not available');
      }

      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.chunk) {
                fullResponse += parsed.chunk;
                onChunk(parsed.chunk);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      return {
        success: true,
        data: {
          response: fullResponse,
        },
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to stream AI response',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // AI SUMMARY
  // ============================================================================

  /**
   * Generate AI summary from text or document
   * @param content - Text content to summarize
   * @param options - Summary options
   */
  static async summarize(
    content: string,
    options: Partial<AiSummaryOptions> = {}
  ): Promise<ServiceResponse<AiServiceResult>> {
    const startTime = Date.now();

    try {
      // Default options
      const summaryOptions: AiSummaryOptions = {
        maxLength: options.maxLength || 500,
        format: options.format || 'paragraph',
        style: options.style || 'concise',
      };

      // Call backend API with proper options
      const response = await apiClient('/ai/summarize', {
        method: 'POST',
        body: {
          content,
          max_length: summaryOptions.maxLength,
          format: summaryOptions.format,
          style: summaryOptions.style,
        },
      });

      return {
        success: true,
        data: {
          response: response.summary || response.response,
          tokensUsed: response.tokens_used,
          model: response.model,
        },
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to generate summary',
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Summarize from file (PDF, DOCX, TXT)
   * @param file - Document file
   * @param options - Summary options
   */
  static async summarizeFile(
    file: File,
    options: Partial<AiSummaryOptions> = {}
  ): Promise<ServiceResponse<AiServiceResult>> {
    const startTime = Date.now();

    try {
      const summaryOptions: AiSummaryOptions = {
        maxLength: options.maxLength || 500,
        format: options.format || 'paragraph',
        style: options.style || 'concise',
      };

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('max_length', summaryOptions.maxLength.toString());
      formData.append('format', summaryOptions.format);
      formData.append('style', summaryOptions.style);

      // Call backend API
      const response = await fetch('/api/v1/ai/summarize/file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to summarize file');
      }

      const data = await response.json();

      return {
        success: true,
        data: {
          response: data.summary || data.response,
          tokensUsed: data.tokens_used,
          model: data.model,
        },
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to summarize file',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // AI TRANSLATION
  // ============================================================================

  /**
   * Translate text using AI
   * @param content - Text to translate
   * @param options - Translation options
   */
  static async translate(
    content: string,
    options: AiTranslateOptions
  ): Promise<ServiceResponse<AiServiceResult>> {
    const startTime = Date.now();

    try {
      // Call backend API
      const response = await apiClient('/ai/translate', {
        method: 'POST',
        body: {
          content,
          source_language: options.sourceLanguage || 'auto',
          target_language: options.targetLanguage,
          preserve_formatting: options.preserveFormatting,
          style: options.style || 'formal',
        },
      });

      return {
        success: true,
        data: {
          response: response.translated_text || response.response,
          tokensUsed: response.tokens_used,
          model: response.model,
        },
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to translate text',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // AI CONTENT IMPROVEMENT
  // ============================================================================

  /**
   * Improve content using AI (grammar, clarity, tone)
   * @param content - Text to improve
   * @param options - Improvement options
   */
  static async improveContent(
    content: string,
    options: AiImproveOptions
  ): Promise<ServiceResponse<AiServiceResult>> {
    const startTime = Date.now();

    try {
      // Call backend API
      const response = await apiClient('/ai/improve', {
        method: 'POST',
        body: {
          content,
          improvement_type: options.type,
          tone: options.tone,
          preserve_meaning: options.preserveMeaning,
        },
      });

      return {
        success: true,
        data: {
          response: response.improved_text || response.response,
          tokensUsed: response.tokens_used,
          model: response.model,
        },
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to improve content',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Check if AI service is available
   */
  static async checkAvailability(): Promise<boolean> {
    try {
      const response = await apiClient('/health');
      return response.status === 'healthy' || response.status === 'ok';
    } catch {
      return false;
    }
  }

  /**
   * Get available AI models
   */
  static async getAvailableModels(): Promise<string[]> {
    try {
      const response = await apiClient('/ai/models');
      return response.models || [];
    } catch {
      return [];
    }
  }

  // ============================================================================
  // AI IMAGE STUDIO
  // ============================================================================

  /**
   * Generate AI image from prompt
   * @param options - Image generation options
   */
  static async generateImage(
    options: AiImageOptions
  ): Promise<ServiceResponse<{ imageUrl: string; seed: number }>> {
    const startTime = Date.now();

    try {
      const response = await apiClient('/ai/image/generate', {
        method: 'POST',
        body: {
          model: options.model,
          prompt: options.prompt,
          negative_prompt: options.negativePrompt,
          style: options.style,
          dimensions: options.dimensions,
          quality: options.quality,
          guidance_scale: options.guidanceScale,
          seed: options.seed,
        },
      });

      return {
        success: true,
        data: {
          imageUrl: response.image_url,
          seed: response.seed || options.seed || Math.floor(Math.random() * 1000000),
        },
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to generate image',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // AI REWRITER
  // ============================================================================

  /**
   * Rewrite content with specified tone and action
   * @param content - Text to rewrite
   * @param options - Rewriter options
   */
  static async rewriteContent(
    content: string,
    options: AiRewriterOptions
  ): Promise<ServiceResponse<AiServiceResult>> {
    const startTime = Date.now();

    try {
      const response = await apiClient('/ai/rewrite', {
        method: 'POST',
        body: {
          content,
          tone: options.tone,
          action: options.action,
          target_length: options.targetLength,
          target_audience: options.targetAudience,
          creativity_level: options.creativityLevel,
          preserve_meaning: options.preserveMeaning,
        },
      });

      return {
        success: true,
        data: {
          response: response.rewritten_text || response.response,
          tokensUsed: response.tokens_used,
          model: response.model,
        },
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to rewrite content',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // AI DATA INSIGHTS
  // ============================================================================

  /**
   * Analyze data and generate insights
   * @param data - Data to analyze (text or JSON)
   * @param options - Insights options
   */
  static async analyzeData(
    data: string | object,
    options: AiInsightsOptions
  ): Promise<ServiceResponse<{
    insights: any;
    visualizations?: any[];
    exportUrl?: string;
  }>> {
    const startTime = Date.now();

    try {
      const response = await apiClient('/ai/insights', {
        method: 'POST',
        body: {
          data: typeof data === 'string' ? data : JSON.stringify(data),
          analysis_type: options.analysisType,
          depth: options.depth,
          include_visualizations: options.includeVisualizations,
          export_format: options.exportFormat,
        },
      });

      return {
        success: true,
        data: {
          insights: response.insights,
          visualizations: response.visualizations,
          exportUrl: response.export_url,
        },
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to analyze data',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // ENHANCED CHAT (with model selection)
  // ============================================================================

  /**
   * Enhanced chat with model selection and system prompts
   * @param message - User message
   * @param conversationHistory - Previous messages
   * @param options - Enhanced chat options
   */
  static async chatEnhanced(
    message: string,
    conversationHistory: AiChatMessage[] = [],
    options: Partial<AiChatEnhancedOptions> = {}
  ): Promise<ServiceResponse<AiServiceResult>> {
    const startTime = Date.now();

    try {
      const chatOptions: AiChatEnhancedOptions = {
        contextLength: options.contextLength || 10,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 2048,
        model: options.model || 'gpt-4-turbo',
        streaming: options.streaming !== undefined ? options.streaming : false,
      };
      if (options.systemPrompt) {
        chatOptions.systemPrompt = options.systemPrompt;
      }

      const formattedHistory = conversationHistory
        .slice(-chatOptions.contextLength)
        .map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          content: msg.content,
        }));

      const response = await apiClient('/chat/enhanced', {
        method: 'POST',
        body: {
          message,
          conversation_history: formattedHistory,
          model: chatOptions.model,
          temperature: chatOptions.temperature,
          max_tokens: chatOptions.maxTokens,
          system_prompt: chatOptions.systemPrompt,
        },
      });

      return {
        success: true,
        data: {
          response: response.response || response.message,
          tokensUsed: response.tokens_used,
          model: response.model,
        },
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get AI response',
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Enhanced summary with all options
   * @param content - Text content to summarize
   * @param options - Enhanced summary options
   */
  static async summarizeEnhanced(
    content: string,
    options: Partial<AiSummaryEnhancedOptions> = {}
  ): Promise<ServiceResponse<{
    summary: string;
    keywords?: string[];
    statistics?: any;
    tokensUsed?: number;
  }>> {
    const startTime = Date.now();

    try {
      const summaryOptions: AiSummaryEnhancedOptions = {
        maxLength: options.maxLength || 500,
        format: options.format || 'paragraph',
        style: options.style || 'concise',
        extractKeywords: options.extractKeywords !== undefined ? options.extractKeywords : false,
        includeStatistics: options.includeStatistics !== undefined ? options.includeStatistics : false,
      };
      if (options.targetLanguage) {
        summaryOptions.targetLanguage = options.targetLanguage;
      }

      const response = await apiClient('/ai/summarize/enhanced', {
        method: 'POST',
        body: {
          content,
          max_length: summaryOptions.maxLength,
          format: summaryOptions.format,
          style: summaryOptions.style,
          extract_keywords: summaryOptions.extractKeywords,
          target_language: summaryOptions.targetLanguage,
          include_statistics: summaryOptions.includeStatistics,
        },
      });

      return {
        success: true,
        data: {
          summary: response.summary,
          keywords: response.keywords,
          statistics: response.statistics,
          tokensUsed: response.tokens_used,
        },
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to generate summary',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Estimate token count for text
   * Rough estimation: ~4 characters per token
   */
  static estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Validate content length for AI processing
   */
  static validateContentLength(
    content: string,
    maxTokens: number = 4096
  ): { isValid: boolean; error?: string; estimatedTokens: number } {
    const estimatedTokens = this.estimateTokenCount(content);

    if (estimatedTokens > maxTokens) {
      return {
        isValid: false,
        error: `Content is too long. Estimated ${estimatedTokens} tokens, maximum is ${maxTokens}.`,
        estimatedTokens,
      };
    }

    return {
      isValid: true,
      estimatedTokens,
    };
  }
}
