/**
 * Database Configuration
 *
 * BEST PRACTICES:
 * - Single Prisma Client instance (singleton pattern)
 * - Proper connection pooling
 * - Graceful disconnection
 * - Error handling
 */

import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';
import { env } from './env.js';

/**
 * Prisma Client Singleton
 *
 * In development: Hot reloading can create multiple instances
 * This prevents connection pool exhaustion
 */
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Connect to database
 */
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

/**
 * Disconnect from database
 * Call this during graceful shutdown
 */
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Error disconnecting database:', error);
    throw error;
  }
};

/**
 * Health check
 * Verifies database connection is alive
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    // Simple connection check without raw queries
    await prisma.$connect();
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

