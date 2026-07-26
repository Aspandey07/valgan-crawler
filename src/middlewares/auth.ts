import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export const requireApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('x-api-key');

  if (!apiKey || apiKey !== env.API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Please provide a valid x-api-key header.'
    });
  }

  next();
};
