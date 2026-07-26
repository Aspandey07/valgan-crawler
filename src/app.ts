import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { logger } from './utils/logger';
import tenderRoutes from './routes/tenders';
import { Prisma } from '@prisma/client';

const app = express();

app.use(helmet());
app.use(cors());
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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/tenders', tenderRoutes);

// Error handling middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  logger.error(err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return res.status(400).json({
      success: false,
      message: 'Database operation failed',
      code: err.code
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = err as any;
  const isProd = process.env.NODE_ENV === 'production';
  const status = e.status || 500;
  
  res.status(status).json({
    success: false,
    message: status === 500 && isProd ? 'Internal Server Error' : (e.message || 'Internal Server Error'),
    errors: isProd ? undefined : e.errors,
  });
});

export default app;
