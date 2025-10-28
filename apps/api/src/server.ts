/**
 * Server Entry Point
 *
 * PRODUCTION PATTERNS:
 * - Graceful shutdown
 * - Process error handling
 * - Database connection before server start
 * - Clean separation of app and server
 */

import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Create Express app
    const app = createApp();

    // Start listening
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on ${env.API_URL}`);
      logger.info(`📝 Environment: ${env.NODE_ENV}`);
    });

    // ============================================
    // GRACEFUL SHUTDOWN
    // ============================================

    /**
     * Handle shutdown signals
     * Ensures proper cleanup before exit
     */
    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown`);

      server.close(async () => {
        logger.info('HTTP server closed');

        // Close database connection
        await disconnectDatabase();

        logger.info('Graceful shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Listen for shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // ============================================
    // UNHANDLED ERRORS
    // ============================================

    /**
     * Catch unhandled promise rejections
     * These should never happen, but log them if they do
     */
    process.on('unhandledRejection', (reason: Error) => {
      logger.error('Unhandled Rejection:', reason);
      throw reason;
    });

    /**
     * Catch uncaught exceptions
     * Log and exit gracefully
     */
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

