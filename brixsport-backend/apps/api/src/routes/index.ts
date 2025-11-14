import { Router } from 'express';
import { router as v1Routes } from './v1';
import matchEventsRoutes from './matchEvents.routes';
import docsRoutes from './docs.routes';
import competitionRoutes from './competitions.routes';
import searchRoutes from './search.routes';
import redisInfoRoutes from './redis-info.routes';
import cacheRoutes from './cache.routes';
import healthRoutes from './health.routes';
import { apiRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Apply rate limiting to all API routes
router.use(apiRateLimiter);

router.use('/v1', v1Routes);
router.use('/v1/match-events', matchEventsRoutes);
router.use('/v1/competitions', competitionRoutes);
router.use('/v1/search', searchRoutes);
router.use('/v1/redis', redisInfoRoutes); // Redis monitoring endpoints
router.use('/v1/cache', cacheRoutes); // Cache management endpoints
router.use('/docs', docsRoutes);
router.use('/', healthRoutes); // Health check endpoint

export default router;