import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        // Better visibility with stronger contrast
        'bg-muted/80 dark:bg-muted/60 animate-pulse rounded-md',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
