/**
 * Time formatting utilities for consistent date/time display across the application
 */

/**
 * Formats a date string into a human-readable relative time
 * @param date - The date string to format
 * @param isMounted - Whether the component is mounted (to avoid hydration mismatch)
 * @param t - Translation function for i18n
 * @param i18n - i18n instance for language detection
 * @returns Formatted time string
 */
export const formatTime = (
  date: string,
  isMounted: boolean,
  t: (key: string) => string,
  i18n: { language: string }
) => {
  // Avoid hydration mismatch - don't render time on server
  if (!isMounted) return '';

  const d = new Date(date);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - d.getTime()) / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 1) return t('messages.justNow') || 'Just now';
  if (diffHours < 24)
    return d.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });
  if (diffHours < 48) return t('messages.yesterday') || 'Yesterday';
  return d.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' });
};

/**
 * Formats a date string into a short relative time (e.g., "2h ago", "3d ago")
 * @param date - The date string to format
 * @param isMounted - Whether the component is mounted
 * @param t - Translation function for i18n
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (
  date: string,
  isMounted: boolean,
  t: (key: string) => string
) => {
  if (!isMounted) return '';

  const d = new Date(date);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - d.getTime()) / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return t('messages.justNow') || 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
};

/**
 * Formats a date string into a full date and time
 * @param date - The date string to format
 * @param isMounted - Whether the component is mounted
 * @param i18n - i18n instance for language detection
 * @returns Formatted date and time string
 */
export const formatFullDateTime = (
  date: string,
  isMounted: boolean,
  i18n: { language: string }
) => {
  if (!isMounted) return '';

  const d = new Date(date);
  return d.toLocaleString(i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
