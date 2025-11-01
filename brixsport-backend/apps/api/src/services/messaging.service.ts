import { supabase } from './supabase.service';
import { logger } from '../utils/logger';

// Types
interface Conversation {
  id: string;
  type: 'announcement' | 'broadcast' | 'direct' | 'group' | 'channel';
  name?: string;
  description?: string;
  avatar_url?: string;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived: boolean;
  archived_at?: string;
}

interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joined_at: string;
  left_at?: string;
  last_read_at?: string;
  notification_settings?: Record<string, any>;
  muted: boolean;
  muted_until?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  parent_message_id?: string;
  content: string;
  content_type: 'text' | 'image' | 'file' | 'system' | 'poll' | 'rich_text';
  formatted_content?: Record<string, any>;
  attachments?: Array<{
    id: string;
    type: 'image' | 'video' | 'document' | 'audio';
    url: string;
    name: string;
    size: number;
    mimeType: string;
  }>;
  edited: boolean;
  edited_at?: string;
  pinned: boolean;
  pinned_by?: string;
  pinned_at?: string;
  reactions?: Record<string, string[]>;
  mention_user_ids?: string[];
  flagged: boolean;
  flagged_by?: string;
  flagged_at?: string;
  flagged_reason?: string;
  created_at: string;
  updated_at: string;
  deleted: boolean;
  deleted_at?: string;
  deleted_by?: string;
}

interface MessageReadStatus {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}

interface BroadcastMessage {
  id: string;
  sender_id: string;
  title: string;
  content: string;
  content_type: string;
  target_type: 'all_users' | 'user_segment' | 'specific_users';
  target_criteria?: Record<string, any>;
  target_user_ids?: string[];
  scheduled_for: string;
  expires_at?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  channels: string[];
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  sent_at?: string;
  recipients_count: number;
  delivered_count: number;
  read_count: number;
  created_at: string;
  updated_at: string;
}

export const messagingService = {
  // Get user conversations
  getUserConversations: async (
    userId: string,
    filters?: {
      type?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
    pagination?: {
      page: number;
      limit: number;
    }
  ): Promise<{ data: Conversation[]; pagination: { page: number; limit: number; total: number; hasNext: boolean } }> => {
    try {
      logger.info('Fetching user conversations', { userId, filters, pagination });

      // Build query
      let query = supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants!inner(user_id)
        `, { count: 'exact' })
        .eq('conversation_participants.user_id', userId)
        .is('conversation_participants.left_at', null);

      // Apply filters
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      // Apply pagination
      const page = pagination?.page || 1;
      const limit = Math.min(pagination?.limit || 50, 100);
      const offset = (page - 1) * limit;
      
      query = query.range(offset, offset + limit - 1);

      // Apply sorting
      const sortBy = filters?.sortBy || 'updated_at';
      const sortOrder = filters?.sortOrder || 'DESC';
      query = query.order(sortBy, { ascending: sortOrder === 'ASC' });

      const { data, error, count } = await query;

      if (error) {
        logger.error('Error fetching user conversations', { error: error.message });
        throw new Error(`Failed to fetch conversations: ${error.message}`);
      }

      const totalPages = Math.ceil((count || 0) / limit);
      
      logger.info('Conversations fetched successfully', { userId, count: data?.length });
      
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
      logger.error('Get user conversations error', { error: error.message });
      throw error;
    }
  },

  // Create conversation
  createConversation: async (
    creatorId: string,
    data: {
      type: 'announcement' | 'broadcast' | 'direct' | 'group' | 'channel';
      name?: string;
      description?: string;
      participantIds: string[];
    }
  ): Promise<Conversation> => {
    try {
      logger.info('Creating conversation', { creatorId, data });

      // Start a transaction
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          type: data.type,
          name: data.name,
          description: data.description,
          created_by: creatorId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (conversationError) {
        logger.error('Error creating conversation', { error: conversationError.message });
        throw new Error(`Failed to create conversation: ${conversationError.message}`);
      }

      const conversationId = conversationData.id;

      // Add creator as owner
      const { error: ownerError } = await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversationId,
          user_id: creatorId,
          role: 'owner',
          joined_at: new Date().toISOString()
        });

      if (ownerError) {
        logger.error('Error adding creator as owner', { error: ownerError.message });
        throw new Error(`Failed to add creator as owner: ${ownerError.message}`);
      }

      // Add other participants
      if (data.participantIds && data.participantIds.length > 0) {
        const participantRecords = data.participantIds.map(participantId => ({
          conversation_id: conversationId,
          user_id: participantId,
          role: 'member',
          joined_at: new Date().toISOString()
        }));

        const { error: participantsError } = await supabase
          .from('conversation_participants')
          .insert(participantRecords);

        if (participantsError) {
          logger.error('Error adding participants', { error: participantsError.message });
          throw new Error(`Failed to add participants: ${participantsError.message}`);
        }
      }

      logger.info('Conversation created successfully', { conversationId });
      
      return conversationData;
    } catch (error: any) {
      logger.error('Create conversation error', { error: error.message });
      throw error;
    }
  },

  // Get conversation details
  getConversationDetails: async (userId: string, conversationId: string): Promise<Conversation | null> => {
    try {
      logger.info('Fetching conversation details', { userId, conversationId });

      // Check if user has access to conversation
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .is('left_at', null)
        .single();

      if (participantError || !participantData) {
        logger.warn('User does not have access to conversation', { userId, conversationId });
        return null;
      }

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) {
        logger.error('Error fetching conversation details', { error: error.message });
        throw new Error(`Failed to fetch conversation details: ${error.message}`);
      }

      logger.info('Conversation details fetched successfully', { conversationId });
      
      return data || null;
    } catch (error: any) {
      logger.error('Get conversation details error', { error: error.message });
      throw error;
    }
  },

  // Update conversation
  updateConversation: async (
    userId: string,
    conversationId: string,
    updates: {
      name?: string;
      description?: string;
      avatar_url?: string;
      settings?: Record<string, any>;
    }
  ): Promise<Conversation> => {
    try {
      logger.info('Updating conversation', { userId, conversationId, updates });

      // Check if user has permission to update conversation (must be owner or admin)
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('role')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .is('left_at', null)
        .in('role', ['owner', 'admin'])
        .single();

      if (participantError || !participantData) {
        logger.warn('User does not have permission to update conversation', { userId, conversationId });
        throw new Error('Insufficient permissions to update conversation');
      }

      const { data, error } = await supabase
        .from('conversations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating conversation', { error: error.message });
        throw new Error(`Failed to update conversation: ${error.message}`);
      }

      logger.info('Conversation updated successfully', { conversationId });
      
      return data;
    } catch (error: any) {
      logger.error('Update conversation error', { error: error.message });
      throw error;
    }
  },

  // Delete conversation
  deleteConversation: async (userId: string, conversationId: string): Promise<void> => {
    try {
      logger.info('Deleting conversation', { userId, conversationId });

      // Check if user has permission to delete conversation (must be owner)
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('role')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .eq('role', 'owner')
        .is('left_at', null)
        .single();

      if (participantError || !participantData) {
        logger.warn('User does not have permission to delete conversation', { userId, conversationId });
        throw new Error('Insufficient permissions to delete conversation');
      }

      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) {
        logger.error('Error deleting conversation', { error: error.message });
        throw new Error(`Failed to delete conversation: ${error.message}`);
      }

      logger.info('Conversation deleted successfully', { conversationId });
    } catch (error: any) {
      logger.error('Delete conversation error', { error: error.message });
      throw error;
    }
  },

  // Add participant to conversation
  addParticipant: async (
    userId: string,
    conversationId: string,
    participantId: string,
    role: 'admin' | 'moderator' | 'member' = 'member'
  ): Promise<ConversationParticipant> => {
    try {
      logger.info('Adding participant to conversation', { userId, conversationId, participantId, role });

      // Check if user has permission to add participants (must be owner or admin)
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('role')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .is('left_at', null)
        .in('role', ['owner', 'admin'])
        .single();

      if (participantError || !participantData) {
        logger.warn('User does not have permission to add participant', { userId, conversationId });
        throw new Error('Insufficient permissions to add participant');
      }

      // Check if participant is already in conversation
      const { data: existingParticipant, error: existingError } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', participantId)
        .single();

      if (existingParticipant && !existingError) {
        logger.warn('Participant already in conversation', { conversationId, participantId });
        throw new Error('Participant already in conversation');
      }

      const { data, error } = await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversationId,
          user_id: participantId,
          role,
          joined_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Error adding participant', { error: error.message });
        throw new Error(`Failed to add participant: ${error.message}`);
      }

      logger.info('Participant added successfully', { conversationId, participantId });
      
      return data;
    } catch (error: any) {
      logger.error('Add participant error', { error: error.message });
      throw error;
    }
  },

  // Remove participant from conversation
  removeParticipant: async (
    userId: string,
    conversationId: string,
    participantId: string
  ): Promise<void> => {
    try {
      logger.info('Removing participant from conversation', { userId, conversationId, participantId });

      // Check if user has permission to remove participants
      // Can remove self, or if user is owner/admin removing others
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('role')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .is('left_at', null)
        .single();

      if (participantError || !participantData) {
        logger.warn('User does not have permission to remove participant', { userId, conversationId });
        throw new Error('Insufficient permissions to remove participant');
      }

      const isRemovingSelf = userId === participantId;
      const isOwnerOrAdmin = ['owner', 'admin'].includes(participantData.role);
      
      if (!isRemovingSelf && !isOwnerOrAdmin) {
        logger.warn('User does not have permission to remove other participants', { userId, conversationId });
        throw new Error('Insufficient permissions to remove other participants');
      }

      // If removing self and is owner, need to transfer ownership or prevent removal
      if (isRemovingSelf && participantData.role === 'owner') {
        // Check if there are other participants
        const { data: otherParticipants, error: otherParticipantsError } = await supabase
          .from('conversation_participants')
          .select('id, user_id')
          .eq('conversation_id', conversationId)
          .neq('user_id', userId)
          .is('left_at', null)
          .limit(1);

        if (otherParticipantsError) {
          logger.error('Error checking other participants', { error: otherParticipantsError.message });
          throw new Error(`Failed to check other participants: ${otherParticipantsError.message}`);
        }

        if (!otherParticipants || otherParticipants.length === 0) {
          // Last participant, delete conversation instead
          await messagingService.deleteConversation(userId, conversationId);
          return;
        }
      }

      const { error } = await supabase
        .from('conversation_participants')
        .update({
          left_at: new Date().toISOString()
        })
        .eq('conversation_id', conversationId)
        .eq('user_id', participantId);

      if (error) {
        logger.error('Error removing participant', { error: error.message });
        throw new Error(`Failed to remove participant: ${error.message}`);
      }

      logger.info('Participant removed successfully', { conversationId, participantId });
    } catch (error: any) {
      logger.error('Remove participant error', { error: error.message });
      throw error;
    }
  },

  // Update participant role
  updateParticipantRole: async (
    userId: string,
    conversationId: string,
    participantId: string,
    role: 'admin' | 'moderator' | 'member'
  ): Promise<ConversationParticipant> => {
    try {
      logger.info('Updating participant role', { userId, conversationId, participantId, role });

      // Check if user has permission to update participant roles (must be owner)
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('role')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .eq('role', 'owner')
        .is('left_at', null)
        .single();

      if (participantError || !participantData) {
        logger.warn('User does not have permission to update participant role', { userId, conversationId });
        throw new Error('Insufficient permissions to update participant role');
      }

      // Cannot change owner role
      if (participantId === userId) {
        logger.warn('Cannot change owner role', { userId, conversationId });
        throw new Error('Cannot change owner role');
      }

      const { data, error } = await supabase
        .from('conversation_participants')
        .update({ role })
        .eq('conversation_id', conversationId)
        .eq('user_id', participantId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating participant role', { error: error.message });
        throw new Error(`Failed to update participant role: ${error.message}`);
      }

      logger.info('Participant role updated successfully', { conversationId, participantId, role });
      
      return data;
    } catch (error: any) {
      logger.error('Update participant role error', { error: error.message });
      throw error;
    }
  },

  // Get messages
  getMessages: async (
    userId: string,
    conversationId: string,
    pagination?: {
      page: number;
      limit: number;
      before?: string;
      after?: string;
    }
  ): Promise<{ data: Message[]; pagination: { page: number; limit: number; total: number; hasNext: boolean } }> => {
    try {
      logger.info('Fetching messages', { userId, conversationId, pagination });

      // Check if user has access to conversation
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .is('left_at', null)
        .single();

      if (participantError || !participantData) {
        logger.warn('User does not have access to conversation', { userId, conversationId });
        throw new Error('Access denied to conversation');
      }

      // Build query
      let query = supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('conversation_id', conversationId)
        .eq('deleted', false)
        .order('created_at', { ascending: false });

      // Apply pagination
      const page = pagination?.page || 1;
      const limit = Math.min(pagination?.limit || 50, 100);
      const offset = (page - 1) * limit;
      
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        logger.error('Error fetching messages', { error: error.message });
        throw new Error(`Failed to fetch messages: ${error.message}`);
      }

      const totalPages = Math.ceil((count || 0) / limit);
      
      logger.info('Messages fetched successfully', { conversationId, count: data?.length });
      
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
      logger.error('Get messages error', { error: error.message });
      throw error;
    }
  },

  // Send message
  sendMessage: async (
    userId: string,
    conversationId: string,
    data: {
      content: string;
      content_type?: 'text' | 'image' | 'file' | 'system' | 'poll' | 'rich_text';
      parent_message_id?: string;
      attachments?: Array<{
        type: 'image' | 'video' | 'document' | 'audio';
        url: string;
        name: string;
        size: number;
        mimeType: string;
      }>;
      mention_user_ids?: string[];
    }
  ): Promise<Message> => {
    try {
      logger.info('Sending message', { userId, conversationId, data });

      // Check if user has access to conversation
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .is('left_at', null)
        .single();

      if (participantError || !participantData) {
        logger.warn('User does not have access to conversation', { userId, conversationId });
        throw new Error('Access denied to conversation');
      }

      const { data: messageData, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          content: data.content,
          content_type: data.content_type || 'text',
          parent_message_id: data.parent_message_id,
          attachments: data.attachments ? JSON.stringify(data.attachments) : '[]',
          mention_user_ids: data.mention_user_ids || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Error sending message', { error: error.message });
        throw new Error(`Failed to send message: ${error.message}`);
      }

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      logger.info('Message sent successfully', { messageId: messageData.id });
      
      return messageData;
    } catch (error: any) {
      logger.error('Send message error', { error: error.message });
      throw error;
    }
  },

  // Update message
  updateMessage: async (
    userId: string,
    messageId: string,
    content: string
  ): Promise<Message> => {
    try {
      logger.info('Updating message', { userId, messageId, content });

      // Check if user has permission to update message (must be sender)
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select('user_id, conversation_id')
        .eq('id', messageId)
        .eq('user_id', userId)
        .eq('deleted', false)
        .single();

      if (messageError || !messageData) {
        logger.warn('User does not have permission to update message', { userId, messageId });
        throw new Error('Insufficient permissions to update message');
      }

      const { data, error } = await supabase
        .from('messages')
        .update({
          content,
          edited: true,
          edited_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating message', { error: error.message });
        throw new Error(`Failed to update message: ${error.message}`);
      }

      logger.info('Message updated successfully', { messageId });
      
      return data;
    } catch (error: any) {
      logger.error('Update message error', { error: error.message });
      throw error;
    }
  },

  // Delete message
  deleteMessage: async (userId: string, messageId: string): Promise<void> => {
    try {
      logger.info('Deleting message', { userId, messageId });

      // Check if user has permission to delete message (must be sender or conversation admin/owner)
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select('user_id, conversation_id')
        .eq('id', messageId)
        .eq('deleted', false)
        .single();

      if (messageError || !messageData) {
        logger.warn('Message not found or already deleted', { userId, messageId });
        throw new Error('Message not found or already deleted');
      }

      // Check if user is sender or has admin/owner permissions in conversation
      const isSender = messageData.user_id === userId;
      
      if (!isSender) {
        const { data: participantData, error: participantError } = await supabase
          .from('conversation_participants')
          .select('role')
          .eq('conversation_id', messageData.conversation_id)
          .eq('user_id', userId)
          .is('left_at', null)
          .in('role', ['owner', 'admin'])
          .single();

        if (participantError || !participantData) {
          logger.warn('User does not have permission to delete message', { userId, messageId });
          throw new Error('Insufficient permissions to delete message');
        }
      }

      const { error } = await supabase
        .from('messages')
        .update({
          deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) {
        logger.error('Error deleting message', { error: error.message });
        throw new Error(`Failed to delete message: ${error.message}`);
      }

      logger.info('Message deleted successfully', { messageId });
    } catch (error: any) {
      logger.error('Delete message error', { error: error.message });
      throw error;
    }
  },

  // Add reaction to message
  addReaction: async (
    userId: string,
    messageId: string,
    emoji: string
  ): Promise<Message> => {
    try {
      logger.info('Adding reaction to message', { userId, messageId, emoji });

      // Check if message exists and is not deleted
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select('reactions, conversation_id')
        .eq('id', messageId)
        .eq('deleted', false)
        .single();

      if (messageError || !messageData) {
        logger.warn('Message not found or deleted', { userId, messageId });
        throw new Error('Message not found or deleted');
      }

      // Check if user has access to conversation
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', messageData.conversation_id)
        .eq('user_id', userId)
        .is('left_at', null)
        .single();

      if (participantError || !participantData) {
        logger.warn('User does not have access to conversation', { userId, messageId });
        throw new Error('Access denied to conversation');
      }

      // Parse existing reactions
      let reactions = messageData.reactions ? JSON.parse(messageData.reactions) : {};
      
      // Add user to emoji reaction list
      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }
      
      // Check if user already reacted with this emoji
      if (!reactions[emoji].includes(userId)) {
        reactions[emoji].push(userId);
      }

      const { data, error } = await supabase
        .from('messages')
        .update({ reactions: JSON.stringify(reactions), updated_at: new Date().toISOString() })
        .eq('id', messageId)
        .select()
        .single();

      if (error) {
        logger.error('Error adding reaction', { error: error.message });
        throw new Error(`Failed to add reaction: ${error.message}`);
      }

      logger.info('Reaction added successfully', { messageId, emoji });
      
      return data;
    } catch (error: any) {
      logger.error('Add reaction error', { error: error.message });
      throw error;
    }
  },

  // Mark messages as read
  markMessagesRead: async (userId: string, conversationId: string): Promise<void> => {
    try {
      logger.info('Marking messages as read', { userId, conversationId });

      // Check if user has access to conversation
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .is('left_at', null)
        .single();

      if (participantError || !participantData) {
        logger.warn('User does not have access to conversation', { userId, conversationId });
        throw new Error('Access denied to conversation');
      }

      // Update participant's last read timestamp
      const { error: updateError } = await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      if (updateError) {
        logger.error('Error updating last read timestamp', { error: updateError.message });
        throw new Error(`Failed to mark messages as read: ${updateError.message}`);
      }

      logger.info('Messages marked as read', { userId, conversationId });
    } catch (error: any) {
      logger.error('Mark messages read error', { error: error.message });
      throw error;
    }
  }
};

export default messagingService;