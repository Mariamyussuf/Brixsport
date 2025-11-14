/**
 * Cache Metrics and Monitoring
 * Tracks cache hit/miss rates, performance, and health
 */

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

export class CacheMetricsCollector {
  private hits: number = 0;
  private misses: number = 0;
  private sets: number = 0;
  private deletes: number = 0;
  private errors: number = 0;
  private responseTimes: number[] = [];
  private lastResetTime: number = Date.now();
  private recentOperations: CacheOperation[] = [];
  private maxRecentOperations: number = 1000;

  /**
   * Record a cache hit
   */
  recordHit(key: string, duration: number): void {
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

  /**
   * Record a cache miss
   */
  recordMiss(key: string, duration: number): void {
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

  /**
   * Record a cache set operation
   */
  recordSet(key: string, duration: number): void {
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

  /**
   * Record a cache delete operation
   */
  recordDelete(key: string, duration: number): void {
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

  /**
   * Record a cache error
   */
  recordError(operation: CacheOperation['operation'], key: string, error: Error, duration: number): void {
    this.errors++;
    this.addOperation({
      operation,
      key,
      error,
      duration,
      timestamp: Date.now()
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): CacheMetrics {
    const totalGets = this.hits + this.misses;
    const hitRate = totalGets > 0 ? this.hits / totalGets : 0;
    const avgResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
      : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: Math.round(hitRate * 10000) / 100, // Percentage with 2 decimals
      sets: this.sets,
      deletes: this.deletes,
      errors: this.errors,
      totalOperations: this.hits + this.misses + this.sets + this.deletes,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      lastResetTime: this.lastResetTime
    };
  }

  /**
   * Get recent operations
   */
  getRecentOperations(limit: number = 100): CacheOperation[] {
    return this.recentOperations.slice(-limit);
  }

  /**
   * Get operations by key
   */
  getOperationsByKey(key: string, limit: number = 50): CacheOperation[] {
    return this.recentOperations
      .filter(op => op.key === key)
      .slice(-limit);
  }

  /**
   * Get error operations
   */
  getErrorOperations(limit: number = 50): CacheOperation[] {
    return this.recentOperations
      .filter(op => op.error !== undefined)
      .slice(-limit);
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.hits = 0;
    this.misses = 0;
    this.sets = 0;
    this.deletes = 0;
    this.errors = 0;
    this.responseTimes = [];
    this.recentOperations = [];
    this.lastResetTime = Date.now();
  }

  /**
   * Get performance percentiles
   */
  getPercentiles(): { p50: number; p95: number; p99: number } {
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

  /**
   * Get cache health status
   */
  getHealth(): {
    healthy: boolean;
    hitRate: number;
    errorRate: number;
    avgResponseTime: number;
    issues: string[];
  } {
    const metrics = this.getMetrics();
    const issues: string[] = [];
    let healthy = true;

    // Check hit rate
    if (metrics.hitRate < 50 && metrics.totalOperations > 100) {
      issues.push(`Low hit rate: ${metrics.hitRate}%`);
      healthy = false;
    }

    // Check error rate
    const errorRate = metrics.totalOperations > 0
      ? (metrics.errors / metrics.totalOperations) * 100
      : 0;
    
    if (errorRate > 5) {
      issues.push(`High error rate: ${errorRate.toFixed(2)}%`);
      healthy = false;
    }

    // Check response time
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

  /**
   * Add operation to recent list
   */
  private addOperation(operation: CacheOperation): void {
    this.recentOperations.push(operation);
    
    // Trim to max size
    if (this.recentOperations.length > this.maxRecentOperations) {
      this.recentOperations = this.recentOperations.slice(-this.maxRecentOperations);
    }
  }

  /**
   * Trim response times to prevent memory issues
   */
  private trimResponses(): void {
    if (this.responseTimes.length > 10000) {
      this.responseTimes = this.responseTimes.slice(-5000);
    }
  }
}

/**
 * Global metrics collector instance
 */
export const globalCacheMetrics = new CacheMetricsCollector();
