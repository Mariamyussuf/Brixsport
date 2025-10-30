import { Router } from 'express';
import adminRoutes from './admin.routes';
import analyticsRoutes from './analytics.routes';
import authRoutes from './auth.routes';
import contentRoutes from './content.routes';
import downloadsRoutes from './downloads.routes';
import favoritesRoutes from './favorites.routes';
import liveRoutes from './live.routes';
import matchesRoutes from './matches.routes';
import matchesSportRoutes from './matches.sport.routes';
import mediaRoutes from './media.routes';
import { notificationPreferencesRoutes } from './notification-preferences.routes';
import { notificationsRoutes } from './notifications.routes';
import { notificationTemplatesRoutes } from './notification-templates.routes';
import securityAlertsRoutes from './security-alerts.routes';
import statisticsRoutes from './statistics.routes';
import teamsRoutes from './teams.routes';
import trackRoutes from './track.routes';
import userActivityRoutes from './user-activity.routes';
import usersRoutes from './users.routes';
import { cloudMessagingRoutes } from './cloud-messaging.routes';

const router = Router();

// API v1 routes
router.use('/admin', adminRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/auth', authRoutes);
router.use('/content', contentRoutes);
router.use('/downloads', downloadsRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/live', liveRoutes);
router.use('/matches', matchesRoutes);
router.use('/matches-sport', matchesSportRoutes);
router.use('/media', mediaRoutes);
router.use('/notification-preferences', notificationPreferencesRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/notification-templates', notificationTemplatesRoutes);
router.use('/security-alerts', securityAlertsRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/teams', teamsRoutes);
router.use('/track', trackRoutes);
router.use('/user-activity', userActivityRoutes);
router.use('/users', usersRoutes);
router.use('/cloud-messaging', cloudMessagingRoutes);

export { router };