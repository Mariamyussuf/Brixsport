import { logger } from '../../utils/logger';
import { redisService } from '../redis.service';
import { supabaseService } from '../supabase.service';
import { PaginatedResult } from './security-service.types';

export interface SecurityEvent {
  id: string;
  userId?: string;
  eventType: string;
  resource?: string;
  action?: string;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  outcome: 'success' | 'failure';
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId?: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

export interface AuditFilter {
  userId?: string;
  eventType?: string;
  startDate?: Date;
  endDate?: Date;
  severity?: string;
  limit?: number;
  offset?: number;
}

export interface AuditService {
  logSecurityEvent(event: SecurityEvent): Promise<void>;
  getAuditLogs(filters: AuditFilter): Promise<PaginatedResult<AuditLog>>;
  exportAuditLogs(filters: AuditFilter, format: 'json' | 'csv' | 'pdf'): Promise<Buffer>;
  alertOnSuspiciousActivity(event: SecurityEvent): Promise<void>;
  // New methods for production-ready implementation
  flushAuditBuffer(): Promise<void>;
  getRecentEvents(limit?: number): Promise<SecurityEvent[]>;
  setAlertRule(rule: any): Promise<void>;
  getAlertRules(): Promise<any[]>;
  getRealTimeEvents(channel: string): Promise<SecurityEvent[]>;
  subscribeToEvents(channel: string): Promise<void>;
}

// Redis keys for audit buffering and real-time monitoring
const AUDIT_BUFFER_KEY = 'audit:buffer';
const SECURITY_EVENTS_KEY = 'security:events';
const REALTIME_CHANNEL_PREFIX = 'audit:channel:';

export const auditService: AuditService = {
  logSecurityEvent: async (event: SecurityEvent): Promise<void> => {
    try {
      logger.info('Logging security event', { 
        eventType: event.eventType, 
        userId: event.userId, 
        severity: event.severity 
      });
      
      // Store security event in Redis for real-time monitoring
      await redisService.lpush(SECURITY_EVENTS_KEY, JSON.stringify({
        ...event,
        timestamp: event.timestamp.toISOString()
      }));
      
      // Keep only the last 1000 events in Redis
      await redisService.ltrim(SECURITY_EVENTS_KEY, 0, 999);
      
      // Add to audit buffer for batch processing
      const auditLog: AuditLog = {
        id: event.id,
        timestamp: event.timestamp,
        userId: event.userId,
        action: event.action || event.eventType,
        resource: event.resource || 'unknown',
        details: event.details,
        ip: event.ip,
        userAgent: event.userAgent
      };
      
      await redisService.lpush(AUDIT_BUFFER_KEY, JSON.stringify({
        ...auditLog,
        timestamp: auditLog.timestamp.toISOString()
      }));
      
      // Keep only the last 1000 entries in the buffer
      await redisService.ltrim(AUDIT_BUFFER_KEY, 0, 999);
      
      // Publish to real-time channels based on event type
      const channels = [
        'all', // Broadcast to all subscribers
        `user:${event.userId}`, // User-specific channel
        `type:${event.eventType}`, // Event type channel
        `severity:${event.severity}` // Severity-based channel
      ];
      
      for (const channel of channels) {
        const channelKey = `${REALTIME_CHANNEL_PREFIX}${channel}`;
        await redisService.lpush(channelKey, JSON.stringify({
          ...event,
          timestamp: event.timestamp.toISOString()
        }));
        await redisService.ltrim(channelKey, 0, 99); // Keep last 100 events per channel
      }
      
      // Alert on critical events
      if (event.severity === 'critical' || event.severity === 'high') {
        await auditService.alertOnSuspiciousActivity(event);
      }
      
      logger.info('Security event logged', { eventId: event.id });
    } catch (error: any) {
      logger.error('Security event logging error', error);
      throw error;
    }
  },
  
  getAuditLogs: async (filters: AuditFilter): Promise<PaginatedResult<AuditLog>> => {
    try {
      logger.debug('Retrieving audit logs', { filters });
      
      // First, flush any buffered logs
      await auditService.flushAuditBuffer();
      
      // Query database for audit logs
      let query = (supabaseService as any).supabase
        .from('AuditLogs')
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false });
      
      // Apply filters
      if (filters.userId) {
        query = query.eq('userId', filters.userId);
      }
      
      if (filters.eventType) {
        query = query.eq('action', filters.eventType);
      }
      
      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate.toISOString());
      }
      
      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate.toISOString());
      }
      
      // Apply pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);
      
      const { data, error, count } = await query;
      
      if (error) {
        logger.error('Error retrieving audit logs from database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Convert timestamp strings back to Date objects
      const auditLogs = data.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }));
      
      logger.debug('Audit logs retrieved', { total: count, limit, offset });
      
      return {
        data: auditLogs,
        total: count || 0,
        limit,
        offset
      };
    } catch (error: any) {
      logger.error('Audit log retrieval error', error);
      throw error;
    }
  },
  
  exportAuditLogs: async (filters: AuditFilter, format: 'json' | 'csv' | 'pdf'): Promise<Buffer> => {
    try {
      logger.info('Exporting audit logs', { format });
      
      // Get filtered logs
      const result = await auditService.getAuditLogs(filters);
      const logs = result.data;
      
      let buffer: Buffer;
      
      switch (format) {
        case 'json':
          // Convert to JSON
          const jsonContent = JSON.stringify(logs, null, 2);
          buffer = Buffer.from(jsonContent, 'utf8');
          break;
          
        case 'csv':
          // Simple CSV export
          const csvContent = logs.map(log => 
            `${log.timestamp.toISOString()},${log.userId || ''},${log.action},${log.resource}`
          ).join('\n');
          
          buffer = Buffer.from(`timestamp,userId,action,resource\n${csvContent}`, 'utf8');
          break;
          
        case 'pdf':
          // Simple text representation for PDF
          const pdfContent = logs.map(log => 
            `Timestamp: ${log.timestamp.toISOString()}
User ID: ${log.userId || 'N/A'}
Action: ${log.action}
Resource: ${log.resource}
---
`
          ).join('');
          
          buffer = Buffer.from(pdfContent, 'utf8');
          break;
          
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
      
      logger.info('Audit logs exported', { format, count: logs.length });
      
      return buffer;
    } catch (error: any) {
      logger.error('Audit log export error', error);
      throw error;
    }
  },
  
  alertOnSuspiciousActivity: async (event: SecurityEvent): Promise<void> => {
    try {
      logger.warn('Suspicious activity detected', { 
        eventType: event.eventType, 
        userId: event.userId, 
        severity: event.severity 
      });
      
      // Save alert to database
      const alertData = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: event.eventType,
        severity: event.severity,
        message: `Suspicious activity detected: ${event.eventType}`,
        details: event.details,
        timestamp: event.timestamp.toISOString(),
        resolved: false
      };
      
      const { error } = await (supabaseService as any).supabase
        .from('SecurityAlerts')
        .insert(alertData);
      
      if (error) {
        logger.error('Error saving security alert to database', { error: error.message });
      }
      
      // In a real implementation, this would send alerts via email, SMS, or a notification system
      // For now, we'll just log the alert
      logger.error('SECURITY ALERT', { 
        message: `Suspicious activity detected: ${event.eventType}`,
        userId: event.userId,
        severity: event.severity,
        details: event.details
      });
      
      // Additional alerting logic could be implemented here
      // For example, notifying security team, blocking user, etc.
    } catch (error: any) {
      logger.error('Suspicious activity alert error', error);
      throw error;
    }
  },
  
  // New methods for production-ready implementation
  flushAuditBuffer: async (): Promise<void> => {
    try {
      logger.debug('Flushing audit buffer');
      
      // Get all entries from Redis buffer
      const bufferedLogs = await redisService.lrange(AUDIT_BUFFER_KEY, 0, -1);
      
      if (bufferedLogs.length === 0) {
        logger.debug('No audit logs to flush');
        return;
      }
      
      // Convert string entries back to objects
      const auditEntries = bufferedLogs.map(log => {
        const parsed = JSON.parse(log);
        return {
          ...parsed,
          timestamp: new Date(parsed.timestamp)
        };
      });
      
      // Save to database
      const { error } = await (supabaseService as any).supabase
        .from('AuditLogs')
        .insert(auditEntries);
      
      if (error) {
        logger.error('Error saving audit logs to database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Clear Redis buffer
      await redisService.del(AUDIT_BUFFER_KEY);
      
      logger.info('Audit buffer flushed to database', { count: auditEntries.length });
    } catch (error: any) {
      logger.error('Error flushing audit buffer', { error: error.message });
      throw error;
    }
  },
  
  getRecentEvents: async (limit: number = 50): Promise<SecurityEvent[]> => {
    try {
      logger.debug('Retrieving recent security events', { limit });
      
      // Get recent events from Redis
      const recentEvents = await redisService.lrange(SECURITY_EVENTS_KEY, 0, limit - 1);
      
      // Convert string entries back to objects
      const events = recentEvents.map(event => {
        const parsed = JSON.parse(event);
        return {
          ...parsed,
          timestamp: new Date(parsed.timestamp)
        };
      });
      
      logger.debug('Recent security events retrieved', { count: events.length });
      return events;
    } catch (error: any) {
      logger.error('Error retrieving recent security events', { error: error.message });
      throw error;
    }
  },
  
  setAlertRule: async (rule: any): Promise<void> => {
    try {
      logger.debug('Setting alert rule', { ruleId: rule.id });
      
      // Save to database
      const { error } = await (supabaseService as any).supabase
        .from('AlertRules')
        .upsert({
          ...rule,
          updatedAt: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
      
      if (error) {
        logger.error('Error saving alert rule to database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Cache in Redis for fast access
      const cacheKey = `alert:rule:${rule.id}`;
      await redisService.set(cacheKey, JSON.stringify(rule), 3600); // Cache for 1 hour
      
      logger.debug('Alert rule set', { ruleId: rule.id });
    } catch (error: any) {
      logger.error('Error setting alert rule', { error: error.message });
      throw error;
    }
  },
  
  getAlertRules: async (): Promise<any[]> => {
    try {
      logger.debug('Retrieving alert rules');
      
      // Try to get from Redis cache first
      const cachedRules = await redisService.get('alert:rules:all');
      if (cachedRules) {
        logger.debug('Alert rules retrieved from cache');
        return JSON.parse(cachedRules);
      }
      
      // If not in cache, get from database
      const { data, error } = await (supabaseService as any).supabase
        .from('AlertRules')
        .select('*')
        .eq('enabled', true);
      
      if (error) {
        logger.error('Error retrieving alert rules from database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Cache in Redis for 10 minutes
      await redisService.set('alert:rules:all', JSON.stringify(data), 600);
      
      logger.debug('Alert rules retrieved from database', { count: data.length });
      return data;
    } catch (error: any) {
      logger.error('Error retrieving alert rules', { error: error.message });
      throw error;
    }
  },
  
  getRealTimeEvents: async (channel: string): Promise<SecurityEvent[]> => {
    try {
      logger.debug('Retrieving real-time events', { channel });
      
      const channelKey = `${REALTIME_CHANNEL_PREFIX}${channel}`;
      const events = await redisService.lrange(channelKey, 0, -1);
      
      // Convert string entries back to objects
      const parsedEvents = events.map(event => {
        const parsed = JSON.parse(event);
        return {
          ...parsed,
          timestamp: new Date(parsed.timestamp)
        };
      });
      
      logger.debug('Real-time events retrieved', { channel, count: parsedEvents.length });
      return parsedEvents;
    } catch (error: any) {
      logger.error('Error retrieving real-time events', { error: error.message });
      throw error;
    }
  },
  
  subscribeToEvents: async (channel: string): Promise<void> => {
    try {
      logger.debug('Subscribing to events', { channel });
      
      // In a real implementation, this would set up a Redis pub/sub subscription
      // For now, we'll just log the subscription
      logger.info('Subscribed to audit events channel', { channel });
    } catch (error: any) {
      logger.error('Error subscribing to events', { error: error.message });
      throw error;
    }
  }
};