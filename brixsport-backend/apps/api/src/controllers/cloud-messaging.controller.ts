import { Request, Response } from 'express';
import { cloudMessagingService } from '../services/cloud-messaging.service';
import { logger } from '../utils/logger';

// Extend the Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    [key: string]: any;
  };
}

class CloudMessagingController {
  // Register a device token for push notifications
  async registerDeviceToken(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      const { token, platform } = req.body;
      
      // Validate required fields
      if (!token || !platform) {
        return res.status(400).json({ 
          success: false, 
          error: 'Token and platform are required' 
        });
      }

      // Validate platform
      if (!['ios', 'android', 'web'].includes(platform)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid platform. Must be one of: ios, android, web' 
        });
      }

      const result = await cloudMessagingService.registerDeviceToken(userId, token, platform);
      
      return res.json({
        success: true,
        data: result.data,
        message: 'Device token registered successfully'
      });
    } catch (error: any) {
      logger.error('Register device token error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to register device token' 
      });
    }
  }

  // Remove a device token
  async removeDeviceToken(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      const { token } = req.body;
      
      // Validate required fields
      if (!token) {
        return res.status(400).json({ 
          success: false, 
          error: 'Token is required' 
        });
      }

      const result = await cloudMessagingService.removeDeviceToken(userId, token);
      
      return res.json({
        success: true,
        message: 'Device token removed successfully'
      });
    } catch (error: any) {
      logger.error('Remove device token error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to remove device token' 
      });
    }
  }

  // Get user's device tokens
  async getUserDeviceTokens(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      const tokens = await cloudMessagingService.getUserDeviceTokens(userId);
      
      return res.json({
        success: true,
        data: tokens
      });
    } catch (error: any) {
      logger.error('Get user device tokens error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch device tokens' 
      });
    }
  }

  // Subscribe to a topic
  async subscribeToTopic(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      const { topic } = req.body;
      
      // Validate required fields
      if (!topic) {
        return res.status(400).json({ 
          success: false, 
          error: 'Topic is required' 
        });
      }

      const result = await cloudMessagingService.subscribeToTopic(userId, topic);
      
      return res.json({
        success: true,
        message: 'Subscribed to topic successfully',
        data: {
          successCount: result.successCount,
          failureCount: result.failureCount
        }
      });
    } catch (error: any) {
      logger.error('Subscribe to topic error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to subscribe to topic' 
      });
    }
  }

  // Unsubscribe from a topic
  async unsubscribeFromTopic(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      const { topic } = req.body;
      
      // Validate required fields
      if (!topic) {
        return res.status(400).json({ 
          success: false, 
          error: 'Topic is required' 
        });
      }

      const result = await cloudMessagingService.unsubscribeFromTopic(userId, topic);
      
      return res.json({
        success: true,
        message: 'Unsubscribed from topic successfully',
        data: {
          successCount: result.successCount,
          failureCount: result.failureCount
        }
      });
    } catch (error: any) {
      logger.error('Unsubscribe from topic error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to unsubscribe from topic' 
      });
    }
  }
}

export const cloudMessagingController = new CloudMessagingController();