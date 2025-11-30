/**
 * API Client for HALO Docs AI
 * Handles all backend API communication
 */

import { API_BASE, buildApiUrl } from './api-base';

export class APIError extends Error {
  public friendlyMessage: string;

  constructor(
    message: string,
    public status: number,
    public data?: any,
    friendlyMessage?: string
  ) {
    super(message);
    this.name = 'APIError';
    this.friendlyMessage = friendlyMessage ?? message;
  }
}

const buildFriendlyMessage = (status: number, data?: any) => {
  if (status >= 500) {
    return 'Something went wrong on our end. Please try again in a moment.';
  }

  if (status === 404) {
    return "We couldn't find what you were looking for. Double-check the link or try again.";
  }

  if (status === 401 || status === 403) {
    return "Access denied. Please try again.";
  }

  if (status === 422) {
    return data?.error || 'Please verify the information you entered and try again.';
  }

  if (status === 400) {
    return data?.error || 'The request could not be processed. Please check your input.';
  }

  return data?.error || 'Request failed. Please try again.';
};

/**
 * Generic API client for authenticated requests
 * @param endpoint - API endpoint (e.g., '/summarize/youtube')
 * @param options - Fetch options with optional body object
 * @param token - Optional auth token
 */
export async function apiClient(
  endpoint: string,
  options: { method?: string; body?: any; headers?: Record<string, string> } = {},
  token?: string
): Promise<any> {
  const url = buildApiUrl(endpoint);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // No authentication required
  
  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers,
  };
  
  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }
  
  const response = await fetch(url, fetchOptions);
  
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const responseText = await response.text();

  if (!response.ok) {
    let errorData: any = undefined;
    if (isJson && responseText) {
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { error: responseText };
      }
    } else if (responseText) {
      errorData = { error: responseText };
    } else {
      errorData = { error: 'Unknown error' };
    }

    const errorMessage = errorData.detail || errorData.error || 'API request failed';
    const friendlyMessage = buildFriendlyMessage(response.status, errorData);

    throw new APIError(errorMessage, response.status, errorData, friendlyMessage);
  }

  if (!responseText) {
    return null;
  }

  if (isJson) {
    try {
      return JSON.parse(responseText);
    } catch {
      throw new APIError(
        'Failed to parse JSON response',
        response.status,
        responseText,
        'We had trouble reading the server response. Please try again.',
      );
    }
  }

  return responseText;
}

/**
 * Make authenticated API request (internal use)
 */
async function fetchAPI(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<any> {
  const url = buildApiUrl(endpoint);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add auth token if provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Merge with provided headers
  if (options.headers) {
    Object.assign(headers, options.headers);
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const responseText = await response.text();

  if (!response.ok) {
    let errorData: any = undefined;
    if (isJson && responseText) {
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { error: responseText };
      }
    } else if (responseText) {
      errorData = { error: responseText };
    } else {
      errorData = { error: 'Unknown error' };
    }

    const errorMessage = errorData.detail || errorData.error || 'API request failed';
    const friendlyMessage = buildFriendlyMessage(response.status, errorData);

    throw new APIError(errorMessage, response.status, errorData, friendlyMessage);
  }

  if (!responseText) {
    return null;
  }

  if (isJson) {
    try {
      return JSON.parse(responseText);
    } catch {
      throw new APIError(
        'Failed to parse JSON response',
        response.status,
        responseText,
        'We had trouble reading the server response. Please try again.',
      );
    }
  }

  return responseText;
}

// ============================================================================
// Authentication Removed - All APIs are now public
// ============================================================================

// ============================================================================
// Chat API
// ============================================================================

export interface ChatConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_preview?: string | null;
  last_message_role?: string | null;
  last_message_at?: string | null;
  message_count: number;
}

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export interface ChatConversationDetail {
  conversation: ChatConversationSummary;
  messages: ChatMessage[];
}

export interface SendChatMessageResponse {
  conversation_id: string;
  message: ChatMessage;
  conversation: ChatConversationSummary;
}

export async function listChatConversations(token: string): Promise<ChatConversationSummary[]> {
  return fetchAPI('/chat/conversations', {}, token);
}

export async function createChatConversation(
  data: { title?: string; system_prompt?: string } = {},
  token: string
): Promise<ChatConversationSummary> {
  return fetchAPI('/chat/conversations', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
}

export async function getChatConversation(
  conversationId: string,
  token: string
): Promise<ChatConversationDetail> {
  return fetchAPI(`/chat/conversations/${conversationId}`, {}, token);
}

export async function renameChatConversation(
  conversationId: string,
  title: string,
  token: string
): Promise<ChatConversationSummary> {
  return fetchAPI(`/chat/conversations/${conversationId}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  }, token);
}

export async function deleteChatConversation(
  conversationId: string,
  token: string
): Promise<void> {
  await fetchAPI(`/chat/conversations/${conversationId}`, {
    method: 'DELETE',
  }, token);
}

export async function sendChatMessage(
  conversationId: string,
  data: { content: string; model?: string },
  token: string
): Promise<SendChatMessageResponse> {
  return fetchAPI(`/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ ...data, stream: false }),
  }, token);
}

export async function streamChatMessage(
  conversationId: string,
  data: { content: string; model?: string },
  token: string,
  signal?: AbortSignal
): Promise<Response> {
  const url = `${API_BASE}/chat/conversations/${conversationId}/messages`;
  const fetchOptions: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ ...data, stream: true }),
  };
  
  if (signal) {
    fetchOptions.signal = signal;
  }
  
  return fetch(url, fetchOptions);
}

// ============================================================================
// GCS Storage API
// ============================================================================

export interface GenerateUploadUrlRequest {
  filename: string;
  content_type: string;
  file_size?: number;
}

export interface GenerateUploadUrlResponse {
  signed_url: string;
  gcs_path: string;
  expires_in_minutes: number;
}

export async function generateGCSUploadURL(
  data: GenerateUploadUrlRequest,
  token?: string
): Promise<GenerateUploadUrlResponse> {
  return fetchAPI('/gcs/generate-upload-url', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
}

export async function generateGCSDownloadURL(
  gcsPath: string,
  token?: string
): Promise<{ signed_url: string; expires_in_minutes: number }> {
  return fetchAPI('/gcs/generate-download-url', {
    method: 'POST',
    body: JSON.stringify({ gcs_path: gcsPath }),
  }, token);
}

/**
 * Upload file directly to GCS using signed URL
 */
export async function uploadToGCS(
  signedUrl: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });
    }
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });
    
    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

/**
 * Upload API - Generate presigned URL (Legacy - for backward compatibility)
 */
export async function generateUploadURL(
  filename: string,
  fileType: string,
  fileSize: number,
  token: string
) {
  return fetchAPI(
    '/upload/generate-url',
    {
      method: 'POST',
      body: JSON.stringify({ filename, file_type: fileType, file_size: fileSize }),
    },
    token
  );
}

/**
 * Upload API - Complete upload
 */
export async function completeUpload(
  documentId: string,
  s3Key: string,
  filename: string,
  fileSize: number,
  mimeType: string,
  token: string
) {
  return fetchAPI(
    '/upload/complete',
    {
      method: 'POST',
      body: JSON.stringify({
        document_id: documentId,
        s3_key: s3Key,
        filename,
        file_size: fileSize,
        mime_type: mimeType,
      }),
    },
    token
  );
}

/**
 * Task API - Get task status
 */
export async function getTaskStatus(taskId: string, token: string) {
  return fetchAPI(`/tasks/status/${taskId}`, {}, token);
}

/**
 * Task API - List user tasks
 */
export async function listTasks(token: string, statusFilter?: string) {
  const query = statusFilter ? `?status_filter=${statusFilter}` : '';
  return fetchAPI(`/tasks/list${query}`, {}, token);
}

/**
 * PDF Tools - Merge PDFs
 */
export async function mergePDFs(documentIds: string[], token: string): Promise<Blob> {
  const url = `${API_BASE}/pdf/merge`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ document_ids: documentIds }),
  });
  
  if (!response.ok) {
    throw new APIError(
      'Merge failed',
      response.status,
      undefined,
      buildFriendlyMessage(response.status),
    );
  }
  
  return response.blob();
}

/**
 * PDF Tools - Split PDF
 */
export async function splitPDF(
  documentId: string,
  pageRange: string,
  token: string
): Promise<Blob> {
  const url = `${API_BASE}/pdf/split`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ document_id: documentId, page_range: pageRange }),
  });
  
  if (!response.ok) {
    throw new APIError(
      'Split failed',
      response.status,
      undefined,
      buildFriendlyMessage(response.status),
    );
  }
  
  return response.blob();
}

/**
 * AI Tools - Summarize
 */
export async function summarizeDocument(documentId: string, token: string) {
  return fetchAPI(
    '/ai/summarize',
    {
      method: 'POST',
      body: JSON.stringify({ document_id: documentId }),
    },
    token
  );
}

/**
 * AI Tools - Translate
 */
export async function translateDocument(
  documentId: string,
  targetLanguage: string,
  token: string
) {
  return fetchAPI(
    '/ai/translate',
    {
      method: 'POST',
      body: JSON.stringify({
        document_id: documentId,
        target_language: targetLanguage,
      }),
    },
    token
  );
}

/**
 * AI Tools - Improve Content
 */
export async function improveContent(
  documentId: string,
  style: string,
  token: string
) {
  return fetchAPI(
    '/ai/improve',
    {
      method: 'POST',
      body: JSON.stringify({ document_id: documentId, style }),
    },
    token
  );
}

/**
 * AI Tools - Review
 */
export async function reviewDocument(
  documentId: string,
  reviewType: string,
  token: string
) {
  return fetchAPI(
    '/ai/review',
    {
      method: 'POST',
      body: JSON.stringify({ document_id: documentId, review_type: reviewType }),
    },
    token
  );
}

/**
 * AI Insights - Create index
 */
export async function createInsightsIndex(documentId: string, token: string) {
  return fetchAPI(
    '/ai/insights/create',
    {
      method: 'POST',
      body: JSON.stringify({ document_id: documentId }),
    },
    token
  );
}

/**
 * AI Insights - Chat
 */
export async function chatWithDocument(
  taskId: string,
  prompt: string,
  chatHistory: Array<{ role: string; content: string }>,
  token: string
) {
  return fetchAPI(
    '/ai/insights/chat',
    {
      method: 'POST',
      body: JSON.stringify({ task_id: taskId, prompt, chat_history: chatHistory }),
    },
    token
  );
}
