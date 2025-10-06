import { Request, Response, NextFunction } from 'express';
import { logger } from '@utils/logger';
import { z, ZodSchema } from 'zod';

// Zod validation schemas
export const validationSchemas = {
  signup: z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    role: z.enum(['user', 'logger', 'senior_logger', 'logger_admin', 'admin', 'super_admin']).optional()
  }),
  
  login: z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required')
  }),
  
  createMatch: z.object({
    competitionId: z.string().min(1, 'Competition ID is required'),
    homeTeamId: z.string().min(1, 'Home team ID is required'),
    awayTeamId: z.string().min(1, 'Away team ID is required'),
    startTime: z.string().datetime().optional(),
    venue: z.string().optional(),
    status: z.enum(['scheduled', 'live', 'finished', 'postponed']).optional()
  }),
  
  updateMatch: z.object({
    competitionId: z.string().optional(),
    homeTeamId: z.string().optional(),
    awayTeamId: z.string().optional(),
    startTime: z.string().datetime().optional(),
    venue: z.string().optional(),
    status: z.enum(['scheduled', 'live', 'finished', 'postponed']).optional(),
    homeScore: z.number().int().min(0).optional(),
    awayScore: z.number().int().min(0).optional()
  }).partial(),
  
  createEvent: z.object({
    name: z.string().min(1, 'Event name is required'),
    date: z.string().datetime(),
    location: z.string().min(1, 'Location is required'),
    eventType: z.enum(['football', 'basketball', 'tennis', 'track', 'field']).optional(),
    status: z.enum(['planned', 'ongoing', 'completed', 'cancelled']).optional()
  }),
  
  updateEvent: z.object({
    name: z.string().optional(),
    date: z.string().datetime().optional(),
    location: z.string().optional(),
    eventType: z.enum(['football', 'basketball', 'tennis', 'track', 'field']).optional(),
    status: z.enum(['planned', 'ongoing', 'completed', 'cancelled']).optional()
  }).partial(),
  
  // Analytics validation schemas
  comparePlayers: z.object({
    playerIds: z.array(z.string().min(1)).min(2, 'At least two player IDs are required')
  }),
  
  compareTeams: z.object({
    teamIds: z.array(z.string().min(1)).min(2, 'At least two team IDs are required')
  }),
  
  generateReport: z.object({
    type: z.enum(['user', 'sports', 'competition', 'platform', 'system', 'deployment']),
    parameters: z.record(z.string(), z.any()).optional(),
    format: z.enum(['json', 'csv', 'pdf'])
  }),
  
  createDashboard: z.object({
    name: z.string().min(1, 'Dashboard name is required'),
    description: z.string().optional(),
    widgets: z.array(z.any()).optional()
  }),
  
  updateDashboard: z.object({
    name: z.string().min(1, 'Dashboard name is required').optional(),
    description: z.string().optional(),
    widgets: z.array(z.any()).optional()
  }).partial(),
  
  // User Activity validation schemas
  generateActivityReport: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    userIds: z.array(z.string().uuid()).optional(),
    actions: z.array(z.string()).optional(),
    format: z.enum(['json', 'csv', 'pdf']).default('json'),
    includeDetails: z.boolean().default(false)
  }),
  
  // Chat validation schemas
  sendChatMessage: z.object({
    message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
    replyToId: z.string().uuid().optional()
  }),
  
  chatModerationAction: z.object({
    action: z.enum(['delete', 'warn', 'timeout', 'ban']),
    messageId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    reason: z.string().min(1, 'Reason is required'),
    duration: z.number().int().positive().optional() // for timeout/ban duration in minutes
  }),
  
  // Match Events validation schemas
  createMatchEvent: z.object({
    teamId: z.string().uuid().optional(),
    playerId: z.string().uuid().optional(),
    eventType: z.enum([
      'goal', 'yellow_card', 'red_card', 'substitution', 
      'penalty', 'corner', 'offside', 'foul', 'injury'
    ]),
    minute: z.number().int().min(0).max(120),
    details: z.record(z.string(), z.any()).optional()
  }),
  
  updateMatchEvent: z.object({
    teamId: z.string().uuid().optional(),
    playerId: z.string().uuid().optional(),
    eventType: z.enum([
      'goal', 'yellow_card', 'red_card', 'substitution', 
      'penalty', 'corner', 'offside', 'foul', 'injury'
    ]).optional(),
    minute: z.number().int().min(0).max(120).optional(),
    details: z.record(z.string(), z.any()).optional()
  }).partial(),
  
  bulkMatchEvents: z.object({
    events: z.array(z.object({
      teamId: z.string().uuid().optional(),
      playerId: z.string().uuid().optional(),
      eventType: z.enum([
        'goal', 'yellow_card', 'red_card', 'substitution', 
        'penalty', 'corner', 'offside', 'foul', 'injury'
      ]),
      minute: z.number().int().min(0).max(120),
      details: z.record(z.string(), z.any()).optional()
    })).min(1, 'At least one event is required')
  }),
  
  // Analytics validation schemas
  analyticsDateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    granularity: z.enum(['hour', 'day', 'week', 'month']).default('day')
  }),
  
  retentionAnalysis: z.object({
    cohortStartDate: z.string().datetime(),
    cohortEndDate: z.string().datetime(),
    analysisMonths: z.number().int().min(1).max(24).default(12)
  }),
  
  // User behavior tracking
  trackUserBehavior: z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
    pageViews: z.array(z.object({
      page: z.string(),
      timestamp: z.string().datetime(),
      duration: z.number().int().positive().optional()
    })).optional(),
    actions: z.array(z.object({
      action: z.string(),
      target: z.string().optional(),
      timestamp: z.string().datetime(),
      metadata: z.record(z.string(), z.any()).optional()
    })).optional(),
    deviceInfo: z.object({
      userAgent: z.string(),
      screenResolution: z.string().optional(),
      timezone: z.string().optional()
    }).optional(),
    locationInfo: z.object({
      country: z.string().optional(),
      region: z.string().optional(),
      city: z.string().optional()
    }).optional()
  }),
  
  // Performance monitoring
  performanceMetric: z.object({
    endpoint: z.string().min(1, 'Endpoint is required'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    responseTime: z.number().int().positive(),
    statusCode: z.number().int().min(100).max(599),
    metadata: z.record(z.string(), z.any()).optional()
  }),
  
  // Cache management
  cacheOperation: z.object({
    cacheKey: z.string().min(1, 'Cache key is required'),
    cacheType: z.string().min(1, 'Cache type is required'),
    ttlMinutes: z.number().int().positive().max(10080).default(60) // max 1 week
  }),
  
  // System settings
  systemSetting: z.object({
    key: z.string().min(1, 'Setting key is required'),
    value: z.any(),
    category: z.string().optional(),
    description: z.string().optional(),
    isPublic: z.boolean().default(false)
  }),
  
  // Audit log query
  auditLogQuery: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    userId: z.string().uuid().optional(),
    action: z.string().optional(),
    ipAddress: z.string().ip().optional(),
    limit: z.number().int().positive().max(1000).default(100),
    offset: z.number().int().min(0).default(0)
  })
};

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body against the schema
      schema.parse(req.body);
      
      logger.info('Request validation passed', { 
        url: req.url, 
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params
      });
      
      // Validation success
      next();
    } catch (error: any) {
      logger.error('Validation error', error);
      
      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        const errorMessages = error.errors.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        res.status(400).json({
          error: 'Validation failed',
          details: errorMessages
        });
        return;
      }
      
      // Handle other errors
      res.status(400).json({
        error: 'Validation failed',
        details: error.message
      });
      return;
    }
  };
};