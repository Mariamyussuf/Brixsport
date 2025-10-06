import { Router } from 'express';

// Import all route modules
import authRoutes from '@routes/v1/auth.routes';
import matchesRoutes from '@routes/v1/matches.routes';
import liveRoutes from '@routes/v1/live.routes';
import usersRoutes from '@routes/v1/users.routes';
import adminRoutes from '@routes/v1/admin.routes';
import analyticsRoutes from '@routes/v1/analytics.routes';
import downloadsRoutes from '@routes/v1/downloads.routes';
import favoritesRoutes from '@routes/v1/favorites.routes';
import competitionRoutes from '@routes/competitions.routes';
import teamsRoutes from '@routes/v1/teams.routes';
import statisticsRoutes from '@routes/v1/statistics.routes';
import mediaRoutes from '@routes/v1/media.routes';
import trackRoutes from '@routes/v1/track.routes';
import { notificationPreferencesRoutes } from './notification-preferences.routes';

const router = Router();

// Mount all routes
router.use('/auth', authRoutes);
router.use('/matches', matchesRoutes);
router.use('/live', liveRoutes);
router.use('/users', usersRoutes);
router.use('/admin', adminRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/downloads', downloadsRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/competitions', competitionRoutes);
router.use('/teams', teamsRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/media', mediaRoutes);
router.use('/track', trackRoutes);
router.use('/notification-preferences', notificationPreferencesRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});
export default router;