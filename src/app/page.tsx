import { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { LandingView } from '@/components/landing/LandingView';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Optimized Multi-Layer Gradient Background */}
      <div className="fixed inset-0 -z-10">
        {/* Base gradient layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"></div>

        {/* Optimized animated gradient orbs - reduced from 4 to 2, smaller sizes, lower blur */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-primary/30 via-blue-500/20 to-transparent dark:from-primary/40 dark:via-blue-600/30 dark:to-transparent rounded-full blur-xl opacity-40 dark:opacity-60 motion-safe:animate-pulse"></div>

        <div className="absolute top-1/3 left-0 w-[350px] h-[350px] bg-gradient-to-tr from-purple-500/20 via-pink-500/15 to-transparent dark:from-purple-600/30 dark:via-pink-600/20 dark:to-transparent rounded-full blur-xl opacity-30 dark:opacity-50 motion-safe:animate-pulse" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>

        {/* Mesh gradient overlay for depth - no animation */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent dark:from-primary/10 dark:via-transparent dark:to-transparent"></div>

        {/* Subtle noise texture for richness */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50 dark:to-gray-950/50"></div>
      </div>

      <Navbar />
      <main className="flex-1 w-full relative z-0">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        }>
          <LandingView />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
