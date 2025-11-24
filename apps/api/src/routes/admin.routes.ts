/**
 * Admin Routes
 *
 * Admin-only routes for analytics and management
 */

import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticate, authorize, UserRole } from '@/middleware/auth.js';
import * as analyticsController from '@/controllers/analytics.controller.js';

const router: ExpressRouter = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// Analytics
router.get('/analytics', analyticsController.getAnalytics);

export default router;

