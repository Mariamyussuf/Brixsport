"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistributedCache = void 0;
const circuit_breaker_1 = require("./circuit-breaker");
const cache_metrics_1 = require("./cache-metrics");
class DistributedCache {
    constructor(redisClient, options, metrics) {
        this.redisClient = redisClient;
        this.options = options;
        this.l1Cache = new Map();
        this.circuitBreaker = circuit_breaker_1.CircuitBreakerFactory.create('redis-cache', {
            failureThreshold: 5,
            successThreshold: 2,
            timeout: 30000,
            monitoringPeriod: 60000,
            volumeThreshold: 10
        });
        this.metrics = metrics || new cache_metrics_1.CacheMetricsCollector();
        if (this.options.l1Enabled) {
            this.startL1Cleanup();
        }
    }
    async get(key) {
        const startTime = Date.now();
        const fullKey = this.getFullKey(key);
        try {
            if (this.options.l1Enabled) {
                const l1Result = this.getFromL1(fullKey);
                if (l1Result !== null) {
                    const duration = Date.now() - startTime;
                    this.metrics.recordHit(fullKey, duration);
                    return l1Result;
                }
            }
            if (this.redisClient) {
                const l2Result = await this.getFromL2(fullKey);
                if (l2Result !== null) {
                    if (this.options.l1Enabled) {
                        this.setInL1(fullKey, l2Result, this.options.l1TTL);
                    }
                    const duration = Date.now() - startTime;
                    this.metrics.recordHit(fullKey, duration);
                    return l2Result;
                }
            }
            const duration = Date.now() - startTime;
            this.metrics.recordMiss(fullKey, duration);
            return null;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.metrics.recordError('get', fullKey, error, duration);
            if (this.options.l1Enabled) {
                return this.getFromL1(fullKey);
            }
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        const startTime = Date.now();
        const fullKey = this.getFullKey(key);
        const ttl = ttlSeconds || this.options.l2TTL;
        try {
            if (this.options.l1Enabled) {
                this.setInL1(fullKey, value, this.options.l1TTL);
            }
            if (this.redisClient) {
                await this.setInL2(fullKey, value, ttl);
            }
            const duration = Date.now() - startTime;
            this.metrics.recordSet(fullKey, duration);
            return true;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.metrics.recordError('set', fullKey, error, duration);
            return this.options.l1Enabled;
        }
    }
    async delete(key) {
        const startTime = Date.now();
        const fullKey = this.getFullKey(key);
        try {
            if (this.options.l1Enabled) {
                this.l1Cache.delete(fullKey);
            }
            if (this.redisClient) {
                await this.deleteFromL2(fullKey);
            }
            const duration = Date.now() - startTime;
            this.metrics.recordDelete(fullKey, duration);
            return true;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.metrics.recordError('delete', fullKey, error, duration);
            return false;
        }
    }
    async deletePattern(pattern) {
        let deletedCount = 0;
        try {
            if (this.options.l1Enabled) {
                const regex = this.patternToRegex(pattern);
                for (const key of this.l1Cache.keys()) {
                    if (regex.test(key)) {
                        this.l1Cache.delete(key);
                        deletedCount++;
                    }
                }
            }
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
        }
        catch (error) {
            console.error('Error deleting cache pattern:', error);
            return deletedCount;
        }
    }
    async clear() {
        if (this.options.l1Enabled) {
            this.l1Cache.clear();
        }
        if (this.redisClient) {
            try {
                await this.circuitBreaker.execute(async () => {
                    const client = await this.redisClient();
                    if (client) {
                        const pattern = this.getFullKey('*');
                        const keys = await client.keys(pattern);
                        if (keys.length > 0) {
                            await client.del(keys);
                        }
                    }
                });
            }
            catch (error) {
                console.error('Error clearing Redis cache:', error);
            }
        }
    }
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
    getMetrics() {
        return this.metrics;
    }
    async isHealthy() {
        if (!this.redisClient) {
            return this.options.l1Enabled;
        }
        try {
            const client = await this.redisClient();
            if (!client)
                return false;
            await client.ping();
            return true;
        }
        catch {
            return false;
        }
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.l1Cache.clear();
    }
    getFromL1(key) {
        const entry = this.l1Cache.get(key);
        if (!entry) {
            return null;
        }
        if (Date.now() > entry.expiresAt) {
            this.l1Cache.delete(key);
            return null;
        }
        return entry.value;
    }
    setInL1(key, value, ttlMs) {
        if (this.l1Cache.size >= this.options.l1MaxSize) {
            const firstKey = this.l1Cache.keys().next().value;
            this.l1Cache.delete(firstKey);
        }
        const entry = {
            value,
            expiresAt: Date.now() + ttlMs,
            createdAt: Date.now()
        };
        this.l1Cache.set(key, entry);
    }
    async getFromL2(key) {
        return this.circuitBreaker.execute(async () => {
            const client = await this.redisClient();
            if (!client)
                return null;
            const value = await client.get(key);
            if (!value)
                return null;
            try {
                return JSON.parse(value);
            }
            catch {
                return value;
            }
        }, async () => null);
    }
    async setInL2(key, value, ttlSeconds) {
        await this.circuitBreaker.execute(async () => {
            const client = await this.redisClient();
            if (!client)
                return;
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            await client.set(key, serialized, { EX: ttlSeconds });
        });
    }
    async deleteFromL2(key) {
        await this.circuitBreaker.execute(async () => {
            const client = await this.redisClient();
            if (!client)
                return;
            await client.del(key);
        });
    }
    getFullKey(key) {
        return `${this.options.keyPrefix}${key}`;
    }
    patternToRegex(pattern) {
        const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regexStr = escaped.replace(/\\\*/g, '.*').replace(/\\\?/g, '.');
        return new RegExp(`^${regexStr}$`);
    }
    startL1Cleanup() {
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            for (const [key, entry] of this.l1Cache.entries()) {
                if (now > entry.expiresAt) {
                    this.l1Cache.delete(key);
                }
            }
        }, 60000);
    }
}
exports.DistributedCache = DistributedCache;
//# sourceMappingURL=distributed-cache.js.map