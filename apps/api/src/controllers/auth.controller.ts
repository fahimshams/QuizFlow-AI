/**
 * Authentication Controller
 *
 * CONTROLLER PATTERN:
 * - Handles HTTP request/response
 * - Delegates business logic to services
 * - Validates input
 * - Formats response
 */

import { Request, Response } from 'express';
import { asyncHandler, AppError } from '@/middleware/errorHandler.js';
import * as authService from '@/services/auth.service.js';
import { logger } from '@/config/logger.js';

/**
 * POST /api/auth/register
 * Register a new user
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  logger.info('User registration attempt', { email });

  const result = await authService.registerUser(email, password, name);

  logger.info('User registered successfully', { userId: result.user.id });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

/**
 * POST /api/auth/login
 * Login user
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  logger.info('User login attempt', { email });

  const result = await authService.loginUser(email, password);

  logger.info('User logged in successfully', { userId: result.user.id });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  const result = await authService.refreshAccessToken(refreshToken);

  res.status(200).json({
    success: true,
    message: 'Token refreshed',
    data: result,
  });
});

/**
 * POST /api/auth/logout
 * Logout user
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  await authService.logoutUser(refreshToken);

  logger.info('User logged out', { userId: req.user?.id });

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'User not authenticated');
  }

  const user = await authService.getUserById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * PATCH /api/auth/profile
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'User not authenticated');
  }

  const { name, email } = req.body as { name?: string; email?: string };

  const user = await authService.updateUserProfile(req.user.id, { name, email });

  logger.info('User profile updated', { userId: req.user.id });

  res.status(200).json({
    success: true,
    message: 'Profile updated',
    data: user,
  });
});

/**
 * POST /api/auth/password
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'User not authenticated');
  }

  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };

  await authService.changeUserPassword(
    req.user.id,
    currentPassword,
    newPassword
  );

  logger.info('User password changed', { userId: req.user.id });

  res.status(200).json({
    success: true,
    message:
      'Password updated. Please sign in again (existing sessions were signed out).',
  });
});

