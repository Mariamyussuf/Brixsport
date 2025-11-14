export interface CacheMetrics {
    hits: number;
    misses: number;
    hitRate: number;
    sets: number;
    deletes: number;
    errors: number;
    totalOperations: number;
    avgResponseTime: number;
    lastResetTime: number;
}
export interface CacheOperation {
    operation: 'get' | 'set' | 'delete' | 'clear';
    key: string;
    hit?: boolean;
    duration: number;
    error?: Error;
    timestamp: number;
}
export declare class CacheMetricsCollector {
    private hits;
    private misses;
    private sets;
    private deletes;
    private errors;
    private responseTimes;
    private lastResetTime;
    private recentOperations;
    private maxRecentOperations;
    recordHit(key: string, duration: number): void;
    recordMiss(key: string, duration: number): void;
    recordSet(key: string, duration: number): void;
    recordDelete(key: string, duration: number): void;
    recordError(operation: CacheOperation['operation'], key: string, error: Error, duration: number): void;
    getMetrics(): CacheMetrics;
    getRecentOperations(limit?: number): CacheOperation[];
    getOperationsByKey(key: string, limit?: number): CacheOperation[];
    getErrorOperations(limit?: number): CacheOperation[];
    reset(): void;
    getPercentiles(): {
        p50: number;
        p95: number;
        p99: number;
    };
    getHealth(): {
        healthy: boolean;
        hitRate: number;
        errorRate: number;
        avgResponseTime: number;
        issues: string[];
    };
    private addOperation;
    private trimResponses;
}
export declare const globalCacheMetrics: CacheMetricsCollector;
//# sourceMappingURL=cache-metrics.d.ts.map