import { getRedisClient, getRedisMetrics, withRedis } from '../config/redis';
import { getOptionalRedisClient } from '../config/redis';
import { logger } from '../utils/logger';
import { promisify } from 'util';
import { RedisClientType } from 'redis';

// Extended Redis info interface
export interface RedisExtendedInfo {
  // Base Redis info
  server: Record<string, string>;
  clients: Record<string, string>;
  memory: Record<string, string>;
  stats: Record<string, string>;
  
  // Extended metrics
  metrics: {
    totalConnections: number;
    activeConnections: number;
    failedConnections: number;
    lastError: string | null;
    lastConnectionTime: string;
    commandsExecuted: number;
    commandErrors: number;
    pool: {
      size: number;
      minSize: number;
      maxSize: number;
      hitRate: string;
      stats: {
        totalAcquired: number;
        totalReleased: number;
        totalCreated: number;
        totalDestroyed: number;
        waitingRequests: number;
        maxWaitingTime: number;
      };
    };
    poolHits: number;
    poolMisses: number;
    connectionString: string;
    uptime: string;
    circuitBreaker: any;
    cacheMetrics: any;
  };
  
  // Health information
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency: number;
    memoryUsage: number;
    connectedClients: number;
    blockedClients: number;
    opsPerSecond: number;
    keyspaceHits: number;
    keyspaceMisses: number;
    hitRate: number;
    usedMemory: string;
    maxMemory: string;
    memoryFragmentationRatio: string;
  };
  
  // Alert information
  alerts: {
    level: 'none' | 'warning' | 'critical';
    messages: string[];
  };
  
  // Allow additional properties
  [key: string]: any;
}

export interface RedisInfo {
  server: Record<string, string>;
  clients: Record<string, string>;
  memory: Record<string, string>;
  stats: Record<string, string>;
  [key: string]: Record<string, string> | string | number | boolean;
}

export class RedisInfoService {
  /**
   * Get Redis server information
   */
  /**
   * Get extended Redis information including metrics and health status
   */
  public static async getExtendedRedisInfo(): Promise<{
    success: boolean;
    data?: RedisExtendedInfo;
    error?: string;
  }> {
    try {
      // Try to get Redis client
      const client = await getOptionalRedisClient();
      if (!client) {
        return {
          success: false,
          error: 'Redis is not configured or unavailable'
        };
      }
      
      // Get basic Redis info
      const infoResult = await this.getRedisInfo();
      if (!infoResult.success || !infoResult.data) {
        throw new Error(infoResult.error || 'Failed to get Redis info');
      }

      // Get Redis metrics from our connection manager
      const metrics = getRedisMetrics();
      
      // Get additional health metrics
      const health = await this.getRedisHealth();
      
      // Combine all data
      const extendedInfo: RedisExtendedInfo = {
        ...infoResult.data,
        metrics: {
          totalConnections: metrics.totalConnections,
          activeConnections: metrics.activeConnections,
          failedConnections: metrics.failedConnections,
          lastError: metrics.lastError?.message || null,
          lastConnectionTime: metrics.lastConnectionTime,
          commandsExecuted: metrics.commandsExecuted,
          commandErrors: metrics.commandErrors,
          pool: metrics.pool,
          poolHits: metrics.poolHits,
          poolMisses: metrics.poolMisses,
          circuitBreaker: metrics.circuitBreaker,
          cacheMetrics: metrics.cacheMetrics,
          connectionString: metrics.connectionString,
          uptime: metrics.uptime
        },
        health,
        alerts: this.generateAlerts(health)
      };

      return {
        success: true,
        data: extendedInfo
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error getting extended Redis info:', error);
      return {
        success: false,
        error: `Failed to get extended Redis info: ${errorMessage}`
      };
    }
  }

  /**
   * Get Redis health status
   */
  private static async getRedisHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency: number;
    memoryUsage: number;
    connectedClients: number;
    blockedClients: number;
    opsPerSecond: number;
    keyspaceHits: number;
    keyspaceMisses: number;
    hitRate: number;
    usedMemory: string;
    maxMemory: string;
    memoryFragmentationRatio: string;
  }> {
    const client = await getOptionalRedisClient();
    if (!client) {
      return {
        status: 'unhealthy',
        latency: -1,
        memoryUsage: -1,
        connectedClients: 0,
        blockedClients: 0,
        opsPerSecond: 0,
        keyspaceHits: 0,
        keyspaceMisses: 0,
        hitRate: 0,
        usedMemory: '0 B',
        maxMemory: '0 B',
        memoryFragmentationRatio: '0.00'
      };
    }
    
    const startTime = Date.now();
    
    try {
      // Basic health check
      await client.ping();
      const latency = Date.now() - startTime;
      
      // Get memory info
      const memoryInfo = await this.getMemoryInfo();
      
      // Get stats
      const statsResult = await this.getRedisStats();
      if (!statsResult.success || !statsResult.data) {
        throw new Error(statsResult.error || 'Failed to get Redis stats');
      }
      const stats = statsResult.data;
      
      // Calculate hit rate
      const hits = stats.keyspace_hits;
      const misses = stats.keyspace_misses;
      const total = hits + misses;
      const hitRate = total > 0 ? (hits / total) * 100 : 0;
      
      // Determine health status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (latency > 100) status = 'degraded';
      if (latency > 1000 || !('isOpen' in client ? client.isOpen : true)) status = 'unhealthy';
      
      // Calculate memory usage percentage safely
      const usedMemory = parseInt(memoryInfo.used_memory || '0', 10);
      const maxMemory = parseInt(memoryInfo.maxmemory || '1', 10); // Avoid division by zero
      const memoryUsage = maxMemory > 0 ? (usedMemory / maxMemory) * 100 : 0;
      
      return {
        status,
        latency,
        memoryUsage,
        connectedClients: stats.connected_clients,
        blockedClients: stats.blocked_clients,
        opsPerSecond: stats.instantaneous_ops_per_sec,
        keyspaceHits: hits,
        keyspaceMisses: misses,
        hitRate,
        usedMemory: this.formatBytes(usedMemory),
        maxMemory: this.formatBytes(maxMemory),
        memoryFragmentationRatio: stats.mem_fragmentation_ratio
      };
    } catch (error) {
      logger.error('Error checking Redis health:', error);
      return {
        status: 'unhealthy',
        latency: -1,
        memoryUsage: -1,
        connectedClients: 0,
        blockedClients: 0,
        opsPerSecond: 0,
        keyspaceHits: 0,
        keyspaceMisses: 0,
        hitRate: 0,
        usedMemory: '0 B',
        maxMemory: '0 B',
        memoryFragmentationRatio: '0.00'
      };
    }
  }

  /**
   * Generate alerts based on Redis health metrics
   */
  private static generateAlerts(health: any) {
    const alerts: string[] = [];
    let level: 'none' | 'warning' | 'critical' = 'none';
    
    // Check memory usage
    if (health.memoryUsage > 90) {
      alerts.push(`High memory usage: ${health.memoryUsage.toFixed(2)}%`);
      level = health.memoryUsage > 95 ? 'critical' : 'warning';
    }
    
    // Check latency
    if (health.latency > 100) {
      alerts.push(`High latency: ${health.latency}ms`);
      level = health.latency > 300 ? 'critical' : 'warning';
    }
    
    // Check hit rate
    if (health.hitRate < 80) {
      alerts.push(`Low cache hit rate: ${health.hitRate.toFixed(2)}%`);
      level = health.hitRate < 50 ? 'critical' : 'warning';
    }
    
    // Check blocked clients
    if (health.blockedClients > 0) {
      alerts.push(`Blocked clients: ${health.blockedClients}`);
      level = 'warning';
    }
    
    // Check memory fragmentation
    const fragRatio = parseFloat(health.memoryFragmentationRatio);
    if (fragRatio > 1.5) {
      alerts.push(`High memory fragmentation: ${fragRatio.toFixed(2)}`);
      level = 'warning';
    }
    
    return { level, messages: alerts };
  }

  /**
   * Format bytes to human readable format
   */
  private static formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Get memory information
   */
  private static async getMemoryInfo(): Promise<Record<string, any>> {
    const client = await getOptionalRedisClient();
    if (!client) {
      return {};
    }
    
    const info = await client.info('memory');
    const lines = info.split('\r\n');
    const memoryInfo: Record<string, any> = {};
    
    for (const line of lines) {
      if (!line || line.startsWith('#')) continue;
      const [key, value] = line.split(':');
      if (key && value) {
        // Convert string values to numbers when possible
        memoryInfo[key] = isNaN(Number(value)) ? value : Number(value);
      }
    }
    
    return memoryInfo;
  }

  /**
   * Get Redis server information
   */
  public static async getRedisInfo(): Promise<{
    success: boolean;
    data?: RedisInfo;
    error?: string;
  }> {
    const client = await getOptionalRedisClient();
    
    if (!client) {
      logger.warn('Redis client is not connected or configured');
      return { success: false, error: 'Redis client is not connected or configured' };
    }

    try {
      const info = await client.info();
      const parsedInfo = this.parseRedisInfo(info);
      
      return {
        success: true,
        data: parsedInfo
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error getting Redis info:', error);
      return {
        success: false,
        error: `Failed to get Redis info: ${errorMessage}`
      };
    }
  }

  /**
   * Get specific Redis information sections
   */
  public static async getRedisInfoSections(sections: string[]): Promise<{
    success: boolean;
    data?: Record<string, Record<string, string>>;
    error?: string;
  }> {
    const client = await getOptionalRedisClient();
    
    if (!client) {
      logger.warn('Redis client is not connected or configured');
      return { success: false, error: 'Redis client is not connected or configured' };
    }

    try {
      const results: Record<string, Record<string, string>> = {};
      
      for (const section of sections) {
        const sectionInfo = await client.info(section as any); // Type assertion needed for Redis client
        const parsedSection = this.parseRedisInfoSection(section, sectionInfo);
        results[section] = parsedSection;
      }
      
      return {
        success: true,
        data: results
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error getting Redis info sections:', error);
      return {
        success: false,
        error: `Failed to get Redis info sections: ${errorMessage}`
      };
    }
  }

  /**
   * Get Redis server statistics
   */
  public static async getRedisStats(): Promise<{
    success: boolean;
    data?: {
      total_connections_received: number;
      total_commands_processed: number;
      instantaneous_ops_per_sec: number;
      total_net_input_bytes: number;
      total_net_output_bytes: number;
      keyspace_hits: number;
      keyspace_misses: number;
      used_memory: string;
      used_memory_human: string;
      used_memory_peak: string;
      used_memory_peak_human: string;
      used_memory_rss: string;
      used_memory_rss_human: string;
      mem_fragmentation_ratio: string;
      connected_clients: number;
      blocked_clients: number;
    } | null;
    error?: string;
  }> {
    const result = await this.getRedisInfoSections(['stats', 'memory', 'clients']);
    
    if (!result.success || !result.data) {
      return {
        success: result.success,
        data: null,
        error: result.error
      };
    }

    const { stats, memory, clients } = result.data;
    
    return {
      success: true,
      data: {
        total_connections_received: parseInt(stats.total_connections_received || '0', 10),
        total_commands_processed: parseInt(stats.total_commands_processed || '0', 10),
        instantaneous_ops_per_sec: parseInt(stats.instantaneous_ops_per_sec || '0', 10),
        total_net_input_bytes: parseInt(stats.total_net_input_bytes || '0', 10),
        total_net_output_bytes: parseInt(stats.total_net_output_bytes || '0', 10),
        keyspace_hits: parseInt(stats.keyspace_hits || '0', 10),
        keyspace_misses: parseInt(stats.keyspace_misses || '0', 10),
        used_memory: memory.used_memory || '0',
        used_memory_human: memory.used_memory_human || '0B',
        used_memory_peak: memory.used_memory_peak || '0',
        used_memory_peak_human: memory.used_memory_peak_human || '0B',
        used_memory_rss: memory.used_memory_rss || '0',
        used_memory_rss_human: memory.used_memory_rss_human || '0B',
        mem_fragmentation_ratio: memory.mem_fragmentation_ratio || '0',
        connected_clients: parseInt(clients.connected_clients || '0', 10),
        blocked_clients: parseInt(clients.blocked_clients || '0', 10)
      }
    };
  }

  /**
   * Parse Redis INFO command output into a structured object
   */
  private static parseRedisInfo(infoString: string): RedisInfo {
    const result: RedisInfo = {
      server: {},
      clients: {},
      memory: {},
      stats: {}
    };
    
    let currentSection = '';

    infoString.split('\r\n').forEach(line => {
      if (line.startsWith('#')) {
        currentSection = line.substring(1).toLowerCase().trim();
        if (!result[currentSection as keyof RedisInfo]) {
          result[currentSection] = {};
        }
      } else if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (currentSection && result[currentSection as keyof RedisInfo]) {
          (result[currentSection as keyof RedisInfo] as Record<string, string>)[key] = value;
        } else {
          result[key] = value;
        }
      }
    });

    return result;
  }

  /**
   * Parse a specific section of Redis INFO output
   */
  private static parseRedisInfoSection(section: string, infoString: string): Record<string, string> {
    const result: Record<string, string> = {};
    
    infoString.split('\r\n').forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    });

    return result;
  }

  /**
   * Check if Redis is connected and responding
   */
  public static async checkHealth(): Promise<{
    success: boolean;
    status: 'connected' | 'disconnected';
    error?: string;
  }> {
    const client = await getOptionalRedisClient();
    
    if (!client) {
      return { success: true, status: 'disconnected', error: 'Redis is not configured or unavailable' };
    }

    try {
      // Simple ping to check if Redis is responding
      await client.ping();
      return { success: true, status: 'connected' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Redis health check failed:', error);
      return {
        success: false,
        status: 'disconnected',
        error: `Redis health check failed: ${errorMessage}`
      };
    }
  }
}

export default RedisInfoService;
