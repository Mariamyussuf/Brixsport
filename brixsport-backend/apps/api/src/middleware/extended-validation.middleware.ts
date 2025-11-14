import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { z, ZodSchema } from 'zod';

// Extended validation schemas for more complex business rules
export const extendedValidationSchemas = {
  // Match event validation (for live match events like goals, cards, substitutions)
  matchEvent: z.object({
    matchId: z.string().min(1, 'Match ID is required'),
    eventType: z.enum([
      'goal', 
      'yellow_card', 
      'red_card', 
      'substitution', 
      'penalty', 
      'own_goal',
      'injury',
      'VAR_review'
    ]),
    timestamp: z.number().int().min(0, 'Timestamp must be a positive number'),
    teamId: z.string().min(1, 'Team ID is required'),
    playerId: z.string().min(1, 'Player ID is required'),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    additionalData: z.record(z.string(), z.any()).optional() // For event-specific data
  }),
  
  // Player substitution validation
  substitution: z.object({
    matchId: z.string().min(1, 'Match ID is required'),
    teamId: z.string().min(1, 'Team ID is required'),
    outgoingPlayerId: z.string().min(1, 'Outgoing player ID is required'),
    incomingPlayerId: z.string().min(1, 'Incoming player ID is required'),
    timestamp: z.number().int().min(0, 'Timestamp must be a positive number'),
    reason: z.enum(['tactical', 'injury', 'disciplinary']).optional()
  }),
  
  // Team formation validation
  formation: z.object({
    matchId: z.string().min(1, 'Match ID is required'),
    teamId: z.string().min(1, 'Team ID is required'),
    formation: z.string().regex(/^\d+-\d+-\d+$/, 'Formation must be in format X-Y-Z (e.g., 4-4-2)'),
    players: z.array(z.object({
      playerId: z.string().min(1, 'Player ID is required'),
      position: z.string().min(1, 'Position is required'),
      jerseyNumber: z.number().int().min(1).max(99)
    })).min(11, 'Formation must have at least 11 players')
  }),
  
  // Match statistics validation
  matchStats: z.object({
    matchId: z.string().min(1, 'Match ID is required'),
    teamId: z.string().min(1, 'Team ID is required'),
    stats: z.object({
      possession: z.number().min(0).max(100).optional(),
      shots: z.number().int().min(0).optional(),
      shotsOnTarget: z.number().int().min(0).optional(),
      corners: z.number().int().min(0).optional(),
      fouls: z.number().int().min(0).optional(),
      yellowCards: z.number().int().min(0).optional(),
      redCards: z.number().int().min(0).optional(),
      offside: z.number().int().min(0).optional(),
      saves: z.number().int().min(0).optional()
    })
  }),
  
  // User profile update validation
  userProfile: z.object({
    firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
    email: z.string().email('Invalid email format'),
    phoneNumber: z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Invalid phone number format').optional(),
    dateOfBirth: z.string().datetime().optional(),
    preferredLanguage: z.enum(['en', 'es', 'fr', 'de']).optional(),
    notificationPreferences: z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      sms: z.boolean().optional()
    }).optional()
  }),
  
  // Logger assignment validation
  loggerAssignment: z.object({
    loggerId: z.string().min(1, 'Logger ID is required'),
    competitionId: z.string().min(1, 'Competition ID is required'),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    role: z.enum(['primary', 'assistant', 'observer']).optional(),
    permissions: z.array(z.string()).optional()
  }),
  
  // Competition creation validation
  competition: z.object({
    name: z.string().min(1, 'Competition name is required').max(100, 'Competition name must be less than 100 characters'),
    description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    type: z.enum(['league', 'cup', 'tournament', 'friendly']),
    status: z.enum(['planned', 'active', 'completed', 'cancelled']),
    teams: z.array(z.string()).min(2, 'Competition must have at least 2 teams'),
    rules: z.object({
      pointsForWin: z.number().int().min(0).max(5).optional(),
      pointsForDraw: z.number().int().min(0).max(5).optional(),
      pointsForLoss: z.number().int().min(0).max(5).optional(),
      maxSubstitutions: z.number().int().min(0).max(10).optional()
    }).optional()
  })
};

export const validateExtended = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body against the schema
      schema.parse(req.body);
      
      logger.info('Extended validation passed', { 
        url: req.url, 
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params
      });
      
      // Validation success
      next();
    } catch (error: any) {
      logger.error('Extended validation error', error);
      
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