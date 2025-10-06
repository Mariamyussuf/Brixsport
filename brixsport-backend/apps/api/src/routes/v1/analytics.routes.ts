import { Router } from 'express';
import { analyticsController } from '../../controllers/analytics.controller';
import { authenticate, requireAdmin, requireLogger, requireSeniorLogger } from '../../middleware/auth.middleware';
import { readRateLimiter, writeRateLimiter } from '../../middleware/rateLimiter.middleware';
import { validate } from '../../middleware/validation.middleware';
import { validationSchemas } from '../../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Apply rate limiting to all analytics endpoints
router.use(readRateLimiter);

// Player Analytics
router.get('/players/:playerId/performance', analyticsController.getPlayerPerformance);
router.get('/players/:playerId/trends', analyticsController.getPlayerTrends);
router.post('/players/compare', writeRateLimiter, validate(validationSchemas.comparePlayers), analyticsController.comparePlayers);

// Team Analytics
router.get('/teams/:teamId/performance', analyticsController.getTeamPerformance);
router.get('/teams/:teamId/standings', analyticsController.getTeamStandings);
router.post('/teams/compare', writeRateLimiter, validate(validationSchemas.compareTeams), analyticsController.compareTeams);

// Match Analytics
router.get('/matches/:matchId/insights', analyticsController.getMatchInsights);
router.get('/matches/:matchId/predictions', analyticsController.getMatchPredictions);
router.get('/matches/:matchId/trends', analyticsController.getMatchTrends);

// Competition Analytics
router.get('/competitions/:competitionId/report', analyticsController.getCompetitionReport);
router.get('/competitions/:competitionId/export', analyticsController.exportCompetitionData);

// === NEW ENDPOINTS BASED ON PROMPT ===

// User Analytics (admin only)
router.get('/users/overview', requireAdmin, analyticsController.getUserOverview);
router.get('/users/activity', requireAdmin, analyticsController.getUserActivity);
router.get('/users/geography', requireAdmin, analyticsController.getUserGeography);
router.get('/users/retention', requireAdmin, analyticsController.getUserRetention);

// Sports Analytics (admin only)
router.get('/sports/performance', requireAdmin, analyticsController.getSportsPerformance);
router.get('/sports/popularity', requireAdmin, analyticsController.getSportPopularity);
router.get('/sports/participation', requireAdmin, analyticsController.getParticipationStatistics);

// Competition Analytics (additional) (admin only)
router.get('/competitions/overview', requireAdmin, analyticsController.getCompetitionOverview);
router.get('/competitions/engagement', requireAdmin, analyticsController.getFanEngagement);
router.get('/competitions/revenue', requireAdmin, analyticsController.getRevenueGeneration);

// Platform Analytics (admin only)
router.get('/platform/usage', requireAdmin, analyticsController.getPlatformUsage);
router.get('/platform/performance', requireAdmin, analyticsController.getSystemPerformance);
router.get('/platform/errors', requireAdmin, analyticsController.getErrorTracking);
router.get('/platform/logs', requireAdmin, analyticsController.getSystemLogs);
router.get('/platform/deployments', requireAdmin, analyticsController.getDeploymentMetrics);

// System Monitoring (admin only)
router.get('/system/health', requireAdmin, analyticsController.getSystemHealth);
router.get('/system/resources', requireAdmin, analyticsController.getResourceUtilization);
router.get('/system/alerts', requireAdmin, analyticsController.getSystemAlerts);
router.get('/system/performance', requireAdmin, analyticsController.getDetailedPerformance);

// Reports (admin only)
router.get('/reports', requireAdmin, analyticsController.listReports);
router.post('/reports', requireAdmin, writeRateLimiter, validate(validationSchemas.generateReport), analyticsController.generateReport);
router.get('/reports/:id', requireAdmin, analyticsController.getReport);
router.get('/reports/:id/download', requireAdmin, analyticsController.downloadReport);
router.delete('/reports/:id', requireAdmin, writeRateLimiter, analyticsController.deleteReport);
router.post('/reports/system-logs', requireAdmin, writeRateLimiter, analyticsController.generateSystemLogReport);
router.post('/reports/deployment-tracking', requireAdmin, writeRateLimiter, analyticsController.generateDeploymentTrackingReport);

// Dashboards (admin only)
router.get('/dashboards', requireAdmin, analyticsController.listDashboards);
router.post('/dashboards', requireAdmin, writeRateLimiter, validate(validationSchemas.createDashboard), analyticsController.createDashboard);
router.get('/dashboards/:id', requireAdmin, analyticsController.getDashboard);
router.put('/dashboards/:id', requireAdmin, writeRateLimiter, validate(validationSchemas.updateDashboard), analyticsController.updateDashboard);
router.delete('/dashboards/:id', requireAdmin, writeRateLimiter, analyticsController.deleteDashboard);

// Real-time Data (logger and above)
router.get('/live', requireLogger, analyticsController.getLiveMetrics);

export default router;