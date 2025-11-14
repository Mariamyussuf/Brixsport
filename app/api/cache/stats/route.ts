import { NextResponse } from 'next/server';
import { getRedisMetrics } from '../../../../brixsport-backend/apps/api/src/config/redis';
import { enhancedRedisService } from '../../../../brixsport-backend/apps/api/src/services/enhanced-redis.service';
import { globalCacheWarmer } from '../../../../brixsport-backend/packages/shared/cache-warming.js';
import { globalCacheMetrics } from '../../../../brixsport-backend/packages/shared/cache-metrics.js';

export async function GET() {
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

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch cache statistics'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json();
    
    switch (action) {
      case 'warm':
        await enhancedRedisService.warmCache();
        return NextResponse.json({
          success: true,
          message: 'Cache warming initiated'
        });
        
      case 'clear':
        await enhancedRedisService.clear();
        return NextResponse.json({
          success: true,
          message: 'Cache cleared successfully'
        });
        
      case 'resetMetrics':
        globalCacheMetrics.reset();
        globalCacheWarmer.resetStats();
        return NextResponse.json({
          success: true,
          message: 'Metrics reset successfully'
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error performing cache action:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to perform cache action'
    }, { status: 500 });
  }
}