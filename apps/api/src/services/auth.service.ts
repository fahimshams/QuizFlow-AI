/**
 * Authentication Service
 *
 * SERVICE LAYER PATTERN:
 * - Business logic lives here
 * - Reusable across controllers
 * - Easy to test (no HTTP dependencies)
 * - Single responsibility
 */

import bcrypt from 'bcryptjs';
import { prisma } from '@/config/database.js';
import { AppError } from '@/middleware/errorHandler.js';
import { generateTokens, verifyRefreshToken, UserRole } from '@/middleware/auth.js';
import { User, UserRole as PrismaUserRole, SubscriptionPlan } from '@prisma/client';

/**
 * Register new user
 */
export const registerUser = async (
  email: string,
  password: string,
  name: string
): Promise<{ user: Omit<User, 'password'>; tokens: { accessToken: string; refreshToken: string } }> => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(409, 'User already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: PrismaUserRole.USER,
      plan: SubscriptionPlan.FREE,
    },
  });

  // Generate tokens
  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role as UserRole,
  });

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, tokens };
};

/**
 * Login user
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<{ user: Omit<User, 'password'>; tokens: { accessToken: string; refreshToken: string } }> => {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid credentials');
  }

  // Generate tokens
  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role as UserRole,
  });

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, tokens };
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (
  refreshToken: string
): Promise<{ accessToken: string }> => {
  // Verify refresh token
  const payload = verifyRefreshToken(refreshToken);

  // Check if token exists in database
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken) {
    throw new AppError(401, 'Invalid refresh token');
  }

  // Check if token is expired
  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({
      where: { token: refreshToken },
    });
    throw new AppError(401, 'Refresh token expired');
  }

  // Generate new access token
  const tokens = generateTokens({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  });

  return { accessToken: tokens.accessToken };
};

/**
 * Logout user
 */
export const logoutUser = async (refreshToken: string): Promise<void> => {
  // Delete refresh token from database
  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  });
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<Omit<User, 'password'>> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

