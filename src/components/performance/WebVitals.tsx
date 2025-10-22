'use client';

// PERFORMANCE: Web Vitals monitoring component
// Tracks Core Web Vitals for Lighthouse optimization

import { useEffect } from 'react';
import type { Metric } from 'web-vitals';

// PERFORMANCE: Only load web-vitals in production for monitoring
const reportWebVitals = (metric: Metric) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, metric);
  }

  // In production, send to analytics (example: Google Analytics, Vercel Analytics, etc.)
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    }

    // Example: Send to custom analytics endpoint
    // fetch('/api/analytics/vitals', {
    //   method: 'POST',
    //   body: JSON.stringify(metric),
    //   headers: { 'Content-Type': 'application/json' },
    // }).catch(() => {});
  }
};

export function WebVitals() {
  useEffect(() => {
    // PERFORMANCE: Dynamically import web-vitals to reduce bundle size
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
      // Core Web Vitals
      onCLS(reportWebVitals); // Cumulative Layout Shift
      onFID(reportWebVitals); // First Input Delay
      onFCP(reportWebVitals); // First Contentful Paint
      onLCP(reportWebVitals); // Largest Contentful Paint
      onTTFB(reportWebVitals); // Time to First Byte
      onINP(reportWebVitals); // Interaction to Next Paint
    });
  }, []);

  return null; // This component doesn't render anything
}

// PERFORMANCE: Performance thresholds for Lighthouse
export const PERFORMANCE_THRESHOLDS = {
  // Good thresholds (green in Lighthouse)
  GOOD: {
    LCP: 2500, // Largest Contentful Paint < 2.5s
    FID: 100, // First Input Delay < 100ms
    CLS: 0.1, // Cumulative Layout Shift < 0.1
    FCP: 1800, // First Contentful Paint < 1.8s
    TTFB: 800, // Time to First Byte < 800ms
    INP: 200, // Interaction to Next Paint < 200ms
  },
  // Needs improvement (orange in Lighthouse)
  NEEDS_IMPROVEMENT: {
    LCP: 4000,
    FID: 300,
    CLS: 0.25,
    FCP: 3000,
    TTFB: 1800,
    INP: 500,
  },
  // Poor (red in Lighthouse)
  // Anything above NEEDS_IMPROVEMENT threshold
};

// PERFORMANCE: Helper to check if metric is good
export function isMetricGood(name: string, value: number): boolean {
  const threshold = PERFORMANCE_THRESHOLDS.GOOD[name as keyof typeof PERFORMANCE_THRESHOLDS.GOOD];
  return threshold ? value <= threshold : true;
}
