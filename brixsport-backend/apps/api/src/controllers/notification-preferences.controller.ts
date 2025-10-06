import { Request, Response } from 'express';
import { notificationPreferencesService } from '../services/notification-preferences.service';
import { logger } from '../utils/logger';
import { 
  NotificationPreferences, 
  UpdateNotificationPreferencesDto 
} from '../types/notification.types';

// Extend the Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

class NotificationPreferencesController {
  // Get user's notification preferences
  async getPreferences(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      const preferences = await notificationPreferencesService.getUserPreferences(userId);
      
      return res.json({
        success: true,
        data: preferences
      });
    } catch (error: any) {
      logger.error('Get notification preferences error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch notification preferences' 
      });
    }
  }

  // Update user's notification preferences
  async updatePreferences(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      const updateDto: UpdateNotificationPreferencesDto = req.body;
      
      // Validate the update DTO
      const validationError = this.validateUpdateDto(updateDto);
      if (validationError) {
        return res.status(400).json({ 
          success: false, 
          error: validationError 
        });
      }

      const updatedPreferences = await notificationPreferencesService.updateUserPreferences(
        userId, 
        updateDto
      );
      
      return res.json({
        success: true,
        data: updatedPreferences
      });
    } catch (error: any) {
      logger.error('Update notification preferences error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update notification preferences' 
      });
    }
  }

  // Validate the update DTO
  private validateUpdateDto(dto: any): string | null {
    // Validate email frequency
    if (dto.emailFrequency && !['INSTANT', 'DAILY', 'WEEKLY', 'NEVER'].includes(dto.emailFrequency)) {
      return 'Invalid email frequency. Must be one of: INSTANT, DAILY, WEEKLY, NEVER';
    }

    // Validate quiet hours if provided
    if (dto.quietHours) {
      if (typeof dto.quietHours.enabled !== 'undefined' && typeof dto.quietHours.enabled !== 'boolean') {
        return 'quietHours.enabled must be a boolean';
      }
      
      if (dto.quietHours.startTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(dto.quietHours.startTime)) {
        return 'Invalid start time format. Use HH:MM';
      }
      
      if (dto.quietHours.endTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(dto.quietHours.endTime)) {
        return 'Invalid end time format. Use HH:MM';
      }
    }

    return null;
  }
}

export const notificationPreferencesController = new NotificationPreferencesController();
