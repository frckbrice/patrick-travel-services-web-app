'use client';

import { useEffect } from 'react';
import { clearServiceWorkerAndCache } from '@/lib/utils/clear-sw-cache';

/**
 * Development mode helper component
 * Automatically clears service workers in development to prevent caching issues
 */
export function DevServiceWorkerCleaner() {
  useEffect(() => {
    // Only run in development mode
    if (process.env.NODE_ENV === 'development') {
      // Check if service worker is registered
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          if (registrations.length > 0) {
            console.warn(
              `[DEV] Found ${registrations.length} service worker(s) in development mode. Clearing...`
            );
            clearServiceWorkerAndCache()
              .then(() => {
                console.log('[DEV] Service workers cleared successfully');
              })
              .catch((error) => {
                console.error('[DEV] Failed to clear service workers:', error);
              });
          }
        });
      }
    }
  }, []);

  return null; // This component doesn't render anything
}
