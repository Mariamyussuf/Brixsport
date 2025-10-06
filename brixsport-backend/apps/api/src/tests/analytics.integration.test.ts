import request from 'supertest';
import express from 'express';
import { Request, Response, NextFunction } from 'express';
import analyticsRoutes from '../routes/v1/analytics.routes';
import { authenticate } from '../middleware/auth.middleware';

// Create express app for testing
const app = express();
app.use(express.json());

// Mock authentication middleware
jest.mock('../middleware/auth.middleware', () => ({
  authenticate: jest.fn((req: Request, res: Response, next: NextFunction) => {
    // Mock authenticated user
    (req as any).user = { id: 'user123', role: 'admin' };
    next();
  })
}));

// Mock rate limiter middleware
jest.mock('../middleware/rateLimiter.middleware', () => ({
  readRateLimiter: jest.fn((req: Request, res: Response, next: NextFunction) => next()),
  writeRateLimiter: jest.fn((req: Request, res: Response, next: NextFunction) => next())
}));

// Mock validation middleware
jest.mock('../middleware/validation.middleware', () => ({
  validate: jest.fn(() => (req: Request, res: Response, next: NextFunction) => next())
}));

// Use the analytics routes
app.use('/api/v1/analytics', analyticsRoutes);

describe('Analytics API Integration Tests', () => {
  describe('GET /api/v1/analytics/users/overview', () => {
    it('should return user overview data', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/users/overview')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('totalUsers');
      expect(response.body.data).toHaveProperty('activeUsers');
    });
  });

  describe('GET /api/v1/analytics/players/:playerId/performance', () => {
    it('should return player performance data', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/players/player123/performance')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('playerId');
      expect(response.body.data).toHaveProperty('playerName');
      expect(response.body.data).toHaveProperty('performanceMetrics');
    });
  });

  describe('GET /api/v1/analytics/teams/:teamId/performance', () => {
    it('should return team performance data', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/teams/team123/performance')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('teamId');
      expect(response.body.data).toHaveProperty('teamName');
      expect(response.body.data).toHaveProperty('performanceMetrics');
    });
  });

  describe('POST /api/v1/analytics/players/compare', () => {
    it('should compare players', async () => {
      const response = await request(app)
        .post('/api/v1/analytics/players/compare')
        .send({
          playerIds: ['player1', 'player2']
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('comparisons');
    });
  });

  describe('POST /api/v1/analytics/teams/compare', () => {
    it('should compare teams', async () => {
      const response = await request(app)
        .post('/api/v1/analytics/teams/compare')
        .send({
          teamIds: ['team1', 'team2']
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('comparisons');
    });
  });

  describe('GET /api/v1/analytics/reports', () => {
    it('should list reports', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/reports')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/v1/analytics/dashboards', () => {
    it('should list dashboards', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/dashboards')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/v1/analytics/live', () => {
    it('should return live metrics', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/live')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });
});