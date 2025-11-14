import { Router } from 'express';
import { statisticsController } from '../controllers/statistics.controller';
import { statisticsController as realtimeStatisticsController } from '../controllers/realtime-statistics.controller';

const router = Router();

// Match statistics routes
router.get('/matches/:matchId/stats', realtimeStatisticsController.getMatchStats);
router.post('/matches/events', realtimeStatisticsController.processMatchEvent);

// Heat map routes
router.get('/matches/:matchId/heatmap', realtimeStatisticsController.getHeatMap);

// Player comparison routes
router.get('/players/:playerId/compare', statisticsController.comparePlayers);

// Team comparison routes
router.get('/teams/:teamId/compare', statisticsController.compareTeams);

// Player statistics export routes
router.get('/players/:playerId/export/csv', realtimeStatisticsController.exportPlayerStatsCSV);
router.get('/players/:playerId/export/pdf', realtimeStatisticsController.exportPlayerStatsPDF);

// Team statistics export routes
router.get('/teams/:teamId/export/csv', realtimeStatisticsController.exportTeamStatsCSV);
router.get('/teams/:teamId/export/pdf', realtimeStatisticsController.exportTeamStatsPDF);

// Player comparison export routes
router.get('/players/:playerId/compare/export/csv', realtimeStatisticsController.exportPlayerComparisonCSV);
router.get('/players/:playerId/compare/export/pdf', realtimeStatisticsController.exportPlayerComparisonPDF);

export default router;