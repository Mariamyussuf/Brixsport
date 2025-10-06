import { Router } from 'express';
import v1Routes from '@routes/v1';
import matchEventsRoutes from '@routes/matchEvents.routes';
import docsRoutes from '@routes/docs.routes';
import competitionRoutes from '@routes/competitions.routes';
import searchRoutes from '@routes/search.routes';
import redisInfoRoutes from './redis-info.routes';
import { apiRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Apply rate limiting to all API routes
router.use(apiRateLimiter);

router.use('/v1', v1Routes);
router.use('/v1/match-events', matchEventsRoutes);
router.use('/v1/competitions', competitionRoutes);
router.use('/v1/search', searchRoutes);
router.use('/v1/redis', redisInfoRoutes); // Redis monitoring endpoints
router.use('/docs', docsRoutes);

export default router;