// Email Parser Service
// Utility functions to parse and extract information from incoming emails

/**
 * Extract thread ID from email headers
 * Priority: X-Thread-ID header > In-Reply-To > References > Subject parsing
 */
export function extractThreadIdFromHeaders(headers: {
  'X-Thread-ID'?: string;
  'In-Reply-To'?: string;
  References?: string;
  subject?: string;
}): string | null {
  // Priority 1: Check X-Thread-ID header (most reliable)
  if (headers['X-Thread-ID']) {
    return headers['X-Thread-ID'].trim();
  }

  // Priority 2: Extract from In-Reply-To header
  // Format: <threadId@patricktravel.com>
  if (headers['In-Reply-To']) {
    const inReplyTo = headers['In-Reply-To'].trim();
    const match = inReplyTo.match(/<([^@]+)@/);
    if (match && match[1]) {
      return match[1];
    }
    // If not in email format, try using the whole value
    if (!inReplyTo.includes('@')) {
      return inReplyTo;
    }
  }

  // Priority 3: Extract from References header (similar format)
  if (headers['References']) {
    const references = headers['References'].trim();
    // References can have multiple values, use the last one
    const refs = references.split(/\s+/);
    const lastRef = refs[refs.length - 1];
    const match = lastRef.match(/<([^@]+)@/);
    if (match && match[1]) {
      return match[1];
    }
    // If not in email format, try using the whole value
    if (!lastRef.includes('@')) {
      return lastRef;
    }
  }

  // Priority 4: Parse from subject line (fallback)
  // Format: "Re: [THREAD:threadId] Original Subject" or similar
  if (headers.subject) {
    // Try pattern: [THREAD:threadId]
    const threadMatch = headers.subject.match(/\[THREAD:([^\]]+)\]/i);
    if (threadMatch && threadMatch[1]) {
      return threadMatch[1].trim();
    }

    // Try pattern: [threadId] at start
    const bracketMatch = headers.subject.match(/^\[([^\]]+)\]/);
    if (bracketMatch && bracketMatch[1]) {
      return bracketMatch[1].trim();
    }
  }

  return null;
}

/**
 * Parse email content from text and HTML
 * Strips quoted/reply content and extracts clean message
 */
export function parseEmailContent(content: { text?: string; html?: string }): string {
  let cleanContent = '';

  // Prefer plain text over HTML for simplicity
  if (content.text) {
    cleanContent = content.text;
  } else if (content.html) {
    // Strip HTML tags for plain text content
    cleanContent = content.html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style tags
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]+>/g, '') // Remove all HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  if (!cleanContent) {
    return '';
  }

  // Remove quoted/reply content
  // Common patterns:
  // - Lines starting with ">"
  // - "On ... wrote:" blocks
  // - "From: ..." headers in quotes
  // - Original message separators

  const lines = cleanContent.split('\n');
  const cleanedLines: string[] = [];
  let inQuotedSection = false;
  let quoteIndicators = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines at the start
    if (cleanedLines.length === 0 && !line) {
      continue;
    }

    // Detect quoted sections
    if (
      line.startsWith('>') ||
      /^On\s+.+wrote:?$/i.test(line) ||
      /^From:\s+.+$/i.test(line) ||
      /^-----Original Message-----/i.test(line) ||
      /^________________________________/i.test(line) ||
      /^Sent from my/i.test(line) ||
      /^Get Outlook/i.test(line)
    ) {
      quoteIndicators++;
      if (quoteIndicators >= 2 || line.startsWith('>')) {
        inQuotedSection = true;
      }
    }

    // If we're in a quoted section, skip these lines
    if (inQuotedSection) {
      continue;
    }

    // Reset quote indicators if we see a blank line after some content
    if (!line && cleanedLines.length > 0) {
      quoteIndicators = 0;
    }

    cleanedLines.push(lines[i]); // Keep original line (with formatting)
  }

  // Join and clean up
  let result = cleanedLines.join('\n').trim();

  // Remove trailing separators
  result = result.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
  result = result.replace(/^\s*[-=_]{3,}\s*$/gm, ''); // Remove separator lines

  return result.trim();
}

/**
 * Extract reply subject (remove "Re:", "Fwd:", etc.)
 */
export function extractReplySubject(subject: string): string {
  return subject.replace(/^(Re:|Fwd?:|RE:|FW:|REF:|REF:)\s*/i, '').trim() || subject;
}
