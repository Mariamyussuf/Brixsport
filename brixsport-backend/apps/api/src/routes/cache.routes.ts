import { Router } from 'express';
import { getRedisMetrics } from '../config/redis';
import { enhancedRedisService } from '../services/enhanced-redis.service';
import { globalCacheWarmer } from '@brixsport/shared/cache-warming';
import { globalCacheMetrics } from '@brixsport/shared/cache-metrics';

const router = Router();

// Get cache statistics and health metrics
router.get('/stats', async (req, res) => {
  try {
    // Get Redis connection metrics
    const redisMetrics = getRedisMetrics();
    
    // Get enhanced Redis service stats
    const enhancedStats = enhancedRedisService.getStats();
    
    // Get cache warmer stats
    const warmerStats = globalCacheWarmer.getStats();
    
    // Combine all metrics
    const stats = {
      timestamp: new Date().toISOString(),
      redis: redisMetrics,
      cache: enhancedStats,
      warming: warmerStats,
      health: {
        redis: await enhancedRedisService.isHealthy(),
        circuitBreaker: redisMetrics.circuitBreaker.state === 'CLOSED'
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching cache stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cache statistics'
    });
  }
});

// Perform cache actions
router.post('/actions', async (req, res) => {
  try {
    const { action } = req.body;
    
    switch (action) {
      case 'warm':
        await enhancedRedisService.warmCache();
        res.json({
          success: true,
          message: 'Cache warming initiated'
        });
        break;
        
      case 'clear':
        await enhancedRedisService.clear();
        res.json({
          success: true,
          message: 'Cache cleared successfully'
        });
        break;
        
      case 'resetMetrics':
        globalCacheMetrics.reset();
        globalCacheWarmer.resetStats();
        res.json({
          success: true,
          message: 'Metrics reset successfully'
        });
        break;
        
      default:
        res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }
  } catch (error: any) {
    console.error('Error performing cache action:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform cache action'
    });
  }
});

export default router;