/**
 * Authentication & Authorization Middleware
 *
 * SECURITY CONCEPTS:
 * - JWT (JSON Web Tokens) for stateless auth
 * - Access tokens (short-lived) + Refresh tokens (long-lived)
 * - Bearer token in Authorization header
 * - Role-based access control (RBAC)
 */

import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env.js';
import { AppError } from './errorHandler.js';
import type { User } from '@quizflow/types';

// Local enum to avoid runtime import issues
// Values must match Prisma's UserRole enum
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JWTPayload;

    // TODO: Fetch full user from database
    // For now, we'll use the decoded payload
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    } as unknown as User;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(401, 'Invalid token');
    }
    next(error);
  }
};

/**
 * Check if user has required role
 * Usage: router.get('/admin', authenticate, authorize(UserRole.ADMIN), handler)
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'Insufficient permissions');
    }

    next();
  };
};

/**
 * Generate JWT tokens
 */
export const generateTokens = (payload: JWTPayload) => {
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
  } as SignOptions);

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
  } as SignOptions);

  return { accessToken, refreshToken };
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JWTPayload;
};

