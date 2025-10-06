import { logger } from '../utils/logger';
import { supabase } from './supabase.service';

export const notificationService = {
  // Get user notifications
  getUserNotifications: async (userId: string, options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}) => {
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
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }
      
      // Order by creation date (newest first)
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        logger.error('Database error fetching user notifications', { error: error.message, userId });
        throw new Error(`Failed to fetch notifications: ${error.message}`);
      }
      
      return {
        success: true,
        data: data || []
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
        
        return {
          success: true,
          data,
          message: `Notification sent to ${notifications.length} users`
        };
      } else {
        // For system-wide broadcasts, we'll need to get all active users
        // This is a simplified approach - in production you might want to use a job queue
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id')
          .eq('is_active', true);
        
        if (usersError) {
          logger.error('Error fetching users for broadcast', { error: usersError.message });
          throw new Error(`Failed to fetch users for broadcast: ${usersError.message}`);
        }
        
        if (!users || users.length === 0) {
          return {
            success: true,
            data: [],
            message: 'No active users found for broadcast'
          };
        }
        
        const notifications = users.map(user => ({
          user_id: user.id,
          title: notificationData.title,
          content: notificationData.content,
          type: notificationData.type || 'system_broadcast',
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
          logger.error('Database error broadcasting system notification', { error: error.message });
          throw new Error(`Failed to broadcast notification: ${error.message}`);
        }
        
        return {
          success: true,
          data,
          message: `Notification broadcast to ${notifications.length} users`
        };
      }
    } catch (error: any) {
      logger.error('Broadcast notification error', error);
      throw error;
    }
  },
  
  // Schedule notification (admin)
  scheduleNotification: async (
    notificationData: { 
      title: string; 
      content: string; 
      type?: string; 
      metadata?: any; 
      targetUsers?: string[]; 
      templateId?: string;
    }, 
    scheduleTime: Date
  ) => {
    try {
      logger.info('Scheduling notification', { notificationData, scheduleTime });
      
      // Store scheduled notification in database
      const scheduledNotification = {
        title: notificationData.title,
        content: notificationData.content,
        type: notificationData.type || 'scheduled',
        metadata: {
          ...notificationData.metadata,
          targetUsers: notificationData.targetUsers,
          originalScheduleTime: scheduleTime.toISOString()
        },
        template_id: notificationData.templateId,
        scheduled_for: scheduleTime.toISOString(),
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
      
      // TODO: In production, integrate with a job queue like BullMQ or similar
      // For now, we'll log that this needs to be processed by a background job
      logger.info('Notification scheduled in database - background job processor needed', { 
        scheduledNotificationId: data.id,
        scheduleTime: scheduleTime.toISOString()
      });
      
      return {
        success: true,
        data,
        message: 'Notification scheduled successfully',
        note: 'Background job processor required for automatic delivery'
      };
    } catch (error: any) {
      logger.error('Schedule notification error', error);
      throw error;
    }
  },
  
  // Get notification templates (admin)
  getNotificationTemplates: async () => {
    try {
      logger.info('Fetching notification templates');
      
      // Fetch templates from database
      const { data, error } = await supabase
        .from('notification_templates')
        .select('id, name, content, type, variables, is_active, created_at, updated_at')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        logger.warn('Failed to fetch templates from database, using fallback templates', { error: error.message });
        
        // Fallback to mock templates if database query fails
        const fallbackTemplates = [
          {
            id: 'match-started',
            name: 'Match Started',
            content: 'The match between {homeTeam} and {awayTeam} has started!',
            type: 'match_event',
            variables: ['homeTeam', 'awayTeam'],
            is_active: true
          },
          {
            id: 'goal-scored',
            name: 'Goal Scored',
            content: 'Goal! {scoringTeam} scores against {opponentTeam}!',
            type: 'match_event',
            variables: ['scoringTeam', 'opponentTeam'],
            is_active: true
          },
          {
            id: 'match-ended',
            name: 'Match Ended',
            content: 'The match between {homeTeam} and {awayTeam} has ended with a score of {homeScore}-{awayScore}',
            type: 'match_event',
            variables: ['homeTeam', 'awayTeam', 'homeScore', 'awayScore'],
            is_active: true
          }
        ];
        
        return {
          success: true,
          data: fallbackTemplates,
          source: 'fallback'
        };
      }
      
      return {
        success: true,
        data: data || [],
        source: 'database'
      };
    } catch (error: any) {
      logger.error('Get notification templates error', error);
      throw error;
    }
  },

  // Get unread notification count for a user
  getUnreadCount: async (userId: string) => {
    try {
      logger.info('Fetching unread notification count', { userId });
      
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);
      
      if (error) {
        logger.error('Database error fetching unread count', { error: error.message, userId });
        throw new Error(`Failed to fetch unread count: ${error.message}`);
      }
      
      return {
        success: true,
        count: count || 0
      };
    } catch (error: any) {
      logger.error('Get unread count error', error);
      throw error;
    }
  },

  // Create a single notification for a specific user
  createNotification: async (
    userId: string, 
    notificationData: { 
      title: string; 
      content: string; 
      type?: string; 
      metadata?: any; 
      templateId?: string;
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
        read: false,
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
  }
};