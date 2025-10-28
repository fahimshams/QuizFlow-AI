/**
 * Rate Limiting Middleware
 *
 * WHY RATE LIMITING?
 * - Prevent DDoS attacks
 * - Prevent brute force attacks
 * - Protect against API abuse
 * - Ensure fair usage
 *
 * PRODUCTION TIP: Use Redis for distributed rate limiting
 * when you have multiple server instances
 */

import rateLimit from 'express-rate-limit';
import { env } from '@/config/env.js';

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests, please try again later',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

/**
 * Strict limiter for auth endpoints
 * Prevents brute force attacks
 * 5 requests per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts, please try again after 15 minutes',
  skipSuccessfulRequests: true, // Don't count successful logins
});

/**
 * Limiter for file uploads
 * Prevents abuse of expensive operations
 * 10 uploads per hour
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Upload limit exceeded, please try again later',
});

