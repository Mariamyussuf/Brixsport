import { logger } from '../utils/logger';
import { redisService, RedisService } from './redis.service';
import { supabaseService } from './supabase.service';
import { supabase } from './supabase.service';
import { getOptionalRedisClient } from '../config/redis';
import { RedisCacheService } from './redis-cache.service';

// Fallback in-memory cache for when Redis is unavailable
const memoryCache = new Map<string, { data: any; expires: number }>();

// Check if Redis is available
const isRedisAvailable = async (): Promise<boolean> => {
  try {
    const client = await getOptionalRedisClient();
    return !!client;
  } catch (error) {
    return false;
  }
};

// Cache service class
class CacheService {
  // Generic get method
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try Redis first if available
      if (await isRedisAvailable()) {
        return await RedisCacheService.get<T>(key);
      }
      
      // Fallback to memory cache
      const entry = memoryCache.get(key);
      if (entry && Date.now() < entry.expires) {
        return entry.data as T;
      }
      
      // Remove expired entry
      if (entry) {
        memoryCache.delete(key);
      }
      
      return null;
    } catch (error) {
      logger.error('Cache get error:', { key, error });
      return null;
    }
  }

  // Generic set method
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<boolean> {
    try {
      // Try Redis first if available
      if (await isRedisAvailable()) {
        return await RedisCacheService.set(key, value, { ttl: ttlSeconds });
      }
      
      // Fallback to memory cache
      const expires = Date.now() + (ttlSeconds * 1000);
      memoryCache.set(key, { data: value, expires });
      
      return true;
    } catch (error) {
      logger.error('Cache set error:', { key, error });
      return false;
    }
  }

  // Generic delete method
  async delete(key: string): Promise<boolean> {
    try {
      // Try Redis first if available
      if (await isRedisAvailable()) {
        return await RedisCacheService.delete(key);
      }
      
      // Fallback to memory cache
      return memoryCache.delete(key);
    } catch (error) {
      logger.error('Cache delete error:', { key, error });
      return false;
    }
  }

  // Get cached statistics with type
  async getCachedStatistics(key: string, type: string): Promise<any> {
    return await this.get(key);
  }

  // Set cached statistics with type
  async setCachedStatistics(key: string, type: string, data: any, ttlMinutes: number = 5): Promise<boolean> {
    return await this.set(key, data, ttlMinutes * 60);
  }

  // Cache user engagement data
  async cacheUserEngagement(userId: string, forceRefresh: boolean = false): Promise<any> {
    const cacheKey = `user_engagement_${userId}`;
    
    if (!forceRefresh) {
      const cached = await this.get(cacheKey);
      if (cached) return cached;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_engagement_metrics')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch user engagement: ${error.message}`);
      }
      
      const stats = data || {
        user_id: userId,
        total_activities: 0,
        active_days: 0,
        activities_last_7_days: 0,
        activities_last_30_days: 0,
        last_activity: null,
        engagement_level: 'inactive',
        engagement_score: 0
      };
      
      await this.set(cacheKey, stats, 300); // Cache for 5 minutes
      return stats;
    } catch (error) {
      logger.error('Cache user engagement error', { userId, error });
      return null;
    }
  }

  // Cache activity trends
  async cacheActivityTrends(days: number = 30): Promise<any> {
    const cacheKey = `activity_trends_${days}`;
    
    const cached = await this.get(cacheKey);
    if (cached) return cached;
    
    try {
      const { data, error } = await supabase.rpc('generate_activity_trends', { p_days: days });
      
      if (error) {
        throw new Error(`Failed to generate activity trends: ${error.message}`);
      }
      
      await this.set(cacheKey, data, 900); // Cache for 15 minutes
      return data;
    } catch (error) {
      logger.error('Cache activity trends error', { days, error });
      return null;
    }
  }

  // Cache real-time metrics
  async cacheRealtimeMetrics(forceRefresh: boolean = false): Promise<any> {
    const cacheKey = 'realtime_metrics';
    
    if (!forceRefresh) {
      const cached = await this.get(cacheKey);
      if (cached) return cached;
    }
    
    try {
      // Get active users count
      const activeUsersResult = await supabase
        .from('user_sessions')
        .select('id', { count: 'exact' })
        .gte('last_activity', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Last 5 minutes
      
      // Get recent activities count
      const recentActivitiesResult = await supabase
        .from('user_activity_logs')
        .select('id', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Last hour
      
      const metrics = {
        activeUsers: activeUsersResult.count || 0,
        recentActivities: recentActivitiesResult.count || 0,
        timestamp: new Date().toISOString()
      };
      
      await this.set(cacheKey, metrics, 60); // Cache for 1 minute
      return metrics;
    } catch (error) {
      logger.error('Cache real-time metrics error', error);
      return null;
    }
  }

  // Cache team statistics
  async cacheTeamStats(teamId: string, forceRefresh: boolean = false): Promise<any> {
    const cacheKey = `team_stats_${teamId}`;
    
    if (!forceRefresh) {
      const cached = await this.get(cacheKey);
      if (cached) return cached;
    }
    
    try {
      const { data, error } = await supabase
        .from('team_statistics')
        .select('*')
        .eq('team_id', teamId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch team stats: ${error.message}`);
      }
      
      const stats = data || {
        team_id: teamId,
        wins: 0,
        losses: 0,
        draws: 0,
        goals_for: 0,
        goals_against: 0,
        points: 0
      };
      
      await this.set(cacheKey, stats, 600); // Cache for 10 minutes
      return stats;
    } catch (error) {
      logger.error('Cache team stats error', { teamId, error });
      return null;
    }
  }

  // Invalidate team caches
  async invalidateTeamCaches(teamId: string): Promise<void> {
    const cacheKey = `team_stats_${teamId}`;
    await this.delete(cacheKey);
  }

  // Invalidate user caches
  async invalidateUserCaches(userId: string): Promise<void> {
    const cacheKey = `user_engagement_${userId}`;
    await this.delete(cacheKey);
  }

  // Get cache statistics
  async getStats(): Promise<any> {
    try {
      if (await isRedisAvailable()) {
        return await RedisCacheService.getStats();
      }
      
      // Return basic memory cache stats
      return {
        l1Size: memoryCache.size,
        l1MaxSize: 1000, // Default max size
        metrics: {
          hits: 0,
          misses: 0,
          hitRate: 0,
          sets: memoryCache.size,
          deletes: 0,
          errors: 0,
          totalOperations: memoryCache.size,
          avgResponseTime: 0,
          lastResetTime: Date.now()
        },
        health: {
          healthy: true,
          hitRate: 0,
          errorRate: 0,
          avgResponseTime: 0,
          issues: []
        },
        percentiles: {
          p50: 0,
          p95: 0,
          p99: 0
        },
        circuitBreaker: {
          state: 'CLOSED',
          failures: 0,
          successes: 0,
          consecutiveFailures: 0,
          consecutiveSuccesses: 0,
          totalRequests: 0,
          rejectedRequests: 0,
          lastFailureTime: null,
          lastSuccessTime: null,
          lastStateChange: Date.now()
        }
      };
    } catch (error) {
      logger.error('Get cache stats error', error);
      return null;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();