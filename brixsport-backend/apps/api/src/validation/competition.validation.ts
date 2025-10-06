import { z } from 'zod';

// Zod schemas for competition validation
export const createCompetitionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  sport: z.enum(['football', 'basketball', 'track'], {
    required_error: 'Sport is required',
    invalid_type_error: 'Sport must be one of: football, basketball, track'
  }),
  type: z.enum(['league', 'tournament', 'cup', 'championship'], {
    required_error: 'Type is required',
    invalid_type_error: 'Type must be one of: league, tournament, cup, championship'
  }),
  category: z.enum(['school', 'college', 'community', 'professional']).optional(),
  start_date: z.string().datetime({ message: 'Start date must be a valid ISO date' }),
  end_date: z.string().datetime({ message: 'End date must be a valid ISO date' }),
  registration_deadline: z.string().datetime({ message: 'Registration deadline must be a valid ISO date' }).optional(),
  max_teams: z.number().min(2, 'Maximum teams must be at least 2').optional(),
  format: z.enum(['single_elimination', 'double_elimination', 'round_robin', 'swiss', 'group_knockout']).optional(),
  prize_pool: z.number().min(0, 'Prize pool must be a positive number').optional(),
  entry_fee: z.number().min(0, 'Entry fee must be a positive number').optional(),
  organizer: z.string().min(1, 'Organizer is required').max(100, 'Organizer must be less than 100 characters'),
  location: z.string().min(1, 'Location is required').max(100, 'Location must be less than 100 characters'),
  rules: z.string().optional(),
  has_group_stage: z.boolean().optional(),
  groups: z.number().min(1, 'Groups must be at least 1').optional(),
  teams_per_group: z.number().min(2, 'Teams per group must be at least 2').optional(),
  advance_per_group: z.number().min(1, 'Advance per group must be at least 1').optional()
});

export const addTeamSchema = z.object({
  team_id: z.string().min(1, 'Team ID is required')
});

export const cancelCompetitionSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters')
});

export const rescheduleMatchSchema = z.object({
  new_date: z.string().datetime({ message: 'New date must be a valid ISO date' }),
  new_venue: z.string().optional()
});

export const postponeMatchSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters')
});

// Type inference
export type CreateCompetitionInput = z.infer<typeof createCompetitionSchema>;
export type AddTeamInput = z.infer<typeof addTeamSchema>;
export type CancelCompetitionInput = z.infer<typeof cancelCompetitionSchema>;
export type RescheduleMatchInput = z.infer<typeof rescheduleMatchSchema>;
export type PostponeMatchInput = z.infer<typeof postponeMatchSchema>;