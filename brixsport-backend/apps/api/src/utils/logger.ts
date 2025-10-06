import * as winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += ` | Meta: ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      logMessage += ` | Stack: ${stack}`;
    }
    
    return logMessage;
  })
);

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    
    // Write all logs to file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Write error logs to separate file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Define the logger interface
interface Logger {
  info: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
}

// Enhanced logger implementation
const enhancedLogger: Logger = {
  info: (message: string, ...args: any[]) => {
    logger.info(message, ...args);
  },
  error: (message: string, ...args: any[]) => {
    logger.error(message, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    logger.warn(message, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    logger.debug(message, ...args);
  }
};

export { enhancedLogger as logger };
export type { Logger };