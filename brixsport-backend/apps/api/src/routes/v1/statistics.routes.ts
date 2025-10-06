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
// Comparison endpoints are already available at:
// - /players/:id/comparison
// - /teams/:id/comparison

export default router;