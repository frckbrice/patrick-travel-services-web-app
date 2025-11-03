// Loading UI for dashboard pages
export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="animate-pulse">
        <div className="h-8 bg-muted/80 dark:bg-muted/60 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-muted/80 dark:bg-muted/60 rounded w-1/2"></div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border rounded-lg p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-muted/80 dark:bg-muted/60 rounded w-2/3 mb-2"></div>
            <div className="h-8 bg-muted/80 dark:bg-muted/60 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-muted/80 dark:bg-muted/60 rounded w-1/3"></div>
          </div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-card border rounded-lg p-6 shadow-sm animate-pulse">
            <div className="h-6 bg-muted/80 dark:bg-muted/60 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-12 bg-muted/80 dark:bg-muted/60 rounded"></div>
              <div className="h-12 bg-muted/80 dark:bg-muted/60 rounded"></div>
              <div className="h-12 bg-muted/80 dark:bg-muted/60 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
