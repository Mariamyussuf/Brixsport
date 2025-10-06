import { statisticsController } from './statistics.controller';
import { statisticsService } from '../services/statistics.service';
import { Request, Response } from 'express';

// Mock the statistics service
jest.mock('../services/statistics.service');

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('Statistics Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();

    mockRequest = {};
    mockResponse = {
      status: mockStatus,
      json: mockJson
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlayerStatistics', () => {
    it('should return player statistics successfully', async () => {
      const mockStats = {
        id: 'player-stats-123',
        playerId: '123',
        sport: 'FOOTBALL',
        matchesPlayed: 10,
        goals: 5,
        assists: 3,
        totalPoints: 18
      };

      (statisticsService.getPlayerStatistics as jest.Mock).mockResolvedValue(mockStats);

      mockRequest = {
        params: { id: '123' }
      };

      await statisticsController.getPlayerStatistics(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });

    it('should handle player not found error', async () => {
      (statisticsService.getPlayerStatistics as jest.Mock).mockRejectedValue(
        new Error('Player not found')
      );

      mockRequest = {
        params: { id: 'invalid-id' }
      };

      await statisticsController.getPlayerStatistics(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Player not found'
      });
    });
  });

  describe('getTeamStatistics', () => {
    it('should return team statistics successfully', async () => {
      const mockStats = {
        id: 'team-stats-123',
        teamId: '123',
        sport: 'FOOTBALL',
        matchesPlayed: 10,
        wins: 7,
        draws: 2,
        losses: 1,
        points: 23
      };

      (statisticsService.getTeamStatistics as jest.Mock).mockResolvedValue(mockStats);

      mockRequest = {
        params: { id: '123' }
      };

      await statisticsController.getTeamStatistics(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });

    it('should handle team not found error', async () => {
      (statisticsService.getTeamStatistics as jest.Mock).mockRejectedValue(
        new Error('Team not found')
      );

      mockRequest = {
        params: { id: 'invalid-id' }
      };

      await statisticsController.getTeamStatistics(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Team not found'
      });
    });
  });

  describe('getCompetitionStatistics', () => {
    it('should return competition statistics successfully', async () => {
      const mockStats = {
        id: 'competition-stats-123',
        competitionId: '123',
        sport: 'FOOTBALL',
        totalMatches: 45,
        totalTeams: 8,
        totalGoals: 120
      };

      (statisticsService.getCompetitionStatistics as jest.Mock).mockResolvedValue(mockStats);

      mockRequest = {
        params: { id: '123' }
      };

      await statisticsController.getCompetitionStatistics(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });
  });
});