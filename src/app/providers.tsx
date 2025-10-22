'use client';

// App providers wrapper - PERFORMANCE OPTIMIZED

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, lazy, Suspense } from 'react';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { FirebaseAuthProvider } from '@/components/auth/FirebaseAuthProvider';
import { I18nProvider } from '@/contexts/I18nProvider';

// PERFORMANCE: Lazy load ReactQueryDevtools (only in development)
const ReactQueryDevtools =
  process.env.NODE_ENV === 'development'
    ? lazy(() =>
        import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools }))
      )
    : null;

// PERFORMANCE: Lazy load InstallPrompt (not critical for initial render)
const InstallPrompt = lazy(() =>
  import('@/components/pwa/InstallPrompt').then((m) => ({ default: m.InstallPrompt }))
);

// DEVELOPMENT: Auto-clear service workers in development mode
const DevServiceWorkerCleaner =
  process.env.NODE_ENV === 'development'
    ? lazy(() =>
        import('@/components/pwa/DevServiceWorkerCleaner').then((m) => ({
          default: m.DevServiceWorkerCleaner,
        }))
      )
    : null;

export function Providers({ children }: { children: React.ReactNode }) {
  // PERFORMANCE: Highly optimized QueryClient for mobile PWA
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // CACHING: Aggressive caching for mobile performance
            staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
            gcTime: 10 * 60 * 1000, // 10 minutes - keep in memory longer

            // MOBILE OPTIMIZATION: Reduce network requests
            refetchOnWindowFocus: false, // Don't refetch when tab becomes active
            refetchOnMount: false, // Use cached data on component mount
            refetchOnReconnect: false, // Don't refetch when internet reconnects

            // PERFORMANCE: Faster failures on mobile networks
            retry: 1, // Only retry once on failure
            retryDelay: 1000, // 1 second between retries

            // MOBILE: Use cache while revalidating in background
            networkMode: 'offlineFirst' as const, // Prefer cache over network
          },
          mutations: {
            retry: 1,
            networkMode: 'online' as const, // Mutations require network
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <I18nProvider>
          <FirebaseAuthProvider>
            {children}

            {/* PERFORMANCE: Toast notifications */}
            <Toaster position="top-right" richColors />

            {/* PERFORMANCE: Only load devtools in development */}
            {ReactQueryDevtools && (
              <Suspense fallback={null}>
                <ReactQueryDevtools initialIsOpen={false} />
              </Suspense>
            )}

            {/* PERFORMANCE: Lazy load PWA install prompt */}
            <Suspense fallback={null}>
              <InstallPrompt />
            </Suspense>

            {/* DEVELOPMENT: Auto-clear service workers in dev mode */}
            {DevServiceWorkerCleaner && (
              <Suspense fallback={null}>
                <DevServiceWorkerCleaner />
              </Suspense>
            )}
          </FirebaseAuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
