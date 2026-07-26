import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  CRAWL_RECORD_LIMIT: z.coerce.number().default(5),
  REQUEST_DELAY_MS: z.coerce.number().default(1000),
  TIMEOUT_MS: z.coerce.number().default(30000),
  RETRY_COUNT: z.coerce.number().default(3),
  DOWNLOAD_DIR: z.string().default('./downloads'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('Invalid environment variables', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
