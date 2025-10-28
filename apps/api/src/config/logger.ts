/**
 * Logger Configuration
 *
 * PRODUCTION TIP: Never use console.log in production!
 * - Structured logging (JSON format)
 * - Log levels (error, warn, info, debug)
 * - Easy to parse and search in log aggregators (CloudWatch, DataDog, etc.)
 */

import winston from 'winston';
import { env } from './env.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Create logger instance
export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }), // Log error stack traces
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
  ),
  defaultMeta: { service: 'quizflow-api' },
  transports: [
    // Console output
    new winston.transports.Console({
      format: combine(
        colorize(),
        consoleFormat
      ),
    }),
    // Error logs to file in production
    ...(env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston.format.json(),
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            format: winston.format.json(),
          }),
        ]
      : []),
  ],
});

// Usage:
// logger.info('User logged in', { userId: '123' });
// logger.error('Database connection failed', { error: err });
// logger.warn('Rate limit exceeded', { ip: req.ip });

