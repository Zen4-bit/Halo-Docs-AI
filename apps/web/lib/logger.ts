/**
 * Logger utility for HALO Docs AI
 * Provides structured logging with different levels and contexts
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  [key: string]: any;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  timestamp?: string;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  timestamp: string;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private constructor() {
    // Set log level based on environment
    this.logLevel = this.getLogLevelFromEnv();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private getLogLevelFromEnv(): LogLevel {
    if (typeof window === 'undefined') {
      // Server-side
      return process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
    }
    
    // Client-side
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem) {
        const savedLevel = localStorage.getItem('log_level');
        if (savedLevel) {
          return parseInt(savedLevel) as LogLevel;
        }
      }
    } catch (error) {
      // localStorage not available (e.g., in test environment)
      console.warn('[HALO] localStorage not available for log level setting', error);
    }
    
    return process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.WARN;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
      timestamp: new Date().toISOString(),
    };
    
    if (error) {
      entry.error = error;
    }
    
    return entry;
  }

  private addToLogs(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }
  }

  private formatLogMessage(entry: LogEntry): string {
    const levelName = LogLevel[entry.level];
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const errorStr = entry.error ? ` Error: ${entry.error.message}` : '';
    return `[${entry.timestamp}] [${levelName}] ${entry.message}${contextStr}${errorStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.addToLogs(entry);
    
    if (typeof console !== 'undefined') {
      console.debug(`[HALO] ${this.formatLogMessage(entry)}`);
    }
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.addToLogs(entry);
    
    if (typeof console !== 'undefined') {
      console.info(`[HALO] ${this.formatLogMessage(entry)}`);
    }
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = this.createLogEntry(LogLevel.WARN, message, context, error);
    this.addToLogs(entry);
    
    if (typeof console !== 'undefined') {
      console.warn(`[HALO] ${this.formatLogMessage(entry)}`);
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.addToLogs(entry);
    
    if (typeof console !== 'undefined') {
      console.error(`[HALO] ${this.formatLogMessage(entry)}`);
    }
    
    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      this.sendToErrorTracking(entry);
    }
  }

  private sendToErrorTracking(entry: LogEntry): void {
    // Placeholder for error tracking service integration
    // Could integrate with Sentry, LogRocket, etc.
    try {
      // Example: Sentry.captureException(entry.error, { extra: entry.context });
      console.log('[HALO] Error tracking placeholder:', entry);
    } catch (trackingError) {
      console.error('[HALO] Failed to send error to tracking service:', trackingError);
    }
  }

  getLogs(level?: LogLevel, limit = 100): LogEntry[] {
    let filteredLogs = this.logs;
    if (level !== undefined) {
      filteredLogs = this.logs.filter(entry => entry.level >= level);
    }
    return filteredLogs.slice(-limit);
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    try {
      if (typeof localStorage !== 'undefined' && localStorage.setItem) {
        localStorage.setItem('log_level', level.toString());
      }
    } catch (error) {
      // localStorage not available (e.g., in test environment)
      console.warn('[HALO] localStorage not available for log level setting', error);
    }
  }
}

// Convenience functions for easy importing
export const logger = Logger.getInstance();

export function logComponentError(
  componentName: string,
  error: Error,
  additionalContext?: LogContext
): void {
  logger.error(`Component error in ${componentName}`, error, {
    component: componentName,
    ...additionalContext,
  });
}

export function logAPIError(
  endpoint: string,
  method: string,
  status: number,
  error?: Error,
  additionalContext?: LogContext
): void {
  logger.error(`API error: ${method} ${endpoint} (${status})`, error, {
    endpoint,
    method,
    status,
    ...additionalContext,
  });
}

export function logPerformance(
  metric: string,
  duration: number,
  additionalContext?: LogContext
): void {
  logger.info(`Performance: ${metric} took ${duration}ms`, {
    metric,
    duration,
    ...additionalContext,
  });
}

export function logUserAction(
  action: string,
  additionalContext?: LogContext
): void {
  logger.info(`User action: ${action}`, {
    action,
    ...additionalContext,
  });
}