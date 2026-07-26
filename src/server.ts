import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './database';

const PORT = Number(env.PORT) || 3000;
const HOST = '0.0.0.0';

async function setupDatabase() {
  try {
    logger.info('Verifying database schema...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Tender" (
          "id" TEXT NOT NULL,
          "portalName" TEXT NOT NULL,
          "tenderId" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "description" TEXT,
          "department" TEXT NOT NULL,
          "closingDate" TIMESTAMP(3),
          "sourceUrl" TEXT NOT NULL,
          "detailUrl" TEXT NOT NULL,
          "localPdfPath" TEXT,
          "documentHash" TEXT,
          "rawData" JSONB,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Tender_pkey" PRIMARY KEY ("id")
      );
    `);
    
    try {
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "Tender_portalName_tenderId_key" ON "Tender"("portalName", "tenderId");`);
    } catch (e) {
      // Ignore if index already exists
    }
  } catch (err) {
    logger.error('Failed to setup database schema:', err);
  }
}

const server = app.listen(PORT, HOST, async () => {
  await setupDatabase();
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
