/**
 * Subscription Routes
 */

import { Router, type Router as ExpressRouter } from 'express';
import express from 'express';
import * as subscriptionController from '@/controllers/subscription.controller.js';
import { authenticate } from '@/middleware/auth.js';
import { validate } from '@/middleware/validation.js';
import { z } from 'zod';

const router: ExpressRouter = Router();

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

router.post(
  '/cancel',
  authenticate,
  subscriptionController.cancelSubscription
);

// TEST ONLY - Upgrade/Downgrade without payment (for development/testing)
// TODO: Remove before production deployment
router.post(
  '/upgrade-test',
  authenticate,
  subscriptionController.upgradeToProTest
);

router.post(
  '/downgrade-test',
  authenticate,
  subscriptionController.downgradeToFreeTest
);

export default router;

