/**
 * Authentication Routes
 *
 * ROUTING PATTERN:
 * - Clean route definitions
 * - Middleware chain (validation → auth → controller)
 * - Easy to understand API structure
 */

import { Router } from 'express';
import * as authController from '@/controllers/auth.controller.js';
import { validate, commonSchemas } from '@/middleware/validation.js';
import { authenticate } from '@/middleware/auth.js';
import { authLimiter } from '@/middleware/rateLimiter.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const registerSchema = {
  body: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    name: z.string().min(2, 'Name must be at least 2 characters'),
  }),
};

const loginSchema = {
  body: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'Password is required'),
  }),
};

const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
};

// Routes
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login
);

router.post(
  '/refresh',
  validate(refreshSchema),
  authController.refresh
);

router.post(
  '/logout',
  authenticate,
  validate(refreshSchema),
  authController.logout
);

router.get(
  '/me',
  authenticate,
  authController.getProfile
);

export default router;

