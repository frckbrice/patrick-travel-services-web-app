// Utility helper functions

// Generate unique reference number
export const generateReferenceNumber = (): string => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `PTS-${timestamp}-${randomStr}`.toUpperCase();
};

// Format date to readable string
export const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

// Format date with time
export const formatDateTime = (date: Date | string): string => {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param text - The text to escape
 * @returns The escaped text safe for HTML insertion
 * @example
 * escapeHtml('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
 */
export const escapeHtml = (text: string): string => {
    const htmlEscapeMap: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };
    return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
};

/**
 * @deprecated Use escapeHtml instead
 * Alias for backward compatibility
 */
export const sanitizeInput = escapeHtml;

// Validate UUID
export const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

/**
 * Safely generates initials from a name string.
 * Handles edge cases like empty strings, extra whitespace, and undefined values.
 * @param name - The full name string to generate initials from (e.g., "John Doe")
 * @returns A string of initials (e.g., "JD" for "John Doe"), or a fallback character "?"
 * @example
 * getInitials("John Doe") // Returns "JD"
 * getInitials("  John   Doe  ") // Returns "JD"
 * getInitials("") // Returns "?"
 * getInitials("John") // Returns "J"
 */
export const getInitials = (name: string): string => {
    if (!name) return '?';

    const trimmedName = name.trim();
    if (!trimmedName) return '?';

    // Split on whitespace and filter out empty segments
    const nameParts = trimmedName.split(/\s+/).filter(part => part.length > 0);

    if (nameParts.length === 0) {
        // Fallback: try to get first non-space character
        const firstChar = trimmedName.replace(/\s/g, '')[0];
        return firstChar ? firstChar.toUpperCase() : '?';
    }

    // Map each segment to its first character
    const initials = nameParts
        .map(part => part[0])
        .filter(char => char)
        .join('')
        .toUpperCase();

    return initials || '?';
};

// Format file size
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

