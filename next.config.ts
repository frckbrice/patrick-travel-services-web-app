import type { NextConfig } from 'next';
// TEMPORARILY DISABLED: PWA causing service worker issues in development
// import withPWAInit from "@ducanh2912/next-pwa";

// const withPWA = withPWAInit({
//   dest: "public",
//   cacheOnFrontEndNav: true,
//   aggressiveFrontEndNavCaching: true,
//   reloadOnOnline: true,
//   disable: process.env.NODE_ENV === "development",
//   workboxOptions: {
//     disableDevLogs: true,
//     // CRITICAL: Exclude API routes from service worker caching
//     runtimeCaching: [
//       {
//         urlPattern: /^https?:\/\/[^/]+\/api\/.*/i,
//         handler: 'NetworkOnly',
//         options: {
//           cacheName: 'api-cache',
//         },
//       },
//       {
//         urlPattern: /^https?.*\.(png|jpg|jpeg|webp|svg|gif|avif)$/i,
//         handler: 'CacheFirst',
//         options: {
//           cacheName: 'image-cache',
//           expiration: {
//             maxEntries: 64,
//             maxAgeSeconds: 24 * 60 * 60, // 24 hours
//           },
//         },
//       },
//       {
//         urlPattern: /^https?.*\.(js|css|woff|woff2|ttf|eot)$/i,
//         handler: 'StaleWhileRevalidate',
//         options: {
//           cacheName: 'static-resources',
//           expiration: {
//             maxEntries: 32,
//             maxAgeSeconds: 24 * 60 * 60, // 24 hours
//           },
//         },
//       },
//     ],
//   },
// });

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',

  // Performance Optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image Optimization
  // PNG is automatically used as fallback when AVIF/WebP not supported
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compression
  compress: true,

  // Server Actions
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: ['localhost:3000'],
    },
    // PERFORMANCE: Optimize package imports to reduce bundle size
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      '@tanstack/react-query',
      'react-hook-form',
      'zod',
      'firebase/auth',
      'firebase/database',
    ],
  },

  // PERFORMANCE: Production optimizations
  reactStrictMode: true,

  // PERFORMANCE: Reduce memory usage
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // 1 minute
    pagesBufferLength: 2,
  },

  // PERFORMANCE & SECURITY: Enhanced headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
      // PERFORMANCE: Cache static assets aggressively
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // PERFORMANCE: Cache fonts
      {
        source: '/_next/static/media/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

// TEMPORARILY DISABLED: Export nextConfig directly (no PWA wrapper)
export default nextConfig;
// export default withPWA(nextConfig);
