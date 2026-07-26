import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { logger } from './utils/logger';
import tenderRoutes from './routes/tenders';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { prisma } from './database';
import { env } from './config/env';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',') }));
app.use(express.json({ limit: '100kb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info({ method: req.method, url: req.url }, 'Incoming request');
  next();
});

// Swagger documentation
try {
  const swaggerDocument = YAML.load(path.join(__dirname, '../docs/swagger.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch {
  logger.warn('Swagger documentation not found or invalid');
}

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'valgan-procurement-platform',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    logger.error({ err: error }, 'Database health check failed');
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

app.use('/api/v1/tenders', tenderRoutes);

// Serve frontend
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../frontend.html'));
});

// Error handling middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  logger.error(err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database operation failed',
        details: [err.code]
      }
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
        details: err.issues
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = err as any;
  const isProd = process.env.NODE_ENV === 'production';
  const status = e.status || 500;
  
  res.status(status).json({
    success: false,
    error: {
      code: status === 500 ? 'INTERNAL_ERROR' : 'API_ERROR',
      message: status === 500 && isProd ? 'Internal Server Error' : (e.message || 'Internal Server Error'),
      details: isProd ? [] : e.errors || []
    }
  });
});

export default app;
