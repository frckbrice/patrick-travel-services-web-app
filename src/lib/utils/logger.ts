// Custom logger utility for Patrick Travel Services Web Application

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

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, data?: LogData): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` | Data: ${JSON.stringify(data)}` : '';
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
      data = { message: errorOrData.message, stack: errorOrData.stack, ...additionalData };
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
