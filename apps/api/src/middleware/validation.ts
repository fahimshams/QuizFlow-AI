/**
 * Request Validation Middleware
 *
 * SECURITY BEST PRACTICE:
 * - NEVER trust user input
 * - Validate everything (body, params, query)
 * - Use Zod for type-safe validation
 * - Fail fast with clear error messages
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { AppError } from './errorHandler.js';

/**
 * Validates request using Zod schema
 * Can validate body, params, or query
 */
export const validate = (schema: {
  body?: z.ZodSchema;
  params?: z.ZodSchema;
  query?: z.ZodSchema;
}) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Validate body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate params
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      // Validate query
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors nicely
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new AppError(400, 'Validation failed', true);
      }
      next(error);
    }
  };
};

/**
 * Common validation schemas
 * Reusable across the app
 */
export const commonSchemas = {
  id: z.object({
    id: z.string().min(1, 'ID is required'),
  }),

  pagination: z.object({
    page: z.string().transform(Number).pipe(z.number().int().min(1)).optional(),
    limit: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(1).max(100))
      .optional(),
  }),

  email: z.string().email('Invalid email address'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
};

