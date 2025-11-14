/**
 * Cache Service
 * Provides frontend interface to cache management API
 */

import { APIResponse } from '@/types/api';

export interface CacheStats {
  timestamp: string;
  redis: {
    totalConnections: number;
    activeConnections: number;
    failedConnections: number;
    commandsExecuted: number;
    commandErrors: number;
    poolSize: number;
    maxPoolSize: number;
    poolHitRate: string;
    connectionString: string;
    lastConnectionTime: string;
    uptime: string;
    circuitBreaker: {
      state: string;
      failures: number;
      successes: number;
      consecutiveFailures: number;
      consecutiveSuccesses: number;
      totalRequests: number;
      rejectedRequests: number;
      lastFailureTime: number | null;
      lastSuccessTime: number | null;
      lastStateChange: number;
    };
  };
  cache: {
    l1Size: number;
    l1MaxSize: number;
    metrics: {
      hits: number;
      misses: number;
      hitRate: number;
      sets: number;
      deletes: number;
      errors: number;
      totalOperations: number;
      avgResponseTime: number;
      lastResetTime: number;
    };
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
  };
  warming: Array<{
    strategyName: string;
    lastRun: number | null;
    lastDuration: number;
    successCount: number;
    failureCount: number;
    averageDuration: number;
  }>;
  health: {
    redis: boolean;
    circuitBreaker: boolean;
  };
}

class CacheService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/v1/cache';
  }

  /**
   * Get cache statistics and health metrics
   */
  async getStats(): Promise<APIResponse<CacheStats>> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error) {
      console.error('Cache stats request failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      };
    }
  }

  /**
   * Perform cache actions
   */
  async performAction(action: 'warm' | 'clear' | 'resetMetrics'): Promise<APIResponse<boolean>> {
    try {
      const response = await fetch(`${this.baseUrl}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data: data.success };
    } catch (error) {
      console.error(`Cache action ${action} failed:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      };
    }
  }

  /**
   * Warm up the cache
   */
  async warmCache(): Promise<APIResponse<boolean>> {
    return this.performAction('warm');
  }

  /**
   * Clear the cache
   */
  async clearCache(): Promise<APIResponse<boolean>> {
    return this.performAction('clear');
  }

  /**
   * Reset cache metrics
   */
  async resetMetrics(): Promise<APIResponse<boolean>> {
    return this.performAction('resetMetrics');
  }

  /**
   * Check if cache is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      const stats = await this.getStats();
      return stats.success && stats.data?.health.redis === true;
    } catch {
      return false;
    }
  }

  /**
   * Get cache hit rate percentage
   */
  async getHitRate(): Promise<number> {
    try {
      const stats = await this.getStats();
      return stats.success ? stats.data?.cache.metrics.hitRate || 0 : 0;
    } catch {
      return 0;
    }
  }
}

// Export singleton instance
export default new CacheService();