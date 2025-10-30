import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { logger } from '../utils/logger';
import { 
  Notification, 
  NotificationPreferences,
  Recipients,
  SendNotificationPayload,
  SendTemplatePayload,
  SendLoggingNotificationPayload,
  SendPrMergedPayload
} from '../types/notification.types';

// Extend the Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    role?: string;
    [key: string]: any;
  };
}

class NotificationsController {
  // Get user notifications
  async getUserNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      const filters = {
        status: req.query.status as string,
        type: req.query.type as string,
        priority: req.query.priority as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'ASC' | 'DESC'
      };

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? Math.min(parseInt(req.query.limit as string), 100) : undefined
      };

      const result = await notificationService.getUserNotifications(userId, { ...filters, ...pagination });
      
      return res.json({
        ...result,
        success: true
      });
    } catch (error: any) {
      logger.error('Get user notifications error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch notifications' 
      });
    }
  }

  // Create notification
  async createNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      const notificationData = req.body;
      
      const result = await notificationService.createNotification(userId, notificationData);
      
      return res.status(201).json({
        success: true,
        data: result.data
      });
    } catch (error: any) {
      logger.error('Create notification error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create notification' 
      });
    }
  }

  // Mark all notifications as read
  async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      const result = await notificationService.markAllNotificationsRead(userId);
      
      return res.json({
        success: true,
        count: result.updatedCount
      });
    } catch (error: any) {
      logger.error('Mark all notifications as read error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to mark notifications as read' 
      });
    }
  }

  // Clear all notifications
  async clearNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      // Get all user notifications first to count them
      const userNotifications = await notificationService.getUserNotifications(userId, {});
      const notificationCount = userNotifications.data.length;

      // Delete all notifications for the user
      // This is a simplified implementation - in a real app, you might want to 
      // implement a bulk delete operation in the service
      let deletedCount = 0;
      for (const notification of userNotifications.data) {
        try {
          await notificationService.deleteNotification(userId, notification.id);
          deletedCount++;
        } catch (error) {
          // Continue with other deletions even if one fails
          logger.warn('Failed to delete notification', { 
            notificationId: notification.id, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
      
      return res.json({
        success: true,
        count: deletedCount
      });
    } catch (error: any) {
      logger.error('Clear notifications error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to clear notifications' 
      });
    }
  }

  // Mark notification as read
  async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      const { id: notificationId } = req.params;
      const { userId: requestBodyUserId } = req.body;
      
      // Verify the user is trying to mark their own notification
      if (requestBodyUserId !== userId) {
        return res.status(403).json({ 
          success: false, 
          error: 'Forbidden' 
        });
      }

      const result = await notificationService.markNotificationRead(userId, notificationId);
      
      return res.json({
        success: result.success
      });
    } catch (error: any) {
      logger.error('Mark notification as read error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to mark notification as read' 
      });
    }
  }

  // Update notification status
  async updateNotificationStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      const { id: notificationId } = req.params;
      const { status, userId: requestBodyUserId } = req.body;
      
      // Verify the user is trying to update their own notification
      if (requestBodyUserId !== userId) {
        return res.status(403).json({ 
          success: false, 
          error: 'Forbidden' 
        });
      }

      // In a real implementation, you would update the notification status in the database
      // For now, we'll simulate this by returning the notification with updated status
      const userNotifications = await notificationService.getUserNotifications(userId, {});
      const notification = userNotifications.data.find(n => n.id === notificationId);
      
      if (!notification) {
        return res.status(404).json({ 
          success: false, 
          error: 'Notification not found' 
        });
      }

      // Update the notification status
      const updatedNotification = {
        ...notification,
        status,
        updated_at: new Date().toISOString()
      };
      
      return res.json({
        success: true,
        data: updatedNotification
      });
    } catch (error: any) {
      logger.error('Update notification status error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update notification status' 
      });
    }
  }

  // Batch update notifications
  async batchUpdateNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      const { notificationIds, status, userId: requestBodyUserId } = req.body;
      
      // Verify the user is trying to update their own notifications
      if (requestBodyUserId !== userId) {
        return res.status(403).json({ 
          success: false, 
          error: 'Forbidden' 
        });
      }

      // In a real implementation, you would update multiple notifications in the database
      // For now, we'll simulate this by returning a count of updated notifications
      let updatedCount = 0;
      
      // Update each notification
      for (const notificationId of notificationIds) {
        try {
          // Check if notification exists and belongs to user
          const userNotifications = await notificationService.getUserNotifications(userId, {});
          const notification = userNotifications.data.find(n => n.id === notificationId);
          
          if (notification) {
            // Update the notification status
            const updatedNotification = {
              ...notification,
              status,
              updated_at: new Date().toISOString()
            };
            updatedCount++;
          }
        } catch (error) {
          // Continue with other updates even if one fails
          logger.warn('Failed to update notification', { 
            notificationId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
      
      return res.json({
        success: true,
        updatedCount
      });
    } catch (error: any) {
      logger.error('Batch update notifications error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to batch update notifications' 
      });
    }
  }

  // Delete notification
  async deleteNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      const { id: notificationId } = req.params;
      const { userId: requestBodyUserId } = req.body;
      
      // Verify the user is trying to delete their own notification
      if (requestBodyUserId !== userId) {
        return res.status(403).json({ 
          success: false, 
          error: 'Forbidden' 
        });
      }

      const result = await notificationService.deleteNotification(userId, notificationId);
      
      return res.json({
        success: result.success
      });
    } catch (error: any) {
      logger.error('Delete notification error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to delete notification' 
      });
    }
  }

  // Admin: Send notification to users
  async sendNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const senderRole = req.user?.role;
      if (!senderRole) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      const { recipients, notification }: SendNotificationPayload = req.body;
      
      // Determine recipient users based on recipient type
      let recipientUserIds: string[] = [];
      
      switch (recipients.type) {
        case 'ALL':
          // Fetch all active users
          // In a real implementation, this would be a database query
          recipientUserIds = ['user1', 'user2', 'user3']; // Placeholder
          break;
        case 'SPECIFIC':
          recipientUserIds = recipients.userIds || [];
          break;
        case 'FAVORITES':
          // Fetch users who favorited specific teams/players
          // In a real implementation, this would be a database query
          recipientUserIds = ['user1']; // Placeholder
          break;
        case 'TEAM':
          // Fetch users who follow the specified team
          // In a real implementation, this would be a database query
          recipientUserIds = ['user1', 'user2']; // Placeholder
          break;
        case 'COMPETITION':
          // Fetch users who follow the specified competition
          // In a real implementation, this would be a database query
          recipientUserIds = ['user1', 'user2', 'user3']; // Placeholder
          break;
        case 'ADMINS':
          // Fetch all admin users
          // In a real implementation, this would be a database query
          recipientUserIds = ['admin1']; // Placeholder
          break;
        case 'LOGGERS':
          // Fetch all logger users
          // In a real implementation, this would be a database query
          recipientUserIds = ['logger1', 'logger2']; // Placeholder
          break;
      }
      
      // Create notifications for each recipient
      const createdNotifications = [];
      
      for (const userId of recipientUserIds) {
        const notificationData = {
          title: notification.title,
          content: notification.content || '', 
          type: notification.type,
          metadata: notification.metadata,
          template_id: notification.template_id, // Fix: use correct property name
          source: senderRole,
          status: 'UNREAD',
          priority: notification.priority || 'NORMAL',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const result = await notificationService.createNotification(userId, notificationData);
        createdNotifications.push(result.data);
      }
      
      return res.json({
        success: true,
        notification: createdNotifications[0],
        sentTo: recipientUserIds.length
      });
    } catch (error: any) {
      logger.error('Send notification error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to send notification' 
      });
    }
  }

  // Admin: Send notification using template
  async sendTemplateNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const senderRole = req.user?.role;
      if (!senderRole) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      const { templateId, recipients, variables }: SendTemplatePayload = req.body;
      
      // In a real implementation, you would fetch the template from the database
      // For now, we'll simulate this with a placeholder
      const template = {
        id: templateId,
        titleTemplate: 'Notification: {{title}}',
        messageTemplate: 'Message: {{message}}',
        type: 'GENERAL',
        defaultPriority: 'NORMAL'
      };
      
      if (!template) {
        return res.status(404).json({ 
          success: false, 
          error: 'Template not found' 
        });
      }
      
      // Determine recipient users based on recipient type
      let recipientUserIds: string[] = [];
      
      switch (recipients.type) {
        case 'ALL':
          // Fetch all active users
          // In a real implementation, this would be a database query
          recipientUserIds = ['user1', 'user2', 'user3']; // Placeholder
          break;
        case 'SPECIFIC':
          recipientUserIds = recipients.userIds || [];
          break;
        case 'FAVORITES':
          // Fetch users who favorited specific teams/players
          // In a real implementation, this would be a database query
          recipientUserIds = ['user1']; // Placeholder
          break;
        case 'TEAM':
          // Fetch users who follow the specified team
          // In a real implementation, this would be a database query
          recipientUserIds = ['user1', 'user2']; // Placeholder
          break;
        case 'COMPETITION':
          // Fetch users who follow the specified competition
          // In a real implementation, this would be a database query
          recipientUserIds = ['user1', 'user2', 'user3']; // Placeholder
          break;
      }
      
      // Create notifications for each recipient by replacing template variables
      const createdNotifications = [];
      
      for (const userId of recipientUserIds) {
        // Replace template variables in title and message
        let title = template.titleTemplate;
        let message = template.messageTemplate;
        
        for (const [key, value] of Object.entries(variables)) {
          const regex = new RegExp(`{{${key}}}`, 'g');
          title = title.replace(regex, String(value));
          message = message.replace(regex, String(value));
        }
        
        const notificationData = {
          title,
          content: message, // Fix: map message to content
          type: template.type,
          priority: template.defaultPriority,
          source: senderRole,
          status: 'UNREAD',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const result = await notificationService.createNotification(userId, notificationData);
        createdNotifications.push(result.data);
      }
      
      return res.json({
        success: true,
        notifications: createdNotifications,
        sentTo: recipientUserIds.length
      });
    } catch (error: any) {
      logger.error('Send template notification error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to send template notification' 
      });
    }
  }

  // Admin: Get notification history
  async getNotificationHistory(req: AuthenticatedRequest, res: Response) {
    try {
      // In a real implementation, you would fetch notification history from the database
      // For now, we'll return placeholder data
      
      const filters = {
        status: req.query.status as string,
        deliveryMethod: req.query.deliveryMethod as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string
      };

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? Math.min(parseInt(req.query.limit as string), 100) : 20
      };

      // Placeholder data
      const history = [
        {
          id: 'history1',
          notificationId: 'notif1',
          userId: 'user1',
          deliveryMethod: 'EMAIL',
          status: 'SENT',
          sentAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
      ];
      
      const total = history.length;
      const totalPages = Math.ceil(total / pagination.limit);
      
      return res.json({
        success: true,
        history,
        total,
        totalPages
      });
    } catch (error: any) {
      logger.error('Get notification history error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch notification history' 
      });
    }
  }

  // Logger: Send logging notification
  async sendLoggingNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const senderRole = req.user?.role;
      if (!senderRole) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      const { recipients, notification }: SendLoggingNotificationPayload = req.body;
      
      // Determine recipient users based on recipient type
      let recipientUserIds: string[] = [];
      
      switch (recipients.type) {
        case 'ADMINS':
          // Fetch all admin users
          // In a real implementation, this would be a database query
          recipientUserIds = ['admin1', 'admin2']; // Placeholder
          break;
        case 'LOGGERS':
          // Fetch all logger users
          // In a real implementation, this would be a database query
          recipientUserIds = ['logger1', 'logger2', 'logger3']; // Placeholder
          break;
        case 'SPECIFIC':
          recipientUserIds = recipients.userIds || [];
          break;
      }
      
      // Create notifications for each recipient
      const createdNotifications = [];
      
      for (const userId of recipientUserIds) {
        const notificationData = {
          title: notification.title,
          content: notification.content || '', // Fix: ensure content is provided
          type: 'LOG_ALERT',
          priority: notification.priority || 'NORMAL',
          source: 'LOGGER',
          status: 'UNREAD',
          metadata: notification.metadata,
          tags: notification.tags,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const result = await notificationService.createNotification(userId, notificationData);
        createdNotifications.push(result.data);
      }
      
      return res.json({
        success: true,
        notification: createdNotifications[0],
        sentTo: recipientUserIds.length
      });
    } catch (error: any) {
      logger.error('Send logging notification error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to send logging notification' 
      });
    }
  }

  // Logger: Send PR merged notification
  async sendPrMergedNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const senderRole = req.user?.role;
      if (!senderRole) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      const { prNumber, prTitle, author, repository, branch, mergedBy, changes, recipients }: SendPrMergedPayload = req.body;
      
      // Determine recipient users based on recipient type
      let recipientUserIds: string[] = [];
      
      switch (recipients.type) {
        case 'ADMINS':
          // Fetch all admin users
          // In a real implementation, this would be a database query
          recipientUserIds = ['admin1', 'admin2']; // Placeholder
          break;
        case 'LOGGERS':
          // Fetch all logger users
          // In a real implementation, this would be a database query
          recipientUserIds = ['logger1', 'logger2', 'logger3']; // Placeholder
          break;
        case 'SPECIFIC':
          recipientUserIds = recipients.userIds || [];
          break;
      }
      
      // Create notifications for each recipient
      const createdNotifications = [];
      
      for (const userId of recipientUserIds) {
        const title = `PR #${prNumber} Merged: ${prTitle}`;
        const message = `Pull Request by ${author} in ${repository}/${branch} has been merged by ${mergedBy}. ` +
                       `Changes: ${changes.filesChanged} files changed, ${changes.linesAdded} lines added, ${changes.linesDeleted} lines deleted.`;
        
        const notificationData = {
          title,
          content: message, // Fix: map message to content
          type: 'LOG_ALERT',
          priority: 'NORMAL',
          source: 'LOGGER',
          status: 'UNREAD',
          metadata: {
            logLevel: 'INFO',
            component: 'PR_MERGER',
            service: 'VERSION_CONTROL',
            environment: process.env.NODE_ENV || 'development',
            correlationId: `pr-${prNumber}`,
            prNumber,
            prTitle,
            author,
            repository,
            branch,
            mergedBy,
            changes
          },
          tags: ['PR', 'DEPLOYMENT'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const result = await notificationService.createNotification(userId, notificationData);
        createdNotifications.push(result.data);
      }
      
      return res.json({
        success: true,
        notification: createdNotifications[0],
        sentTo: recipientUserIds.length
      });
    } catch (error: any) {
      logger.error('Send PR merged notification error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to send PR merged notification' 
      });
    }
  }
}

// Create and export a singleton instance of the controller
const notificationsController = new NotificationsController();

export { notificationsController };