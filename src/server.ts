import app from './app.js';
import { logger } from './logger.js';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Handle graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force shutdown after 10 seconds if connections are hanging
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
