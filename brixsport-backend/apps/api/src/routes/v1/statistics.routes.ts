import { Router } from 'express';
import { statisticsController } from '../../controllers/statistics.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { 
  getPlayerStatisticsValidationRules,
  getPlayerTrendsValidationRules,
  comparePlayersValidationRules,
  getTeamStatisticsValidationRules,
  getTeamTrendsValidationRules,
  compareTeamsValidationRules,
  getCompetitionStatisticsValidationRules,
  getCompetitionStandingsValidationRules,
  getTopPerformersValidationRules,
  getPlayerAnalyticsReportValidationRules,
  getTeamAnalyticsReportValidationRules,
  compareEntitiesValidationRules
} from '../../validation/statistics.validation';

// Import our new controller
import { statisticsController as realtimeStatisticsController } from '../../controllers/realtime-statistics.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Player Statistics
router.get('/players/:id', getPlayerStatisticsValidationRules(), statisticsController.getPlayerStatistics);
router.get('/players/:id/trends', getPlayerTrendsValidationRules(), statisticsController.getPlayerTrends);
router.get('/players/:id/comparison', comparePlayersValidationRules(), statisticsController.comparePlayers);

// Team Statistics
router.get('/teams/:id', getTeamStatisticsValidationRules(), statisticsController.getTeamStatistics);
router.get('/teams/:id/trends', getTeamTrendsValidationRules(), statisticsController.getTeamTrends);
router.get('/teams/:id/comparison', compareTeamsValidationRules(), statisticsController.compareTeams);

// Competition Statistics
router.get('/competitions/:id', getCompetitionStatisticsValidationRules(), statisticsController.getCompetitionStatistics);
router.get('/competitions/:id/standings', getCompetitionStandingsValidationRules(), statisticsController.getCompetitionStandings);
router.get('/competitions/:id/top-performers', getTopPerformersValidationRules(), statisticsController.getTopPerformers);

// Analytics and Reports
router.get('/analytics/player-performance/:id', getPlayerAnalyticsReportValidationRules(), statisticsController.getPlayerAnalyticsReport);
router.get('/analytics/team-performance/:id', getTeamAnalyticsReportValidationRules(), statisticsController.getTeamAnalyticsReport);

// Real-time match statistics endpoints
router.get('/matches/:matchId/stats', realtimeStatisticsController.getMatchStats);
router.post('/matches/events', realtimeStatisticsController.processMatchEvent);

// Heat map endpoints
router.get('/matches/:matchId/heatmap', realtimeStatisticsController.getHeatMap);

// Export endpoints
router.get('/players/:playerId/export/csv', realtimeStatisticsController.exportPlayerStatsCSV);
router.get('/players/:playerId/export/pdf', realtimeStatisticsController.exportPlayerStatsPDF);
router.get('/teams/:teamId/export/csv', realtimeStatisticsController.exportTeamStatsCSV);
router.get('/teams/:teamId/export/pdf', realtimeStatisticsController.exportTeamStatsPDF);
router.get('/players/:playerId/compare/export/csv', realtimeStatisticsController.exportPlayerComparisonCSV);
router.get('/players/:playerId/compare/export/pdf', realtimeStatisticsController.exportPlayerComparisonPDF);

export default router;