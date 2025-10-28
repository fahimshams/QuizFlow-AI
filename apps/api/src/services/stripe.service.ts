/**
 * Stripe Service
 *
 * SUBSCRIPTION BEST PRACTICES:
 * - Use Stripe Checkout (hosted payment page)
 * - Webhooks for reliable event handling
 * - Idempotency for webhook processing
 * - Store subscription IDs for easy management
 *
 * PRODUCTION TIPS:
 * - Always verify webhook signatures
 * - Handle all webhook events (not just successful payments)
 * - Use Stripe test mode for development
 * - Implement subscription cancellation & updates
 */

import Stripe from 'stripe';
import { env } from '@/config/env.js';
import { prisma } from '@/config/database.js';
import { AppError } from '@/middleware/errorHandler.js';
import { logger } from '@/config/logger.js';
import { SubscriptionPlan } from '@prisma/client';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

/**
 * Create Stripe checkout session for Pro plan
 */
export const createCheckoutSession = async (
  userId: string,
  successUrl: string,
  cancelUrl: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Check if user already has a Pro plan
  if (user.plan === SubscriptionPlan.PRO) {
    throw new AppError(400, 'User already has a Pro subscription');
  }

  try {
    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: env.STRIPE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
      },
    });

    logger.info('Stripe checkout session created', {
      userId,
      sessionId: session.id,
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    logger.error('Stripe checkout session creation failed', error);
    throw new AppError(500, 'Failed to create checkout session');
  }
};

/**
 * Create customer portal session (for managing subscription)
 */
export const createPortalSession = async (
  userId: string,
  returnUrl: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user?.stripeCustomerId) {
    throw new AppError(400, 'No active subscription found');
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });

    return {
      url: session.url,
    };
  } catch (error) {
    logger.error('Stripe portal session creation failed', error);
    throw new AppError(500, 'Failed to create portal session');
  }
};

/**
 * Handle Stripe webhook events
 */
export const handleWebhookEvent = async (
  payload: Buffer,
  signature: string
) => {
  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    logger.error('Webhook signature verification failed', error);
    throw new AppError(400, 'Invalid webhook signature');
  }

  logger.info('Stripe webhook received', { type: event.type });

  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    default:
      logger.info('Unhandled webhook event type', { type: event.type });
  }
};

/**
 * Handle successful checkout
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;

  if (!userId) {
    logger.error('No userId in checkout session metadata');
    return;
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: SubscriptionPlan.PRO,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
      },
    });

    logger.info('User upgraded to Pro', {
      userId,
      subscriptionId: subscription.id,
    });
  } catch (error) {
    logger.error('Failed to handle checkout completed', error);
  }
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const user = await prisma.user.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!user) {
      logger.error('User not found for subscription', {
        subscriptionId: subscription.id,
      });
      return;
    }

    // Update subscription status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: subscription.status,
        // If subscription is active, ensure user is on Pro plan
        ...(subscription.status === 'active' && {
          plan: SubscriptionPlan.PRO,
        }),
      },
    });

    logger.info('Subscription updated', {
      userId: user.id,
      status: subscription.status,
    });
  } catch (error) {
    logger.error('Failed to handle subscription updated', error);
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const user = await prisma.user.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!user) {
      logger.error('User not found for subscription', {
        subscriptionId: subscription.id,
      });
      return;
    }

    // Downgrade to free plan
    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: SubscriptionPlan.FREE,
        subscriptionStatus: 'canceled',
      },
    });

    logger.info('User downgraded to Free', {
      userId: user.id,
      subscriptionId: subscription.id,
    });
  } catch (error) {
    logger.error('Failed to handle subscription deleted', error);
  }
}

/**
 * Handle payment failures
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: invoice.customer as string },
    });

    if (!user) {
      return;
    }

    // Update subscription status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'past_due',
      },
    });

    logger.warn('Payment failed for user', {
      userId: user.id,
      invoiceId: invoice.id,
    });

    // TODO: Send email notification to user
  } catch (error) {
    logger.error('Failed to handle payment failed', error);
  }
}

