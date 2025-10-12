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

// Create the winston logger instance
const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
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

// Create and export the logger that implements the Logger interface
const logger: Logger = {
  info: (message: string, ...args: any[]) => winstonLogger.info(message, ...args),
  error: (message: string, ...args: any[]) => winstonLogger.error(message, ...args),
  warn: (message: string, ...args: any[]) => winstonLogger.warn(message, ...args),
  debug: (message: string, ...args: any[]) => winstonLogger.debug(message, ...args)
};

export { logger };
export type { Logger };