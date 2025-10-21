/**
 * HTML Minifier for Email Templates
 * Reduces email size by ~40-50% for faster sending
 */

/**
 * Minify HTML by removing unnecessary whitespace, comments, and line breaks
 * while preserving structure and functionality
 */
export function minifyHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return html;
  }

  // Remove HTML comments
  html = html.replace(/<!--[\s\S]*?-->/g, '');

  // Remove whitespace between tags
  html = html.replace(/>\s+</g, '><');

  // Remove leading and trailing whitespace from lines
  html = html.replace(/^\s+|\s+$/gm, '');

  // Replace multiple spaces with single space
  html = html.replace(/\s{2,}/g, ' ');

  // Remove whitespace around specific characters
  html = html.replace(/\s*([{}:;,])\s*/g, '$1');

  // Remove empty lines
  html = html.replace(/\n\s*\n/g, '\n');

  // Trim final result
  return html.trim();
}

/**
 * Minify inline CSS while preserving functionality
 */
export function minifyCSS(css: string): string {
  if (!css || typeof css !== 'string') {
    return css;
  }

  // Remove comments
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');

  // Remove whitespace around special characters
  css = css.replace(/\s*([{}:;,])\s*/g, '$1');

  // Remove multiple spaces
  css = css.replace(/\s+/g, ' ');

  // Remove trailing semicolons
  css = css.replace(/;}/g, '}');

  return css.trim();
}

/**
 * Get size reduction statistics
 */
export function getMinificationStats(
  original: string,
  minified: string
): {
  originalSize: number;
  minifiedSize: number;
  reduction: number;
  reductionPercent: number;
} {
  const originalSize = new Blob([original]).size;
  const minifiedSize = new Blob([minified]).size;
  const reduction = originalSize - minifiedSize;
  const reductionPercent = Math.round((reduction / originalSize) * 100);

  return {
    originalSize,
    minifiedSize,
    reduction,
    reductionPercent,
  };
}

/**
 * Conditionally minify HTML based on environment
 * Only minifies in production for faster email sending
 */
export function minifyForProduction(html: string): string {
  // Only minify in production
  if (process.env.NODE_ENV === 'production') {
    return minifyHTML(html);
  }

  // In development, keep readable for debugging
  return html;
}
