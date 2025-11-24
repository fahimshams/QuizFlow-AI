/**
 * Analytics Service
 *
 * Provides analytics data for admin dashboard:
 * - User statistics
 * - Usage statistics
 * - Revenue statistics
 * - Cost calculations
 */

import { prisma } from '@/config/database.js';
import { logger } from '@/config/logger.js';
import { SubscriptionPlan } from '@prisma/client';
import Stripe from 'stripe';
import { env } from '@/config/env.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

interface AnalyticsData {
  users: {
    total: number;
    free: number;
    pro: number;
    active: number;
    newThisMonth: number;
    growth: number; // percentage
  };
  usage: {
    totalQuizzes: number;
    totalUploads: number;
    quizzesThisMonth: number;
    uploadsThisMonth: number;
    averageQuestionsPerQuiz: number;
  };
  revenue: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    activeSubscriptions: number;
    churnRate: number; // percentage
  };
  costs: {
    estimatedOpenAICost: number;
    stripeFees: number;
    totalCost: number;
  };
  trends: {
    userGrowth: Array<{ date: string; count: number }>;
    quizGeneration: Array<{ date: string; count: number }>;
    revenue: Array<{ date: string; amount: number }>;
  };
}

/**
 * Get comprehensive analytics data
 */
export const getAnalytics = async (): Promise<AnalyticsData> => {
  try {
    // Get date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // User statistics
    const totalUsers = await prisma.user.count();
    const freeUsers = await prisma.user.count({
      where: { plan: SubscriptionPlan.FREE },
    });
    const proUsersCount = await prisma.user.count({
      where: { plan: SubscriptionPlan.PRO },
    });
    const activeUsers = await prisma.user.count({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });
    const newUsersThisMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });
    const newUsersLastMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    });
    const userGrowth = newUsersLastMonth > 0
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
      : newUsersThisMonth > 0 ? 100 : 0;

    // Usage statistics
    const totalQuizzes = await prisma.quiz.count();
    const totalUploads = await prisma.fileUpload.count();
    const quizzesThisMonth = await prisma.quiz.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });
    const uploadsThisMonth = await prisma.fileUpload.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Calculate average questions per quiz
    const allQuizzes = await prisma.quiz.findMany({
      select: { questionCount: true },
    });
    const averageQuestionsPerQuiz =
      allQuizzes.length > 0
        ? allQuizzes.reduce((sum, q) => sum + q.questionCount, 0) /
          allQuizzes.length
        : 0;

    // Revenue statistics - Get real data from Stripe
    const activeProUsers = await prisma.user.findMany({
      where: {
        plan: SubscriptionPlan.PRO,
        subscriptionStatus: 'active',
        stripeSubscriptionId: { not: null },
      },
      select: {
        stripeSubscriptionId: true,
      },
    });

    let monthlyRecurringRevenue = 0;
    let totalRevenue = 0;
    let actualStripeFees = 0;

    // Get actual subscription data from Stripe
    for (const user of activeProUsers) {
      if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(
            user.stripeSubscriptionId,
            { expand: ['items.data.price'] }
          );

          // Get the price amount (in cents, convert to dollars)
          const priceAmount = subscription.items.data[0]?.price?.unit_amount || 0;
          const monthlyPrice = priceAmount / 100;
          monthlyRecurringRevenue += monthlyPrice;

          // Get actual Stripe fees from invoices
          const invoices = await stripe.invoices.list({
            subscription: user.stripeSubscriptionId,
            limit: 12, // Last 12 months
          });

          invoices.data.forEach((invoice) => {
            if (invoice.status === 'paid') {
              totalRevenue += invoice.amount_paid / 100; // Convert cents to dollars
              // Stripe fee is typically 2.9% + $0.30, but we can get actual fees
              if (invoice.application_fee_amount) {
                actualStripeFees += invoice.application_fee_amount / 100;
              } else {
                // Estimate if not available
                const estimatedFee = (invoice.amount_paid / 100) * 0.029 + 0.3;
                actualStripeFees += estimatedFee;
              }
            }
          });
        } catch (error) {
          logger.warn('Failed to fetch Stripe subscription', {
            subscriptionId: user.stripeSubscriptionId,
            error,
          });
        }
      }
    }

    const activeSubscriptions = activeProUsers.length;

    // If no Stripe data, fall back to estimate
    if (monthlyRecurringRevenue === 0 && activeSubscriptions > 0) {
      // Try to get price from environment variable
      try {
        const price = await stripe.prices.retrieve(env.STRIPE_PRO_PRICE_ID);
        const monthlyPrice = (price.unit_amount || 0) / 100;
        monthlyRecurringRevenue = activeSubscriptions * monthlyPrice;
      } catch (error) {
        logger.warn('Failed to fetch Stripe price, using estimate', error);
        // Fallback estimate
        monthlyRecurringRevenue = activeSubscriptions * 10;
      }
    }

    // Calculate churn rate (users who canceled this month)
    const canceledThisMonth = await prisma.user.count({
      where: {
        subscriptionStatus: 'canceled',
        updatedAt: {
          gte: startOfMonth,
        },
      },
    });
    const churnRate =
      activeSubscriptions > 0
        ? (canceledThisMonth / activeSubscriptions) * 100
        : 0;

    // Cost calculations
    // Estimate OpenAI costs
    // GPT-4o-mini pricing: ~$0.15 per 1M input tokens, $0.60 per 1M output tokens
    // Average quiz generation uses ~2000 input tokens and ~1500 output tokens
    const avgInputTokens = 2000;
    const avgOutputTokens = 1500;
    const inputCostPerQuiz = (avgInputTokens / 1_000_000) * 0.15;
    const outputCostPerQuiz = (avgOutputTokens / 1_000_000) * 0.6;
    const costPerQuiz = inputCostPerQuiz + outputCostPerQuiz;
    const estimatedOpenAICost = totalQuizzes * costPerQuiz;

    // Use actual Stripe fees if available, otherwise estimate
    const stripeFees = actualStripeFees > 0
      ? actualStripeFees
      : monthlyRecurringRevenue * 0.029 + (activeSubscriptions * 0.3);

    const totalCost = estimatedOpenAICost + stripeFees;

    // Trends data (last 30 days)
    const trends = await getTrendsData(30);

    return {
      users: {
        total: totalUsers,
        free: freeUsers,
        pro: proUsersCount,
        active: activeUsers,
        newThisMonth: newUsersThisMonth,
        growth: Math.round(userGrowth * 100) / 100,
      },
      usage: {
        totalQuizzes,
        totalUploads,
        quizzesThisMonth,
        uploadsThisMonth,
        averageQuestionsPerQuiz: Math.round(averageQuestionsPerQuiz * 100) / 100,
      },
      revenue: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        monthlyRecurringRevenue: Math.round(monthlyRecurringRevenue * 100) / 100,
        activeSubscriptions,
        churnRate: Math.round(churnRate * 100) / 100,
      },
      costs: {
        estimatedOpenAICost: Math.round(estimatedOpenAICost * 100) / 100,
        stripeFees: Math.round(stripeFees * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
      },
      trends,
    };
  } catch (error) {
    logger.error('Error fetching analytics', error);
    throw error;
  }
};

/**
 * Get trends data for charts
 */
async function getTrendsData(days: number) {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // User growth trend
  const users = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
    },
    select: {
      createdAt: true,
    },
  });

  // Quiz generation trend
  const quizzes = await prisma.quiz.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
    },
    select: {
      createdAt: true,
    },
  });

  // Group by date
  const userGrowthMap = new Map<string, number>();
  const quizGenerationMap = new Map<string, number>();
  const revenueMap = new Map<string, number>();

  // Initialize all dates with 0
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    userGrowthMap.set(dateStr, 0);
    quizGenerationMap.set(dateStr, 0);
    revenueMap.set(dateStr, 0);
  }

  // Count users per day
  users.forEach((user) => {
    const dateStr = user.createdAt.toISOString().split('T')[0];
    userGrowthMap.set(
      dateStr,
      (userGrowthMap.get(dateStr) || 0) + 1
    );
  });

  // Count quizzes per day
  quizzes.forEach((quiz) => {
    const dateStr = quiz.createdAt.toISOString().split('T')[0];
    quizGenerationMap.set(
      dateStr,
      (quizGenerationMap.get(dateStr) || 0) + 1
    );
  });

    // Calculate revenue per day (estimate)
    // Get actual price from Stripe if possible
    let PRO_MONTHLY_PRICE = 10; // Default fallback
    try {
      const price = await stripe.prices.retrieve(env.STRIPE_PRO_PRICE_ID);
      PRO_MONTHLY_PRICE = (price.unit_amount || 1000) / 100;
    } catch (error) {
      // Use default if Stripe call fails
    }

    const proUsersForTrends = await prisma.user.findMany({
      where: {
        plan: SubscriptionPlan.PRO,
        subscriptionStatus: 'active',
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    proUsersForTrends.forEach((user) => {
    const dateStr = user.createdAt.toISOString().split('T')[0];
    revenueMap.set(
      dateStr,
      (revenueMap.get(dateStr) || 0) + PRO_MONTHLY_PRICE
    );
  });

  // Convert maps to arrays
  const userGrowth = Array.from(userGrowthMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const quizGeneration = Array.from(quizGenerationMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const revenue = Array.from(revenueMap.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    userGrowth,
    quizGeneration,
    revenue,
  };
}

