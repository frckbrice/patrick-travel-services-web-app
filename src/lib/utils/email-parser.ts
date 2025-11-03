/**
 * Email parser utility for extracting information from incoming emails
 */

interface ParsedEmail {
  from: string;
  fromName?: string;
  subject: string;
  text?: string;
  html?: string;
  threadId?: string;
  messageId?: string;
  inReplyTo?: string;
  references?: string;
}

/**
 * Extract thread ID from email headers or subject
 */
export function extractThreadId(email: ParsedEmail): string | null {
  // Priority 1: Check X-Thread-ID header
  if (email.threadId) {
    return email.threadId;
  }

  // Priority 2: Extract from In-Reply-To or References header
  const replyToHeader = email.inReplyTo || email.references || '';
  if (replyToHeader) {
    // Format: "1234567890-abc-xyz@patricktravel.com"
    const match = replyToHeader.match(/^([^-]+-[^-]+-[^@]+)@/);
    if (match) {
      return match[1];
    }
  }

  // Priority 3: Extract from subject with [Thread: xxx] format
  const subjectMatch = email.subject.match(/\[Thread:([^\]]+)\]/);
  if (subjectMatch) {
    return subjectMatch[1];
  }

  // Priority 4: Extract from reply subject
  const replyMatch = email.subject.match(/^Re:\s*(.+)/i);
  if (replyMatch) {
    // Try to find embedded thread ID in original subject
    const originalSubject = replyMatch[1];
    const embeddedMatch = originalSubject.match(/\[([A-Za-z0-9-]+-[A-Za-z0-9-]+-[A-Za-z0-9-]+)\]/);
    if (embeddedMatch) {
      return embeddedMatch[1];
    }
  }

  return null;
}

/**
 * Extract email address from string like "John Doe <john@example.com>"
 */
export function parseEmailAddress(emailString: string): { email: string; name?: string } {
  const match = emailString.match(/(?:([^<]+)<)?([^>]+)>?/);
  if (match) {
    return {
      name: match[1]?.trim(),
      email: match[2]?.trim(),
    };
  }
  return { email: emailString.trim() };
}

/**
 * Clean email content - remove quoted reply text
 */
export function cleanEmailContent(html: string): string {
  // Remove quoted sections
  return html
    .replace(/<blockquote[^>]*>[\s\S]*?<\/blockquote>/gi, '')
    .replace(/<div[^>]*class=["\']gmail_quote["\'][^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/^On .+ wrote:[\s\S]*$/m, '')
    .replace(/^>.*$/gm, '')
    .trim();
}

/**
 * Validate email structure
 */
export function validateIncomingEmail(email: any): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: 'Email data is missing' };
  }

  if (!email.from) {
    return { valid: false, error: 'From address is missing' };
  }

  if (!email.subject) {
    return { valid: false, error: 'Subject is missing' };
  }

  if (!email.text && !email.html) {
    return { valid: false, error: 'Email content is missing' };
  }

  return { valid: true };
}
