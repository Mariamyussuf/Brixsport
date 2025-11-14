import { withRedis } from '../config/redis';
import { getOptionalRedisClient } from '../config/redis';
import { logger } from '../utils/logger';
import { RedisClientType, RedisModules, RedisFunctions, RedisScripts } from 'redis';

type RedisClient = RedisClientType<RedisModules, RedisFunctions, RedisScripts>;

type CacheOptions = {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  noCache?: boolean; // Bypass cache
  noStore?: boolean; // Don't store in cache
  staleWhileRevalidate?: number; // Time in seconds to serve stale while revalidating
  maxStaleAge?: number; // Maximum age in seconds to serve stale content
};

type CacheEntry<T> = {
  data: T;
  metadata: {
    cachedAt: number;
    expiresAt: number;
    etag: string;
    tags?: string[];
  };
};

export class RedisCacheService {
  private static readonly CACHE_PREFIX = 'brixsport:cache:';
  private static readonly TAG_PREFIX = 'brixsport:tags:';
  private static readonly DEFAULT_TTL = 300; // 5 minutes
  private static readonly STALE_TTL = 86400; // 24 hours for stale content

  /**
   * Get a value from cache
   */
  public static async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    if (options.noCache) return null;
    
    const cacheKey = this.getCacheKey(key);
    
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        return null;
      }
      
      const cached = await client.get(cacheKey);
      if (!cached) return null;
      
      const entry: CacheEntry<T> = JSON.parse(cached);
      const now = Date.now();
      
      // Check if entry is expired
      if (now > entry.metadata.expiresAt) {
        // If we have stale-while-revalidate, return stale data while updating in background
        if (options.staleWhileRevalidate && now < entry.metadata.expiresAt + (options.maxStaleAge || this.STALE_TTL) * 1000) {
          // Trigger background refresh
          this.refreshInBackground(key, options).catch(err => 
            logger.error('Background refresh failed:', err)
          );
          return entry.data;
        }
        return null;
      }
      
      return entry.data;
    } catch (error) {
      logger.error('Cache get error:', { key, error });
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  public static async set<T>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (options.noStore) return true;
    
    const cacheKey = this.getCacheKey(key);
    const ttl = options.ttl || this.DEFAULT_TTL;
    const now = Date.now();
    
    const entry: CacheEntry<T> = {
      data: value,
      metadata: {
        cachedAt: now,
        expiresAt: now + ttl * 1000,
        etag: this.generateETag(value),
        tags: options.tags
      }
    };
    
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        return true; // Pretend it was successful
      }
      
      const serialized = JSON.stringify(entry);
      
      // Set the main cache entry
      await client.set(cacheKey, serialized, { PX: ttl * 1000 });
      
      // Store cache key in tag sets for invalidation
      if (options.tags?.length) {
        await this.addTagsToKey(cacheKey, options.tags, client);
      }
      
      return true;
    } catch (error) {
      logger.error('Cache set error:', { key, error });
      return false;
    }
  }

  /**
   * Delete a value from cache
   */
  public static async delete(key: string): Promise<boolean> {
    const cacheKey = this.getCacheKey(key);
    
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        return true; // Pretend it was successful
      }
      
      // Get the entry to check for tags before deleting
      const cached = await client.get(cacheKey);
      if (cached) {
        const entry = JSON.parse(cached);
        if (entry.metadata?.tags?.length) {
          await this.removeKeyFromTags(cacheKey, entry.metadata.tags, client);
        }
      }
      
      // Delete the main cache entry
      const result = await client.del(cacheKey);
      return result > 0;
    } catch (error) {
      logger.error('Cache delete error:', { key, error });
      return false;
    }
  }

  /**
   * Invalidate cache by tags
   */
  public static async invalidateTags(tags: string[]): Promise<number> {
    if (!tags.length) return 0;
    
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        return 0;
      }
      
      let totalInvalidated = 0;
      
      for (const tag of tags) {
        const tagKey = this.getTagKey(tag);
        const cacheKeys = await client.sMembers(tagKey);
        
        if (cacheKeys.length > 0) {
          // Delete all cache entries with this tag
          const deleted = await client.del(cacheKeys);
          totalInvalidated += deleted;
          
          // Delete the tag set
          await client.del(tagKey);
        }
      }
      
      return totalInvalidated;
    } catch (error) {
      logger.error('Cache invalidate tags error:', { tags, error });
      return 0;
    }
  }

  /**
   * Clear the entire cache (use with caution)
   */
  public static async clear(): Promise<boolean> {
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        return true; // Pretend it was successful
      }
      
      // Using SCAN to safely delete keys in batches
      let cursor = 0;
      let keys: string[] = [];
      
      do {
        const result = await client.scan(cursor, {
          MATCH: `${this.CACHE_PREFIX}*`,
          COUNT: 100
        });
        
        cursor = result.cursor;
        const scanKeys = result.keys;
        keys = keys.concat(scanKeys);
        
        // Delete keys in batches of 1000
        if (keys.length >= 1000) {
          await client.del(keys);
          keys = [];
        }
      } while (cursor !== 0);
      
      // Delete any remaining keys
      if (keys.length > 0) {
        await client.del(keys);
      }
      
      // Clear all tag sets
      let tagCursor = 0;
      do {
        const tagResult = await client.scan(tagCursor, {
          MATCH: `${this.TAG_PREFIX}*`,
          COUNT: 100
        });
        
        tagCursor = tagResult.cursor;
        const tagKeys = tagResult.keys;
        
        if (tagKeys.length > 0) {
          await client.del(tagKeys);
        }
      } while (tagCursor !== 0);
      
      return true;
    } catch (error) {
      logger.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  public static async getStats() {
    type StatsResult = {
      memory: Record<string, string>;
      keys: {
        total: number;
        expired: number;
        active: number;
      };
      tags: {
        totalTags: number;
        totalTaggedKeys: number;
      };
    } | null;
    
    try {
      const client = await getOptionalRedisClient();
      if (!client) {
        return null;
      }
      
      const [memory, keys, tags] = await Promise.all([
        client.info('memory'),
        this.getKeyStats(client),
        this.getTagStats(client)
      ]);
      
      return {
        memory: this.parseInfo(memory),
        keys,
        tags
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return null;
    }
  }

  // Private helper methods
  
  private static getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }
  
  private static getTagKey(tag: string): string {
    return `${this.TAG_PREFIX}${tag}`;
  }
  
  private static generateETag(data: unknown): string {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `"${hash.toString(16)}"`;
  }
  
  private static async addTagsToKey(
    cacheKey: string, 
    tags: string[], 
    client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>
  ): Promise<void> {
    if (!tags.length) return;
    
    const pipeline = client.multi();
    
    for (const tag of tags) {
      const tagKey = this.getTagKey(tag);
      pipeline.sAdd(tagKey, cacheKey);
      // Set expiration on tag set to auto-cleanup
      pipeline.expire(tagKey, this.STALE_TTL);
    }
    
    try {
      await pipeline.exec();
    } catch (error) {
      logger.error('Failed to add tags to key:', { cacheKey, tags, error });
      throw error;
    }
  }
  
  private static async removeKeyFromTags(
    cacheKey: string, 
    tags: string[], 
    client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>
  ): Promise<void> {
    if (!tags.length) return;
    
    const pipeline = client.multi();
    
    for (const tag of tags) {
      const tagKey = this.getTagKey(tag);
      pipeline.sRem(tagKey, cacheKey);
    }
    
    try {
      await pipeline.exec();
    } catch (error) {
      logger.error('Failed to remove key from tags:', { cacheKey, tags, error });
      throw error;
    }
  }
  
  private static async refreshInBackground(
    key: string, 
    options: CacheOptions
  ): Promise<void> {
    // This would be implemented to refresh the cache in the background
    // For example, by emitting an event or calling a refresh handler
    logger.debug('Background refresh triggered for key:', key);
  }
  
  private static async getKeyStats(client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>) {
    try {
      const [totalKeys, expiredKeys] = await Promise.all([
        this.countKeys(client, this.CACHE_PREFIX + '*'),
        this.countKeys(client, this.CACHE_PREFIX + '*', true)
      ]);
      
      return {
        total: totalKeys,
        expired: expiredKeys,
        active: totalKeys - expiredKeys
      };
    } catch (error) {
      logger.error('Failed to get key stats:', error);
      return {
        total: 0,
        expired: 0,
        active: 0
      };
    }
  }
  
  private static async getTagStats(client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>) {
    try {
      const tagKeys = await this.scanKeys(client, this.TAG_PREFIX + '*');
      let totalTaggedKeys = 0;
      
      if (tagKeys.length > 0) {
        const counts = await Promise.all(
          tagKeys.map(tag => client.sCard(tag).catch(() => 0))
        );
        totalTaggedKeys = counts.reduce((sum: number, count: number) => sum + count, 0);
      }
      
      return {
        totalTags: tagKeys.length,
        totalTaggedKeys
      };
    } catch (error) {
      logger.error('Failed to get tag stats:', error);
      return {
        totalTags: 0,
        totalTaggedKeys: 0
      };
    }
  }
  
  private static async countKeys(
    client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>, 
    pattern: string, 
    checkTtl = false
  ): Promise<number> {
    let count = 0;
    let cursor = 0;
    
    try {
      do {
        const result = await client.scan(cursor, {
          MATCH: pattern,
          COUNT: 1000 // Process in batches of 1000
        });
        
        const nextCursor = typeof result === 'string' ? 0 : result.cursor;
        const keys = typeof result === 'string' ? [] : result.keys;
        
        cursor = nextCursor;
        
        if (keys && keys.length > 0) {
          if (checkTtl) {
            const ttls = await Promise.all(
              keys.map((key: string) => 
                client.ttl(key).catch(() => -2) // Return -2 on error to indicate key doesn't exist
              )
            );
            count += ttls.filter((ttl: number) => ttl === -1 || ttl > 0).length;
          } else {
            count += keys.length;
          }
        }
      } while (cursor !== 0);
      
      return count;
    } catch (error) {
      logger.error(`Failed to count keys for pattern ${pattern}:`, error);
      return 0;
    }
  }
  
  private static async scanKeys(
    client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>, 
    pattern: string
  ): Promise<string[]> {
    let cursor = 0;
    const keys: string[] = [];
    
    try {
      do {
        const result = await client.scan(cursor, {
          MATCH: pattern,
          COUNT: 1000 // Process in batches of 1000
        });
        
        const nextCursor = typeof result === 'string' ? 0 : result.cursor;
        const scanKeys = typeof result === 'string' ? [] : result.keys;
        
        cursor = nextCursor;
        
        if (scanKeys && scanKeys.length > 0) {
          keys.push(...scanKeys);
        }
      } while (cursor !== 0);
      
      return keys;
    } catch (error) {
      logger.error(`Failed to scan keys for pattern ${pattern}:`, error);
      return [];
    }
  }
  
  private static parseInfo(info: string): Record<string, string> {
    const result: Record<string, string> = {};
    
    if (!info) return result;
    
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      if (!line || line.startsWith('#')) continue;
      
      const separatorIndex = line.indexOf(':');
      if (separatorIndex === -1) continue;
      
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      
      if (key) {
        result[key] = value;
      }
    }
    
    return result;
  }
}

export const redisCache = RedisCacheService;
