import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';
import { redisService } from '../services/redis.service';

export interface DDoSProtection {
  rateLimitByIP(): any;
  detectDDoS(): any;
  blockMaliciousIPs(): any;
  challengeSuspiciousRequests(): any;
  adaptiveRateLimiting(): any;
  userAgentAnalysis(): any;
}

// In-memory storage for IP tracking (in production, this should be in Redis or similar)
const ipRequests: { [ip: string]: { count: number; timestamp: number }[] } = {};
const blockedIPs: { [ip: string]: number } = {}; // IP -> block expiration timestamp
const userAgentStats: { [userAgent: string]: { count: number; ips: Set<string> } } = {};

export const ddosProtection: DDoSProtection = {
  rateLimitByIP: () => {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: any, res: any, next: any, options: any) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          url: req.url,
          method: req.method
        });
        res.status(options.statusCode).send(options.message);
      }
    });
  },
  
  detectDDoS: () => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const ip: string = req.ip || 'unknown';
        const userAgent: string = req.headers['user-agent'] || 'unknown';
        const now = Date.now();
        const windowMs = 60000; // 1 minute window
        
        // Initialize tracking for this IP if needed
        if (!ipRequests[ip]) {
          ipRequests[ip] = [];
        }
        
        // Add current request
        ipRequests[ip].push({ count: 1, timestamp: now });
        
        // Remove old requests outside the window
        ipRequests[ip] = ipRequests[ip].filter(
          (request: { count: number; timestamp: number }) => now - request.timestamp < windowMs
        );
        
        // Calculate requests per minute
        const rpm = ipRequests[ip].length;
        
        // Track user agent statistics
        if (!userAgentStats[userAgent]) {
          userAgentStats[userAgent] = { count: 0, ips: new Set() };
        }
        userAgentStats[userAgent].count++;
        userAgentStats[userAgent].ips.add(ip);
        
        // Check if this IP is making too many requests
        const threshold = parseInt(process.env.DDOS_RPM_THRESHOLD || '100');
        if (rpm > threshold) {
          logger.warn('Potential DDoS attack detected - high RPM', {
            ip,
            rpm,
            threshold
          });
          
          // Block this IP temporarily
          blockedIPs[ip] = now + 300000; // Block for 5 minutes
        }
        
        // Check for suspicious user agent patterns
        const userAgentThreshold = parseInt(process.env.USER_AGENT_THRESHOLD || '1000');
        if (userAgentStats[userAgent].count > userAgentThreshold && userAgentStats[userAgent].ips.size > 50) {
          logger.warn('Potential DDoS attack detected - suspicious user agent', {
            userAgent,
            requestCount: userAgentStats[userAgent].count,
            uniqueIPs: userAgentStats[userAgent].ips.size
          });
          
          // Block all IPs associated with this user agent for 10 minutes
          for (const suspiciousIP of userAgentStats[userAgent].ips) {
            blockedIPs[suspiciousIP] = now + 600000; // Block for 10 minutes
          }
        }
        
        // Use Redis for more sophisticated tracking in production
        if (redisService && typeof redisService.incr === 'function') {
          try {
            const ipKey = `ddos:ip:${ip}`;
            const userAgentKey = `ddos:ua:${userAgent}`;
            const globalKey = 'ddos:global';
            
            // Increment counters in Redis
            const ipCount = await redisService.incr(ipKey);
            const userAgentCount = await redisService.incr(userAgentKey);
            const globalCount = await redisService.incr(globalKey);
            
            // Set expiration for keys (1 minute)
            await Promise.all([
              redisService.expire(ipKey, 60),
              redisService.expire(userAgentKey, 60),
              redisService.expire(globalKey, 60)
            ]);
            
            // Check for global attack pattern
            if (globalCount > 1000) { // More than 1000 requests per minute globally
              logger.warn('Potential global DDoS attack detected', {
                globalRPM: globalCount
              });
            }
            
            // Check for IP-based attack
            if (ipCount > 200) { // More than 200 requests per minute from one IP
              logger.warn('Potential DDoS attack detected - high IP activity', {
                ip,
                ipRPM: ipCount
              });
              blockedIPs[ip] = now + 600000; // Block for 10 minutes
            }
            
            // Check for user agent-based attack
            if (userAgentCount > 500) { // More than 500 requests per minute from one user agent
              logger.warn('Potential DDoS attack detected - suspicious user agent activity', {
                userAgent,
                userAgentRPM: userAgentCount
              });
            }
          } catch (redisError) {
            logger.warn('Redis error in DDoS detection', redisError);
          }
        }
        
        next();
      } catch (error: any) {
        logger.error('DDoS detection error', error);
        next();
      }
    };
  },
  
  blockMaliciousIPs: () => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const ip: string = req.ip || 'unknown';
        const now = Date.now();
        
        // Check if IP is blocked
        const blockExpiration = blockedIPs[ip];
        if (blockExpiration && now < blockExpiration) {
          logger.warn('Blocked malicious IP', { ip });
          
          res.status(403).json({
            success: false,
            error: 'Access denied',
            message: 'Your IP has been temporarily blocked due to suspicious activity'
          });
          return;
        }
        
        // Remove expired blocks
        if (blockExpiration && now >= blockExpiration) {
          delete blockedIPs[ip];
        }
        
        // Check Redis for blocked IPs in production
        if (redisService && typeof redisService.exists === 'function') {
          try {
            const blockedKey = `blocked_ip:${ip}`;
            const isBlocked = await redisService.exists(blockedKey);
            
            if (isBlocked) {
              logger.warn('Blocked malicious IP (Redis)', { ip });
              
              res.status(403).json({
                success: false,
                error: 'Access denied',
                message: 'Your IP has been temporarily blocked due to suspicious activity'
              });
              return;
            }
          } catch (redisError) {
            logger.warn('Redis error in IP blocking check', redisError);
          }
        }
        
        next();
      } catch (error: any) {
        logger.error('IP blocking error', error);
        next();
      }
    };
  },
  
  challengeSuspiciousRequests: () => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Check for suspicious patterns in request
        const suspiciousPatterns = [
          /(\b|\d)union(\b|\d)/i,
          /(\b|\d)select(\b|\d)/i,
          /(\b|\d)insert(\b|\d)/i,
          /(\b|\d)update(\b|\d)/i,
          /(\b|\d)delete(\b|\d)/i,
          /(\b|\d)drop(\b|\d)/i,
          /(\b|\d)create(\b|\d)/i,
          /(\b|\d)alter(\b|\d)/i,
          /<script/i,
          /javascript:/i,
          /vbscript:/i,
          /on\w+\s*=/i,
          /\.\.\/\.\./, // Directory traversal
          /etc\/passwd/i, // Common file inclusion attempts
          /\/etc\/shadow/i
        ];
        
        // Check for excessive parameter count (potential DoS)
        const paramCount = (req.query ? Object.keys(req.query).length : 0) + 
                         (req.body ? Object.keys(req.body).length : 0);
        
        if (paramCount > 100) {
          logger.warn('Suspicious request - excessive parameters', {
            ip: req.ip,
            url: req.url,
            method: req.method,
            paramCount
          });
          
          // Temporarily block IP
          const now = Date.now();
          blockedIPs[req.ip || 'unknown'] = now + 300000; // Block for 5 minutes
          
          res.status(400).json({
            success: false,
            error: 'Bad request',
            message: 'Request contains too many parameters'
          });
          return;
        }
        
        const requestData = [
          req.url,
          JSON.stringify(req.query),
          JSON.stringify(req.body),
          req.headers['user-agent'] || ''
        ].join(' ');
        
        const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestData));
        
        if (isSuspicious) {
          logger.warn('Suspicious request detected', {
            ip: req.ip,
            url: req.url,
            method: req.method
          });
          
          // Block IP temporarily
          const now = Date.now();
          blockedIPs[req.ip || 'unknown'] = now + 600000; // Block for 10 minutes
          
          // Log to Redis for monitoring
          if (redisService && typeof redisService.lpush === 'function') {
            try {
              const logKey = `suspicious_requests:${new Date().toISOString().split('T')[0]}`;
              const logEntry = {
                timestamp: new Date().toISOString(),
                ip: req.ip,
                url: req.url,
                method: req.method,
                userAgent: req.headers['user-agent']
              };
              
              await redisService.lpush(logKey, JSON.stringify(logEntry));
              await redisService.ltrim(logKey, 0, 999); // Keep only last 1000 entries
            } catch (redisError) {
              logger.warn('Failed to log suspicious request to Redis', redisError);
            }
          }
          
          res.status(403).json({
            success: false,
            error: 'Forbidden',
            message: 'Request blocked for security reasons'
          });
          return;
        }
        
        next();
      } catch (error: any) {
        logger.error('Suspicious request challenge error', error);
        next();
      }
    };
  },
  
  adaptiveRateLimiting: () => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const ip: string = req.ip || 'unknown';
        const userAgent: string = req.headers['user-agent'] || 'unknown';
        const path: string = req.path;
        const method: string = req.method;
        
        // Use Redis for adaptive rate limiting
        if (redisService && typeof redisService.get === 'function') {
          try {
            // Get current request rates
            const ipKey = `rate_limit:ip:${ip}`;
            const pathKey = `rate_limit:path:${path}`;
            const userAgentKey = `rate_limit:ua:${userAgent}`;
            
            const [ipCountStr, pathCountStr, userAgentCountStr] = await Promise.all([
              redisService.get(ipKey),
              redisService.get(pathKey),
              redisService.get(userAgentKey)
            ]);
            
            const ipCount = ipCountStr ? parseInt(ipCountStr) : 0;
            const pathCount = pathCountStr ? parseInt(pathCountStr) : 0;
            const userAgentCount = userAgentCountStr ? parseInt(userAgentCountStr) : 0;
            
            // Calculate adaptive limits
            let maxRequests = 100; // Base limit
            
            // Increase limit for known good user agents
            if (userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari')) {
              maxRequests = 200;
            }
            
            // Decrease limit for suspicious patterns
            if (userAgent.includes('bot') || userAgent.includes('crawler') || userAgent === 'unknown') {
              maxRequests = 50;
            }
            
            // Check if any limit is exceeded
            if (ipCount > maxRequests || pathCount > maxRequests * 2 || userAgentCount > maxRequests * 5) {
              logger.warn('Adaptive rate limit exceeded', {
                ip,
                path,
                ipCount,
                pathCount,
                userAgentCount,
                maxRequests
              });
              
              // Temporary block
              const now = Date.now();
              blockedIPs[ip] = now + 300000; // Block for 5 minutes
              
              res.status(429).json({
                success: false,
                error: 'Too many requests',
                message: 'Rate limit exceeded. Please try again later.'
              });
              return;
            }
            
            // Increment counters
            await Promise.all([
              redisService.incr(ipKey),
              redisService.incr(pathKey),
              redisService.incr(userAgentKey)
            ]);
            
            // Set expiration (1 minute)
            await Promise.all([
              redisService.expire(ipKey, 60),
              redisService.expire(pathKey, 60),
              redisService.expire(userAgentKey, 60)
            ]);
          } catch (redisError) {
            logger.warn('Redis error in adaptive rate limiting', redisError);
          }
        }
        
        next();
      } catch (error: any) {
        logger.error('Adaptive rate limiting error', error);
        next();
      }
    };
  },
  
  userAgentAnalysis: () => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userAgent: string = req.headers['user-agent'] || 'unknown';
        const ip: string = req.ip || 'unknown';
        
        // Analyze user agent
        const userAgentAnalysis = {
          isEmpty: userAgent === 'unknown',
          isAutomated: /bot|crawler|spider|scraper|automated/i.test(userAgent),
          isSuspicious: /sqlmap|nikto|nessus|burp|zaproxy/i.test(userAgent),
          isBrowser: /Mozilla|Chrome|Safari|Firefox|Edge/i.test(userAgent),
          isMobile: /Mobile|Android|iPhone|iPad/i.test(userAgent)
        };
        
        // Log analysis to Redis using available methods
        if (redisService && typeof redisService.hset === 'function') {
          try {
            const analysisKey = `user_agent_analysis:${new Date().toISOString().split('T')[0]}`;
            
            // Use hset to store analysis data
            for (const [key, value] of Object.entries(userAgentAnalysis)) {
              if (value) {
                // Increment the counter for this analysis type
                const fieldKey = key;
                const currentCountStr = await redisService.hget(analysisKey, fieldKey);
                const currentCount = currentCountStr ? parseInt(currentCountStr) : 0;
                await redisService.hset(analysisKey, fieldKey, (currentCount + 1).toString());
              }
            }
            
            // Also track unique user agents
            const userAgentKey = `unique_user_agents:${new Date().toISOString().split('T')[0]}`;
            await redisService.sadd(userAgentKey, userAgent);
          } catch (redisError) {
            logger.warn('Failed to log user agent analysis to Redis', redisError);
          }
        }
        
        // Block suspicious user agents
        if (userAgentAnalysis.isSuspicious) {
          logger.warn('Suspicious user agent detected', {
            ip,
            userAgent
          });
          
          const now = Date.now();
          blockedIPs[ip] = now + 3600000; // Block for 1 hour
          
          res.status(403).json({
            success: false,
            error: 'Forbidden',
            message: 'Access denied'
          });
          return;
        }
        
        next();
      } catch (error: any) {
        logger.error('User agent analysis error', error);
        next();
      }
    };
  }
};