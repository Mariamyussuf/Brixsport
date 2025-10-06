import { z } from 'zod';

const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const updateNotificationPreferencesSchema = z.object({
  deliveryMethods: z.object({
    push: z.boolean().optional(),
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
    inApp: z.boolean().optional(),
  }).optional(),
  
  categories: z.object({
    matchUpdates: z.boolean().optional(),
    teamNews: z.boolean().optional(),
    competitionNews: z.boolean().optional(),
    marketing: z.boolean().optional(),
    systemAlerts: z.boolean().optional(),
  }).optional(),
  
  emailFrequency: z.enum(['INSTANT', 'DAILY', 'WEEKLY', 'NEVER']).optional(),
  
  quietHours: z.object({
    enabled: z.boolean().optional(),
    startTime: z.string().regex(timeRegex, 'Invalid time format. Use HH:MM').optional(),
    endTime: z.string().regex(timeRegex, 'Invalid time format. Use HH:MM').optional(),
  }).optional(),
}).refine(
  (data) => {
    if (!data.quietHours) return true;
    
    const { enabled, startTime, endTime } = data.quietHours;
    
    // If quiet hours are enabled, both start and end times are required
    if (enabled) {
      return !!(startTime && endTime);
    }
    
    return true;
  },
  {
    message: 'Both startTime and endTime are required when quietHours is enabled',
    path: ['quietHours'],
  }
);

export type UpdateNotificationPreferencesDto = z.infer<typeof updateNotificationPreferencesSchema>;
