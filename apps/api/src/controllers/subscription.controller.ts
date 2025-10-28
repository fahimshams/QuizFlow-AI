/**
 * Subscription Controller
 */

import { Request, Response } from 'express';
import { asyncHandler, AppError } from '@/middleware/errorHandler.js';
import * as stripeService from '@/services/stripe.service.js';
import { logger } from '@/config/logger.js';

/**
 * POST /api/subscription/checkout
 * Create Stripe checkout session
 */
export const createCheckout = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    const { successUrl, cancelUrl } = req.body;

    logger.info('Creating checkout session', { userId: req.user.id });

    const result = await stripeService.createCheckoutSession(
      req.user.id,
      successUrl,
      cancelUrl
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  }
);

/**
 * POST /api/subscription/portal
 * Create customer portal session
 */
export const createPortal = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    const { returnUrl } = req.body;

    const result = await stripeService.createPortalSession(
      req.user.id,
      returnUrl
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  }
);

/**
 * POST /api/subscription/webhook
 * Handle Stripe webhooks
 */
export const handleWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      throw new AppError(400, 'Missing stripe signature');
    }

    // req.body should be raw buffer (handled by express.raw())
    await stripeService.handleWebhookEvent(req.body, signature);

    res.status(200).json({ received: true });
  }
);

