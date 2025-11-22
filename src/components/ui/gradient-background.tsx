'use client';

/**
 * Reusable gradient background component matching the /about page gradient
 * Can be used across multiple pages for consistency
 */
export function GradientBackground() {
  return (
    <div className="">
      {/* Base gradient layer - Beautiful gradient for light mode */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"></div>

      {/* Beautiful animated gradient orbs - Vibrant colors for light mode */}
      <div
        className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-blue-400/25 via-indigo-400/20 via-purple-400/15 to-transparent dark:from-slate-700/20 dark:via-slate-600/15 dark:to-transparent rounded-full blur-3xl opacity-40 dark:opacity-40"
        style={{ animation: 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
      ></div>

      <div
        className="absolute top-1/3 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-purple-300/30 via-pink-300/25 via-rose-300/20 to-transparent dark:from-indigo-800/15 dark:via-blue-800/10 dark:to-transparent rounded-full blur-3xl opacity-35 dark:opacity-35"
        style={{
          animation: 'pulse 10s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          animationDelay: '2s',
        }}
      ></div>

      <div
        className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-gradient-to-tl from-cyan-300/30 via-teal-300/25 via-emerald-300/20 to-transparent dark:from-teal-800/15 dark:via-cyan-800/10 dark:to-transparent rounded-full blur-3xl opacity-35 dark:opacity-35"
        style={{
          animation: 'pulse 12s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          animationDelay: '4s',
        }}
      ></div>

      {/* Additional beautiful accent orb */}
      <div
        className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-gradient-to-br from-violet-300/20 via-purple-300/15 to-indigo-300/10 dark:from-transparent dark:to-transparent rounded-full blur-3xl opacity-30 dark:opacity-0"
        style={{
          animation: 'pulse 14s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          animationDelay: '1s',
        }}
      ></div>

      {/* Mesh gradient overlay for depth - Enhanced for light mode */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-200/10 via-purple-200/8 via-pink-200/5 to-transparent dark:from-slate-800/8 dark:via-transparent dark:to-transparent"></div>
    </div>
  );
}
