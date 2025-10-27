// Custom logger utility for Patrick Travel Services Web Application

import { hashPII } from './pii-hash';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

type LogDataValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | LogDataValue[]
  | { [key: string]: LogDataValue };

interface LogData {
  [key: string]: LogDataValue;
}

// Fields that typically contain PII and should be automatically hashed
const PII_FIELDS = [
  'email',
  'uid',
  'userId',
  'user_id',
  'userEmail',
  'user_email',
  'recipientEmail',
  'recipient_email',
  'senderEmail',
  'sender_email',
  'phone',
  'phoneNumber',
  'phone_number',
  'name',
  'firstName',
  'first_name',
  'lastName',
  'last_name',
  'fullName',
  'full_name',
  'clientName',
  'client_name',
  'participantName',
  'participant_name',
  'senderName',
  'sender_name',
  'recipientName',
  'recipient_name',
  'message',
  'content',
  'address',
  'zipCode',
  'zip_code',
  'postalCode',
  'postal_code',
  'ssn',
  'passport',
  'token',
  'authToken',
  'accessToken',
  'refreshToken',
  'password',
];

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Recursively sanitize PII from log data
   * Automatically hashes any field that matches PII field names
   */
  private sanitizeData(data: LogDataValue): LogDataValue {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item));
    }

    if (typeof data === 'object') {
      const sanitized: { [key: string]: LogDataValue } = {};
      for (const [key, value] of Object.entries(data)) {
        // Check if this field name matches a PII field (case-insensitive)
        const isPIIField = PII_FIELDS.some(
          (piiField) => key.toLowerCase() === piiField.toLowerCase()
        );

        if (isPIIField && typeof value === 'string') {
          // Hash the PII value
          sanitized[key] = hashPII(value);
        } else if (typeof value === 'object' && value !== null) {
          // Recursively sanitize nested objects
          sanitized[key] = this.sanitizeData(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }

    return data;
  }

  private formatMessage(level: LogLevel, message: string, data?: LogData): string {
    const timestamp = new Date().toISOString();
    const sanitizedData = data ? this.sanitizeData(data) : undefined;
    const dataStr = sanitizedData ? ` | Data: ${JSON.stringify(sanitizedData)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
  }

  info(message: string, data?: LogData): void {
    // Only log info messages in development
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage('info', message, data);
      console.log(formattedMessage);
    }
  }

  warn(message: string, errorOrData?: Error | unknown | LogData): void {
    let data: LogData = {};

    if (errorOrData instanceof Error) {
      data = { message: errorOrData.message, stack: errorOrData.stack };
    } else if (errorOrData && typeof errorOrData === 'object') {
      data = errorOrData as LogData;
    }

    const formattedMessage = this.formatMessage('warn', message, data);
    console.warn(formattedMessage);
  }

  error(message: string, errorOrData?: Error | unknown | LogData, additionalData?: LogData): void {
    let data: LogData = { ...additionalData };

    if (errorOrData instanceof Error) {
      // Don't include stack in production, sanitize message
      const errorMessage = errorOrData.message;
      data = {
        message: errorMessage.length > 100 ? `${errorMessage.substring(0, 100)}...` : errorMessage,
        stack: this.isDevelopment ? errorOrData.stack : '[REDACTED]',
        ...additionalData,
      };
    } else if (errorOrData && typeof errorOrData === 'object') {
      data = { ...(errorOrData as LogData), ...additionalData };
    } else if (errorOrData !== undefined) {
      data = { error: String(errorOrData), ...additionalData };
    }

    const formattedMessage = this.formatMessage('error', message, data);
    console.error(formattedMessage);
  }

  debug(message: string, data?: LogData): void {
    // Only log debug messages in development
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage('debug', message, data);
      console.debug(formattedMessage);
    }
  }
}

export const logger = new Logger();
