/**
 * Distributed Cache Layer
 * Provides multi-level caching with L1 (memory) and L2 (Redis) tiers
 */

import { RedisClientType } from 'redis';
import { CircuitBreaker, CircuitBreakerFactory } from './circuit-breaker';
import { CacheMetricsCollector } from './cache-metrics';

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

export interface DistributedCacheOptions {
  l1Enabled: boolean;
  l1MaxSize: number;
  l1TTL: number; // milliseconds
  l2TTL: number; // seconds
  enableMetrics: boolean;
  keyPrefix: string;
}

export class DistributedCache {
  private l1Cache: Map<string, CacheEntry<any>> = new Map();
  private circuitBreaker: CircuitBreaker;
  private metrics: CacheMetricsCollector;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(
    private redisClient: (() => Promise<RedisClientType | null>) | null,
    private options: DistributedCacheOptions,
    metrics?: CacheMetricsCollector
  ) {
    this.circuitBreaker = CircuitBreakerFactory.create('redis-cache', {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
      monitoringPeriod: 60000,
      volumeThreshold: 10
    });

    this.metrics = metrics || new CacheMetricsCollector();

    // Start L1 cache cleanup
    if (this.options.l1Enabled) {
      this.startL1Cleanup();
    }
  }

  /**
   * Get value from cache (L1 then L2)
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    const fullKey = this.getFullKey(key);

    try {
      // Try L1 cache first
      if (this.options.l1Enabled) {
        const l1Result = this.getFromL1<T>(fullKey);
        if (l1Result !== null) {
          const duration = Date.now() - startTime;
          this.metrics.recordHit(fullKey, duration);
          return l1Result;
        }
      }

      // Try L2 (Redis) cache
      if (this.redisClient) {
        const l2Result = await this.getFromL2<T>(fullKey);
        if (l2Result !== null) {
          // Backfill L1 cache
          if (this.options.l1Enabled) {
            this.setInL1(fullKey, l2Result, this.options.l1TTL);
          }
          const duration = Date.now() - startTime;
          this.metrics.recordHit(fullKey, duration);
          return l2Result;
        }
      }

      // Cache miss
      const duration = Date.now() - startTime;
      this.metrics.recordMiss(fullKey, duration);
      return null;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.recordError('get', fullKey, error as Error, duration);
      
      // On Redis failure, try L1 cache only
      if (this.options.l1Enabled) {
        return this.getFromL1<T>(fullKey);
      }
      
      return null;
    }
  }

  /**
   * Set value in cache (both L1 and L2)
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    const startTime = Date.now();
    const fullKey = this.getFullKey(key);
    const ttl = ttlSeconds || this.options.l2TTL;

    try {
      // Set in L1 cache
      if (this.options.l1Enabled) {
        this.setInL1(fullKey, value, this.options.l1TTL);
      }

      // Set in L2 (Redis) cache
      if (this.redisClient) {
        await this.setInL2(fullKey, value, ttl);
      }

      const duration = Date.now() - startTime;
      this.metrics.recordSet(fullKey, duration);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.recordError('set', fullKey, error as Error, duration);
      
      // If Redis fails, at least we have L1
      return this.options.l1Enabled;
    }
  }

  /**
   * Delete value from cache (both L1 and L2)
   */
  async delete(key: string): Promise<boolean> {
    const startTime = Date.now();
    const fullKey = this.getFullKey(key);

    try {
      // Delete from L1
      if (this.options.l1Enabled) {
        this.l1Cache.delete(fullKey);
      }

      // Delete from L2
      if (this.redisClient) {
        await this.deleteFromL2(fullKey);
      }

      const duration = Date.now() - startTime;
      this.metrics.recordDelete(fullKey, duration);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.recordError('delete', fullKey, error as Error, duration);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    let deletedCount = 0;

    try {
      // Delete from L1
      if (this.options.l1Enabled) {
        const regex = this.patternToRegex(pattern);
        for (const key of this.l1Cache.keys()) {
          if (regex.test(key)) {
            this.l1Cache.delete(key);
            deletedCount++;
          }
        }
      }

      // Delete from L2
      if (this.redisClient) {
        const client = await this.redisClient();
        if (client) {
          const fullPattern = this.getFullKey(pattern);
          const keys = await client.keys(fullPattern);
          
          if (keys.length > 0) {
            await client.del(keys);
            deletedCount += keys.length;
          }
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Error deleting cache pattern:', error);
      return deletedCount;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    // Clear L1
    if (this.options.l1Enabled) {
      this.l1Cache.clear();
    }

    // Clear L2
    if (this.redisClient) {
      try {
        await this.circuitBreaker.execute(async () => {
          const client = await this.redisClient!();
          if (client) {
            const pattern = this.getFullKey('*');
            const keys = await client.keys(pattern);
            if (keys.length > 0) {
              await client.del(keys);
            }
          }
        });
      } catch (error) {
        console.error('Error clearing Redis cache:', error);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      l1Size: this.l1Cache.size,
      l1MaxSize: this.options.l1MaxSize,
      metrics: this.metrics.getMetrics(),
      health: this.metrics.getHealth(),
      percentiles: this.metrics.getPercentiles(),
      circuitBreaker: this.circuitBreaker.getMetrics()
    };
  }

  /**
   * Get metrics collector
   */
  getMetrics(): CacheMetricsCollector {
    return this.metrics;
  }

  /**
   * Check if cache is healthy
   */
  async isHealthy(): Promise<boolean> {
    if (!this.redisClient) {
      return this.options.l1Enabled; // Healthy if L1 is available
    }

    try {
      const client = await this.redisClient();
      if (!client) return false;
      
      await client.ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Destroy cache and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.l1Cache.clear();
  }

  // === Private Methods ===

  private getFromL1<T>(key: string): T | null {
    const entry = this.l1Cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.l1Cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  private setInL1<T>(key: string, value: T, ttlMs: number): void {
    // Implement simple LRU eviction
    if (this.l1Cache.size >= this.options.l1MaxSize) {
      const firstKey = this.l1Cache.keys().next().value;
      if (firstKey) {
        this.l1Cache.delete(firstKey);
      }
    }

    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now()
    };

    this.l1Cache.set(key, entry);
  }

  private async getFromL2<T>(key: string): Promise<T | null> {
    return this.circuitBreaker.execute(
      async () => {
        const client = await this.redisClient!();
        if (!client) return null;

        const value = await client.get(key);
        if (!value) return null;

        try {
          return JSON.parse(value) as T;
        } catch {
          return value as T;
        }
      },
      async () => null // Fallback returns null
    );
  }

  private async setInL2<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.circuitBreaker.execute(async () => {
      const client = await this.redisClient!();
      if (!client) return;

      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await client.set(key, serialized, { EX: ttlSeconds });
    });
  }

  private async deleteFromL2(key: string): Promise<void> {
    await this.circuitBreaker.execute(async () => {
      const client = await this.redisClient!();
      if (!client) return;

      await client.del(key);
    });
  }

  private getFullKey(key: string): string {
    return `${this.options.keyPrefix}${key}`;
  }

  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexStr = escaped.replace(/\\\*/g, '.*').replace(/\\\?/g, '.');
    return new RegExp(`^${regexStr}$`);
  }

  private startL1Cleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.l1Cache.entries()) {
        if (now > entry.expiresAt) {
          this.l1Cache.delete(key);
        }
      }
    }, 60000); // Run every minute
  }
}
