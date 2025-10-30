import request from 'supertest';
import express from 'express';
import statisticsRoutes from './statistics.routes';
import { statisticsController } from '../../controllers/statistics.controller';

// Mock the statistics controller
jest.mock('../../controllers/statistics.controller', () => ({
  statisticsController: {
    getPlayerStatistics: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
    getPlayerTrends: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
    comparePlayers: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
    getTeamStatistics: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
    getTeamTrends: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
    compareTeams: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
    getCompetitionStatistics: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
    getCompetitionStandings: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
    getTopPerformers: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
    getPlayerAnalyticsReport: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
    getTeamAnalyticsReport: jest.fn((req, res) => res.status(200).json({ success: true, data: {} }))
  }
}));

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/v1/statistics', statisticsRoutes);

describe('Statistics Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(statisticsRoutes).toBeDefined();
  });

  it('should have player statistics routes', async () => {
    const mockResponse = { success: true, data: { playerId: '123', goals: 5 } };
    (statisticsController.getPlayerStatistics as jest.Mock).mockImplementation((req, res) => 
      res.status(200).json(mockResponse)
    );

    const response = await request(app).get('/api/v1/statistics/players/123');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse);
    expect(statisticsController.getPlayerStatistics).toHaveBeenCalled();
  });

  it('should have team statistics routes', async () => {
    const mockResponse = { success: true, data: { teamId: '456', wins: 10 } };
    (statisticsController.getTeamStatistics as jest.Mock).mockImplementation((req, res) => 
      res.status(200).json(mockResponse)
    );

    const response = await request(app).get('/api/v1/statistics/teams/456');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse);
    expect(statisticsController.getTeamStatistics).toHaveBeenCalled();
  });

  it('should have competition statistics routes', async () => {
    const mockResponse = { success: true, data: { competitionId: '789', matches: 20 } };
    (statisticsController.getCompetitionStatistics as jest.Mock).mockImplementation((req, res) => 
      res.status(200).json(mockResponse)
    );

    const response = await request(app).get('/api/v1/statistics/competitions/789');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse);
    expect(statisticsController.getCompetitionStatistics).toHaveBeenCalled();
  });
});