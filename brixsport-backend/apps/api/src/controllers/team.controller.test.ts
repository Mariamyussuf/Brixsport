import { TeamController } from './team.controller';
import { TeamService } from '../services/team.service';
import { Request, Response } from 'express';

// Mock the TeamService
jest.mock('../services/team.service');

describe('TeamController', () => {
  let teamController: TeamController;
  let mockTeamService: jest.Mocked<TeamService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockTeamService = new TeamService() as jest.Mocked<TeamService>;
    teamController = new TeamController();
    
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {};
    mockResponse = {
      status: mockStatus,
      json: mockJson
    };
  });

  describe('getTeams', () => {
    it('should return teams with pagination', async () => {
      const mockTeams = {
        teams: [
          { id: '1', name: 'Team A', sport: 'FOOTBALL', status: 'ACTIVE' } as any,
          { id: '2', name: 'Team B', sport: 'BASKETBALL', status: 'ACTIVE' } as any
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1
        }
      };

      mockTeamService.getTeams = jest.fn().mockResolvedValue(mockTeams);
      
      mockRequest = {
        query: {}
      };

      await teamController.getTeams(mockRequest as Request, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockTeams);
    });
  });

  describe('getTeamById', () => {
    it('should return a team when found', async () => {
      const mockTeam = { id: '1', name: 'Team A', sport: 'FOOTBALL', status: 'ACTIVE' };
      
      mockTeamService.getTeamById = jest.fn().mockResolvedValue(mockTeam);
      
      mockRequest = {
        params: { id: '1' }
      };

      await teamController.getTeamById(mockRequest as Request, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ team: mockTeam });
    });

    it('should return 404 when team not found', async () => {
      mockTeamService.getTeamById = jest.fn().mockResolvedValue(null);
      
      mockRequest = {
        params: { id: 'non-existent' }
      };

      await teamController.getTeamById(mockRequest as Request, mockResponse as Response);
      
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: {
          code: 'TEAM_NOT_FOUND',
          message: 'Team not found'
        }
      });
    });
  });
});