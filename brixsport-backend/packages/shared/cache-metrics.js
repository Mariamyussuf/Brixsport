"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalCacheMetrics = exports.CacheMetricsCollector = void 0;
class CacheMetricsCollector {
    constructor() {
        this.hits = 0;
        this.misses = 0;
        this.sets = 0;
        this.deletes = 0;
        this.errors = 0;
        this.responseTimes = [];
        this.lastResetTime = Date.now();
        this.recentOperations = [];
        this.maxRecentOperations = 1000;
    }
    recordHit(key, duration) {
        this.hits++;
        this.responseTimes.push(duration);
        this.addOperation({
            operation: 'get',
            key,
            hit: true,
            duration,
            timestamp: Date.now()
        });
        this.trimResponses();
    }
    recordMiss(key, duration) {
        this.misses++;
        this.responseTimes.push(duration);
        this.addOperation({
            operation: 'get',
            key,
            hit: false,
            duration,
            timestamp: Date.now()
        });
        this.trimResponses();
    }
    recordSet(key, duration) {
        this.sets++;
        this.responseTimes.push(duration);
        this.addOperation({
            operation: 'set',
            key,
            duration,
            timestamp: Date.now()
        });
        this.trimResponses();
    }
    recordDelete(key, duration) {
        this.deletes++;
        this.responseTimes.push(duration);
        this.addOperation({
            operation: 'delete',
            key,
            duration,
            timestamp: Date.now()
        });
        this.trimResponses();
    }
    recordError(operation, key, error, duration) {
        this.errors++;
        this.addOperation({
            operation,
            key,
            error,
            duration,
            timestamp: Date.now()
        });
    }
    getMetrics() {
        const totalGets = this.hits + this.misses;
        const hitRate = totalGets > 0 ? this.hits / totalGets : 0;
        const avgResponseTime = this.responseTimes.length > 0
            ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
            : 0;
        return {
            hits: this.hits,
            misses: this.misses,
            hitRate: Math.round(hitRate * 10000) / 100,
            sets: this.sets,
            deletes: this.deletes,
            errors: this.errors,
            totalOperations: this.hits + this.misses + this.sets + this.deletes,
            avgResponseTime: Math.round(avgResponseTime * 100) / 100,
            lastResetTime: this.lastResetTime
        };
    }
    getRecentOperations(limit = 100) {
        return this.recentOperations.slice(-limit);
    }
    getOperationsByKey(key, limit = 50) {
        return this.recentOperations
            .filter(op => op.key === key)
            .slice(-limit);
    }
    getErrorOperations(limit = 50) {
        return this.recentOperations
            .filter(op => op.error !== undefined)
            .slice(-limit);
    }
    reset() {
        this.hits = 0;
        this.misses = 0;
        this.sets = 0;
        this.deletes = 0;
        this.errors = 0;
        this.responseTimes = [];
        this.recentOperations = [];
        this.lastResetTime = Date.now();
    }
    getPercentiles() {
        if (this.responseTimes.length === 0) {
            return { p50: 0, p95: 0, p99: 0 };
        }
        const sorted = [...this.responseTimes].sort((a, b) => a - b);
        const p50Index = Math.floor(sorted.length * 0.5);
        const p95Index = Math.floor(sorted.length * 0.95);
        const p99Index = Math.floor(sorted.length * 0.99);
        return {
            p50: Math.round(sorted[p50Index] * 100) / 100,
            p95: Math.round(sorted[p95Index] * 100) / 100,
            p99: Math.round(sorted[p99Index] * 100) / 100
        };
    }
    getHealth() {
        const metrics = this.getMetrics();
        const issues = [];
        let healthy = true;
        if (metrics.hitRate < 50 && metrics.totalOperations > 100) {
            issues.push(`Low hit rate: ${metrics.hitRate}%`);
            healthy = false;
        }
        const errorRate = metrics.totalOperations > 0
            ? (metrics.errors / metrics.totalOperations) * 100
            : 0;
        if (errorRate > 5) {
            issues.push(`High error rate: ${errorRate.toFixed(2)}%`);
            healthy = false;
        }
        if (metrics.avgResponseTime > 100) {
            issues.push(`Slow response time: ${metrics.avgResponseTime}ms`);
            healthy = false;
        }
        return {
            healthy,
            hitRate: metrics.hitRate,
            errorRate: Math.round(errorRate * 100) / 100,
            avgResponseTime: metrics.avgResponseTime,
            issues
        };
    }
    addOperation(operation) {
        this.recentOperations.push(operation);
        if (this.recentOperations.length > this.maxRecentOperations) {
            this.recentOperations = this.recentOperations.slice(-this.maxRecentOperations);
        }
    }
    trimResponses() {
        if (this.responseTimes.length > 10000) {
            this.responseTimes = this.responseTimes.slice(-5000);
        }
    }
}
exports.CacheMetricsCollector = CacheMetricsCollector;
exports.globalCacheMetrics = new CacheMetricsCollector();
//# sourceMappingURL=cache-metrics.js.map