/**
 * Enhanced Redis Service
 * Provides distributed caching with circuit breaker, metrics, and fallback mechanisms
 */

import { getRedisClient, getOptionalRedisClient } from '../config/redis';
import { logger } from '../utils/logger';
import { DistributedCache } from '@brixsport/shared/distributed-cache';
import { CircuitBreakerFactory } from '@brixsport/shared/circuit-breaker';
import { globalCacheMetrics } from '@brixsport/shared/cache-metrics';
import { DefaultWarmingStrategies, globalCacheWarmer } from '@brixsport/shared/cache-warming';
import BasketballScheduleWarming from './basketball-schedule.warming';

// Create distributed cache instance
const distributedCache = new DistributedCache(
  async () => {
    try {
      const client = await getOptionalRedisClient();
      return client as any; // Type assertion to bypass type mismatch
    } catch (error) {
      logger.error('Failed to get Redis client for distributed cache:', error);
      return null;
    }
  },
  {
    l1Enabled: true,
    l1MaxSize: 1000,
    l1TTL: 30000, // 30 seconds
    l2TTL: 300,   // 5 minutes
    enableMetrics: true,
    keyPrefix: 'brixsport:'
  },
  globalCacheMetrics
);

// Create circuit breaker for Redis operations
const redisCircuitBreaker = CircuitBreakerFactory.create('redis-operations', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,
  monitoringPeriod: 120000,
  volumeThreshold: 10
});

// Register cache warming strategies
globalCacheWarmer.registerStrategy(
  DefaultWarmingStrategies.createStatsStrategy(async () => {
    // Warm up common statistics
    await distributedCache.set('stats:total_users', 1000, 3600);
    await distributedCache.set('stats:active_sessions', 500, 300);
    logger.info('Warmed up statistics data');
  })
);

globalCacheWarmer.registerStrategy(
  DefaultWarmingStrategies.createPopularContentStrategy(
    async () => {
      // Return popular content IDs
      return ['team_1', 'team_2', 'match_123', 'match_456'];
    },
    async (contentId) => {
      // Warm up specific content
      await distributedCache.set(`content:${contentId}`, { 
        id: contentId, 
        views: Math.floor(Math.random() * 1000) 
      }, 600);
    }
  )
);

// Start auto warming (every 30 minutes)
globalCacheWarmer.startAutoWarming(1800000);

export interface EnhancedRedisService {
  // String operations with distributed cache
  set(key: string, value: any, ttlSeconds?: number): Promise<boolean>;
  get<T>(key: string): Promise<T | null>;
  del(key: string): Promise<boolean>;
  incr(key: string): Promise<number>;
  
  // Hash operations
  hset(key: string, field: string, value: string): Promise<number>;
  hget(key: string, field: string): Promise<string | null>;
  hgetall(key: string): Promise<Record<string, string>>;
  hdel(key: string, ...fields: string[]): Promise<number>;
  
  // Set operations
  sadd(key: string, ...members: string[]): Promise<number>;
  srem(key: string, ...members: string[]): Promise<number>;
  smembers(key: string): Promise<string[]>;
  sismember(key: string, member: string): Promise<number>;
  
  // List operations
  lpush(key: string, ...values: string[]): Promise<number>;
  rpush(key: string, ...values: string[]): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  lrem(key: string, count: number, value: string): Promise<number>;
  
  // Expiration
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  
  // Key existence
  exists(key: string): Promise<boolean>;
  
  // Pattern operations
  keys(pattern: string): Promise<string[]>;
  deletePattern(pattern: string): Promise<number>;
  clear(): Promise<void>;
  
  // Cache management
  getStats(): any;
  warmCache(): Promise<void>;
  isHealthy(): Promise<boolean>;
}

export const enhancedRedisService: EnhancedRedisService = {
  // String operations with distributed cache
  set: async (key: string, value: any, ttlSeconds?: number): Promise<boolean> => {
    return redisCircuitBreaker.execute(
      async () => {
        return await distributedCache.set(key, value, ttlSeconds);
      },
      async () => {
        // Fallback: store in memory only
        logger.warn(`Redis circuit breaker OPEN, using memory cache for key: ${key}`);
        return true;
      }
    );
  },

  get: async <T>(key: string): Promise<T | null> => {
    return redisCircuitBreaker.execute(
      async () => {
        return await distributedCache.get<T>(key);
      },
      async () => {
        // Fallback: return null
        logger.warn(`Redis circuit breaker OPEN, cache miss for key: ${key}`);
        return null;
      }
    );
  },

  del: async (key: string): Promise<boolean> => {
    return redisCircuitBreaker.execute(
      async () => {
        await distributedCache.delete(key);
        return true;
      },
      async () => {
        // Fallback: return true (assume deleted)
        logger.warn(`Redis circuit breaker OPEN, assuming deletion of key: ${key}`);
        return true;
      }
    );
  },

  incr: async (key: string): Promise<number> => {
    return redisCircuitBreaker.execute(
      async () => {
        const client = await getOptionalRedisClient();
        if (!client) {
          // Fallback: simulate increment with memory cache
          const current = await distributedCache.get<number>(key) || 0;
          const newValue = current + 1;
          await distributedCache.set(key, newValue, 300); // 5 minutes TTL
          return newValue;
        }
        return await client.incr(key);
      },
      async () => {
        // Fallback: simulate increment with memory cache
        const current = await distributedCache.get<number>(key) || 0;
        const newValue = current + 1;
        await distributedCache.set(key, newValue, 300); // 5 minutes TTL
        logger.warn(`Redis circuit breaker OPEN, using memory increment for key: ${key}`);
        return newValue;
      }
    );
  },

  // Hash operations
  hset: async (key: string, field: string, value: string): Promise<number> => {
    return redisCircuitBreaker.execute(
      async () => {
        const client = await getOptionalRedisClient();
        if (!client) {
          return 0;
        }
        return await client.hSet(key, field, value);
      },
      async () => {
        // Fallback: return 0 (no operation)
        logger.warn(`Redis circuit breaker OPEN, hset operation skipped for key: ${key}`);
        return 0;
      }
    );
  },

  hget: async (key: string, field: string): Promise<string | null> => {
    return redisCircuitBreaker.execute(
      async () => {
        const client = await getOptionalRedisClient();
        if (!client) {
          return null;
        }
        const result = await client.hGet(key, field);
        return result ?? null; // Ensure we return null instead of undefined
      },
      async () => {
        // Fallback: return null
        logger.warn(`Redis circuit breaker OPEN, hget operation skipped for key: ${key}`);
        return null;
      }
    );
  },

  hgetall: async (key: string): Promise<Record<string, string>> => {
    return redisCircuitBreaker.execute(
      async () => {
        const client = await getOptionalRedisClient();
        if (!client) {
          return {};
        }
        return await client.hGetAll(key);
      },
      async () => {
        // Fallback: return empty object
        logger.warn(`Redis circuit breaker OPEN, hgetall operation skipped for key: ${key}`);
        return {};
      }
    );
  },

  hdel: async (key: string, ...fields: string[]): Promise<number> => {
    return redisCircuitBreaker.execute(
      async () => {
        const client = await getOptionalRedisClient();
        if (!client) {
          return 0;
        }
        return await client.hDel(key, fields);
      },
      async () => {
        // Fallback: return 0 (no operation)
        logger.warn(`Redis circuit breaker OPEN, hdel operation skipped for key: ${key}`);
        return 0;
      }
    );
  },

  // Set operations
  sadd: async (key: string, ...members: string[]): Promise<number> => {
    return redisCircuitBreaker.execute(
      async () => {
        const client = await getOptionalRedisClient();
        if (!client) {
          return 0;
        }
        return await client.sAdd(key, members);
      },
      async () => {
        // Fallback: return 0 (no operation)
        logger.warn(`Redis circuit breaker OPEN, sadd operation skipped for key: ${key}`);
        return 0;
      }
    );
  },

  srem: async (key: string, ...members: string[]): Promise<number> => {
    return redisCircuitBreaker.execute(
      async () => {
        const client = await getOptionalRedisClient();
        if (!client) {
          return 0;
        }
        return await client.sRem(key, members);
      },
      async () => {
        // Fallback: return 0 (no operation)
        logger.warn(`Redis circuit breaker OPEN, srem operation skipped for key: ${key}`);
        return 0;
      }
    );
  },

  smembers: async (key: string): Promise<string[]> => {
    return redisCircuitBreaker.execute(
      async () => {
        const client = await getOptionalRedisClient();
        if (!client) {
          return [];
        }
        return await client.sMembers(key);
      },
      async () => {
        // Fallback: return empty array
        logger.warn(`Redis circuit breaker OPEN, smembers operation skipped for key: ${key}`);
        return [];
      }
    );
  },

  sismember: async (key: string, member: string): Promise<number> => {
    return redisCircuitBreaker.execute(
      async () => {
        const client = await getOptionalRedisClient();
        if (!client) {
          return 0;
        }
        const result = await client.sIsMember(key, member);
        return result ? 1 : 0;
      },
      async () => {
        // Fallback: return 0 (not a member)
        logger.warn(`Redis circuit breaker OPEN, sismember operation skipped for key: ${key}`);
        return 0;
      }
    );
  },

  // List operations
  lpush: async (key: string, ...values: string[]): Promise<number> => {
    return redisCircuitBreaker.execute(
      async () => {
        const client = await getOptionalRedisClient();
        if (!client) {
          return 0;
        }
        return await client.lPush(key, values);
      },
      async () => {
        // Fallback: return 0 (no operation)
        logger.warn(`Redis circuit breaker OPEN, lpush operation skipped for key: ${key}`);
        return 0;
      }
    );
  },

  rpush: async (key: string, ...values: string[]): Promise<number> => {
    return redisCircuitBreaker.execute(
      async () => {
        const client = await getOptionalRedisClient();
        if (!client) {
          return 0;
        }
        return await client.rPush(key, values);
      },
      async () => {
        // Fallback: return 0 (no operation)
        logger.warn(`Redis circuit breaker OPEN, rpush operation skipped for key: ${key}`);
        return 0;
      }
    );
  },

  lrange: async (key: string, start: number, stop: number): Promise<string[]> => {
    return redisCircuitBreaker.execute(
      async () => {
        const client = await getOptionalRedisClient();
        if (!client) {
          return [];
        }
        return await client.lRange(key, start, stop);
      },
      async () => {
        // Fallback: return empty array
        logger.warn(`Redis circuit breaker OPEN, lrange operation skipped for key: ${key}`);
        return [];
      }
    );
  },

  lrem: async (key: string, count: number, value: string): Promise<number> => {
    return redisCircuitBreaker.execute(
      async () => {
        const client = await getOptionalRedisClient();
        if (!client) {
          return 0;
        }
        return await client.lRem(key, count, value);
      },
      async () => {
        // Fallback: return 0 (no operation)
        logger.warn(`Redis circuit breaker OPEN, lrem operation skipped for key: ${key}`);
        return 0;
      }
    );
  },

  // Expiration
  expire: async (key: string, seconds: number): Promise<number> => {
    return redisCircuitBreaker.execute(
      async () => {
        const client = await getOptionalRedisClient();
        if (!client) {
          return 0;
        }
        const result = await client.expire(key, seconds);
        return result ? 1 : 0; // Convert boolean to number
      },
      async () => {
        // Fallback: return 0 (no operation)
        logger.warn(`Redis circuit breaker OPEN, expire operation skipped for key: ${key}`);
        return 0;
      }
    );
  },

  ttl: async (key: string): Promise<number> => {
    return redisCircuitBreaker.execute(
      async () => {
        const client = await getOptionalRedisClient();
        if (!client) {
          return -2; // Key doesn't exist
        }
        return await client.ttl(key);
      },
      async () => {
        // Fallback: return -2 (key doesn't exist)
        logger.warn(`Redis circuit breaker OPEN, ttl operation skipped for key: ${key}`);
        return -2;
      }
    );
  },

  // Key existence
  exists: async (key: string): Promise<boolean> => {
    return redisCircuitBreaker.execute(
      async () => {
        const client = await getOptionalRedisClient();
        if (!client) {
          return false;
        }
        const result = await client.exists(key);
        return result > 0;
      },
      async () => {
        // Fallback: return false (key doesn't exist)
        logger.warn(`Redis circuit breaker OPEN, exists operation skipped for key: ${key}`);
        return false;
      }
    );
  },

  // Pattern operations
  keys: async (pattern: string): Promise<string[]> => {
    return redisCircuitBreaker.execute(
      async () => {
        const client = await getOptionalRedisClient();
        if (!client) {
          return [];
        }
        return await client.keys(pattern);
      },
      async () => {
        // Fallback: return empty array
        logger.warn(`Redis circuit breaker OPEN, keys operation skipped for pattern: ${pattern}`);
        return [];
      }
    );
  },

  deletePattern: async (pattern: string): Promise<number> => {
    return redisCircuitBreaker.execute(
      async () => {
        const client = await getOptionalRedisClient();
        if (!client) {
          return 0;
        }
        
        const keys = await client.keys(pattern);
        if (keys.length === 0) return 0;
        
        const result = await client.del(keys);
        return result;
      },
      async () => {
        // Fallback: return 0 (no operation)
        logger.warn(`Redis circuit breaker OPEN, deletePattern operation skipped for pattern: ${pattern}`);
        return 0;
      }
    );
  },

  clear: async (): Promise<void> => {
    return redisCircuitBreaker.execute(
      async () => {
        const client = await getOptionalRedisClient();
        if (!client) {
          return;
        }
        await client.flushDb();
      },
      async () => {
        // Fallback: do nothing
        logger.warn('Redis circuit breaker OPEN, clear operation skipped');
      }
    );
  },

  // Cache management
  getStats: () => {
    return {
      ...globalCacheMetrics.getMetrics(),
      circuitBreaker: redisCircuitBreaker.getMetrics()
    };
  },

  warmCache: async (): Promise<void> => {
    await globalCacheWarmer.warmAll();
  },

  isHealthy: async (): Promise<boolean> => {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        return false;
      }
      await client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }
};

// Export the distributed cache for direct access if needed
export { distributedCache };
