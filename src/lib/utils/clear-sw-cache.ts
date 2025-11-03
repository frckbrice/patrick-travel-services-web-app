/**
 * Service Worker Cache Management Utilities
 * Use these functions to clear PWA cache when experiencing issues
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Unregister all service workers and clear all caches
 * This is useful when the PWA is blocking API requests in development
 */
export async function clearServiceWorkerAndCache(): Promise<void> {
  try {
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        if (isDevelopment) {
          console.log('[SW] Unregistered service worker:', registration.scope);
        }
      }
    }

    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(async (cacheName) => {
          await caches.delete(cacheName);
          if (isDevelopment) {
            console.log('[CACHE] Deleted cache:', cacheName);
          }
        })
      );
    }

    if (isDevelopment) {
      console.log('[SW] All service workers and caches cleared successfully');
    }
  } catch (error) {
    if (isDevelopment) {
      console.error('[SW] Error clearing service workers and cache:', error);
    }
    throw error;
  }
}

/**
 * Check if service worker is active
 */
export function isServiceWorkerActive(): boolean {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    return true;
  }
  return false;
}

/**
 * Get all registered service workers
 */
export async function getServiceWorkers(): Promise<readonly ServiceWorkerRegistration[]> {
  if ('serviceWorker' in navigator) {
    return await navigator.serviceWorker.getRegistrations();
  }
  return [];
}

/**
 * Get all cache names
 */
export async function getCacheNames(): Promise<string[]> {
  if ('caches' in window) {
    return await caches.keys();
  }
  return [];
}

/**
 * Clear only API-related caches
 */
export async function clearApiCache(): Promise<void> {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    const apiCaches = cacheNames.filter((name) => name.includes('api') || name.includes('runtime'));

    await Promise.all(
      apiCaches.map(async (cacheName) => {
        await caches.delete(cacheName);
        if (isDevelopment) {
          console.log('[CACHE] Deleted API cache:', cacheName);
        }
      })
    );
  }
}
