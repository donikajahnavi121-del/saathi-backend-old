import app from './app.js';
import { ENV } from './config/env.js';
import { logger } from './utils/logger.js';
import { disconnectPrisma } from './config/db.js';
import { disconnectRedis } from './config/redis.js';
import { initializeScheduler } from './jobs/scheduler.js';

const server = app.listen(ENV.PORT, () => {
  logger.info(`=======================================================`);
  logger.info(` Saathi Adherence Platform API running on port ${ENV.PORT}`);
  logger.info(` Environment: ${ENV.NODE_ENV}`);
  logger.info(` Swagger Documentation: http://localhost:${ENV.PORT}/docs`);
  logger.info(` Health Status: http://localhost:${ENV.PORT}/health`);
  logger.info(`=======================================================`);

  // Start background cron jobs and reminder queue
  initializeScheduler();
});

// Graceful Shutdown Handlers
async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed.');
    await disconnectPrisma();
    await disconnectRedis();
    logger.info('Graceful shutdown completed.');
    process.exit(0);
  });

  // Force shutdown if taking longer than 10 seconds
  setTimeout(() => {
    logger.error('Forcefully terminating process after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
