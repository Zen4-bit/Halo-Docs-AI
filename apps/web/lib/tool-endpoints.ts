/**
 * Tool endpoint mappings for Docker backend API
 * Centralizes all tool API endpoints for easy maintenance
 */

export const TOOL_ENDPOINTS = {
  // AI Tools - Core AI Processing
  SUMMARIZE: '/summarize/text',
  SUMMARIZE_YOUTUBE: '/summarize/youtube',
  SUMMARIZE_TEXT: '/summarize/text',
  TRANSLATE: '/generative/translate',
  IMPROVE: '/generative/improve',
  IMPROVE_CONTENT: '/generative/improve',
  REVIEW: '/generative/review',
  REDACT: '/generative/redact',
  INSIGHTS_CREATE: '/image/insights',
  INSIGHTS_CHAT: '/image/insights',
  INSIGHTS: '/generative/insights',
  TAGLINE_CREATE: '/generative/tagline',

  // Image & Video Generation
  GENERATE_IMAGE: '/ai/generate-image',
  GENERATE_VIDEO: '/ai/generate-video',
  IMAGE_STUDIO: '/ai/generate-image',
  VIDEO_FORGE: '/ai/generate-video',

  // Chat
  CHAT_STREAM: '/chat/stream',
  HALO_CHAT: '/chat/stream',

  // PDF Tools - Complete Suite
  PDF_MERGE: '/pdf/merge',
  PDF_SPLIT: '/pdf/split',
  PDF_COMPRESS: '/pdf/compress',
  PDF_ROTATE: '/pdf/rotate',
  PDF_WATERMARK: '/pdf/watermark',
  PDF_REDACT: '/pdf/redact',
  PDF_REPAIR: '/pdf/repair',
  PDF_PAGE_NUMBERS: '/pdf/page-numbers',

  // Office Productivity Tools
  RESUME_OPTIMIZE: '/office/resume-optimize',
  PROPOSAL_GENERATE: '/office/proposal-generate',
  PROPOSAL_WRITER: '/office/proposal-generate',

  // Document Tools
  UPLOAD_GENERATE_URL: '/upload/generate-url',
  UPLOAD_COMPLETE: '/upload/complete',

  // GCS Storage
  GCS_GENERATE_UPLOAD_URL: '/gcs/generate-upload-url',
  GCS_GENERATE_DOWNLOAD_URL: '/gcs/generate-download-url',

  // Task Management
  TASK_STATUS: '/tasks/status',
  TASK_LIST: '/tasks/list',

  // Chat Conversations
  CHAT_CONVERSATIONS: '/chat/conversations',
  CHAT_SEND_MESSAGE: '/chat/conversations',

  // Media
  VIDEO_DOWNLOADER: '/media/video-download',
} as const;

export type ToolEndpoint = typeof TOOL_ENDPOINTS[keyof typeof TOOL_ENDPOINTS];

/**
 * Get the appropriate endpoint for a tool
 */
export function getToolEndpoint(toolName: string): string {
  const endpointMap: Record<string, string> = {
    // AI Tools
    'summarize': TOOL_ENDPOINTS.SUMMARIZE,
    'summarize-youtube': TOOL_ENDPOINTS.SUMMARIZE_YOUTUBE,
    'summarize-text': TOOL_ENDPOINTS.SUMMARIZE_TEXT,
    'translate': TOOL_ENDPOINTS.TRANSLATE,
    'improve': TOOL_ENDPOINTS.IMPROVE,
    'improve-content': TOOL_ENDPOINTS.IMPROVE_CONTENT,
    'review': TOOL_ENDPOINTS.REVIEW,
    'redact': TOOL_ENDPOINTS.REDACT,
    'insights': TOOL_ENDPOINTS.INSIGHTS,
    'insights-create': TOOL_ENDPOINTS.INSIGHTS_CREATE,
    'insights-chat': TOOL_ENDPOINTS.INSIGHTS_CHAT,
    'tagline': TOOL_ENDPOINTS.TAGLINE_CREATE,
    'tagline-create': TOOL_ENDPOINTS.TAGLINE_CREATE,

    // Chat
    'chat': TOOL_ENDPOINTS.HALO_CHAT,
    'halo-chat': TOOL_ENDPOINTS.HALO_CHAT,

    // Media Tools
    'image-studio': TOOL_ENDPOINTS.IMAGE_STUDIO,
    'generate-image': TOOL_ENDPOINTS.GENERATE_IMAGE,
    'video-forge': TOOL_ENDPOINTS.VIDEO_FORGE,
    'generate-video': TOOL_ENDPOINTS.GENERATE_VIDEO,

    // PDF Tools
    'merge': TOOL_ENDPOINTS.PDF_MERGE,
    'split': TOOL_ENDPOINTS.PDF_SPLIT,
    'compress': TOOL_ENDPOINTS.PDF_COMPRESS,
    'rotate': TOOL_ENDPOINTS.PDF_ROTATE,
    'watermark': TOOL_ENDPOINTS.PDF_WATERMARK,
    'pdf-redact': TOOL_ENDPOINTS.PDF_REDACT,
    'repair': TOOL_ENDPOINTS.PDF_REPAIR,
    'page-numbers': TOOL_ENDPOINTS.PDF_PAGE_NUMBERS,

    // Office Tools
    'resume-optimize': TOOL_ENDPOINTS.RESUME_OPTIMIZE,
    'proposal-generate': TOOL_ENDPOINTS.PROPOSAL_GENERATE,
    'proposal-writer': TOOL_ENDPOINTS.PROPOSAL_WRITER,

    // Media
    'video-downloader': TOOL_ENDPOINTS.VIDEO_DOWNLOADER,
  };

  return endpointMap[toolName] || `/tools/${toolName}`;
}
