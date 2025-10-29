/**
 * Global Error Handler Middleware
 *
 * WHY THIS IS IMPORTANT:
 * - Centralized error handling
 * - Consistent error responses
 * - Prevents app crashes
 * - Logs errors properly
 * - Never exposes sensitive info in production
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger.js';
import { env } from '@/config/env.js';
import type { APIError } from '@quizflow/types';

/**
 * Custom API Error Class
 * Allows us to throw errors with status codes
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Global error handler
 * Catches all errors thrown in routes/controllers
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Default to 500 Internal Server Error
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = false;

  // If it's our custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }

  // Log error
  logger.error('Error occurred:', {
    statusCode,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Construct error response
  const errorResponse: APIError = {
    error: err.name || 'Error',
    message: isOperational ? message : 'Something went wrong',
    statusCode,
    ...(env.NODE_ENV === 'development' && { details: err.stack }),
  };

  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * Async handler wrapper
 * Eliminates need for try-catch in every async route
 *
 * Usage:
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await getUsersFromDB();
 *   res.json(users);
 * }));
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

