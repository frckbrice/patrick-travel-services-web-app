import { memo } from 'react';
import { cn } from '@/lib/utils';

/**
 * SimpleSkeleton - Optimized skeleton loader for better Core Web Vitals
 *
 * PERFORMANCE OPTIMIZATIONS:
 * 1. Reduced animation complexity (opacity-only, no transform) for better CLS
 * 2. Memoized to prevent unnecessary re-renders (better TBT)
 * 3. Simpler DOM structure (single div) for faster FCP
 * 4. will-change hint for optimized compositor usage
 * 5. Reduced animation duration for perceived faster loading (Speed Index)
 */
export const SimpleSkeleton = memo(function SimpleSkeleton({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="simple-skeleton"
      className={cn(
        'bg-muted/50 rounded',
        // Optimized animation: opacity-only (no transform for better CLS)
        'animate-[pulse_1.5s_ease-in-out_infinite]',
        // Performance hint for browser compositor
        'will-change-[opacity]',
        className
      )}
      aria-busy="true"
      aria-live="polite"
      {...props}
    />
  );
});

/**
 * SkeletonText - Ultra-minimal text skeleton
 * Pre-defined heights for common text sizes to reduce custom styling
 */
export const SkeletonText = memo(function SkeletonText({
  size = 'md',
  className,
  ...props
}: React.ComponentProps<'div'> & { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeClasses = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-6',
    xl: 'h-8',
  };

  return <SimpleSkeleton className={cn(sizeClasses[size], 'w-full', className)} {...props} />;
});

/**
 * SkeletonCard - Minimal card skeleton
 * Reduces 10-15 DOM elements to just 3-4
 */
export const SkeletonCard = memo(function SkeletonCard({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn('border rounded-lg p-6 space-y-3', 'bg-card', className)} {...props}>
      <SkeletonText size="lg" className="w-2/3" />
      <SkeletonText size="md" className="w-full" />
      <SkeletonText size="md" className="w-4/5" />
    </div>
  );
});
