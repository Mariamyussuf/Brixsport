import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { analyticsService } from '../services/analytics.service';
import { errorHandlerService } from '../services/error.handler.service';

export const analyticsController = {
  // Player Analytics
  getPlayerPerformance: async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      
      const result = await analyticsService.getPlayerPerformance(playerId);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get player performance error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getPlayerTrends: async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      
      const result = await analyticsService.getPlayerTrends(playerId);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get player trends error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  comparePlayers: async (req: Request, res: Response) => {
    try {
      const { playerIds } = req.body;
      
      // Validate input
      if (!playerIds || !Array.isArray(playerIds) || playerIds.length < 2) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'At least two player IDs are required in an array'
        });
      }
      
      const result = await analyticsService.comparePlayers(playerIds);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Compare players error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Team Analytics
  getTeamPerformance: async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      
      const result = await analyticsService.getTeamPerformance(teamId);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get team performance error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getTeamStandings: async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      
      const result = await analyticsService.getTeamStandings(teamId);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get team standings error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  compareTeams: async (req: Request, res: Response) => {
    try {
      const { teamIds } = req.body;
      
      // Validate input
      if (!teamIds || !Array.isArray(teamIds) || teamIds.length < 2) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'At least two team IDs are required in an array'
        });
      }
      
      const result = await analyticsService.compareTeams(teamIds);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Compare teams error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Match Analytics
  getMatchInsights: async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      
      const result = await analyticsService.getMatchInsights(matchId);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get match insights error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getMatchPredictions: async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      
      const result = await analyticsService.getMatchPredictions(matchId);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get match predictions error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getMatchTrends: async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      
      const result = await analyticsService.getMatchTrends(matchId);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get match trends error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Competition Analytics
  getCompetitionReport: async (req: Request, res: Response) => {
    try {
      const { competitionId } = req.params;
      
      const result = await analyticsService.getCompetitionReport(competitionId);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get competition report error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  exportCompetitionData: async (req: Request, res: Response) => {
    try {
      const { competitionId } = req.params;
      
      const result = await analyticsService.exportCompetitionData(competitionId);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Export competition data error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // === NEW CONTROLLER METHODS BASED ON PROMPT ===
  
  // User Analytics
  getUserOverview: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.getUserOverview();
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get user overview error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getUserActivity: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.getUserActivity();
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get user activity error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getUserGeography: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.getUserGeography();
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get user geography error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getUserRetention: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.getUserRetention();
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get user retention error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Sports Analytics
  getSportsPerformance: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.getSportsPerformance();
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get sports performance error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getSportPopularity: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.getSportPopularity();
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get sport popularity error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getParticipationStatistics: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.getParticipationStatistics();
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get participation statistics error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Competition Analytics (additional)
  getCompetitionOverview: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.getCompetitionOverview();
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get competition overview error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getFanEngagement: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.getFanEngagement();
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get fan engagement error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getRevenueGeneration: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.getRevenueGeneration();
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get revenue generation error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Platform Analytics
  getPlatformUsage: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.getPlatformUsage();
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get platform usage error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getSystemPerformance: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.getSystemPerformance();
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get system performance error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getErrorTracking: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.getErrorTracking();
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get error tracking error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getSystemLogs: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.getSystemLogs();
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get system logs error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getDeploymentMetrics: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.getDeploymentMetrics();
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get deployment metrics error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // System Monitoring
  getSystemHealth: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.getSystemHealth();
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get system health error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getResourceUtilization: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.getResourceUtilization();
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get resource utilization error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getSystemAlerts: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.getSystemAlerts();
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get system alerts error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getDetailedPerformance: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.getDetailedPerformance();
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get detailed performance error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Reports
  listReports: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.listReports();
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('List reports error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  generateReport: async (req: Request, res: Response) => {
    try {
      const { type, parameters, format } = req.body;
      const result = await analyticsService.generateReport(type, parameters, format);
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Generate report error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getReport: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await analyticsService.getReport(id);
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get report error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  downloadReport: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await analyticsService.downloadReport(id);
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Download report error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  deleteReport: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await analyticsService.deleteReport(id);
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Delete report error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  generateSystemLogReport: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.generateSystemLogReport();
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Generate system log report error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  generateDeploymentTrackingReport: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.generateDeploymentTrackingReport();
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Generate deployment tracking report error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Dashboards
  listDashboards: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.listDashboards();
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('List dashboards error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  createDashboard: async (req: Request, res: Response) => {
    try {
      const { name, description, widgets } = req.body;
      const result = await analyticsService.createDashboard(name, description, widgets);
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Create dashboard error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getDashboard: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await analyticsService.getDashboard(id);
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get dashboard error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  updateDashboard: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, widgets } = req.body;
      const result = await analyticsService.updateDashboard(id, name, description, widgets);
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Update dashboard error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  deleteDashboard: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await analyticsService.deleteDashboard(id);
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Delete dashboard error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Real-time Data
  getLiveMetrics: async (req: Request, res: Response) => {
    try {
      const result = await analyticsService.getLiveMetrics();
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get live metrics error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
};