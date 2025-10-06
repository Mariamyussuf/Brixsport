import { z } from 'zod';

// Track event validation schemas
export const listTrackEventsSchema = z.object({
  status: z.enum(['planned', 'ongoing', 'completed', 'cancelled']).optional(),
  eventType: z.enum(['football', 'basketball', 'tennis', 'track', 'field']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional()
});

export const getTrackEventSchema = z.object({
  id: z.string().min(1, 'Track event ID is required')
});

export const createTrackEventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  date: z.string().datetime(),
  location: z.string().min(1, 'Location is required'),
  eventType: z.enum(['football', 'basketball', 'tennis', 'track', 'field']).optional(),
  status: z.enum(['planned', 'ongoing', 'completed', 'cancelled']).optional()
});

export const updateTrackEventSchema = z.object({
  name: z.string().optional(),
  date: z.string().datetime().optional(),
  location: z.string().optional(),
  eventType: z.enum(['football', 'basketball', 'tennis', 'track', 'field']).optional(),
  status: z.enum(['planned', 'ongoing', 'completed', 'cancelled']).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided'
});

export const submitResultsSchema = z.object({
  participantId: z.string().min(1, 'Participant ID is required'),
  resultValue: z.number()
});

export const updateResultSchema = z.object({
  resultValue: z.number().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided'
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