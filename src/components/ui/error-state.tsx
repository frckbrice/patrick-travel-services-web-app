'use client';

/**
 * Reusable Error State Component
 * Based on existing error pages pattern but made flexible for inline use
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, AlertCircle, RefreshCw, ArrowLeft, Home, LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  /** Error icon to display */
  icon?: LucideIcon;
  /** Main title/heading */
  title?: string;
  /** Description text */
  description?: string;
  /** Show retry button */
  showRetry?: boolean;
  /** Retry button callback */
  onRetry?: () => void;
  /** Retry button text */
  retryText?: string;
  /** Show back button */
  showBack?: boolean;
  /** Back button callback (defaults to window.history.back) */
  onBack?: () => void;
  /** Back button text */
  backText?: string;
  /** Show home button */
  showHome?: boolean;
  /** Home button URL */
  homeUrl?: string;
  /** Home button text */
  homeText?: string;
  /** Additional custom actions */
  customActions?: React.ReactNode;
  /** Full screen mode (takes full viewport) */
  fullScreen?: boolean;
  /** Icon color class */
  iconColor?: string;
  /** Background color class */
  bgColor?: string;
  /** Border color class */
  borderColor?: string;
  /** Additional className for the container */
  className?: string;
  /** Show error details in development */
  errorDetails?: string;
  /** Variant: 'error' | 'not-found' | 'forbidden' */
  variant?: 'error' | 'not-found' | 'forbidden';
}

export function ErrorState({
  icon: Icon,
  title,
  description,
  showRetry = true,
  onRetry,
  retryText = 'Try Again',
  showBack = true,
  onBack,
  backText = 'Go Back',
  showHome = false,
  homeUrl = '/dashboard',
  homeText = 'Go to Dashboard',
  customActions,
  fullScreen = false,
  iconColor,
  bgColor,
  borderColor,
  className,
  errorDetails,
  variant = 'error',
}: ErrorStateProps) {
  // Set defaults based on variant
  const defaultIcon = variant === 'not-found' ? AlertCircle : AlertTriangle;
  const defaultTitle =
    variant === 'not-found'
      ? 'Not Found'
      : variant === 'forbidden'
        ? 'Access Denied'
        : 'Something Went Wrong';
  const defaultDescription =
    variant === 'not-found'
      ? "The resource you're looking for doesn't exist or you don't have permission to access it."
      : variant === 'forbidden'
        ? "You don't have permission to access this resource."
        : 'An unexpected error occurred. Please try again.';
  const defaultIconColor =
    variant === 'not-found'
      ? 'text-orange-600 dark:text-orange-400'
      : 'text-red-600 dark:text-red-400';
  const defaultBgColor =
    variant === 'not-found' ? 'bg-orange-50 dark:bg-orange-900/30' : 'bg-red-50 dark:bg-red-900/30';
  const defaultBorderColor =
    variant === 'not-found'
      ? 'border-orange-200 dark:border-orange-800'
      : 'border-red-200 dark:border-red-800';

  const FinalIcon = Icon || defaultIcon;
  const finalIconColor = iconColor || defaultIconColor;
  const finalBgColor = bgColor || defaultBgColor;
  const finalBorderColor = borderColor || defaultBorderColor;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  const containerClasses = cn(
    'flex items-center justify-center p-4',
    fullScreen
      ? 'min-h-screen bg-gradient-to-br from-background via-background to-muted/30'
      : 'min-h-[60vh]',
    className
  );

  return (
    <div className={containerClasses}>
      <Card className={cn('w-full max-w-2xl', finalBorderColor)}>
        <CardContent className="pt-12 pb-12">
          <div className="text-center space-y-6">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div
                  className={cn(
                    'absolute inset-0 rounded-full blur-xl animate-pulse',
                    finalBgColor
                  )}
                />
                <div className={cn('relative p-6 rounded-full', finalBgColor)}>
                  <FinalIcon className={cn('h-16 w-16', finalIconColor)} />
                </div>
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">{title || defaultTitle}</h2>
              <p className="text-muted-foreground max-w-md mx-auto px-4">
                {description || defaultDescription}
              </p>
            </div>

            {/* Error Details (development only) */}
            {errorDetails && process.env.NODE_ENV === 'development' && (
              <div className="bg-muted/50 border border-destructive/20 rounded-lg p-4 text-left max-w-xl mx-auto">
                <p className="text-xs font-mono text-destructive break-all">{errorDetails}</p>
              </div>
            )}

            {/* Actions */}
            {(showRetry || showBack || showHome || customActions) && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                {showRetry && onRetry && (
                  <Button onClick={onRetry} variant="default">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {retryText}
                  </Button>
                )}
                {showBack && (
                  <Button onClick={handleBack} variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {backText}
                  </Button>
                )}
                {showHome && (
                  <Button asChild variant="outline">
                    <Link href={homeUrl}>
                      <Home className="mr-2 h-4 w-4" />
                      {homeText}
                    </Link>
                  </Button>
                )}
                {customActions}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
