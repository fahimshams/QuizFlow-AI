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

const updateProfileSchema = {
  body: z
    .object({
      name: z.string().min(2, 'Name must be at least 2 characters').optional(),
      email: commonSchemas.email.optional(),
    })
    .refine((d) => d.name !== undefined || d.email !== undefined, {
      message: 'Provide at least one of: name, email',
    }),
};

const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: commonSchemas.password,
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

router.patch(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  authController.updateProfile
);

router.post(
  '/password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

export default router;

