import { logger } from '../utils/logger';
import { supabaseService } from './supabase.service';

interface PasswordResetLog {
  userId?: string;
  email: string;
  action: 'request' | 'reset_success' | 'reset_failed' | 'token_expired' | 'token_invalid' | 'rate_limited';
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Password Reset Audit Logging Service
 * Logs all password reset attempts for security auditing and compliance
 */
export const passwordResetAuditService = {
  /**
   * Log a password reset event
   * @param logData Password reset log data
   */
  logPasswordResetEvent: async (logData: PasswordResetLog): Promise<void> => {
    try {
      const logEntry = {
        user_id: logData.userId || null,
        email: logData.email,
        action: logData.action,
        ip_address: logData.ipAddress || 'unknown',
        user_agent: logData.userAgent || 'unknown',
        metadata: logData.metadata || {},
        timestamp: logData.timestamp || new Date(),
        severity: passwordResetAuditService.getSeverityLevel(logData.action)
      };

      // Log to application logger
      logger.info('Password reset event', logEntry);

      // Store in database for audit trail
      try {
        // Attempt to store in a security_logs or audit_logs table
        // This assumes you have a security logging table in your database
        await passwordResetAuditService.storeAuditLog(logEntry);
      } catch (dbError) {
        logger.warn('Failed to store password reset audit log in database', { 
          error: dbError,
          logEntry 
        });
      }

      // Alert on suspicious patterns
      if (logData.action === 'rate_limited' || logData.action === 'reset_failed') {
        await passwordResetAuditService.checkSuspiciousActivity(logData);
      }
    } catch (error: any) {
      logger.error('Failed to log password reset event', { 
        error: error.message, 
        logData 
      });
    }
  },

  /**
   * Store audit log in database
   * @param logEntry Log entry to store
   */
  storeAuditLog: async (logEntry: any): Promise<void> => {
    try {
      // Try to insert into security_logs or logger_activity table
      // Adapt this based on your actual database schema
      const supabase = (supabaseService as any).getClient?.() || (supabaseService as any).supabase;
      
      if (supabase) {
        // Try to insert into a security audit table
        const { error } = await supabase
          .from('logger_activity')
          .insert({
            logger_id: logEntry.user_id,
            activity_type: `password_reset_${logEntry.action}`,
            description: `Password reset ${logEntry.action} for ${logEntry.email}`,
            metadata: {
              email: logEntry.email,
              ip_address: logEntry.ip_address,
              user_agent: logEntry.user_agent,
              severity: logEntry.severity,
              ...logEntry.metadata
            },
            timestamp: logEntry.timestamp
          });

        if (error) {
          logger.warn('Failed to insert audit log', { error });
        }
      }
    } catch (error: any) {
      logger.warn('Error storing audit log in database', { error: error.message });
    }
  },

  /**
   * Get severity level for action
   * @param action Password reset action
   */
  getSeverityLevel: (action: PasswordResetLog['action']): 'low' | 'medium' | 'high' | 'critical' => {
    switch (action) {
      case 'request':
        return 'low';
      case 'reset_success':
        return 'medium';
      case 'reset_failed':
        return 'medium';
      case 'token_expired':
        return 'low';
      case 'token_invalid':
        return 'high';
      case 'rate_limited':
        return 'high';
      default:
        return 'medium';
    }
  },

  /**
   * Check for suspicious activity patterns
   * @param logData Password reset log data
   */
  checkSuspiciousActivity: async (logData: PasswordResetLog): Promise<void> => {
    try {
      // Check for repeated failures from same IP
      if (logData.ipAddress) {
        const recentFailures = await passwordResetAuditService.getRecentFailures(
          logData.ipAddress,
          15 // Last 15 minutes
        );

        if (recentFailures >= 5) {
          logger.warn('Suspicious password reset activity detected', {
            ipAddress: logData.ipAddress,
            recentFailures,
            email: logData.email
          });

          // Could trigger additional security measures here
          // e.g., notify security team, temporary IP block, etc.
        }
      }
    } catch (error: any) {
      logger.error('Error checking suspicious activity', { error: error.message });
    }
  },

  /**
   * Get recent failures count
   * @param ipAddress IP address to check
   * @param minutesBack How many minutes to look back
   */
  getRecentFailures: async (ipAddress: string, minutesBack: number): Promise<number> => {
    try {
      const supabase = (supabaseService as any).getClient?.() || (supabaseService as any).supabase;
      
      if (supabase) {
        const cutoffTime = new Date(Date.now() - minutesBack * 60 * 1000);
        
        const { data, error } = await supabase
          .from('logger_activity')
          .select('*', { count: 'exact', head: true })
          .eq('activity_type', 'password_reset_reset_failed')
          .gte('timestamp', cutoffTime.toISOString())
          .contains('metadata', { ip_address: ipAddress });

        if (!error && data) {
          return (data as any).length || 0;
        }
      }
      
      return 0;
    } catch (error: any) {
      logger.error('Error getting recent failures', { error: error.message });
      return 0;
    }
  },

  /**
   * Log password reset request
   */
  logResetRequest: async (
    email: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<void> => {
    await passwordResetAuditService.logPasswordResetEvent({
      email,
      action: 'request',
      ipAddress,
      userAgent,
      metadata,
      timestamp: new Date()
    });
  },

  /**
   * Log successful password reset
   */
  logResetSuccess: async (
    userId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<void> => {
    await passwordResetAuditService.logPasswordResetEvent({
      userId,
      email,
      action: 'reset_success',
      ipAddress,
      userAgent,
      metadata,
      timestamp: new Date()
    });
  },

  /**
   * Log failed password reset
   */
  logResetFailed: async (
    email: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<void> => {
    await passwordResetAuditService.logPasswordResetEvent({
      email,
      action: 'reset_failed',
      ipAddress,
      userAgent,
      metadata: { reason, ...metadata },
      timestamp: new Date()
    });
  },

  /**
   * Log expired token attempt
   */
  logTokenExpired: async (
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> => {
    await passwordResetAuditService.logPasswordResetEvent({
      email,
      action: 'token_expired',
      ipAddress,
      userAgent,
      timestamp: new Date()
    });
  },

  /**
   * Log invalid token attempt
   */
  logTokenInvalid: async (
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> => {
    await passwordResetAuditService.logPasswordResetEvent({
      email,
      action: 'token_invalid',
      ipAddress,
      userAgent,
      timestamp: new Date()
    });
  },

  /**
   * Log rate limited attempt
   */
  logRateLimited: async (
    email: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<void> => {
    await passwordResetAuditService.logPasswordResetEvent({
      email,
      action: 'rate_limited',
      ipAddress,
      userAgent,
      metadata,
      timestamp: new Date()
    });
  },

  /**
   * Get password reset audit logs for a user
   * @param email User email
   * @param limit Number of logs to retrieve
   */
  getUserResetLogs: async (email: string, limit: number = 10): Promise<any[]> => {
    try {
      const supabase = (supabaseService as any).getClient?.() || (supabaseService as any).supabase;
      
      if (supabase) {
        const { data, error } = await supabase
          .from('logger_activity')
          .select('*')
          .ilike('description', `%${email}%`)
          .like('activity_type', 'password_reset_%')
          .order('timestamp', { ascending: false })
          .limit(limit);

        if (!error && data) {
          return data;
        }
      }
      
      return [];
    } catch (error: any) {
      logger.error('Error getting user reset logs', { error: error.message });
      return [];
    }
  },

  /**
   * Get recent password reset statistics
   * @param hoursBack Number of hours to look back
   */
  getResetStatistics: async (hoursBack: number = 24): Promise<{
    totalRequests: number;
    successfulResets: number;
    failedResets: number;
    rateLimited: number;
    expiredTokens: number;
    invalidTokens: number;
  }> => {
    try {
      const supabase = (supabaseService as any).getClient?.() || (supabaseService as any).supabase;
      
      if (supabase) {
        const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
        
        const { data, error } = await supabase
          .from('logger_activity')
          .select('activity_type')
          .like('activity_type', 'password_reset_%')
          .gte('timestamp', cutoffTime.toISOString());

        if (!error && data) {
          const stats = {
            totalRequests: 0,
            successfulResets: 0,
            failedResets: 0,
            rateLimited: 0,
            expiredTokens: 0,
            invalidTokens: 0
          };

          data.forEach((log: any) => {
            switch (log.activity_type) {
              case 'password_reset_request':
                stats.totalRequests++;
                break;
              case 'password_reset_reset_success':
                stats.successfulResets++;
                break;
              case 'password_reset_reset_failed':
                stats.failedResets++;
                break;
              case 'password_reset_rate_limited':
                stats.rateLimited++;
                break;
              case 'password_reset_token_expired':
                stats.expiredTokens++;
                break;
              case 'password_reset_token_invalid':
                stats.invalidTokens++;
                break;
            }
          });

          return stats;
        }
      }
      
      return {
        totalRequests: 0,
        successfulResets: 0,
        failedResets: 0,
        rateLimited: 0,
        expiredTokens: 0,
        invalidTokens: 0
      };
    } catch (error: any) {
      logger.error('Error getting reset statistics', { error: error.message });
      return {
        totalRequests: 0,
        successfulResets: 0,
        failedResets: 0,
        rateLimited: 0,
        expiredTokens: 0,
        invalidTokens: 0
      };
    }
  }
};
