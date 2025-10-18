import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { WebVitals } from '@/components/performance/WebVitals';

// PERFORMANCE: Optimized font loading with display:swap and preload
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap', // Prevents invisible text while font loads
  preload: true,
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
});

// PERFORMANCE: Separate viewport export (Next.js 14+ optimization)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'Patrick Travel Services - Immigration Management',
    template: '%s | Patrick Travel Services',
  },
  description:
    'Complete immigration services management platform for streamlined case management and client communications',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PTS Immigration',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Patrick Travel Services',
    title: 'Immigration Management Platform',
    description: 'Complete immigration services management platform',
  },
  twitter: {
    card: 'summary',
    title: 'Patrick Travel Services',
    description: 'Immigration Management Platform',
  },
  // PERFORMANCE: Add robots for SEO
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* CRITICAL: Clear service workers BEFORE React loads (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      if (registrations.length > 0) {
                        console.warn('[DEV] Found service workers, clearing...');
                        Promise.all(registrations.map(r => r.unregister())).then(() => {
                          console.log('[DEV] Service workers cleared');
                        });
                      }
                    });
                  }
                  if ('caches' in window) {
                    caches.keys().then(function(names) {
                      if (names.length > 0) {
                        console.warn('[DEV] Found caches, clearing...');
                        Promise.all(names.map(name => caches.delete(name))).then(() => {
                          console.log('[DEV] Caches cleared');
                        });
                      }
                    });
                  }
                })();
              `,
            }}
          />
        )}
        {/* PERFORMANCE: Resource hints for faster loading */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* PERFORMANCE: Web Vitals monitoring */}
        <WebVitals />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
