import { RedisClientType } from 'redis';
import { CacheMetricsCollector } from './cache-metrics';
export interface CacheEntry<T> {
    value: T;
    expiresAt: number;
    createdAt: number;
}
export interface DistributedCacheOptions {
    l1Enabled: boolean;
    l1MaxSize: number;
    l1TTL: number;
    l2TTL: number;
    enableMetrics: boolean;
    keyPrefix: string;
}
export declare class DistributedCache {
    private redisClient;
    private options;
    private l1Cache;
    private circuitBreaker;
    private metrics;
    private cleanupInterval?;
    constructor(redisClient: (() => Promise<RedisClientType | null>) | null, options: DistributedCacheOptions, metrics?: CacheMetricsCollector);
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean>;
    delete(key: string): Promise<boolean>;
    deletePattern(pattern: string): Promise<number>;
    clear(): Promise<void>;
    getStats(): {
        l1Size: number;
        l1MaxSize: number;
        metrics: import("./cache-metrics").CacheMetrics;
        health: {
            healthy: boolean;
            hitRate: number;
            errorRate: number;
            avgResponseTime: number;
            issues: string[];
        };
        percentiles: {
            p50: number;
            p95: number;
            p99: number;
        };
        circuitBreaker: import("./circuit-breaker").CircuitBreakerMetrics;
    };
    getMetrics(): CacheMetricsCollector;
    isHealthy(): Promise<boolean>;
    destroy(): void;
    private getFromL1;
    private setInL1;
    private getFromL2;
    private setInL2;
    private deleteFromL2;
    private getFullKey;
    private patternToRegex;
    private startL1Cleanup;
}
//# sourceMappingURL=distributed-cache.d.ts.map