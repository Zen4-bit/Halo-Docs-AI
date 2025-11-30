'use client';

import { useEffect } from 'react';

export default function AnalyticsBridge() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'analytics_ready',
      timestamp: Date.now(),
    });
  }, []);

  return null;
}

