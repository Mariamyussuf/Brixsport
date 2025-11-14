import { logger } from '../../utils/logger';
import { redisService } from '../redis.service';
import { supabaseService } from '../supabase.service';
import { SecurityAlert, PaginatedResult } from './security-service.types';

export interface AlertRule {
  id: string;
  name: string;
  condition: AlertCondition;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notificationChannels: string[];
}

export interface AlertCondition {
  metric: string;
  operator: string;
  threshold: number;
  duration: number; // in seconds
}

export interface AlertingService {
  sendSecurityAlert(alert: SecurityAlert): Promise<void>;
  configureAlertRules(rules: AlertRule[]): Promise<void>;
  getAlertHistory(filters: AlertFilter): Promise<PaginatedResult<SecurityAlert>>;
  resolveAlert(alertId: string, resolvedBy?: string): Promise<void>;
  // New methods for production-ready implementation
  getAlertRules(): Promise<AlertRule[]>;
  addAlertRule(rule: AlertRule): Promise<void>;
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<void>;
  deleteAlertRule(ruleId: string): Promise<void>;
  getActiveAlerts(): Promise<SecurityAlert[]>;
  sendNotification(channel: string, message: string, severity: string): Promise<void>;
}

export interface AlertFilter {
  type?: string;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
  resolved?: boolean;
  limit?: number;
  offset?: number;
}

// In-memory storage for alerts (in production, this should be in a database)
const securityAlerts: SecurityAlert[] = [];

// In-memory storage for alert rules
const alertRules: AlertRule[] = [];

export const alertingService: AlertingService = {
  sendSecurityAlert: async (alert: SecurityAlert): Promise<void> => {
    try {
      logger.info('Sending security alert', { 
        alertType: alert.type, 
        severity: alert.severity 
      });
      
      // Store alert
      securityAlerts.push(alert);
      
      // Save to database
      const { error } = await (supabaseService as any).supabase
        .from('SecurityAlerts')
        .insert({
          ...alert,
          timestamp: alert.timestamp.toISOString(),
          resolvedAt: alert.resolvedAt ? alert.resolvedAt.toISOString() : null,
          details: JSON.stringify(alert.details)
        });
      
      if (error) {
        logger.error('Error saving security alert to database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Cache in Redis for fast access
      const alertKey = `alert:${alert.id}`;
      await redisService.set(alertKey, JSON.stringify(alert), 3600); // Cache for 1 hour
      
      // Add to active alerts list in Redis if not resolved
      if (!alert.resolved) {
        await redisService.lpush('alerts:active', alert.id);
        await redisService.ltrim('alerts:active', 0, 99); // Keep only last 100 active alerts
      }
      
      // In a real implementation, this would send notifications via:
      // - Email (using nodemailer)
      // - SMS (using Twilio or similar)
      // - Slack/Discord webhooks
      // - Push notifications
      // - etc.
      
      // For now, we'll just log the alert
      logger[alert.severity === 'critical' ? 'error' : 
            alert.severity === 'high' ? 'warn' : 'info'](
        'SECURITY ALERT', 
        alert
      );
      
      logger.info('Security alert sent', { alertId: alert.id });
    } catch (error: any) {
      logger.error('Security alert sending error', error);
      throw error;
    }
  },
  
  configureAlertRules: async (rules: AlertRule[]): Promise<void> => {
    try {
      logger.info('Configuring alert rules', { ruleCount: rules.length });
      
      // Replace existing rules with new ones
      alertRules.length = 0;
      alertRules.push(...rules);
      
      // Save to database
      const { error } = await (supabaseService as any).supabase
        .from('AlertRules')
        .upsert(rules.map(rule => ({
          ...rule,
          condition: JSON.stringify(rule.condition)
        })));
      
      if (error) {
        logger.error('Error saving alert rules to database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Cache in Redis for fast access
      await redisService.set('alert:rules:all', JSON.stringify(rules), 3600); // Cache for 1 hour
      
      logger.info('Alert rules configured', { ruleCount: alertRules.length });
    } catch (error: any) {
      logger.error('Alert rule configuration error', error);
      throw error;
    }
  },
  
  getAlertHistory: async (filters: AlertFilter): Promise<PaginatedResult<SecurityAlert>> => {
    try {
      logger.debug('Retrieving alert history', { filters });
      
      // Query database for alerts
      let query = (supabaseService as any).supabase
        .from('SecurityAlerts')
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false });
      
      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      
      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }
      
      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate.toISOString());
      }
      
      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate.toISOString());
      }
      
      if (filters.resolved !== undefined) {
        query = query.eq('resolved', filters.resolved);
      }
      
      // Apply pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);
      
      const { data, error, count } = await query;
      
      if (error) {
        logger.error('Error retrieving alerts from database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Convert timestamp strings back to Date objects
      const alerts = data.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
        resolvedAt: item.resolvedAt ? new Date(item.resolvedAt) : undefined,
        details: JSON.parse(item.details || '{}')
      }));
      
      logger.debug('Alert history retrieved', { total: count, limit, offset });
      
      return {
        data: alerts,
        total: count || 0,
        limit,
        offset
      };
    } catch (error: any) {
      logger.error('Alert history retrieval error', error);
      throw error;
    }
  },
  
  resolveAlert: async (alertId: string, resolvedByUserId?: string): Promise<void> => {
    try {
      logger.info('Resolving alert', { alertId, resolvedByUserId });
      
      // Find the alert
      const alert = securityAlerts.find(a => a.id === alertId);
      if (alert) {
        // Mark as resolved
        alert.resolved = true;
        alert.resolvedAt = new Date();
        // Set the user who resolved the alert
        if (resolvedByUserId) {
          alert.resolvedBy = resolvedByUserId;
        }
      }
      
      // Update in database
      const updateData: any = {
        resolved: true,
        resolvedAt: new Date().toISOString()
      };
      
      // Add resolvedBy field if userId is provided
      if (resolvedByUserId) {
        updateData.resolvedBy = resolvedByUserId;
      }
      
      const { error } = await (supabaseService as any).supabase
        .from('SecurityAlerts')
        .update(updateData)
        .eq('id', alertId);
      
      if (error) {
        logger.error('Error updating alert in database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Remove from active alerts in Redis
      await redisService.lrem('alerts:active', 0, alertId);
      
      // Update cache
      const alertKey = `alert:${alertId}`;
      const cachedAlert = await redisService.get(alertKey);
      if (cachedAlert) {
        const alertData = JSON.parse(cachedAlert);
        alertData.resolved = true;
        alertData.resolvedAt = new Date().toISOString();
        // Add resolvedBy field if userId is provided
        if (resolvedByUserId) {
          alertData.resolvedBy = resolvedByUserId;
        }
        await redisService.set(alertKey, JSON.stringify(alertData), 3600);
      }
      
      logger.info('Alert resolved', { alertId, resolvedByUserId });
    } catch (error: any) {
      logger.error('Alert resolution error', error);
      throw error;
    }
  },
  
  // New methods for production-ready implementation
  getAlertRules: async (): Promise<AlertRule[]> => {
    try {
      logger.debug('Getting alert rules');
      
      // Try to get from Redis cache first
      const cachedRules = await redisService.get('alert:rules:all');
      
      if (cachedRules) {
        logger.debug('Alert rules retrieved from cache');
        const rules = JSON.parse(cachedRules);
        // Convert condition strings back to objects
        return rules.map((rule: any) => ({
          ...rule,
          condition: JSON.parse(rule.condition)
        }));
      }
      
      // If not in cache, get from database
      const { data, error } = await (supabaseService as any).supabase
        .from('AlertRules')
        .select('*');
      
      if (error) {
        logger.error('Error retrieving alert rules from database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Convert condition strings back to objects
      const rules = data.map((rule: any) => ({
        ...rule,
        condition: JSON.parse(rule.condition)
      }));
      
      // Cache in Redis for 10 minutes
      await redisService.set('alert:rules:all', JSON.stringify(rules), 600);
      
      logger.debug('Alert rules retrieved from database and cached', { count: rules.length });
      return rules;
    } catch (error: any) {
      logger.error('Error getting alert rules', { error: error.message });
      throw error;
    }
  },
  
  addAlertRule: async (rule: AlertRule): Promise<void> => {
    try {
      logger.debug('Adding alert rule', { ruleId: rule.id });
      
      // Save to database
      const { error } = await (supabaseService as any).supabase
        .from('AlertRules')
        .insert({
          ...rule,
          condition: JSON.stringify(rule.condition)
        });
      
      if (error) {
        logger.error('Error saving alert rule to database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Cache in Redis
      const ruleKey = `alert:rule:${rule.id}`;
      await redisService.set(ruleKey, JSON.stringify(rule), 3600); // Cache for 1 hour
      
      // Clear rules cache
      await redisService.del('alert:rules:all');
      
      logger.debug('Alert rule added', { ruleId: rule.id });
    } catch (error: any) {
      logger.error('Error adding alert rule', { error: error.message });
      throw error;
    }
  },
  
  updateAlertRule: async (ruleId: string, updates: Partial<AlertRule>): Promise<void> => {
    try {
      logger.debug('Updating alert rule', { ruleId });
      
      // Update in database
      const { error } = await (supabaseService as any).supabase
        .from('AlertRules')
        .update({
          ...updates,
          condition: updates.condition ? JSON.stringify(updates.condition) : undefined,
          updatedAt: new Date().toISOString()
        })
        .eq('id', ruleId);
      
      if (error) {
        logger.error('Error updating alert rule in database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Clear caches
      await redisService.del(`alert:rule:${ruleId}`);
      await redisService.del('alert:rules:all');
      
      logger.debug('Alert rule updated', { ruleId });
    } catch (error: any) {
      logger.error('Error updating alert rule', { error: error.message });
      throw error;
    }
  },
  
  deleteAlertRule: async (ruleId: string): Promise<void> => {
    try {
      logger.debug('Deleting alert rule', { ruleId });
      
      // Delete from database
      const { error } = await (supabaseService as any).supabase
        .from('AlertRules')
        .delete()
        .eq('id', ruleId);
      
      if (error) {
        logger.error('Error deleting alert rule from database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Clear caches
      await redisService.del(`alert:rule:${ruleId}`);
      await redisService.del('alert:rules:all');
      
      logger.debug('Alert rule deleted', { ruleId });
    } catch (error: any) {
      logger.error('Error deleting alert rule', { error: error.message });
      throw error;
    }
  },
  
  getActiveAlerts: async (): Promise<SecurityAlert[]> => {
    try {
      logger.debug('Getting active alerts');
      
      // Try to get from Redis cache first
      const activeAlertIds = await redisService.lrange('alerts:active', 0, -1);
      
      if (activeAlertIds.length > 0) {
        const alerts = [];
        for (const alertId of activeAlertIds) {
          const alertKey = `alert:${alertId}`;
          const cachedAlert = await redisService.get(alertKey);
          if (cachedAlert) {
            const alertData = JSON.parse(cachedAlert);
            // Convert timestamp strings back to Date objects
            alerts.push({
              ...alertData,
              timestamp: new Date(alertData.timestamp),
              resolvedAt: alertData.resolvedAt ? new Date(alertData.resolvedAt) : undefined,
              details: JSON.parse(alertData.details || '{}')
            });
          }
        }
        logger.debug('Active alerts retrieved from cache', { count: alerts.length });
        return alerts;
      }
      
      // If not in cache, get from database
      const { data, error } = await (supabaseService as any).supabase
        .from('SecurityAlerts')
        .select('*')
        .eq('resolved', false)
        .order('timestamp', { ascending: false })
        .limit(100);
      
      if (error) {
        logger.error('Error retrieving active alerts from database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Convert timestamp strings back to Date objects
      const alerts = data.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
        resolvedAt: item.resolvedAt ? new Date(item.resolvedAt) : undefined,
        details: JSON.parse(item.details || '{}')
      }));
      
      // Cache in Redis
      if (alerts.length > 0) {
        const alertIds = alerts.map((alert: SecurityAlert) => alert.id);
        await redisService.del('alerts:active');
        await redisService.lpush('alerts:active', ...alertIds);
        await redisService.ltrim('alerts:active', 0, 99);
        
        for (const alert of alerts) {
          const alertKey = `alert:${alert.id}`;
          await redisService.set(alertKey, JSON.stringify(alert), 3600);
        }
      }
      
      logger.debug('Active alerts retrieved from database and cached', { count: alerts.length });
      return alerts;
    } catch (error: any) {
      logger.error('Error getting active alerts', { error: error.message });
      throw error;
    }
  },
  
  sendNotification: async (channel: string, message: string, severity: string): Promise<void> => {
    try {
      logger.debug('Sending notification', { channel, severity });
      
      // In a real implementation, this would send notifications via various channels:
      // - Email (using nodemailer)
      // - SMS (using Twilio or similar)
      // - Slack/Discord webhooks
      // - Push notifications
      // - etc.
      
      // For now, we'll just log the notification
      logger.info('SECURITY NOTIFICATION', { channel, message, severity });
      
      // Log notification to database
      const { error } = await (supabaseService as any).supabase
        .from('SecurityNotifications')
        .insert({
          channel: channel,
          message: message,
          severity: severity,
          timestamp: new Date().toISOString()
        });
      
      if (error) {
        logger.error('Error saving notification to database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      logger.debug('Notification sent', { channel, severity });
    } catch (error: any) {
      logger.error('Error sending notification', { error: error.message });
      throw error;
    }
  }
};

// Function to evaluate alert conditions and trigger alerts
export async function evaluateAlertConditions(metrics: any): Promise<void> {
  try {
    logger.debug('Evaluating alert conditions');
    
    // Get alert rules
    const rules = await alertingService.getAlertRules();
    
    // Check each alert rule
    for (const rule of rules) {
      if (!rule.enabled) continue;
      
      // Get the metric value
      const metricValue = (metrics as any)[rule.condition.metric];
      if (metricValue === undefined) continue;
      
      // Evaluate condition
      let conditionMet = false;
      
      switch (rule.condition.operator) {
        case 'gt':
          conditionMet = metricValue > rule.condition.threshold;
          break;
        case 'lt':
          conditionMet = metricValue < rule.condition.threshold;
          break;
        case 'eq':
          conditionMet = metricValue === rule.condition.threshold;
          break;
        case 'gte':
          conditionMet = metricValue >= rule.condition.threshold;
          break;
        case 'lte':
          conditionMet = metricValue <= rule.condition.threshold;
          break;
      }
      
      if (conditionMet) {
        // Trigger alert
        const alert: SecurityAlert = {
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'metric_threshold',
          severity: rule.severity,
          message: `Metric ${rule.condition.metric} ${rule.condition.operator} ${rule.condition.threshold}`,
          details: {
            metric: rule.condition.metric,
            value: metricValue,
            threshold: rule.condition.threshold,
            operator: rule.condition.operator
          },
          timestamp: new Date(),
          resolved: false
        };
        
        await alertingService.sendSecurityAlert(alert);
        
        // Send notifications
        for (const channel of rule.notificationChannels) {
          await alertingService.sendNotification(channel, alert.message, rule.severity);
        }
      }
    }
  } catch (error: any) {
    logger.error('Alert condition evaluation error', error);
  }
}