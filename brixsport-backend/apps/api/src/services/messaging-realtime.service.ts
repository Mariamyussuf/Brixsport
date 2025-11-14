import { supabase } from './supabase.service';
import { logger } from '../utils/logger';
import { cloudMessagingService } from './cloud-messaging.service';
import { RealtimeChannel } from '@supabase/supabase-js';

// Types
interface TypingIndicator {
  conversation_id: string;
  user_id: string;
  user_name: string;
  started_at: string;
  expires_at: string;
}

interface MessageDeliveryStatus {
  id: string;
  message_id: string;
  user_id: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  delivered_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  content_type: string;
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'critical';
  category?: string;
  tags?: string[];
  target_audience: string;
  target_user_ids?: string[];
  scheduled_at?: string;
  published_at?: string;
  expires_at?: string;
  status: 'draft' | 'scheduled' | 'published' | 'expired' | 'archived';
  is_pinned: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const messagingRealtimeService = {
  // Active realtime subscriptions
  activeChannels: new Map<string, RealtimeChannel>(),

  /**
   * Subscribe to new messages in a conversation
   */
  subscribeToMessages: async (
    conversationId: string,
    userId: string,
    onMessage: (message: any) => void
  ): Promise<RealtimeChannel> => {
    try {
      logger.info('Subscribing to messages', { conversationId, userId });

      // Verify user has access to conversation
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .is('left_at', null)
        .single();

      if (participantError || !participantData) {
        throw new Error('Access denied to conversation');
      }

      const channelName = `conversation:${conversationId}:messages`;
      
      // Check if channel already exists
      if (messagingRealtimeService.activeChannels.has(channelName)) {
        return messagingRealtimeService.activeChannels.get(channelName)!;
      }

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            logger.info('New message received', { messageId: payload.new.id });
            onMessage(payload.new);
          }
        )
        .subscribe();

      messagingRealtimeService.activeChannels.set(channelName, channel);
      logger.info('Subscribed to messages channel', { channelName });

      return channel;
    } catch (error: any) {
      logger.error('Subscribe to messages error', { error: error.message });
      throw error;
    }
  },

  /**
   * Subscribe to typing indicators in a conversation
   */
  subscribeToTypingIndicators: async (
    conversationId: string,
    userId: string,
    onTyping: (indicator: TypingIndicator) => void
  ): Promise<RealtimeChannel> => {
    try {
      logger.info('Subscribing to typing indicators', { conversationId, userId });

      const channelName = `conversation:${conversationId}:typing`;
      
      // Check if channel already exists
      if (messagingRealtimeService.activeChannels.has(channelName)) {
        return messagingRealtimeService.activeChannels.get(channelName)!;
      }

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'typing_indicators',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            logger.debug('Typing indicator update', { type: payload.eventType });
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              onTyping(payload.new as TypingIndicator);
            }
          }
        )
        .subscribe();

      messagingRealtimeService.activeChannels.set(channelName, channel);
      logger.info('Subscribed to typing indicators channel', { channelName });

      return channel;
    } catch (error: any) {
      logger.error('Subscribe to typing indicators error', { error: error.message });
      throw error;
    }
  },

  /**
   * Subscribe to message reactions
   */
  subscribeToReactions: async (
    conversationId: string,
    onReaction: (reaction: MessageReaction, action: 'added' | 'removed') => void
  ): Promise<RealtimeChannel> => {
    try {
      logger.info('Subscribing to message reactions', { conversationId });

      const channelName = `conversation:${conversationId}:reactions`;
      
      if (messagingRealtimeService.activeChannels.has(channelName)) {
        return messagingRealtimeService.activeChannels.get(channelName)!;
      }

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'message_reactions'
          },
          (payload) => {
            logger.debug('Reaction added', { reactionId: payload.new.id });
            onReaction(payload.new as MessageReaction, 'added');
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'message_reactions'
          },
          (payload) => {
            logger.debug('Reaction removed', { reactionId: payload.old.id });
            onReaction(payload.old as MessageReaction, 'removed');
          }
        )
        .subscribe();

      messagingRealtimeService.activeChannels.set(channelName, channel);
      logger.info('Subscribed to reactions channel', { channelName });

      return channel;
    } catch (error: any) {
      logger.error('Subscribe to reactions error', { error: error.message });
      throw error;
    }
  },

  /**
   * Unsubscribe from a channel
   */
  unsubscribe: async (channelName: string): Promise<void> => {
    try {
      const channel = messagingRealtimeService.activeChannels.get(channelName);
      if (channel) {
        await supabase.removeChannel(channel);
        messagingRealtimeService.activeChannels.delete(channelName);
        logger.info('Unsubscribed from channel', { channelName });
      }
    } catch (error: any) {
      logger.error('Unsubscribe error', { error: error.message });
      throw error;
    }
  },

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll: async (): Promise<void> => {
    try {
      for (const [channelName, channel] of messagingRealtimeService.activeChannels) {
        await supabase.removeChannel(channel);
        messagingRealtimeService.activeChannels.delete(channelName);
        logger.info('Unsubscribed from channel', { channelName });
      }
    } catch (error: any) {
      logger.error('Unsubscribe all error', { error: error.message });
      throw error;
    }
  },

  /**
   * Update typing indicator
   */
  updateTypingIndicator: async (conversationId: string, userId: string): Promise<void> => {
    try {
      logger.debug('Updating typing indicator', { conversationId, userId });

      const { error } = await supabase.rpc('update_typing_indicator', {
        p_conversation_id: conversationId,
        p_user_id: userId
      });

      if (error) {
        throw new Error(`Failed to update typing indicator: ${error.message}`);
      }

      logger.debug('Typing indicator updated', { conversationId, userId });
    } catch (error: any) {
      logger.error('Update typing indicator error', { error: error.message });
      throw error;
    }
  },

  /**
   * Stop typing indicator
   */
  stopTypingIndicator: async (conversationId: string, userId: string): Promise<void> => {
    try {
      logger.debug('Stopping typing indicator', { conversationId, userId });

      const { error } = await supabase
        .from('typing_indicators')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to stop typing indicator: ${error.message}`);
      }

      logger.debug('Typing indicator stopped', { conversationId, userId });
    } catch (error: any) {
      logger.error('Stop typing indicator error', { error: error.message });
      throw error;
    }
  },

  /**
   * Get active typing users
   */
  getTypingUsers: async (conversationId: string): Promise<TypingIndicator[]> => {
    try {
      logger.debug('Getting typing users', { conversationId });

      const { data, error } = await supabase.rpc('get_typing_users', {
        p_conversation_id: conversationId
      });

      if (error) {
        throw new Error(`Failed to get typing users: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      logger.error('Get typing users error', { error: error.message });
      throw error;
    }
  },

  /**
   * Track message delivery status
   */
  trackMessageDelivery: async (
    messageId: string,
    userId: string,
    status: 'sent' | 'delivered' | 'failed' = 'sent'
  ): Promise<void> => {
    try {
      logger.debug('Tracking message delivery', { messageId, userId, status });

      const { error } = await supabase.rpc('track_message_delivery', {
        p_message_id: messageId,
        p_user_id: userId,
        p_status: status
      });

      if (error) {
        throw new Error(`Failed to track message delivery: ${error.message}`);
      }

      logger.debug('Message delivery tracked', { messageId, userId, status });
    } catch (error: any) {
      logger.error('Track message delivery error', { error: error.message });
      throw error;
    }
  },

  /**
   * Get message delivery status
   */
  getMessageDeliveryStatus: async (messageId: string): Promise<MessageDeliveryStatus[]> => {
    try {
      logger.debug('Getting message delivery status', { messageId });

      const { data, error } = await supabase
        .from('message_delivery_status')
        .select('*')
        .eq('message_id', messageId);

      if (error) {
        throw new Error(`Failed to get message delivery status: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      logger.error('Get message delivery status error', { error: error.message });
      throw error;
    }
  },

  /**
   * Add message reaction
   */
  addMessageReaction: async (
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<MessageReaction> => {
    try {
      logger.info('Adding message reaction', { messageId, userId, emoji });

      const { data, error } = await supabase.rpc('add_message_reaction', {
        p_message_id: messageId,
        p_user_id: userId,
        p_emoji: emoji
      });

      if (error) {
        throw new Error(`Failed to add message reaction: ${error.message}`);
      }

      // Fetch the created reaction
      const { data: reaction, error: fetchError } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('emoji', emoji)
        .single();

      if (fetchError || !reaction) {
        throw new Error('Failed to fetch created reaction');
      }

      logger.info('Message reaction added', { reactionId: reaction.id });
      return reaction;
    } catch (error: any) {
      logger.error('Add message reaction error', { error: error.message });
      throw error;
    }
  },

  /**
   * Remove message reaction
   */
  removeMessageReaction: async (
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<void> => {
    try {
      logger.info('Removing message reaction', { messageId, userId, emoji });

      const { data, error } = await supabase.rpc('remove_message_reaction', {
        p_message_id: messageId,
        p_user_id: userId,
        p_emoji: emoji
      });

      if (error) {
        throw new Error(`Failed to remove message reaction: ${error.message}`);
      }

      logger.info('Message reaction removed', { messageId, userId, emoji });
    } catch (error: any) {
      logger.error('Remove message reaction error', { error: error.message });
      throw error;
    }
  },

  /**
   * Get message reactions
   */
  getMessageReactions: async (messageId: string): Promise<MessageReaction[]> => {
    try {
      logger.debug('Getting message reactions', { messageId });

      const { data, error } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId);

      if (error) {
        throw new Error(`Failed to get message reactions: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      logger.error('Get message reactions error', { error: error.message });
      throw error;
    }
  },

  /**
   * Create announcement
   */
  createAnnouncement: async (
    userId: string,
    data: {
      title: string;
      content: string;
      priority: 'low' | 'normal' | 'high' | 'urgent' | 'critical';
      category?: string;
      tags?: string[];
      target_audience?: string;
      target_user_ids?: string[];
      scheduled_at?: string;
      expires_at?: string;
      is_pinned?: boolean;
    }
  ): Promise<Announcement> => {
    try {
      logger.info('Creating announcement', { userId, title: data.title });

      const { data: announcement, error } = await supabase
        .from('announcements')
        .insert({
          title: data.title,
          content: data.content,
          priority: data.priority,
          category: data.category,
          tags: data.tags || [],
          target_audience: data.target_audience || 'all',
          target_user_ids: data.target_user_ids,
          scheduled_at: data.scheduled_at || new Date().toISOString(),
          expires_at: data.expires_at,
          is_pinned: data.is_pinned || false,
          status: data.scheduled_at && new Date(data.scheduled_at) > new Date() ? 'scheduled' : 'published',
          published_at: !data.scheduled_at || new Date(data.scheduled_at) <= new Date() ? new Date().toISOString() : null,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating announcement', { error: error.message });
        throw new Error(`Failed to create announcement: ${error.message}`);
      }

      logger.info('Announcement created successfully', { announcementId: announcement.id });

      // Send push notifications to targeted users
      if (announcement.status === 'published') {
        await messagingRealtimeService.notifyAnnouncementRecipients(announcement);
      }

      return announcement;
    } catch (error: any) {
      logger.error('Create announcement error', { error: error.message });
      throw error;
    }
  },

  /**
   * Get announcements
   */
  getAnnouncements: async (
    userId?: string,
    filters?: {
      status?: string;
      priority?: string;
      category?: string;
      tags?: string[];
    },
    pagination?: {
      page: number;
      limit: number;
    }
  ): Promise<{ data: Announcement[]; pagination: { page: number; limit: number; total: number; hasNext: boolean } }> => {
    try {
      logger.info('Getting announcements', { userId, filters });

      let query = supabase
        .from('announcements')
        .select('*', { count: 'exact' });

      // Filter by status (default to published)
      if (filters?.status) {
        query = query.eq('status', filters.status);
      } else {
        query = query.eq('status', 'published');
      }

      // Filter by priority
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      // Filter by category
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      // Filter by tags
      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      // Apply pagination
      const page = pagination?.page || 1;
      const limit = Math.min(pagination?.limit || 50, 100);
      const offset = (page - 1) * limit;
      
      query = query
        .range(offset, offset + limit - 1)
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        logger.error('Error fetching announcements', { error: error.message });
        throw new Error(`Failed to fetch announcements: ${error.message}`);
      }

      const totalPages = Math.ceil((count || 0) / limit);
      
      logger.info('Announcements fetched successfully', { count: data?.length });
      
      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          hasNext: page < totalPages
        }
      };
    } catch (error: any) {
      logger.error('Get announcements error', { error: error.message });
      throw error;
    }
  },

  /**
   * Update announcement
   */
  updateAnnouncement: async (
    userId: string,
    announcementId: string,
    updates: Partial<Announcement>
  ): Promise<Announcement> => {
    try {
      logger.info('Updating announcement', { userId, announcementId });

      const { data, error } = await supabase
        .from('announcements')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', announcementId)
        .eq('created_by', userId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating announcement', { error: error.message });
        throw new Error(`Failed to update announcement: ${error.message}`);
      }

      logger.info('Announcement updated successfully', { announcementId });
      return data;
    } catch (error: any) {
      logger.error('Update announcement error', { error: error.message });
      throw error;
    }
  },

  /**
   * Delete announcement
   */
  deleteAnnouncement: async (userId: string, announcementId: string): Promise<void> => {
    try {
      logger.info('Deleting announcement', { userId, announcementId });

      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId)
        .eq('created_by', userId);

      if (error) {
        logger.error('Error deleting announcement', { error: error.message });
        throw new Error(`Failed to delete announcement: ${error.message}`);
      }

      logger.info('Announcement deleted successfully', { announcementId });
    } catch (error: any) {
      logger.error('Delete announcement error', { error: error.message });
      throw error;
    }
  },

  /**
   * Notify announcement recipients
   */
  notifyAnnouncementRecipients: async (announcement: Announcement): Promise<void> => {
    try {
      logger.info('Notifying announcement recipients', { announcementId: announcement.id });

      // Determine target users
      let targetUserIds: string[] = [];

      if (announcement.target_user_ids && announcement.target_user_ids.length > 0) {
        targetUserIds = announcement.target_user_ids;
      } else {
        // Get users based on target audience
        const { data: users, error } = await supabase
          .from('User')
          .select('id')
          .eq('deleted', false)
          .eq('suspended', false);

        if (error) {
          logger.error('Error fetching target users', { error: error.message });
          throw new Error(`Failed to fetch target users: ${error.message}`);
        }

        targetUserIds = users ? users.map(u => u.id) : [];
      }

      // Send push notifications to each user
      const notificationPromises = targetUserIds.map(async (userId) => {
        try {
          await cloudMessagingService.sendPushNotificationToUser(userId, {
            title: announcement.title,
            body: announcement.content,
            data: {
              type: 'announcement',
              announcement_id: announcement.id,
              priority: announcement.priority
            }
          });
        } catch (error: any) {
          logger.error('Error sending notification to user', { userId, error: error.message });
        }
      });

      await Promise.allSettled(notificationPromises);

      logger.info('Announcement notifications sent', { announcementId: announcement.id, recipientCount: targetUserIds.length });
    } catch (error: any) {
      logger.error('Notify announcement recipients error', { error: error.message });
      throw error;
    }
  },

  /**
   * Mark message as read and update read receipts
   */
  markMessageRead: async (messageId: string, userId: string): Promise<void> => {
    try {
      logger.debug('Marking message as read', { messageId, userId });

      const { error } = await supabase
        .from('message_read_status')
        .insert({
          message_id: messageId,
          user_id: userId,
          read_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        throw new Error(`Failed to mark message as read: ${error.message}`);
      }

      logger.debug('Message marked as read', { messageId, userId });
    } catch (error: any) {
      logger.error('Mark message read error', { error: error.message });
      throw error;
    }
  },

  /**
   * Get message read receipts
   */
  getMessageReadReceipts: async (messageId: string): Promise<any[]> => {
    try {
      logger.debug('Getting message read receipts', { messageId });

      const { data, error } = await supabase
        .from('message_read_status')
        .select(`
          *,
          user:User(id, name, email)
        `)
        .eq('message_id', messageId);

      if (error) {
        throw new Error(`Failed to get message read receipts: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      logger.error('Get message read receipts error', { error: error.message });
      throw error;
    }
  }
};

export default messagingRealtimeService;