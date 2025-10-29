/**
 * Application Constants
 *
 * Note: We define these locally instead of importing from @quizflow/types
 * to avoid runtime module resolution issues with TypeScript workspace packages.
 */

// Plan limits and features (by string key for runtime access)
// Keys match Prisma's SubscriptionPlan enum values
export const PLAN_LIMITS_BY_NAME = {
  FREE: {
    uploadsPerWeek: 1,
    questionsPerQuiz: 5,
    hasWatermark: true,
  },
  PRO: {
    uploadsPerWeek: Infinity,
    questionsPerQuiz: 30,
    hasWatermark: false,
  },
} as const;

// Type for plan names
export type PlanName = keyof typeof PLAN_LIMITS_BY_NAME;

