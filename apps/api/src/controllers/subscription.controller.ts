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

/**
 * POST /api/subscription/upgrade-test
 * Test endpoint to upgrade user to Pro (for development/testing only)
 * TODO: Remove this endpoint before production deployment
 */
export const upgradeToProTest = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    const { prisma } = await import('@/config/database.js');

    // Check if user is already Pro
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (user.plan === 'PRO') {
      throw new AppError(400, 'User is already on Pro plan');
    }

    // Upgrade user to Pro
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        plan: 'PRO',
        subscriptionStatus: 'active',
      },
    });

    logger.info('User upgraded to Pro (TEST)', { userId: req.user.id });

    res.status(200).json({
      success: true,
      message: 'Successfully upgraded to Pro! 🎉',
      data: {
        plan: 'PRO',
      },
    });
  }
);

/**
 * POST /api/subscription/downgrade-test
 * Test endpoint to downgrade user to Free (for development/testing only)
 * TODO: Remove this endpoint before production deployment
 */
export const downgradeToFreeTest = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    const { prisma } = await import('@/config/database.js');

    // Downgrade user to Free
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        plan: 'FREE',
        subscriptionStatus: null,
        stripeSubscriptionId: null,
      },
    });

    logger.info('User downgraded to Free (TEST)', { userId: req.user.id });

    res.status(200).json({
      success: true,
      message: 'Downgraded to Free plan',
      data: {
        plan: 'FREE',
      },
    });
  }
);

/**
 * POST /api/subscription/cancel
 * Cancel active subscription (keeps access until period end)
 */
export const cancelSubscription = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    logger.info('Canceling subscription', { userId: req.user.id });

    const result = await stripeService.cancelSubscription(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Subscription canceled successfully. You will have access until the end of your billing period.',
      data: result,
    });
  }
);

