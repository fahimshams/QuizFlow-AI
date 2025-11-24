/**
 * Analytics Controller
 *
 * Admin-only endpoints for analytics
 */

import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler.js';
import * as analyticsService from '@/services/analytics.service.js';

/**
 * GET /api/admin/analytics
 * Get comprehensive analytics data
 */
export const getAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const analytics = await analyticsService.getAnalytics();

  res.status(200).json({
    success: true,
    data: analytics,
  });
});

