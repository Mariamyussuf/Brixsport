import { logger } from '../../utils/logger';
import { redisService } from '../redis.service';
import { supabaseService } from '../supabase.service';

export interface FirewallRule {
  id: string;
  ip: string;
  action: 'allow' | 'deny';
  port?: number;
  protocol?: string;
  expiresAt?: Date;
}

export interface NetworkSecurity {
  configureFirewall(rules: FirewallRule[]): Promise<void>;
  monitorNetworkTraffic(): Promise<void>;
  blockSuspiciousTraffic(ip: string): Promise<void>;
  whitelistIP(ip: string): Promise<void>;
  getFirewallRules(): Promise<FirewallRule[]>;
  addFirewallRule(rule: FirewallRule): Promise<void>;
  removeFirewallRule(ruleId: string): Promise<void>;
  getBlockedIPs(): Promise<string[]>;
  getWhitelistedIPs(): Promise<string[]>;
  logNetworkEvent(event: any): Promise<void>;
  getNetworkStatistics(): Promise<any>;
  detectSuspiciousActivity(stats: any): Promise<any[]>;
  checkRateLimitViolations(): Promise<any[]>;
  detectDDoSAttacks(stats: any): Promise<any[]>;
}

// In-memory storage for firewall rules (in production, this should be in a database)
const firewallRules: FirewallRule[] = [];

// In-memory storage for whitelisted IPs
const whitelistedIPs: Set<string> = new Set();

// In-memory storage for blocked IPs
const blockedIPs: Set<string> = new Set();

export const networkSecurity: NetworkSecurity = {
  configureFirewall: async (rules: FirewallRule[]): Promise<void> => {
    try {
      logger.info('Configuring firewall', { ruleCount: rules.length });
      
      // Replace existing rules with new ones
      firewallRules.length = 0;
      firewallRules.push(...rules);
      
      // Save to database
      const { error } = await (supabaseService as any).supabase
        .from('FirewallRules')
        .upsert(rules.map(rule => ({
          ...rule,
          expiresAt: rule.expiresAt ? rule.expiresAt.toISOString() : null
        })));
      
      if (error) {
        logger.error('Error saving firewall rules to database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Cache in Redis for fast access
      await redisService.set('firewall:rules', JSON.stringify(rules), 3600); // Cache for 1 hour
      
      logger.info('Firewall configured', { ruleCount: firewallRules.length });
    } catch (error: any) {
      logger.error('Firewall configuration error', error);
      throw error;
    }
  },
  
  monitorNetworkTraffic: async (): Promise<void> => {
    try {
      logger.debug('Starting comprehensive network traffic monitoring');

      // Get current network statistics
      const networkStats = await networkSecurity.getNetworkStatistics();

      // Check for suspicious patterns
      const suspiciousActivity = await networkSecurity.detectSuspiciousActivity(networkStats);

      // Monitor connection rates
      const rateLimitViolations = await networkSecurity.checkRateLimitViolations();

      // Detect potential DDoS attacks
      const ddosThreats = await networkSecurity.detectDDoSAttacks(networkStats);

      // Log monitoring results
      if (suspiciousActivity.length > 0 || rateLimitViolations.length > 0 || ddosThreats.length > 0) {
        await networkSecurity.logNetworkEvent({
          id: `monitor-${Date.now()}`,
          type: 'monitoring_alert',
          severity: 'warning',
          message: 'Network monitoring detected potential threats',
          details: {
            suspiciousActivity: suspiciousActivity.length,
            rateLimitViolations: rateLimitViolations.length,
            ddosThreats: ddosThreats.length,
            timestamp: new Date().toISOString()
          }
        });
      }

      // Auto-block severe threats
      for (const threat of [...suspiciousActivity, ...ddosThreats]) {
        if (threat.severity === 'high') {
          await networkSecurity.blockSuspiciousTraffic(threat.ip);
        }
      }

      logger.debug('Network traffic monitoring completed', {
        threatsDetected: suspiciousActivity.length + ddosThreats.length,
        rateViolations: rateLimitViolations.length
      });
    } catch (error: any) {
      logger.error('Network traffic monitoring error', error);
      throw error;
    }
  },

  // Helper function to get network statistics
  getNetworkStatistics: async () => {
    try {
      const stats = {
        timestamp: new Date(),
        blockedIPs: await redisService.get('network:blocked:ips:count') || '0',
        whitelistedIPs: await redisService.get('network:whitelisted:ips:count') || '0',
        firewallRules: firewallRules.length,
        recentEvents: parseInt(await redisService.get('network:events:count') || '0')
      };

      // Get recent network events from Redis (last 100)
      const recentEventKeys = await redisService.lrange('network:events:recent', 0, 99);
      const recentEvents = [];
      for (const key of recentEventKeys) {
        const event = await redisService.get(key);
        if (event) {
          recentEvents.push(JSON.parse(event));
        }
      }

      stats.recentEvents = recentEvents.length;
      return stats;
    } catch (error: any) {
      logger.error('Error getting network statistics', error);
      return {
        timestamp: new Date(),
        blockedIPs: 0,
        whitelistedIPs: 0,
        firewallRules: firewallRules.length,
        recentEvents: []
      };
    }
  },

  // Detect suspicious network activity patterns
  detectSuspiciousActivity: async (stats: any) => {
    const suspicious: any[] = [];

    // Check for IPs with multiple failed attempts
    const failedAttempts = await redisService.hgetall('network:failed:attempts');
    for (const [ip, attempts] of Object.entries(failedAttempts)) {
      if (parseInt(attempts) > 10) { // More than 10 failed attempts
        suspicious.push({
          ip,
          reason: 'Multiple failed connection attempts',
          severity: 'medium',
          attempts: parseInt(attempts)
        });
      }
    }

    // Check for unusual traffic patterns in recent events
    const recentEvents = stats.recentEvents || [];
    const ipCounts: { [key: string]: number } = {};

    recentEvents.forEach((event: any) => {
      if (event.ip) {
        ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1;
      }
    });

    // Flag IPs with unusually high activity
    for (const [ip, count] of Object.entries(ipCounts)) {
      if (count > 50) { // More than 50 events in recent period
        suspicious.push({
          ip,
          reason: 'Unusual high traffic volume',
          severity: 'high',
          eventCount: count
        });
      }
    }

    return suspicious;
  },

  // Check for rate limit violations
  checkRateLimitViolations: async () => {
    const violations: any[] = [];

    // Get rate limiting data from Redis
    const rateLimitKeys = await redisService.keys('network:rate:limit:*');
    for (const key of rateLimitKeys) {
      const count = parseInt(await redisService.get(key) || '0');
      if (count > 100) { // More than 100 requests per minute
        const ip = key.replace('network:rate:limit:', '');
        violations.push({
          ip,
          reason: 'Rate limit exceeded',
          severity: 'medium',
          requestCount: count
        });
      }
    }

    return violations;
  },

  // Detect potential DDoS attacks
  detectDDoSAttacks: async (stats: any) => {
    const threats: any[] = [];

    // Check for sudden spikes in traffic
    const totalEvents = stats.recentEvents?.length || 0;
    if (totalEvents > 1000) { // More than 1000 events in recent period
      // Get unique IPs
      const uniqueIPs = new Set();
      stats.recentEvents?.forEach((event: any) => {
        if (event.ip) uniqueIPs.add(event.ip);
      });

      // If many IPs are generating traffic, it might be DDoS
      if (uniqueIPs.size > 100) {
        threats.push({
          ip: 'MULTIPLE',
          reason: 'Potential DDoS attack detected',
          severity: 'high',
          uniqueIPs: uniqueIPs.size,
          totalEvents
        });
      }
    }

    return threats;
  },

  blockSuspiciousTraffic: async (ip: string): Promise<void> => {
    try {
      // Add IP to blocked list
      blockedIPs.add(ip);
      
      // Remove from whitelist if present
      whitelistedIPs.delete(ip);
      
      // Add firewall rule to block this IP
      const rule: FirewallRule = {
        id: `block-${Date.now()}`,
        ip,
        action: 'deny',
        expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
      };
      
      firewallRules.push(rule);
      
      // Save to database
      const { error } = await (supabaseService as any).supabase
        .from('FirewallRules')
        .insert({
          ...rule,
          expiresAt: rule.expiresAt ? rule.expiresAt.toISOString() : null
        });
      
      if (error) {
        logger.error('Error saving firewall rule to database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Cache in Redis
      await redisService.sadd('network:blocked:ips', ip);
      await redisService.set(`firewall:rule:${rule.id}`, JSON.stringify(rule), 3600);
      
      logger.info('IP blocked', { ip });
    } catch (error: any) {
      logger.error('IP blocking error', error);
      throw error;
    }
  },
  
  whitelistIP: async (ip: string): Promise<void> => {
    try {
      logger.info('Whitelisting IP', { ip });
      
      // Add IP to whitelist
      whitelistedIPs.add(ip);
      
      // Remove from blocked list if present
      blockedIPs.delete(ip);
      
      // Remove any existing deny rules for this IP
      const denyRuleIndex = firewallRules.findIndex(
        rule => rule.ip === ip && rule.action === 'deny'
      );
      
      if (denyRuleIndex >= 0) {
        const ruleId = firewallRules[denyRuleIndex].id;
        firewallRules.splice(denyRuleIndex, 1);
        
        // Remove from database
        const { error } = await (supabaseService as any).supabase
          .from('FirewallRules')
          .delete()
          .eq('id', ruleId);
        
        if (error) {
          logger.error('Error deleting firewall rule from database', { error: error.message });
        }
        
        // Remove from Redis cache
        await redisService.del(`firewall:rule:${ruleId}`);
      }
      
      // Add firewall rule to allow this IP
      const rule: FirewallRule = {
        id: `allow-${Date.now()}`,
        ip,
        action: 'allow'
      };
      
      firewallRules.push(rule);
      
      // Save to database
      const { error } = await (supabaseService as any).supabase
        .from('FirewallRules')
        .insert({
          ...rule,
          expiresAt: rule.expiresAt ? rule.expiresAt.toISOString() : null
        });
      
      if (error) {
        logger.error('Error saving firewall rule to database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Cache in Redis
      await redisService.sadd('network:whitelisted:ips', ip);
      await redisService.set(`firewall:rule:${rule.id}`, JSON.stringify(rule), 3600);
      
      logger.info('IP whitelisted', { ip });
    } catch (error: any) {
      logger.error('IP whitelisting error', error);
      throw error;
    }
  },
  
  // New methods for production-ready implementation
  getFirewallRules: async (): Promise<FirewallRule[]> => {
    try {
      logger.debug('Getting firewall rules');
      
      // Try to get from Redis cache first
      const cachedRules = await redisService.get('firewall:rules');
      
      if (cachedRules) {
        logger.debug('Firewall rules retrieved from cache');
        const rules = JSON.parse(cachedRules);
        // Convert expiresAt strings back to Date objects
        return rules.map((rule: any) => ({
          ...rule,
          expiresAt: rule.expiresAt ? new Date(rule.expiresAt) : undefined
        }));
      }
      
      // If not in cache, get from database
      const { data, error } = await (supabaseService as any).supabase
        .from('FirewallRules')
        .select('*');
      
      if (error) {
        logger.error('Error retrieving firewall rules from database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Convert expiresAt strings back to Date objects
      const rules = data.map((rule: any) => ({
        ...rule,
        expiresAt: rule.expiresAt ? new Date(rule.expiresAt) : undefined
      }));
      
      // Cache in Redis for 10 minutes
      await redisService.set('firewall:rules', JSON.stringify(rules), 600);
      
      logger.debug('Firewall rules retrieved from database and cached', { count: rules.length });
      return rules;
    } catch (error: any) {
      logger.error('Error getting firewall rules', { error: error.message });
      throw error;
    }
  },
  
  addFirewallRule: async (rule: FirewallRule): Promise<void> => {
    try {
      logger.debug('Adding firewall rule', { ruleId: rule.id });
      
      // Save to database
      const { error } = await (supabaseService as any).supabase
        .from('FirewallRules')
        .insert({
          ...rule,
          expiresAt: rule.expiresAt ? rule.expiresAt.toISOString() : null
        });
      
      if (error) {
        logger.error('Error saving firewall rule to database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Cache in Redis
      await redisService.set(`firewall:rule:${rule.id}`, JSON.stringify(rule), 3600);
      
      // Update rules cache
      await redisService.del('firewall:rules');
      
      logger.debug('Firewall rule added', { ruleId: rule.id });
    } catch (error: any) {
      logger.error('Error adding firewall rule', { error: error.message });
      throw error;
    }
  },
  
  removeFirewallRule: async (ruleId: string): Promise<void> => {
    try {
      logger.debug('Removing firewall rule', { ruleId });
      
      // Remove from database
      const { error } = await (supabaseService as any).supabase
        .from('FirewallRules')
        .delete()
        .eq('id', ruleId);
      
      if (error) {
        logger.error('Error deleting firewall rule from database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Remove from Redis cache
      await redisService.del(`firewall:rule:${ruleId}`);
      
      // Update rules cache
      await redisService.del('firewall:rules');
      
      logger.debug('Firewall rule removed', { ruleId });
    } catch (error: any) {
      logger.error('Error removing firewall rule', { error: error.message });
      throw error;
    }
  },
  getBlockedIPs: async (): Promise<string[]> => {
    try {
      logger.debug('Getting blocked IPs');
      
      // Try to get from Redis cache first
      const cachedBlocked = JSON.parse(await redisService.get('network:blocked:ips') || '[]');
      
      if (cachedBlocked.length > 0) {
        logger.debug('Blocked IPs retrieved from cache', { count: cachedBlocked.length });
        return cachedBlocked;
      }
      
      // If not in cache, get from database
      const { data, error } = await (supabaseService as any).supabase
        .from('FirewallRules')
        .select('ip')
        .eq('action', 'deny');
      
      if (error) {
        logger.error('Error retrieving blocked IPs from database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      const ips = data.map((item: { ip: string }) => item.ip);
      
      // Cache in Redis for 10 minutes
      if (ips.length > 0) {
        await redisService.sadd('network:blocked:ips', ...ips);
      }
      
      logger.debug('Blocked IPs retrieved from database and cached', { count: ips.length });
      return ips;
    } catch (error: any) {
      logger.error('Error getting blocked IPs', { error: error.message });
      throw error;
    }
  },
  
  getWhitelistedIPs: async (): Promise<string[]> => {
    try {
      logger.debug('Getting whitelisted IPs');
      
      // Try to get from Redis cache first
      const cachedWhitelisted = JSON.parse(await redisService.get('network:whitelisted:ips') || '[]');
      
      if (cachedWhitelisted.length > 0) {
        logger.debug('Whitelisted IPs retrieved from cache', { count: cachedWhitelisted.length });
        return cachedWhitelisted;
      }
      
      // If not in cache, get from database
      const { data, error } = await (supabaseService as any).supabase
        .from('FirewallRules')
        .select('ip')
        .eq('action', 'allow');
      
      if (error) {
        logger.error('Error retrieving whitelisted IPs from database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      const ips = data.map((item: { ip: string }) => item.ip);
      
      // Cache in Redis for 10 minutes
      if (ips.length > 0) {
        await redisService.sadd('network:whitelisted:ips', ...ips);
      }
      
      logger.debug('Whitelisted IPs retrieved from database and cached', { count: ips.length });
      return ips;
    } catch (error: any) {
      logger.error('Error getting whitelisted IPs', { error: error.message });
      throw error;
    }
  },
  
  logNetworkEvent: async (event: any): Promise<void> => {
    try {
      logger.debug('Logging network event', { eventId: event.id });
      
      // Save to database
      const { error } = await (supabaseService as any).supabase
        .from('NetworkEvents')
        .insert({
          ...event,
          timestamp: new Date().toISOString()
        });
      
      if (error) {
        logger.error('Error saving network event to database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Add to Redis for real-time monitoring
      const eventKey = `network:event:${event.id}`;
      await redisService.set(eventKey, JSON.stringify(event), 3600); // Keep for 1 hour
      
      logger.debug('Network event logged', { eventId: event.id });
    } catch (error: any) {
      logger.error('Error logging network event', { error: error.message });
      throw error;
    }
  }
};

// Helper function to check if an IP is allowed
export async function isIPAllowed(ip: string): Promise<boolean> {
  try {
    // Check if IP is whitelisted in Redis
    const isWhitelisted = JSON.parse(await redisService.get('network:whitelisted:ips') || '[]').includes(ip);
    if (isWhitelisted) {
      return true;
    }
    
    // Check if IP is blocked in Redis
    const isBlocked = JSON.parse(await redisService.get('network:blocked:ips') || '[]').includes(ip);
    if (isBlocked) {
      return false;
    }
    
    // Check firewall rules in Redis cache
    const cachedRules = await redisService.get('firewall:rules');
    if (cachedRules) {
      const rules: FirewallRule[] = JSON.parse(cachedRules);
      const relevantRules = rules.filter(rule => rule.ip === ip);
      
      // If there are no rules for this IP, default to allow
      if (relevantRules.length === 0) {
        return true;
      }
      
      // Check the most recent rule
      const latestRule = relevantRules.reduce((latest, current) => {
        return !latest || (current.id > latest.id) ? current : latest;
      });
      
      return latestRule.action === 'allow';
    }
    
    // If not in cache, check database
    const { data, error } = await (supabaseService as any).supabase
      .from('FirewallRules')
      .select('*')
      .eq('ip', ip)
      .order('id', { ascending: false })
      .limit(1);
    
    if (error) {
      logger.error('Error checking IP allowance in database', { error: error.message });
      // Default to allow if there's a database error
      return true;
    }
    
    // If there are no rules for this IP, default to allow
    if (data.length === 0) {
      return true;
    }
    
    return data[0].action === 'allow';
  } catch (error: any) {
    logger.error('Error checking if IP is allowed', { error: error.message });
    // Default to allow if there's an error
    return true;
  }
}