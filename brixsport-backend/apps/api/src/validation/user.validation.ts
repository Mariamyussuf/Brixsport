import { z } from 'zod';

// Auth validation schemas
export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters long')
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format')
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters long')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long')
});

// User profile validation schemas
export const updateProfileSchema = z.object({
  name: z.string().optional(),
  avatar: z.string().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided'
});

export const uploadProfilePictureSchema = z.object({
  url: z.string().url('Invalid URL format')
});

// User preferences validation schemas
export const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
  notifications: z.boolean().optional(),
  language: z.string().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided'
});

// Notification settings validation schemas
export const updateNotificationSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  importantOnly: z.boolean().optional(),
  quietHours: z.object({
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional()
  }).optional(),
  followedTeams: z.array(z.string()).optional(),
  followedPlayers: z.array(z.string()).optional(),
  followedCompetitions: z.array(z.string()).optional(),
  deliveryMethods: z.object({
    push: z.boolean().optional(),
    inApp: z.boolean().optional(),
    email: z.boolean().optional()
  }).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided'
});

// Admin validation schemas
export const listUsersSchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : undefined),
  limit: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : undefined),
  search: z.string().optional()
});

export const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(['user', 'admin', 'logger']).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided'
});

export const suspendUserSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters long')
});

export const activateUserSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters long')
});

// Validation middleware
export const validate = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.body);
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