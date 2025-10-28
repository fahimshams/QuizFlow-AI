/**
 * Subscription Routes
 */

import { Router } from 'express';
import express from 'express';
import * as subscriptionController from '@/controllers/subscription.controller.js';
import { authenticate } from '@/middleware/auth.js';
import { validate } from '@/middleware/validation.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const checkoutSchema = {
  body: z.object({
    successUrl: z.string().url('Invalid success URL'),
    cancelUrl: z.string().url('Invalid cancel URL'),
  }),
};

const portalSchema = {
  body: z.object({
    returnUrl: z.string().url('Invalid return URL'),
  }),
};

// Webhook route (must accept raw body, no JSON parsing)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  subscriptionController.handleWebhook
);

// Protected routes
router.post(
  '/checkout',
  authenticate,
  validate(checkoutSchema),
  subscriptionController.createCheckout
);

router.post(
  '/portal',
  authenticate,
  validate(portalSchema),
  subscriptionController.createPortal
);

export default router;

