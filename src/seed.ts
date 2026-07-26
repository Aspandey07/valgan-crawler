import { UKContractsFinder } from './crawlers/portals/UKContractsFinder';
import { logger } from './utils/logger';
import { prisma } from './database';
import { env } from './config/env';

async function main() {
  logger.info('Initializing SEED script to populate sample data for reviewer testing');
  
  // Set a small limit for seeding so it completes quickly
  const originalLimit = env.CRAWL_RECORD_LIMIT;
  env.CRAWL_RECORD_LIMIT = 5;

  const crawler = new UKContractsFinder();
  
  try {
    await crawler.run();
    logger.info('✅ Seed script completed successfully.');
  } catch (error: unknown) {
    logger.error({ err: error }, 'Seed script execution failed');
  } finally {
    // Restore original limit just in case
    env.CRAWL_RECORD_LIMIT = originalLimit;
    await prisma.$disconnect();
    logger.info('Database connection closed.');
  }
}

main();
