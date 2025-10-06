import { Router } from 'express';
import { userActivityController } from '../../controllers/user-activity.controller';
import { authenticate, requireAdmin, requireLogger } from '../../middleware/auth.middleware';
import { readRateLimiter, writeRateLimiter } from '../../middleware/rateLimiter.middleware';
import { validate } from '../../middleware/validation.middleware';
import { validationSchemas } from '../../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Apply rate limiting
router.use(readRateLimiter);

// Get current user's activity log
router.get('/my-activity', userActivityController.getMyActivity);

// Get current user's statistics
router.get('/my-stats', userActivityController.getMyStatistics);

// Admin-only endpoints for user activity management
router.get('/users/:userId/activity', requireAdmin, userActivityController.getUserActivity);
router.get('/users/:userId/stats', requireAdmin, userActivityController.getUserStatistics);

// Bulk activity analytics (admin only)
router.get('/analytics/overview', requireAdmin, userActivityController.getActivityOverview);
router.get('/analytics/trends', requireAdmin, userActivityController.getActivityTrends);
router.get('/analytics/engagement', requireAdmin, userActivityController.getEngagementMetrics);
router.get('/analytics/retention', requireAdmin, userActivityController.getRetentionAnalytics);

// Activity reporting (admin only)
router.post('/reports/activity', requireAdmin, writeRateLimiter, 
  validate(validationSchemas.generateActivityReport), 
  userActivityController.generateActivityReport);

// Real-time activity monitoring (logger and above)
router.get('/live/activity', requireLogger, userActivityController.getLiveActivityFeed);
router.get('/live/stats', requireLogger, userActivityController.getLiveStatistics);


// Get chat history for a match
router.get('/chat/:matchId/history', userActivityController.getChatHistory);

// Send chat message (will be handled via WebSocket, but endpoint for fallback)
router.post('/chat/:matchId/message', writeRateLimiter,
  validate(validationSchemas.sendChatMessage),
  userActivityController.sendChatMessage);

// Delete chat message (admin/moderator only)
router.delete('/chat/message/:messageId', requireAdmin, writeRateLimiter,
  userActivityController.deleteChatMessage);

// Chat moderation (admin only)
router.get('/chat/moderation/reports', requireAdmin, userActivityController.getChatModerationReports);
router.post('/chat/moderation/action', requireAdmin, writeRateLimiter,
  validate(validationSchemas.chatModerationAction),
  userActivityController.performChatModerationAction);



// Get match events
router.get('/matches/:matchId/events', userActivityController.getMatchEvents);

// Create match event (admin only)
router.post('/matches/:matchId/events', requireAdmin, writeRateLimiter,
  validate(validationSchemas.createMatchEvent),
  userActivityController.createMatchEvent);

// Update match event (admin only)
router.put('/matches/:matchId/events/:eventId', requireAdmin, writeRateLimiter,
  validate(validationSchemas.updateMatchEvent),
  userActivityController.updateMatchEvent);

// Delete match event (admin only)
router.delete('/matches/:matchId/events/:eventId', requireAdmin, writeRateLimiter,
  userActivityController.deleteMatchEvent);

// Bulk match events operations (admin only)
router.post('/matches/:matchId/events/bulk', requireAdmin, writeRateLimiter,
  validate(validationSchemas.bulkMatchEvents),
  userActivityController.bulkCreateMatchEvents);

export default router;
