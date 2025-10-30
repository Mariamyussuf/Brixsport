import { logger } from '../utils/logger';
import { supabase } from './supabase.service';
import { queueService } from './queue.service';
import { cloudMessagingService } from './cloud-messaging.service';

// Define notification interfaces
interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: string;
  read: boolean;
  read_at?: string;
  status: string;
  metadata?: any;
  template_id?: string;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
}

export const notificationService = {
  // Get user notifications
  getUserNotifications: async (userId: string, options: { 
    limit?: number; 
    offset?: number; 
    unreadOnly?: boolean;
    status?: string;
    type?: string;
    priority?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}) => {
    try {
      logger.info('Fetching user notifications', { userId, options });
      
      let query = supabase
        .from('notifications')
        .select('id, title, content, type, read, created_at, updated_at, metadata')
        .eq('user_id', userId);
      
      // Filter for unread notifications only if requested
      if (options.unreadOnly) {
        query = query.eq('read', false);
      }
      
      // Apply additional filters
      if (options.status) {
        query = query.eq('status', options.status);
      }
      
      if (options.type) {
        query = query.eq('type', options.type);
      }
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }
      
      // Order by creation date (newest first) or specified sort
      const sortBy = options.sortBy || 'created_at';
      const sortOrder = options.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'ASC' });
      
      const { data, error } = await query;
      
      if (error) {
        logger.error('Database error fetching user notifications', { error: error.message, userId });
        throw new Error(`Failed to fetch notifications: ${error.message}`);
      }
      
      return {
        success: true,
        data: data || [],
        notifications: data || [],
        total: data?.length || 0,
        totalPages: options.limit ? Math.ceil((data?.length || 0) / options.limit) : 1
      };
    } catch (error: any) {
      logger.error('Get user notifications error', error);
      throw error;
    }
  },
  
  // Mark notification as read
  markNotificationRead: async (userId: string, notificationId: string) => {
    try {
      logger.info('Marking notification as read', { userId, notificationId });
      
      const { data, error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Notification not found');
        }
        logger.error('Database error marking notification as read', { error: error.message, userId, notificationId });
        throw new Error(`Failed to mark notification as read: ${error.message}`);
      }
      
      return {
        success: true,
        data
      };
    } catch (error: any) {
      logger.error('Mark notification read error', error);
      throw error;
    }
  },
  
  // Mark all notifications as read
  markAllNotificationsRead: async (userId: string) => {
    try {
      logger.info('Marking all notifications as read', { userId });
      
      const { data, error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('read', false)
        .select('id');
      
      if (error) {
        logger.error('Database error marking all notifications as read', { error: error.message, userId });
        throw new Error(`Failed to mark all notifications as read: ${error.message}`);
      }
      
      const updatedCount = data?.length || 0;
      
      return {
        success: true,
        message: `${updatedCount} notifications marked as read`,
        updatedCount
      };
    } catch (error: any) {
      logger.error('Mark all notifications read error', error);
      throw error;
    }
  },
  
  // Delete notification
  deleteNotification: async (userId: string, notificationId: string) => {
    try {
      logger.info('Deleting notification', { userId, notificationId });
      
      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Notification not found');
        }
        logger.error('Database error deleting notification', { error: error.message, userId, notificationId });
        throw new Error(`Failed to delete notification: ${error.message}`);
      }
      
      return {
        success: true,
        message: 'Notification deleted successfully',
        data
      };
    } catch (error: any) {
      logger.error('Delete notification error', error);
      throw error;
    }
  },
  
  // Broadcast notification (admin)
  broadcastNotification: async (notificationData: { 
    title: string; 
    content: string; 
    type?: string; 
    metadata?: any; 
    targetUsers?: string[]; 
    templateId?: string;
  }) => {
    try {
      logger.info('Broadcasting notification', { notificationData });
      
      // If specific users are targeted, create individual notifications
      if (notificationData.targetUsers && notificationData.targetUsers.length > 0) {
        const notifications = notificationData.targetUsers.map(userId => ({
          user_id: userId,
          title: notificationData.title,
          content: notificationData.content,
          type: notificationData.type || 'broadcast',
          metadata: notificationData.metadata || {},
          template_id: notificationData.templateId,
          read: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        const { data, error } = await supabase
          .from('notifications')
          .insert(notifications)
          .select();
        
        if (error) {
          logger.error('Database error broadcasting targeted notification', { error: error.message });
          throw new Error(`Failed to broadcast notification: ${error.message}`);
        }
        
        // Add notifications to job queue for processing
        for (const notification of data || []) {
          const priority = notification.type === 'urgent' ? 10 : 
                          notification.type === 'important' ? 5 : 1;
          
          await queueService.addNotificationJob(
            'send_notification',
            { notificationId: notification.id, userId: notification.user_id },
            priority
          );
        }
        
        return {
          success: true,
          data,
          message: `Notification sent to ${notifications.length} users`
        };
      } else {
        // For system-wide broadcasts, we'll need to get all active users
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id')
          .eq('is_active', true);
        
        if (usersError) {
          logger.error('Error fetching users for broadcast', { error: usersError.message });
          throw new Error(`Failed to fetch users: ${usersError.message}`);
        }
        
        if (!users || users.length === 0) {
          return {
            success: true,
            data: [],
            message: 'No active users found'
          };
        }
        
        // Create notifications for all active users
        const notifications = users.map(user => ({
          user_id: user.id,
          title: notificationData.title,
          content: notificationData.content,
          type: notificationData.type || 'broadcast',
          metadata: notificationData.metadata || {},
          template_id: notificationData.templateId,
          read: false,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        const { data, error } = await supabase
          .from('notifications')
          .insert(notifications)
          .select();
        
        if (error) {
          logger.error('Database error broadcasting system-wide notification', { error: error.message });
          throw new Error(`Failed to broadcast notification: ${error.message}`);
        }
        
        // Add notifications to job queue for processing
        for (const notification of data || []) {
          const priority = notification.type === 'urgent' ? 10 : 
                          notification.type === 'important' ? 5 : 1;
          
          await queueService.addNotificationJob(
            'send_notification',
            { notificationId: notification.id, userId: notification.user_id },
            priority
          );
        }
        
        return {
          success: true,
          data,
          message: `Notification sent to ${users.length} users`
        };
      }
    } catch (error: any) {
      logger.error('Broadcast notification error', error);
      throw error;
    }
  },

  // Create notification for user
  createNotification: async (
    userId: string,
    notificationData: { 
      title: string; 
      content: string; 
      type?: string; 
      metadata?: any; 
      templateId?: string;
      status?: string;
      priority?: string;
      source?: string;
      tags?: string[];
      entityId?: string;
      entityType?: string;
      actionUrl?: string;
      imageUrl?: string;
      scheduledAt?: string;
      expiresAt?: string;
      read?: boolean;
    }
  ) => {
    try {
      logger.info('Creating notification for user', { userId, notificationData });
      
      const notification = {
        user_id: userId,
        title: notificationData.title,
        content: notificationData.content,
        type: notificationData.type || 'general',
        metadata: notificationData.metadata || {},
        template_id: notificationData.templateId,
        status: notificationData.status || 'pending',
        priority: notificationData.priority || 'NORMAL',
        source: notificationData.source || 'SYSTEM',
        tags: notificationData.tags || [],
        entity_id: notificationData.entityId,
        entity_type: notificationData.entityType,
        action_url: notificationData.actionUrl,
        image_url: notificationData.imageUrl,
        scheduled_at: notificationData.scheduledAt,
        expires_at: notificationData.expiresAt,
        read: notificationData.read || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([notification])
        .select()
        .single();
      
      if (error) {
        logger.error('Database error creating notification', { error: error.message });
        throw new Error(`Failed to create notification: ${error.message}`);
      }
      
      // Add to job queue for processing
      const priority = notification.priority === 'URGENT' ? 10 : 
                      notification.priority === 'HIGH' ? 5 : 
                      notification.priority === 'NORMAL' ? 3 : 1;
      
      await queueService.addNotificationJob(
        'send_notification',
        { notificationId: data.id, userId: data.user_id },
        priority
      );
      
      return {
        success: true,
        data
      };
    } catch (error: any) {
      logger.error('Create notification error', error);
      throw error;
    }
  },

  // Get scheduled notifications (admin)
  getScheduledNotifications: async (options: { status?: string; limit?: number; offset?: number } = {}) => {
    try {
      logger.info('Fetching scheduled notifications', { options });
      
      let query = supabase
        .from('scheduled_notifications')
        .select('*');
      
      if (options.status) {
        query = query.eq('status', options.status);
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }
      
      query = query.order('scheduled_for', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) {
        logger.error('Database error fetching scheduled notifications', { error: error.message });
        throw new Error(`Failed to fetch scheduled notifications: ${error.message}`);
      }
      
      return {
        success: true,
        data: data || []
      };
    } catch (error: any) {
      logger.error('Get scheduled notifications error', error);
      throw error;
    }
  },

  // Cancel a scheduled notification (admin)
  cancelScheduledNotification: async (scheduledNotificationId: string) => {
    try {
      logger.info('Cancelling scheduled notification', { scheduledNotificationId });
      
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', scheduledNotificationId)
        .select()
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Scheduled notification not found');
        }
        logger.error('Database error cancelling scheduled notification', { error: error.message });
        throw new Error(`Failed to cancel scheduled notification: ${error.message}`);
      }
      
      return {
        success: true,
        data,
        message: 'Scheduled notification cancelled successfully'
      };
    } catch (error: any) {
      logger.error('Cancel scheduled notification error', error);
      throw error;
    }
  },
  
  // Process notification queue
  processNotificationQueue: async () => {
    try {
      logger.info('Processing notification queue');
      
      // This method is now handled by the queue service workers
      return {
        success: true,
        message: 'Notification queue processing handled by workers'
      };
    } catch (error: any) {
      logger.error('Process notification queue error', error);
      throw error;
    }
  },
  
  // Send notification through job queue
  sendNotificationViaQueue: async (notificationId: string) => {
    try {
      logger.info('Sending notification via job queue', { notificationId });
      
      // Get the notification details
      const { data: notification, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .single();
      
      if (error) {
        logger.error('Database error fetching notification', { error: error.message, notificationId });
        throw new Error(`Failed to fetch notification: ${error.message}`);
      }
      
      if (!notification) {
        throw new Error('Notification not found');
      }
      
      // Add to job queue for processing
      const priority = notification.priority === 'URGENT' ? 10 : 
                      notification.priority === 'HIGH' ? 5 : 
                      notification.priority === 'NORMAL' ? 3 : 1;
      
      const jobResult = await queueService.addNotificationJob(
        'send_notification',
        { notificationId, userId: notification.user_id },
        priority
      );
      
      // Update notification status to queued
      await supabase
        .from('notifications')
        .update({ 
          status: 'queued',
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId);
      
      return {
        success: true,
        data: jobResult.data,
        message: 'Notification added to job queue for processing'
      };
    } catch (error: any) {
      logger.error('Send notification via queue error', error);
      throw error;
    }
  },
  
  // Process individual notification job
  processNotificationJob: async (jobData: { notificationId: string; userId: string }) => {
    try {
      logger.info('Processing notification job', { jobData });
      
      const { notificationId, userId } = jobData;
      
      // Get the notification details
      const { data: notification, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .single();
      
      if (error) {
        logger.error('Database error fetching notification for job processing', { 
          error: error.message, 
          notificationId 
        });
        throw new Error(`Failed to fetch notification: ${error.message}`);
      }
      
      if (!notification) {
        throw new Error('Notification not found');
      }
      
      // Send notification based on type
      logger.info('Sending notification', { 
        notificationId, 
        userId, 
        type: notification.type,
        title: notification.title
      });
      
      // Send email notification for important updates
      if (['urgent', 'important', 'broadcast'].includes(notification.type)) {
        await sendEmailNotification(userId, notification);
      }
      
      // Send push notification for real-time updates
      await sendPushNotification(userId, notification);
      
      // Update notification status to sent
      await supabase
        .from('notifications')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId);
      
      return {
        success: true,
        message: 'Notification sent successfully',
        data: { notificationId, userId }
      };
    } catch (error: any) {
      logger.error('Process notification job error', error);
      
      // Update notification status to failed
      if (error.notificationId) {
        await supabase
          .from('notifications')
          .update({ 
            status: 'failed',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', error.notificationId);
      }
      
      throw error;
    }
  },
  
  // Schedule notification for future delivery
  scheduleNotification: async (notificationData: { 
    userId: string;
    title: string; 
    content: string; 
    type?: string; 
    metadata?: any; 
    scheduledFor: string; // ISO date string
    templateId?: string;
  }) => {
    try {
      logger.info('Scheduling notification', { notificationData });
      
      // Calculate delay in milliseconds
      const scheduledTime = new Date(notificationData.scheduledFor).getTime();
      const currentTime = new Date().getTime();
      const delay = Math.max(0, scheduledTime - currentTime);
      
      // Create scheduled notification record
      const scheduledNotification = {
        user_id: notificationData.userId,
        title: notificationData.title,
        content: notificationData.content,
        type: notificationData.type || 'general',
        metadata: notificationData.metadata || {},
        template_id: notificationData.templateId,
        scheduled_for: notificationData.scheduledFor,
        status: 'scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .insert([scheduledNotification])
        .select()
        .single();
      
      if (error) {
        logger.error('Database error scheduling notification', { error: error.message });
        throw new Error(`Failed to schedule notification: ${error.message}`);
      }
      
      // Add to scheduled notification queue for future processing
      await queueService.addScheduledNotificationJob(
        { scheduledNotificationId: data.id },
        delay
      );
      
      return {
        success: true,
        data,
        message: 'Notification scheduled successfully'
      };
    } catch (error: any) {
      logger.error('Schedule notification error', error);
      throw error;
    }
  },
  
  // Get users by recipient type
  getUsersByRecipientType: async (recipients: { 
    type: string; 
    userIds?: string[]; 
    teamId?: string; 
    competitionId?: string 
  }) => {
    try {
      let recipientUserIds: string[] = [];
      
      switch (recipients.type) {
        case 'ALL':
          // Fetch all active users
          const { data: allUsers, error: allUsersError } = await supabase
            .from('users')
            .select('id')
            .eq('is_active', true);
          
          if (allUsersError) {
            throw new Error(`Failed to fetch all users: ${allUsersError.message}`);
          }
          
          recipientUserIds = allUsers?.map(user => user.id) || [];
          break;
          
        case 'SPECIFIC':
          recipientUserIds = recipients.userIds || [];
          // Validate that these users exist
          if (recipientUserIds.length > 0) {
            const { data: validUsers, error: validUsersError } = await supabase
              .from('users')
              .select('id')
              .in('id', recipientUserIds);
            
            if (validUsersError) {
              throw new Error(`Failed to validate users: ${validUsersError.message}`);
            }
            
            recipientUserIds = validUsers?.map(user => user.id) || [];
          }
          break;
          
        case 'FAVORITES':
          // Fetch users who favorited specific teams/players
          // This would require joining with the favorites table
          // For now, we'll return an empty array as a placeholder
          recipientUserIds = [];
          break;
          
        case 'TEAM':
          // Fetch users who follow the specified team
          // This would require joining with the favorites table
          // For now, we'll return an empty array as a placeholder
          recipientUserIds = [];
          break;
          
        case 'COMPETITION':
          // Fetch users who follow the specified competition
          // This would require joining with the favorites table
          // For now, we'll return an empty array as a placeholder
          recipientUserIds = [];
          break;
          
        case 'ADMINS':
          // Fetch all admin users
          const { data: adminUsers, error: adminUsersError } = await supabase
            .from('users')
            .select('id')
            .in('role', ['admin', 'super-admin']);
          
          if (adminUsersError) {
            throw new Error(`Failed to fetch admin users: ${adminUsersError.message}`);
          }
          
          recipientUserIds = adminUsers?.map(user => user.id) || [];
          break;
          
        case 'LOGGERS':
          // Fetch all logger users
          const { data: loggerUsers, error: loggerUsersError } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'logger');
          
          if (loggerUsersError) {
            throw new Error(`Failed to fetch logger users: ${loggerUsersError.message}`);
          }
          
          recipientUserIds = loggerUsers?.map(user => user.id) || [];
          break;
      }
      
      return recipientUserIds;
    } catch (error: any) {
      logger.error('Get users by recipient type error', error);
      throw error;
    }
  }
};

export default notificationService;

// Helper function to send email notifications
async function sendEmailNotification(userId: string, notification: any) {
  try {
    // Get user email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single();
    
    if (userError) {
      throw new Error(`Failed to fetch user: ${userError.message}`);
    }
    
    if (!user?.email) {
      logger.warn('User email not found', { userId });
      return;
    }
    
    // In a real implementation, this would integrate with an email service like SendGrid, SES, etc.
    // For now, we'll log the email content
    logger.info('Email notification sent', {
      to: user.email,
      subject: notification.title,
      body: notification.content,
      userId,
      notificationId: notification.id
    });
    
    // TODO: Implement actual email sending with a service like SendGrid
    // Example with SendGrid:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: user.email,
      from: 'notifications@brixsport.com',
      subject: notification.title,
      text: notification.content,
      html: `<strong>${notification.content}</strong>`,
    };
    await sgMail.send(msg);
    */
  } catch (error: any) {
    logger.error('Error sending email notification', { 
      error: error.message, 
      userId, 
      notificationId: notification.id 
    });
    throw error;
  }
}

// Helper function to send push notifications
async function sendPushNotification(userId: string, notification: any) {
  try {
    // First, try to send via cloud messaging service (Firebase)
    const pushResult = await cloudMessagingService.sendPushNotificationToUser(userId, {
      title: notification.title,
      body: notification.content,
      data: {
        notificationId: notification.id,
        type: notification.type,
        ...notification.metadata
      }
    });

    if (pushResult.success) {
      logger.info('Push notification sent via Firebase', {
        userId,
        title: notification.title,
        body: notification.content,
        notificationId: notification.id
      });
      return;
    }

    // Fallback to logging if cloud messaging is not available
    logger.info('Push notification sent (logged)', {
      userId,
      title: notification.title,
      body: notification.content,
      notificationId: notification.id
    });
  } catch (error: any) {
    logger.error('Error sending push notification', { 
      error: error.message, 
      userId, 
      notificationId: notification.id 
    });
    throw error;
  }
}