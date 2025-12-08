export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  stack?: string;
}

class Logger {
  private level: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = import.meta.env.DEV
      ? LogLevel.DEBUG
      : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      stack: error?.stack
    };
  }

  private log(entry: LogEntry): void {
    // Store log
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with colors
    const prefix = `[${entry.timestamp}] [${LogLevel[entry.level]}]`;
    const contextStr = entry.context
      ? `\n${JSON.stringify(entry.context, null, 2)}`
      : '';
    const stackStr = entry.stack ? `\n${entry.stack}` : '';

    const styles = {
      [LogLevel.DEBUG]: 'color: #6B7280',
      [LogLevel.INFO]: 'color: #3B82F6',
      [LogLevel.WARN]: 'color: #F59E0B',
      [LogLevel.ERROR]: 'color: #EF4444; font-weight: bold'
    };

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`%c${prefix}`, styles[LogLevel.DEBUG], entry.message, contextStr);
        break;
      case LogLevel.INFO:
        console.info(`%c${prefix}`, styles[LogLevel.INFO], entry.message, contextStr);
        break;
      case LogLevel.WARN:
        console.warn(`%c${prefix}`, styles[LogLevel.WARN], entry.message, contextStr);
        break;
      case LogLevel.ERROR:
        console.error(`%c${prefix}`, styles[LogLevel.ERROR], entry.message, contextStr, stackStr);
        break;
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log(this.createEntry(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log(this.createEntry(LogLevel.INFO, message, context));
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log(this.createEntry(LogLevel.WARN, message, context));
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.log(this.createEntry(LogLevel.ERROR, message, context, error));
    }
  }

  /**
   * Get all logs or filter by level
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter((log) => log.level === level);
    }
    return this.logs;
  }

  /**
   * Clear all stored logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON string
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Download logs as file
   */
  downloadLogs(filename: string = `principle-logs-${Date.now()}.json`): void {
    const blob = new Blob([this.exportLogs()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const logger = new Logger();
