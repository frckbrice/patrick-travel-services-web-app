import { memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

/**
 * Progressive UI Placeholder Components
 *
 * These components display immediately with real UI structure and placeholder values
 * instead of long skeleton screens, providing better perceived performance and UX.
 *
 * MOBILE-FIRST OPTIMIZATIONS:
 * - Instant display (no loading delay)
 * - Real UI structure (better CLS scores)
 * - Minimal re-renders (better performance)
 * - Clear visual feedback with subtle animation
 */

interface StatCardPlaceholderProps {
  title: string;
  icon: LucideIcon;
  className?: string;
  loadingText?: string;
}

/**
 * StatCardPlaceholder - Shows stat card structure immediately with placeholder value
 * Better UX than skeleton: users see the UI structure immediately
 */
export const StatCardPlaceholder = memo(function StatCardPlaceholder({
  title,
  icon: Icon,
  className,
  loadingText = 'Loading...',
}: StatCardPlaceholderProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-muted-foreground/50 animate-pulse">--</div>
        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
          {loadingText}
        </p>
      </CardContent>
    </Card>
  );
});

interface TablePlaceholderProps {
  columns: { header: string; width?: string }[];
  rows?: number;
  className?: string;
}

/**
 * TablePlaceholder - Shows table structure immediately with placeholder rows
 * Better than skeleton: users see headers and structure right away
 */
export const TablePlaceholder = memo(function TablePlaceholder({
  columns,
  rows = 5,
  className,
}: TablePlaceholderProps) {
  return (
    <div className={cn('rounded-md border', className)}>
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={cn('px-4 py-3 text-left text-sm font-medium', col.width)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-t">
              {columns.map((col, colIdx) => (
                <td key={colIdx} className="px-4 py-3">
                  <div
                    className={cn('h-4 bg-muted/30 rounded animate-pulse', col.width || 'w-full')}
                    style={{
                      animationDelay: `${rowIdx * 50}ms`,
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

interface ListItemPlaceholderProps {
  showAvatar?: boolean;
  showBadge?: boolean;
  showActions?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * ListItemPlaceholder - Shows list item structure immediately
 * Better than skeleton: shows the actual layout users will see
 */
export const ListItemPlaceholder = memo(function ListItemPlaceholder({
  showAvatar = false,
  showBadge = false,
  showActions = false,
  className,
  style,
}: ListItemPlaceholderProps) {
  return (
    <div
      className={cn('flex items-center justify-between p-4 border rounded-lg', className)}
      style={style}
    >
      <div className="flex items-center gap-3 flex-1">
        {showAvatar && <div className="h-10 w-10 rounded-full bg-muted/30 animate-pulse" />}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted/30 rounded animate-pulse w-1/3" />
          <div className="h-3 bg-muted/30 rounded animate-pulse w-1/2" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showBadge && <div className="h-6 w-20 bg-muted/30 rounded-full animate-pulse" />}
        {showActions && <div className="h-8 w-16 bg-muted/30 rounded animate-pulse" />}
      </div>
    </div>
  );
});

/**
 * CardListPlaceholder - Shows multiple placeholder list items
 */
export const CardListPlaceholder = memo(function CardListPlaceholder({
  items = 3,
  showAvatar = false,
  showBadge = false,
  showActions = false,
  className,
}: {
  items?: number;
  showAvatar?: boolean;
  showBadge?: boolean;
  showActions?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, idx) => (
        <ListItemPlaceholder
          key={idx}
          showAvatar={showAvatar}
          showBadge={showBadge}
          showActions={showActions}
          style={
            {
              animationDelay: `${idx * 100}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
});

interface EmptyStatePlaceholderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

/**
 * EmptyStatePlaceholder - Shows when data is loaded but empty
 * Clear, friendly empty state with icon
 */
export const EmptyStatePlaceholder = memo(function EmptyStatePlaceholder({
  icon: Icon,
  title,
  description,
  className,
}: EmptyStatePlaceholderProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      <Icon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium text-muted-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground/80 mt-2">{description}</p>}
    </div>
  );
});

interface CaseCardPlaceholderProps {
  className?: string;
}

/**
 * CaseCardPlaceholder - Shows placeholder for case card with full structure
 */
export const CaseCardPlaceholder = memo(function CaseCardPlaceholder({
  className,
}: CaseCardPlaceholderProps) {
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-muted/30 rounded animate-pulse" />
              <div className="h-5 w-40 bg-muted/30 rounded animate-pulse" />
            </div>
            <div className="h-4 w-32 bg-muted/30 rounded animate-pulse" />
          </div>
          <div className="h-6 w-24 bg-muted/30 rounded-full animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-4 bg-muted/30 rounded animate-pulse" />
              <div className="h-4 w-full bg-muted/30 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <div className="h-4 w-24 bg-muted/30 rounded animate-pulse" />
          <div className="h-8 w-24 bg-muted/30 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
});
