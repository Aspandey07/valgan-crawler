import { UKContractsFinder } from './crawlers/portals/UKContractsFinder';
import { logger } from './utils/logger';
import { prisma } from './database';

async function main() {
  logger.info('Initializing crawler execution');
  
  const crawler = new UKContractsFinder();
  
  try {
    await crawler.run();
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(`Crawler execution failed: ${error.message}`);
    } else {
      logger.error(`Crawler execution failed: ${String(error)}`);
    }
  } finally {
    await prisma.$disconnect();
    logger.info('Database connection closed.');
  }
}

main();
