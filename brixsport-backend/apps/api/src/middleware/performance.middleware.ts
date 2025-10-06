import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { supabase } from '../services/supabase.service';
import { websocketService } from '../services/websocket.service';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userAgent?: string;
  ipAddress?: string;
  userId?: string;
  timestamp: Date;
}

// Store metrics in memory for batch processing
const metricsBuffer: PerformanceMetrics[] = [];
const BUFFER_SIZE = 100;
const FLUSH_INTERVAL = 30000; // 30 seconds

// Performance monitoring middleware
export const performanceMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const originalSend = res.send;
  
  // Override res.send to capture response time
  res.send = function(body: any) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Extract request information
    const metrics: PerformanceMetrics = {
      endpoint: req.route?.path || req.path,
      method: req.method,
      responseTime,
      statusCode: res.statusCode,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
      userId: (req as any).user?.id,
      timestamp: new Date()
    };
    
    // Add to buffer
    metricsBuffer.push(metrics);
    
    // Log slow requests
    if (responseTime > 1000) {
      logger.warn('Slow request detected', {
        endpoint: metrics.endpoint,
        method: metrics.method,
        responseTime: metrics.responseTime,
        statusCode: metrics.statusCode,
        userId: metrics.userId
      });
    }
    
    // Log errors
    if (res.statusCode >= 400) {
      logger.error('Request error', {
        endpoint: metrics.endpoint,
        method: metrics.method,
        statusCode: metrics.statusCode,
        responseTime: metrics.responseTime,
        userId: metrics.userId,
        userAgent: metrics.userAgent,
        ipAddress: metrics.ipAddress
      });
    }
    
    // Broadcast real-time performance metrics for critical endpoints
    if (responseTime > 2000 || res.statusCode >= 500) {
      websocketService.broadcastPerformanceMetrics({
        ...metrics,
        severity: responseTime > 5000 ? 'critical' : res.statusCode >= 500 ? 'error' : 'warning'
      });
    }
    
    // Flush buffer if it's full
    if (metricsBuffer.length >= BUFFER_SIZE) {
      flushMetricsBuffer();
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

// Flush metrics buffer to database
const flushMetricsBuffer = async () => {
  if (metricsBuffer.length === 0) return;
  
  try {
    const metricsToFlush = metricsBuffer.splice(0, metricsBuffer.length);
    
    // Insert metrics into database
    const { error } = await supabase
      .from('performance_metrics')
      .insert(
        metricsToFlush.map(metric => ({
          endpoint: metric.endpoint,
          method: metric.method,
          response_time_ms: metric.responseTime,
          status_code: metric.statusCode,
          user_id: metric.userId || null,
          ip_address: metric.ipAddress,
          user_agent: metric.userAgent,
          created_at: metric.timestamp.toISOString()
        }))
      );
    
    if (error) {
      logger.error('Failed to flush performance metrics', { error: error.message });
      // Put metrics back in buffer for retry
      metricsBuffer.unshift(...metricsToFlush);
    } else {
      logger.info('Performance metrics flushed', { count: metricsToFlush.length });
    }
  } catch (error: any) {
    logger.error('Error flushing performance metrics', error);
  }
};

// Periodic flush
setInterval(flushMetricsBuffer, FLUSH_INTERVAL);

// Graceful shutdown handler
process.on('SIGINT', async () => {
  logger.info('Flushing remaining performance metrics before shutdown');
  await flushMetricsBuffer();
});

process.on('SIGTERM', async () => {
  logger.info('Flushing remaining performance metrics before shutdown');
  await flushMetricsBuffer();
});

// Request rate limiting tracking
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_THRESHOLD = 100; // requests per minute

export const rateLimitTracking = (req: Request, res: Response, next: NextFunction) => {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  
  // Clean up expired entries
  for (const [key, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(key);
    }
  }
  
  // Get or create client data
  let clientData = requestCounts.get(clientId);
  if (!clientData || now > clientData.resetTime) {
    clientData = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW
    };
    requestCounts.set(clientId, clientData);
  }
  
  // Increment request count
  clientData.count++;
  
  // Check rate limit
  if (clientData.count > RATE_LIMIT_THRESHOLD) {
    logger.warn('Rate limit exceeded', {
      clientId,
      count: clientData.count,
      threshold: RATE_LIMIT_THRESHOLD,
      endpoint: req.path,
      method: req.method
    });
    
    // Broadcast rate limit alert
    websocketService.broadcastPerformanceMetrics({
      type: 'rate_limit_exceeded',
      clientId,
      count: clientData.count,
      endpoint: req.path,
      method: req.method,
      timestamp: new Date()
    });
  }
  
  // Add rate limit headers
  res.set({
    'X-RateLimit-Limit': RATE_LIMIT_THRESHOLD.toString(),
    'X-RateLimit-Remaining': Math.max(0, RATE_LIMIT_THRESHOLD - clientData.count).toString(),
    'X-RateLimit-Reset': Math.ceil(clientData.resetTime / 1000).toString()
  });
  
  next();
};

// Memory usage tracking
export const memoryTracking = (req: Request, res: Response, next: NextFunction) => {
  const memUsage = process.memoryUsage();
  
  // Log memory usage if it's high
  const memoryThreshold = 500 * 1024 * 1024; // 500MB
  if (memUsage.heapUsed > memoryThreshold) {
    logger.warn('High memory usage detected', {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      endpoint: req.path,
      method: req.method
    });
    
    // Broadcast memory alert
    websocketService.broadcastPerformanceMetrics({
      type: 'high_memory_usage',
      memoryUsage: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      },
      endpoint: req.path,
      method: req.method,
      timestamp: new Date()
    });
  }
  
  next();
};

// Database connection health check
export const healthCheck = async (req: Request, res: Response, next: NextFunction) => {
  // Only run health check on specific endpoints or periodically
  if (req.path !== '/health' && Math.random() > 0.01) { // 1% of requests
    return next();
  }
  
  try {
    const startTime = Date.now();
    
    // Test database connection
    const { data, error } = await supabase
      .from('User')
      .select('id')
      .limit(1);
    
    const dbResponseTime = Date.now() - startTime;
    
    if (error || dbResponseTime > 5000) {
      logger.error('Database health check failed', {
        error: error?.message,
        responseTime: dbResponseTime
      });
      
      // Broadcast health alert
      websocketService.broadcastSystemHealth({
        database: {
          status: 'unhealthy',
          responseTime: dbResponseTime,
          error: error?.message
        },
        timestamp: new Date()
      });
    }
    
    // Add health info to request context
    (req as any).healthInfo = {
      database: {
        status: error ? 'unhealthy' : 'healthy',
        responseTime: dbResponseTime
      }
    };
    
  } catch (error: any) {
    logger.error('Health check error', error);
  }
  
  next();
};

// Performance analytics aggregation
export const getPerformanceAnalytics = async (timeRange: string = '24h') => {
  try {
    const timeRangeMap = {
      '1h': '1 hour',
      '24h': '24 hours',
      '7d': '7 days',
      '30d': '30 days'
    };
    
    const interval = timeRangeMap[timeRange as keyof typeof timeRangeMap] || '24 hours';
    
    // Get performance metrics from database
    const { data: metrics, error } = await supabase
      .from('performance_metrics')
      .select('*')
      .gte('created_at', new Date(Date.now() - (timeRange === '1h' ? 3600000 : timeRange === '24h' ? 86400000 : timeRange === '7d' ? 604800000 : 2592000000)).toISOString())
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch performance metrics: ${error.message}`);
    }
    
    // Aggregate metrics
    const analytics = {
      totalRequests: metrics?.length || 0,
      averageResponseTime: metrics?.length ? metrics.reduce((sum, m) => sum + m.response_time_ms, 0) / metrics.length : 0,
      errorRate: metrics?.length ? (metrics.filter(m => m.status_code >= 400).length / metrics.length) * 100 : 0,
      slowRequests: metrics?.filter(m => m.response_time_ms > 1000).length || 0,
      topEndpoints: getTopEndpoints(metrics || []),
      statusCodeDistribution: getStatusCodeDistribution(metrics || []),
      responseTimePercentiles: getResponseTimePercentiles(metrics || []),
      hourlyTrends: getHourlyTrends(metrics || [])
    };
    
    return analytics;
  } catch (error: any) {
    logger.error('Error getting performance analytics', error);
    throw error;
  }
};

// Helper functions for analytics
const getTopEndpoints = (metrics: any[]) => {
  const endpointCounts = metrics.reduce((acc, metric) => {
    acc[metric.endpoint] = (acc[metric.endpoint] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(endpointCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([endpoint, count]) => ({ endpoint, count }));
};

const getStatusCodeDistribution = (metrics: any[]) => {
  const statusCodes = metrics.reduce((acc, metric) => {
    const statusRange = Math.floor(metric.status_code / 100) * 100;
    acc[statusRange] = (acc[statusRange] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  return Object.entries(statusCodes).map(([code, count]) => ({
    statusCode: `${code}xx`,
    count
  }));
};

const getResponseTimePercentiles = (metrics: any[]) => {
  if (metrics.length === 0) return {};
  
  const sortedTimes = metrics.map(m => m.response_time_ms).sort((a, b) => a - b);
  
  return {
    p50: sortedTimes[Math.floor(sortedTimes.length * 0.5)],
    p90: sortedTimes[Math.floor(sortedTimes.length * 0.9)],
    p95: sortedTimes[Math.floor(sortedTimes.length * 0.95)],
    p99: sortedTimes[Math.floor(sortedTimes.length * 0.99)]
  };
};

const getHourlyTrends = (metrics: any[]) => {
  const hourlyData = metrics.reduce((acc, metric) => {
    const hour = new Date(metric.created_at).getHours();
    if (!acc[hour]) {
      acc[hour] = { requests: 0, totalResponseTime: 0, errors: 0 };
    }
    acc[hour].requests++;
    acc[hour].totalResponseTime += metric.response_time_ms;
    if (metric.status_code >= 400) {
      acc[hour].errors++;
    }
    return acc;
  }, {} as Record<number, { requests: number; totalResponseTime: number; errors: number }>);
  
  return Object.entries(hourlyData).map(([hour, data]) => {
    const hourData = data as { requests: number; totalResponseTime: number; errors: number };
    return {
      hour: parseInt(hour),
      requests: hourData.requests,
      averageResponseTime: hourData.totalResponseTime / hourData.requests,
      errorRate: (hourData.errors / hourData.requests) * 100
    };
  });
};
