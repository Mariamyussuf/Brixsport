import { z } from 'zod';

// Match validation schemas
export const listMatchesSchema = z.object({
  sport: z.enum(['football', 'basketball', 'track']).optional(),
  status: z.enum(['scheduled', 'live', 'completed', 'postponed', 'all']).optional(),
  limit: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : undefined),
  offset: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : undefined)
});

export const getMatchDetailsSchema = z.object({
  id: z.string().min(1, 'Match ID is required')
});

// Football match extension validation
export const footballMatchExtensionSchema = z.object({
  formation: z.string().optional(),
  referee: z.string().optional(),
  weather: z.string().optional(),
  attendance: z.number().optional()
});

// Basketball match extension validation
export const basketballMatchExtensionSchema = z.object({
  quarter: z.number().optional(),
  quarter_time: z.string().optional(), // MM:SS format
  fouls_home: z.number().optional(),
  fouls_away: z.number().optional()
});

// Track event validation
export const trackEventSchema = z.object({
  id: z.string().optional(),
  sport: z.literal('track'),
  competition_id: z.string(),
  event_name: z.string(),
  event_type: z.enum(['sprint', 'distance', 'field', 'relay']),
  gender: z.enum(['male', 'female', 'mixed']),
  scheduled_time: z.string().datetime(),
  status: z.enum(['scheduled', 'live', 'completed', 'postponed']),
  results: z.array(z.object({
    position: z.number(),
    team_id: z.string(),
    team_name: z.string(),
    athlete_name: z.string(),
    time: z.string().optional(),
    distance: z.number().optional()
  })).optional()
});

// Validation middleware
export const validate = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse({
        ...req.params,
        ...req.query,
        ...req.body
      });
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  };
};