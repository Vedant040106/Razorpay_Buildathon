import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { seedDatabase } from './database/seed.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function startServer() {
  try {
    // 1. Connect to Database (local URI or embedded memory-server)
    await connectDatabase();

    // 2. Ensure baseline data (Merchant, Admin User, Demo Cases) exists
    await seedDatabase();

    // 3. Initialize Express application
    const app = createApp();

    // 3. Listen on configured port
    const server = app.listen(env.PORT, () => {
      logger.info(`RecoverAI API Server active and listening on port ${env.PORT} [${env.NODE_ENV}]`);
      logger.info(`Health check available at: http://localhost:${env.PORT}/api/health`);
    });

    // 4. Graceful shutdown handler
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        await disconnectDatabase();
        process.exit(0);
      });

      // Force shutdown if taking longer than 10s
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (err) {
    logger.error('Fatal error during application startup:', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

startServer();
