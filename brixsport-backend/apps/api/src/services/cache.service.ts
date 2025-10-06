import { logger } from '../utils/logger';
import { redisService, RedisService } from './redis.service';
import { supabaseService } from './supabase.service';
import { supabase } from './supabase.service';
import { getRedisClient } from '../config/redis';

// Fallback in-memory cache for when Redis is unavailable
const memoryCache = new Map<string, { data: any; expires: number }>();

// Check if Redis is available
const isRedisAvailable = async (): Promise<boolean> => {
  try {
    const client = await getRedisClient();
    return client?.isOpen ?? false;
  } catch (error) {
    return false;
  }
};

// Memory cache implementation
const memoryCacheService: Pick<RedisService, 'set' | 'get' | 'del'> = {
  set: async (key: string, value: string, ttl: number = 300) => {
    const expires = Date.now() + ttl * 1000;
    memoryCache.set(key, { data: value, expires });
    logger.warn('Using memory cache (Redis unavailable)', { key, ttl });
  },
  
  get: async (key: string) => {
    const item = memoryCache.get(key);
    if (!item) return null;
    
    // Check if item has expired
    if (Date.now() > item.expires) {
      memoryCache.delete(key);
      return null;
    }
    
    return item.data;
  },
  
  del: async (key: string) => {
    memoryCache.delete(key);
    return 1;
  }
};

// Clean up expired memory cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, { expires }] of memoryCache.entries()) {
    if (now > expires) {
      memoryCache.delete(key);
    }
  }
}, 60 * 1000); // Run every minute

export const cacheService = {
  // Set cache value
  set: async (key: string, value: any, ttl: number = 300) => {
    try {
      const serializedValue = JSON.stringify(value);
      
      const redisAvailable = await isRedisAvailable();

      if (redisAvailable) {
        await redisService.set(key, serializedValue, ttl);
        logger.info('Cache set in Redis', { key, ttl });
      } else {
        await memoryCacheService.set(key, serializedValue, ttl);
      }
    } catch (error: any) {
      logger.error('Cache set error, falling back to memory', error);
      await memoryCacheService.set(key, JSON.stringify(value), ttl);
    }
  },
  // Get cache value
  get: async (key: string) => {
    try {
      let cached: string | null = null;

      const redisAvailable = await isRedisAvailable();
      if (redisAvailable) {
        cached = await redisService.get(key);
      } else {
        cached = await memoryCacheService.get(key);
      }

      if (!cached) {
        logger.info('Cache miss', { key, source: redisAvailable ? 'Redis' : 'Memory' });
        return null;
      }

      logger.info('Cache hit', { key, source: redisAvailable ? 'Redis' : 'Memory' });
      return JSON.parse(cached);
    } catch (error: any) {
      logger.error('Cache get error, trying memory fallback', error);
      try {
        const cached = await memoryCacheService.get(key);
        return cached ? JSON.parse(cached) : null;
      } catch (fallbackError: any) {
        logger.error('Memory cache get error', fallbackError);
        return null;
      }
    }
  },
  // Delete cache value
  delete: async (key: string) => {
    try {
      const redisAvailable = await isRedisAvailable();

      if (redisAvailable) {
        await redisService.del(key);
      } else {
        await memoryCacheService.del(key);
      }
      logger.info('Cache deleted', { 
        key, 
        source: redisAvailable ? 'Redis' : 'Memory' 
      });
    } catch (error: any) {
      logger.error('Cache delete error, trying memory fallback', error);
      try {
        await memoryCacheService.del(key);
      } catch (e) {
        logger.error('Memory cache delete error', e);
      }
    }
  },
  
  // Clear all cache
  clear: async () => {
    try {
      const redisAvailable = await isRedisAvailable();

      if (redisAvailable) {
        // Get all keys
        const keys = await redisService.keys('*');
        if (keys.length > 0) {
          // Delete keys in batches to avoid performance issues
          const BATCH_SIZE = 100;
          for (let i = 0; i < keys.length; i += BATCH_SIZE) {
            const batch = keys.slice(i, i + BATCH_SIZE);
            // Use Promise.all to delete keys in parallel within the batch
            await Promise.all(batch.map(key => redisService.del(key)));
          }
        }
        logger.info('Redis cache cleared');
      } else {
        memoryCache.clear();
        logger.info('Memory cache cleared');
      }
    } catch (error: any) {
      logger.error('Cache clear error', error);
      throw error;
    }
  },
  
  // Get cache stats
  getStats: async () => {
    try {
      // Get all keys
      const keys = await redisService.keys('*');
      const stats = {
        size: keys.length,
        keys: keys
      };
      return stats;
    } catch (error: any) {
      logger.error('Cache stats error', error);
      throw error;
    }
  },

  // Database-backed cache methods
  
  // Get cached statistics with database fallback
  getCachedStatistics: async (cacheKey: string, cacheType: string) => {
    try {
      // First try Redis cache
      const redisData = await cacheService.get(`stats:${cacheKey}`);
      if (redisData) {
        return redisData;
      }
      
      // Then try database cache
      const { data: result, error } = await supabase.rpc('get_cached_statistics', {
        p_cache_key: cacheKey,
        p_cache_type: cacheType
      });
      
      if (!error && result) {
        const dbData = result;
        // Store in Redis for faster access
        await cacheService.set(`stats:${cacheKey}`, dbData, 300); // 5 minutes
        return dbData;
      }
      
      return null;
    } catch (error: any) {
      logger.error('Get cached statistics error', error);
      return null;
    }
  },
  
  // Set cached statistics in both Redis and database
  setCachedStatistics: async (cacheKey: string, cacheType: string, data: any, ttlMinutes: number = 60) => {
    try {
      // Store in Redis
      await cacheService.set(`stats:${cacheKey}`, data, ttlMinutes * 60);
      
      // Store in database
      await supabase.rpc('set_cached_statistics', {
        p_cache_key: cacheKey,
        p_cache_type: cacheType,
        p_data: JSON.stringify(data),
        p_ttl_minutes: ttlMinutes
      });
      
      logger.info('Statistics cached', { cacheKey, cacheType, ttlMinutes });
    } catch (error: any) {
      logger.error('Set cached statistics error', error);
      throw error;
    }
  },
  
  // Cache user engagement metrics
  cacheUserEngagement: async (userId: string, forceRefresh: boolean = false) => {
    const cacheKey = `user_engagement:${userId}`;
    
    if (!forceRefresh) {
      const cached = await cacheService.getCachedStatistics(cacheKey, 'user_engagement');
      if (cached) {
        return cached;
      }
    }
    
    try {
      // Get fresh data from materialized view
      const { data: result, error } = await supabase
        .from('user_engagement_metrics')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (!error && result) {
        const engagementData = result;
        await cacheService.setCachedStatistics(cacheKey, 'user_engagement', engagementData, 30);
        return engagementData;
      }
      
      return null;
    } catch (error: any) {
      logger.error('Cache user engagement error', error);
      throw error;
    }
  },
  
  // Cache team statistics
  cacheTeamStats: async (teamId: string, forceRefresh: boolean = false) => {
    const cacheKey = `team_stats:${teamId}`;
    
    if (!forceRefresh) {
      const cached = await cacheService.getCachedStatistics(cacheKey, 'team_stats');
      if (cached) {
        return cached;
      }
    }
    
    try {
      // Get fresh data from materialized view
      const { data: result, error } = await supabase
        .from('team_statistics')
        .select('*')
        .eq('team_id', teamId)
        .single();
      
      if (!error && result) {
        const teamData = result;
        await cacheService.setCachedStatistics(cacheKey, 'team_stats', teamData, 60);
        return teamData;
      }
      
      return null;
    } catch (error: any) {
      logger.error('Cache team stats error', error);
      throw error;
    }
  },
  
  // Cache activity trends
  cacheActivityTrends: async (days: number = 30, forceRefresh: boolean = false) => {
    const cacheKey = `activity_trends:${days}d`;
    
    if (!forceRefresh) {
      const cached = await cacheService.getCachedStatistics(cacheKey, 'activity_trends');
      if (cached) {
        return cached;
      }
    }
    
    try {
      // Get fresh data from materialized view
      const { data: result, error } = await supabase
        .from('activity_trends')
        .select('*')
        .gte('activity_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('activity_date', { ascending: false });
      
      if (!error && result) {
        const trendsData = result;
        await cacheService.setCachedStatistics(cacheKey, 'activity_trends', trendsData, 15); // 15 minutes
        return trendsData;
      }
      
      return [];
    } catch (error: any) {
      logger.error('Cache activity trends error', error);
      throw error;
    }
  },
  
  // Cache real-time metrics
  cacheRealtimeMetrics: async (forceRefresh: boolean = false) => {
    const cacheKey = 'realtime_metrics';
    
    if (!forceRefresh) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    try {
      // Get fresh real-time data
      const { data: result, error } = await supabase.rpc('get_realtime_metrics');
      
      if (!error && result) {
        const metricsData = result;
        await cacheService.set(cacheKey, metricsData, 30); // 30 seconds for real-time data
        return metricsData;
      }
      
      return null;
    } catch (error: any) {
      logger.error('Cache realtime metrics error', error);
      throw error;
    }
  },
  
  // Invalidate related caches
  invalidateUserCaches: async (userId: string) => {
    try {
      const patterns = [
        `stats:user_engagement:${userId}`,
        `stats:user_activity:${userId}`,
        `stats:user_stats:${userId}`
      ];
      
      for (const pattern of patterns) {
        await cacheService.delete(pattern);
      }
      
      logger.info('User caches invalidated', { userId });
    } catch (error: any) {
      logger.error('Invalidate user caches error', error);
    }
  },
  
  // Invalidate team caches
  invalidateTeamCaches: async (teamId: string) => {
    try {
      const patterns = [
        `stats:team_stats:${teamId}`,
        `stats:team_matches:${teamId}`,
        `stats:team_events:${teamId}`
      ];
      
      for (const pattern of patterns) {
        await cacheService.delete(pattern);
      }
      
      logger.info('Team caches invalidated', { teamId });
    } catch (error: any) {
      logger.error('Invalidate team caches error', error);
    }
  },
  
  // Warm up frequently accessed caches
  warmUpCaches: async () => {
    try {
      logger.info('Starting cache warm-up');
      
      // Warm up real-time metrics
      await cacheService.cacheRealtimeMetrics(true);
      
      // Warm up activity trends
      await cacheService.cacheActivityTrends(7, true);
      await cacheService.cacheActivityTrends(30, true);
      
      // Get top active users and warm their engagement data
      const { data: activeUsersResult, error: activeUsersError } = await supabase
        .from('user_engagement_metrics')
        .select('user_id')
        .order('engagement_score', { ascending: false })
        .limit(10);
      
      if (!activeUsersError && activeUsersResult) {
        for (const user of activeUsersResult) {
          await cacheService.cacheUserEngagement(user.user_id, true);
        }
      }
      
      logger.info('Cache warm-up completed');
    } catch (error: any) {
      logger.error('Cache warm-up error', error);
    }
  }
};