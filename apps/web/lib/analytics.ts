'use client';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export const trackEvent = (name: string, properties: Record<string, unknown> = {}) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  const payload = {
    event: name,
    timestamp: Date.now(),
    ...properties,
  };
  window.dataLayer.push(payload);

  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', payload);
  }
};

export const trackToolOpened = (toolId: string, category: string) => {
  trackEvent('tool_opened', { toolId, category });
};

export const trackWorkflowItemOpened = (eventId: string, status: string, category: string) => {
  trackEvent('workflow_item_opened', { eventId, status, category });
};

export const trackFormSubmission = (
  formId: string,
  status: 'success' | 'error',
  metadata?: Record<string, unknown>,
) => {
  trackEvent('form_submission', { formId, status, ...metadata });
};

