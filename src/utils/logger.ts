import { CONFIG } from '../config/index.js';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private level: LogLevel;

  constructor() {
    this.level = this.getLogLevel(CONFIG.LOG_LEVEL);
  }

  private getLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : '';
    
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs}`;
  }

  private log(level: LogLevel, levelName: string, message: string, ...args: any[]): void {
    if (this.level >= level) {
      console.log(this.formatMessage(levelName, message, ...args));
    }
  }

  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, 'error', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, 'warn', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, 'info', message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, 'debug', message, ...args);
  }
}

export const logger = new Logger();