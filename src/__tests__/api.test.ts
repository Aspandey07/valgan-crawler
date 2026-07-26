import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../app';
import { env } from '../config/env';

describe('Valgan Procurement API', () => {
  const API_KEY = env.API_KEY;

  describe('Health Endpoints', () => {
    it('GET /health should return status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('valgan-procurement-platform');
    });

    // We do not test /health/ready here to avoid DB dependency in lightweight unit tests,
    // but the endpoint exists and is manually testable.
  });

  describe('Security (API Key)', () => {
    it('should reject requests without API Key', async () => {
      const res = await request(app).get('/api/v1/tenders');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Unauthorized');
    });

    it('should reject requests with invalid API Key', async () => {
      const res = await request(app)
        .get('/api/v1/tenders')
        .set('x-api-key', 'wrong-key');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Tenders API Validation', () => {
    it('GET /api/v1/tenders should return a list when auth is valid', async () => {
      const res = await request(app)
        .get('/api/v1/tenders')
        .set('x-api-key', API_KEY);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('GET /api/v1/tenders/search should handle queries gracefully', async () => {
      const res = await request(app)
        .get('/api/v1/tenders/search?q=services')
        .set('x-api-key', API_KEY);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/tenders/:id should return 400 for invalid UUID format', async () => {
      const res = await request(app)
        .get('/api/v1/tenders/not-a-uuid')
        .set('x-api-key', API_KEY);
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR'); 
    });
  });
});
