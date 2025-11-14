import { logger } from '../../utils/logger';
import { redisService } from '../redis.service';
import { supabaseService } from '../supabase.service';

export interface SecurityMetrics {
  authAttempts: number;
  failedAuthAttempts: number;
  successfulAuthAttempts: number;
  apiRequests: number;
  blockedRequests: number;
  suspiciousActivities: number;
  vulnerabilities: number;
}

export interface SecurityMonitoring {
  monitorAuthAttempts(): any;
  monitorAPIUsage(): any;
  monitorDatabaseAccess(): any;
  monitorFileUploads(): any;
  // New methods for production-ready implementation
  getMetrics(): Promise<SecurityMetrics>;
  resetMetrics(): Promise<void>;
  logMetric(metric: string, value: number): Promise<void>;
  getMetricHistory(metric: string, hours?: number): Promise<any[]>;
}

// In-memory storage for metrics (in production, this should be in a time-series database)
const securityMetrics: SecurityMetrics = {
  authAttempts: 0,
  failedAuthAttempts: 0,
  successfulAuthAttempts: 0,
  apiRequests: 0,
  blockedRequests: 0,
  suspiciousActivities: 0,
  vulnerabilities: 0
};

export const securityMonitoring: SecurityMonitoring = {
  monitorAuthAttempts: () => {
    return (req: any, res: any, next: any): void => {
      try {
        // Increment auth attempts counter
        securityMetrics.authAttempts++;
        securityMonitoring.logMetric('authAttempts', 1).catch(logger.error);
        
        // Check if this is an auth endpoint
        if (req.path.includes('/auth') || req.path.includes('/login') || req.path.includes('/signup')) {
          // Check response status to determine success/failure
          const originalSend = res.send;
          res.send = function (body: any) {
            // Check if auth was successful or failed
            try {
              const response = JSON.parse(body);
              if (response.success === false) {
                securityMetrics.failedAuthAttempts++;
                securityMonitoring.logMetric('failedAuthAttempts', 1).catch(logger.error);
              } else if (response.token || response.data?.token) {
                securityMetrics.successfulAuthAttempts++;
                securityMonitoring.logMetric('successfulAuthAttempts', 1).catch(logger.error);
              }
            } catch (e) {
              // Not JSON response, continue
            }
            return originalSend.call(this, body);
          };
        }
        
        next();
      } catch (error: any) {
        logger.error('Auth monitoring error', error);
        next();
      }
    };
  },
  
  monitorAPIUsage: () => {
    return (req: any, res: any, next: any): void => {
      try {
        // Increment API requests counter
        securityMetrics.apiRequests++;
        securityMonitoring.logMetric('apiRequests', 1).catch(logger.error);
        
        // Check if request was blocked (403 status)
        const originalSend = res.send;
        res.send = function (body: any) {
          if (res.statusCode === 403) {
            securityMetrics.blockedRequests++;
            securityMonitoring.logMetric('blockedRequests', 1).catch(logger.error);
          }
          return originalSend.call(this, body);
        };
        
        next();
      } catch (error: any) {
        logger.error('API usage monitoring error', error);
        next();
      }
    };
  },
  
  monitorDatabaseAccess: () => {
    return (req: any, res: any, next: any): void => {
      try {
        // In a real implementation, this would monitor database access patterns
        // For now, we'll just log that monitoring is active
        logger.debug('Database access monitoring active');
        
        next();
      } catch (error: any) {
        logger.error('Database access monitoring error', error);
        next();
      }
    };
  },
  
  monitorFileUploads: () => {
    return (req: any, res: any, next: any): void => {
      try {
        // Check if this is a file upload endpoint
        if (req.path.includes('/upload') || req.path.includes('/file')) {
          // Increment file upload counter
          logger.info('File upload detected', { 
            ip: req.ip, 
            userId: req.user?.userId 
          });
        }
        
        next();
      } catch (error: any) {
        logger.error('File upload monitoring error', error);
        next();
      }
    };
  },
  
  // New methods for production-ready implementation
  getMetrics: async (): Promise<SecurityMetrics> => {
    try {
      logger.debug('Getting security metrics');
      
      // Try to get from Redis cache first
      const cachedMetrics = await redisService.get('security:metrics:current');
      
      if (cachedMetrics) {
        logger.debug('Security metrics retrieved from cache');
        return JSON.parse(cachedMetrics);
      }
      
      // If not in cache, get from database (last hour of data)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data, error } = await (supabaseService as any).supabase
        .from('SecurityMetrics')
        .select('metric, value')
        .gte('timestamp', oneHourAgo);
      
      if (error) {
        logger.warn('Error retrieving security metrics from database', { error: error.message });
        // Return current in-memory metrics
        return { ...securityMetrics };
      }
      
      // Aggregate metrics from database
      const dbMetrics: SecurityMetrics = {
        authAttempts: 0,
        failedAuthAttempts: 0,
        successfulAuthAttempts: 0,
        apiRequests: 0,
        blockedRequests: 0,
        suspiciousActivities: 0,
        vulnerabilities: 0
      };
      
      for (const item of data) {
        if (item.metric in dbMetrics) {
          (dbMetrics as any)[item.metric] += item.value;
        }
      }
      
      // Merge with current in-memory metrics
      const mergedMetrics: SecurityMetrics = {
        authAttempts: dbMetrics.authAttempts + securityMetrics.authAttempts,
        failedAuthAttempts: dbMetrics.failedAuthAttempts + securityMetrics.failedAuthAttempts,
        successfulAuthAttempts: dbMetrics.successfulAuthAttempts + securityMetrics.successfulAuthAttempts,
        apiRequests: dbMetrics.apiRequests + securityMetrics.apiRequests,
        blockedRequests: dbMetrics.blockedRequests + securityMetrics.blockedRequests,
        suspiciousActivities: dbMetrics.suspiciousActivities + securityMetrics.suspiciousActivities,
        vulnerabilities: dbMetrics.vulnerabilities + securityMetrics.vulnerabilities
      };
      
      // Cache in Redis for 1 minute
      await redisService.set('security:metrics:current', JSON.stringify(mergedMetrics), 60);
      
      logger.debug('Security metrics retrieved and cached');
      return mergedMetrics;
    } catch (error: any) {
      logger.error('Error getting security metrics', { error: error.message });
      // Return current in-memory metrics as fallback
      return { ...securityMetrics };
    }
  },
  
  resetMetrics: async (): Promise<void> => {
    try {
      logger.debug('Resetting security metrics');
      
      // Reset in-memory metrics
      securityMetrics.authAttempts = 0;
      securityMetrics.failedAuthAttempts = 0;
      securityMetrics.successfulAuthAttempts = 0;
      securityMetrics.apiRequests = 0;
      securityMetrics.blockedRequests = 0;
      securityMetrics.suspiciousActivities = 0;
      securityMetrics.vulnerabilities = 0;
      
      // Clear Redis cache
      await redisService.del('security:metrics:current');
      
      logger.debug('Security metrics reset');
    } catch (error: any) {
      logger.error('Error resetting security metrics', { error: error.message });
      throw error;
    }
  },
  
  logMetric: async (metric: string, value: number): Promise<void> => {
    try {
      logger.debug('Logging security metric', { metric, value });
      
      // Save to database
      const { error } = await (supabaseService as any).supabase
        .from('SecurityMetrics')
        .insert({
          metric: metric,
          value: value,
          timestamp: new Date().toISOString()
        });
      
      if (error) {
        logger.error('Error saving security metric to database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Add to Redis time series data (keep last 100 values per metric)
      const metricKey = `security:metrics:history:${metric}`;
      const entry = JSON.stringify({
        value: value,
        timestamp: Date.now()
      });
      
      await redisService.lpush(metricKey, entry);
      await redisService.ltrim(metricKey, 0, 99); // Keep only last 100 entries
      
      // Clear current metrics cache since we've updated a metric
      await redisService.del('security:metrics:current');
      
      logger.debug('Security metric logged', { metric, value });
    } catch (error: any) {
      logger.error('Error logging security metric', { error: error.message });
      throw error;
    }
  },
  
  getMetricHistory: async (metric: string, hours: number = 24): Promise<any[]> => {
    try {
      logger.debug('Getting security metric history', { metric, hours });
      
      // Try to get from Redis cache first
      const cacheKey = `security:metrics:history:${metric}:${hours}`;
      const cachedHistory = await redisService.get(cacheKey);
      
      if (cachedHistory) {
        logger.debug('Security metric history retrieved from cache', { metric });
        return JSON.parse(cachedHistory);
      }
      
      // If not in cache, get from database
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await (supabaseService as any).supabase
        .from('SecurityMetrics')
        .select('*')
        .eq('metric', metric)
        .gte('timestamp', since)
        .order('timestamp', { ascending: true });
      
      if (error) {
        logger.error('Error retrieving security metric history from database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Cache in Redis for 5 minutes
      await redisService.set(cacheKey, JSON.stringify(data), 300);
      
      logger.debug('Security metric history retrieved from database and cached', { metric, count: data.length });
      return data;
    } catch (error: any) {
      logger.error('Error getting security metric history', { error: error.message });
      throw error;
    }
  }
};

// Function to get current security metrics
export async function getSecurityMetrics(): Promise<SecurityMetrics> {
  return await securityMonitoring.getMetrics();
}

// Function to reset metrics (for testing purposes)
export async function resetSecurityMetrics(): Promise<void> {
  await securityMonitoring.resetMetrics();
}