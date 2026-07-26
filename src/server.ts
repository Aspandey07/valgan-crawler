import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './database';

const PORT = Number(env.PORT) || 3000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info(`Server is running on http://${HOST}:${PORT} in ${env.NODE_ENV} mode`);
}).on('error', (err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});
