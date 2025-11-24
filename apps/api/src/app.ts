/**
 * Express Application Setup
 *
 * ARCHITECTURE:
 * - Middleware stack (order matters!)
 * - Route mounting
 * - Error handling
 * - Graceful shutdown
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from '@/config/env.js';
import { logger } from '@/config/logger.js';
import { errorHandler } from '@/middleware/errorHandler.js';
import { apiLimiter } from '@/middleware/rateLimiter.js';
import authRoutes from '@/routes/auth.routes.js';
import fileRoutes from '@/routes/file.routes.js';
import quizRoutes from '@/routes/quiz.routes.js';
import subscriptionRoutes from '@/routes/subscription.routes.js';
import adminRoutes from '@/routes/admin.routes.js';

/**
 * Create and configure Express app
 */
export const createApp = (): Application => {
  const app = express();

  // ============================================
  // SECURITY MIDDLEWARE
  // ============================================

  /**
   * Helmet - Sets security-related HTTP headers
   * - Prevents clickjacking
   * - XSS protection
   * - Content type sniffing prevention
   */
  app.use(helmet());

  /**
   * CORS - Cross-Origin Resource Sharing
   * Allows frontend to make requests to backend
   */
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true, // Allow cookies
    })
  );

  /**
   * MongoDB Injection Prevention
   * Sanitizes user input to prevent NoSQL injection
   */
  app.use(mongoSanitize());

  // ============================================
  // PARSING MIDDLEWARE
  // ============================================

  /**
   * Parse JSON bodies
   * Limit size to prevent DOS attacks
   */
  app.use(express.json({ limit: '10mb' }));

  /**
   * Parse URL-encoded bodies (form data)
   */
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  /**
   * Compress responses
   * Reduces bandwidth usage
   */
  app.use(compression());

  // ============================================
  // RATE LIMITING
  // ============================================

  /**
   * Apply rate limiting to all routes
   * Prevents abuse and DDoS
   */
  app.use(apiLimiter);

  // ============================================
  // REQUEST LOGGING
  // ============================================

  /**
   * Log all incoming requests (development only)
   */
  if (env.NODE_ENV === 'development') {
    app.use((req, _res, next) => {
      logger.debug(`${req.method} ${req.path}`, {
        body: req.body,
        query: req.query,
      });
      next();
    });
  }

  // ============================================
  // ROUTES
  // ============================================

  /**
   * Health check endpoint
   * Used by load balancers and monitoring tools
   */
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  /**
   * API version endpoint
   */
  app.get('/api', (_req, res) => {
    res.json({
      name: 'QuizFlow AI API',
      version: '1.0.0',
      documentation: `${env.API_URL}/docs`,
    });
  });

  // ============================================
  // API ROUTES
  // ============================================

  app.use('/api/auth', authRoutes);
  app.use('/api/upload', fileRoutes);
  app.use('/api/quiz', quizRoutes);
  app.use('/api/subscription', subscriptionRoutes);
  app.use('/api/admin', adminRoutes);

  // ============================================
  // STATIC FILE SERVING
  // ============================================

  /**
   * Serve uploaded files (QTI exports, etc.)
   * Must be after API routes to avoid conflicts
   */
  app.use('/uploads', express.static(env.UPLOAD_DIR));

  /**
   * 404 handler
   * Must be after all routes
   */
  app.use((_req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource does not exist',
      statusCode: 404,
    });
  });

  // ============================================
  // ERROR HANDLING
  // ============================================

  /**
   * Global error handler
   * Must be last middleware
   */
  app.use(errorHandler);

  return app;
};

