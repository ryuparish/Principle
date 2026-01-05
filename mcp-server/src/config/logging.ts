import * as fs from 'fs';
import * as path from 'path';

export class Logger {
  private logPath: string;

  constructor() {
    this.logPath = process.env.MCP_LOG_PATH || '/tmp/principle-mcp.log';
    // Ensure log directory exists
    const dir = path.dirname(this.logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private write(level: string, message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${level}: ${message}`;

    // Write to stderr (visible in MCP logs, doesn't interfere with JSON-RPC on stdout)
    console.error(entry);

    // Write to log file for persistence
    try {
      fs.appendFileSync(this.logPath, entry + '\n');
      if (data) {
        fs.appendFileSync(this.logPath, JSON.stringify(data, null, 2) + '\n');
      }
    } catch (err) {
      // Ignore file write errors
    }
  }

  info(message: string, data?: unknown) {
    this.write('INFO', message, data);
  }

  error(message: string, error?: Error | unknown) {
    if (error instanceof Error) {
      this.write('ERROR', message, {
        message: error.message,
        stack: error.stack
      });
    } else {
      this.write('ERROR', message, error);
    }
  }

  debug(message: string, data?: unknown) {
    if (process.env.DEBUG) {
      this.write('DEBUG', message, data);
    }
  }

  warn(message: string, data?: unknown) {
    this.write('WARN', message, data);
  }
}

export const logger = new Logger();
