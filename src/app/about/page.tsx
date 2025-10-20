import { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AboutView } from '@/components/about/AboutView';

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Subtle Professional Background */}
      <div className="fixed inset-0 -z-10">
        {/* Base gradient layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"></div>

        {/* Subtle animated gradient orbs - Muted colors */}
        <div
          className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-slate-300/15 via-slate-200/10 to-transparent dark:from-slate-700/20 dark:via-slate-600/15 dark:to-transparent rounded-full blur-3xl opacity-30 dark:opacity-40"
          style={{ animation: 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
        ></div>

        <div
          className="absolute top-1/3 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-200/10 via-blue-200/8 to-transparent dark:from-indigo-800/15 dark:via-blue-800/10 dark:to-transparent rounded-full blur-3xl opacity-25 dark:opacity-35"
          style={{
            animation: 'pulse 10s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            animationDelay: '2s',
          }}
        ></div>

        <div
          className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-gradient-to-tl from-teal-200/10 via-cyan-200/8 to-transparent dark:from-teal-800/15 dark:via-cyan-800/10 dark:to-transparent rounded-full blur-3xl opacity-25 dark:opacity-35"
          style={{
            animation: 'pulse 12s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            animationDelay: '4s',
          }}
        ></div>

        {/* Mesh gradient overlay for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-200/5 via-transparent to-transparent dark:from-slate-800/8 dark:via-transparent dark:to-transparent"></div>
      </div>

      <Navbar />

      <main className="flex-1 w-full relative z-0">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          }
        >
          <AboutView />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
