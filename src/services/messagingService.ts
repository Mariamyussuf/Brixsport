import AdminService from '@/services/AdminService';

// Types
interface Conversation {
  id: string;
  type: 'announcement' | 'broadcast';
  name?: string;
  participants: Participant[];
  lastMessage?: Message;
  unreadCount: number;
  isMuted: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Participant {
  userId: string;
  role: 'admin' | 'system';
  joinedAt: Date;
  lastReadAt?: Date;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'system' | 'announcement' | 'broadcast';
  attachments?: Attachment[];
  reactions?: Reaction[];
  replyTo?: string;
  editedAt?: Date;
  deletedAt?: Date;
  isPinned?: boolean;
  metadata?: {
    source?: 'admin' | 'system';
    tags?: string[];
  };
  createdAt: Date;
}

interface Attachment {
  id: string;
  type: 'image' | 'video' | 'document' | 'audio';
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

interface Reaction {
  userId: string;
  emoji: string;
  createdAt: Date;
}

interface BroadcastMessage {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'alert' | 'update' | 'maintenance';
  priority: 'normal' | 'high' | 'urgent' | 'critical';
  recipients: {
    type: 'all' | 'specific' | 'role-based';
    userIds?: string[];
    roles?: string[];
  };
  scheduledAt?: Date;
  sentAt?: Date;
  expiresAt?: Date;
  isPublished: boolean;
  tags?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock database
const conversations: Conversation[] = [];
const messages: Message[] = [];
const broadcastMessages: BroadcastMessage[] = [];

export class MessagingService {
  // Add the missing addParticipant method
  static async addParticipant(
    userId: string,
    conversationId: string,
    participantId: string
  ) {
    try {
      console.log('Adding participant to conversation', { userId, conversationId, participantId });
      
      const conversationIndex = conversations.findIndex(conv => 
        conv.id === conversationId
      );
      
      if (conversationIndex === -1) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Conversation not found'
          }
        };
      }
      
      // Check if user has permission to add participants (must be admin)
      const participant = conversations[conversationIndex].participants.find(p => p.userId === userId);
      if (!participant || participant.role !== 'admin') {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to add participants'
          }
        };
      }
      
      // Check if participant already exists
      const existingParticipant = conversations[conversationIndex].participants.find(p => p.userId === participantId);
      if (existingParticipant) {
        return {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'User is already a participant'
          }
        };
      }
      
      // Add new participant with system role by default
      const newParticipant: Participant = {
        userId: participantId,
        role: 'system',
        joinedAt: new Date()
      };
      
      conversations[conversationIndex].participants.push(newParticipant);
      
      return {
        success: true,
        data: newParticipant
      };
    } catch (error) {
      console.error('Add participant error', error);
      throw error;
    }
  }

  // Implement the removeParticipant method properly
  static async removeParticipant(
    userId: string,
    conversationId: string,
    participantId: string
  ) {
    try {
      console.log('Removing participant from conversation', { userId, conversationId, participantId });
      
      const conversationIndex = conversations.findIndex(conv => 
        conv.id === conversationId
      );
      
      if (conversationIndex === -1) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Conversation not found'
          }
        };
      }
      
      // Check if user has permission to remove participants (must be admin)
      const participant = conversations[conversationIndex].participants.find(p => p.userId === userId);
      if (!participant || participant.role !== 'admin') {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to remove participants'
          }
        };
      }
      
      // Find the participant to remove
      const participantIndex = conversations[conversationIndex].participants.findIndex(p => p.userId === participantId);
      if (participantIndex === -1) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Participant not found'
          }
        };
      }
      
      // Prevent removing the last admin
      const admins = conversations[conversationIndex].participants.filter(p => p.role === 'admin');
      if (admins.length === 1 && admins[0].userId === participantId) {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Cannot remove the last admin from conversation'
          }
        };
      }
      
      // Remove participant
      const removedParticipant = conversations[conversationIndex].participants.splice(participantIndex, 1)[0];
      
      return {
        success: true,
        data: removedParticipant,
        message: 'Participant removed successfully'
      };
    } catch (error) {
      console.error('Remove participant error', error);
      throw error;
    }
  }

  // Implement the updateParticipantRole method properly
  static async updateParticipantRole(
    userId: string,
    conversationId: string,
    participantId: string,
    role: 'admin' | 'system'
  ) {
    try {
      console.log('Updating participant role', { userId, conversationId, participantId, role });
      
      const conversationIndex = conversations.findIndex(conv => 
        conv.id === conversationId
      );
      
      if (conversationIndex === -1) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Conversation not found'
          }
        };
      }
      
      // Check if user has permission to update participant roles (must be admin)
      const participant = conversations[conversationIndex].participants.find(p => p.userId === userId);
      if (!participant || participant.role !== 'admin') {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to update participant roles'
          }
        };
      }
      
      // Find the participant to update
      const participantToUpdateIndex = conversations[conversationIndex].participants.findIndex(p => p.userId === participantId);
      if (participantToUpdateIndex === -1) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Participant not found'
          }
        };
      }
      
      // Prevent removing the last admin if trying to change role from admin to system
      const admins = conversations[conversationIndex].participants.filter(p => p.role === 'admin');
      if (admins.length === 1 && admins[0].userId === participantId && role === 'system') {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Cannot change the last admin to system role'
          }
        };
      }
      
      // Update participant role
      conversations[conversationIndex].participants[participantToUpdateIndex].role = role;
      
      return {
        success: true,
        data: conversations[conversationIndex].participants[participantToUpdateIndex],
        message: 'Participant role updated successfully'
      };
    } catch (error) {
      console.error('Update participant role error', error);
      throw error;
    }
  }
  // Conversations - Only for system/admin use
  static async getUserConversations(
    userId: string,
    filters: {
      type?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
    pagination: {
      page: number;
      limit: number;
    }
  ) {
    try {
      console.log('Fetching system conversations', { userId, filters, pagination });
      
      // Only return system conversations where user is a participant
      let userConversations = conversations.filter(conv => 
        conv.participants.some(p => p.userId === userId) && 
        (conv.type === 'announcement' || conv.type === 'broadcast')
      );
      
      // Apply type filter if provided
      if (filters.type) {
        userConversations = userConversations.filter(conv => conv.type === filters.type);
      }
      
      // Apply sorting
      userConversations.sort((a, b) => {
        const order = filters.sortOrder === 'ASC' ? 1 : -1;
        if (filters.sortBy === 'updatedAt') {
          return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * order;
        }
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * order;
      });
      
      // Apply pagination
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedConversations = userConversations.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: paginatedConversations,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: userConversations.length,
          hasNext: endIndex < userConversations.length
        }
      };
    } catch (error) {
      console.error('Get system conversations error', error);
      throw error;
    }
  }

  static async createConversation(
    userId: string,
    data: {
      name?: string;
      type: 'announcement' | 'broadcast';
      participantIds: string[];
    }
  ) {
    try {
      console.log('Creating system conversation', { userId, data });
      
      // Create participants array - only admins can create system conversations
      const participants: Participant[] = [
        {
          userId,
          role: 'admin',
          joinedAt: new Date()
        },
        ...data.participantIds.map(id => ({
          userId: id,
          role: 'system' as 'system',
          joinedAt: new Date()
        }))
      ];
      
      // Create new conversation
      const newConversation: Conversation = {
        id: Date.now().toString(),
        type: data.type,
        name: data.name,
        participants,
        unreadCount: 0,
        isMuted: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      conversations.push(newConversation);
      
      return {
        success: true,
        data: newConversation
      };
    } catch (error) {
      console.error('Create system conversation error', error);
      throw error;
    }
  }

  static async getConversationDetails(userId: string, conversationId: string) {
    try {
      console.log('Fetching conversation details', { userId, conversationId });
      
      const conversation = conversations.find(conv => 
        conv.id === conversationId && 
        conv.participants.some(p => p.userId === userId)
      );
      
      if (!conversation) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Conversation not found'
          }
        };
      }
      
      return {
        success: true,
        data: conversation
      };
    } catch (error) {
      console.error('Get conversation details error', error);
      throw error;
    }
  }

  static async updateConversation(
    userId: string,
    conversationId: string,
    updates: {
      name?: string;
      isMuted?: boolean;
      isArchived?: boolean;
    }
  ) {
    try {
      console.log('Updating conversation', { userId, conversationId, updates });
      
      const conversationIndex = conversations.findIndex(conv => 
        conv.id === conversationId && 
        conv.participants.some(p => p.userId === userId)
      );
      
      if (conversationIndex === -1) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Conversation not found'
          }
        };
      }
      
      // Check if user has permission to update (must be admin)
      const participant = conversations[conversationIndex].participants.find(p => p.userId === userId);
      if (!participant || participant.role !== 'admin') {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to update conversation'
          }
        };
      }
      
      // Update conversation
      conversations[conversationIndex] = {
        ...conversations[conversationIndex],
        ...updates,
        updatedAt: new Date()
      };
      
      return {
        success: true,
        data: conversations[conversationIndex]
      };
    } catch (error) {
      console.error('Update conversation error', error);
      throw error;
    }
  }

  static async deleteConversation(userId: string, conversationId: string) {
    try {
      console.log('Deleting conversation', { userId, conversationId });
      
      const conversationIndex = conversations.findIndex(conv => 
        conv.id === conversationId && 
        conv.participants.some(p => p.userId === userId)
      );
      
      if (conversationIndex === -1) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Conversation not found'
          }
        };
      }
      
      // Check if user has permission to delete (must be admin)
      const participant = conversations[conversationIndex].participants.find(p => p.userId === userId);
      if (!participant || participant.role !== 'admin') {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to delete conversation'
          }
        };
      }
      
      // Remove conversation
      const deletedConversation = conversations.splice(conversationIndex, 1)[0];
      
      // Also delete all messages in this conversation
      const messagesToDelete = messages.filter(msg => msg.conversationId === conversationId);
      messagesToDelete.forEach(msg => {
        const msgIndex = messages.findIndex(m => m.id === msg.id);
        if (msgIndex !== -1) {
          messages.splice(msgIndex, 1);
        }
      });
      
      return {
        success: true,
        data: deletedConversation,
        message: 'Conversation deleted successfully'
      };
    } catch (error) {
      console.error('Delete conversation error', error);
      throw error;
    }
  }

  // Messages - Only system messages
  static async getMessages(
    userId: string,
    conversationId: string,
    pagination: {
      page: number;
      limit: number;
      before?: string;
      after?: string;
    }
  ) {
    try {
      console.log('Fetching system messages', { userId, conversationId, pagination });
      
      // Verify user has access to conversation
      const conversation = conversations.find(conv => 
        conv.id === conversationId && 
        conv.participants.some(p => p.userId === userId)
      );
      
      if (!conversation) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Conversation not found'
          }
        };
      }
      
      // Get messages for conversation
      let conversationMessages = messages.filter(msg => msg.conversationId === conversationId);
      
      // Apply sorting (newest first)
      conversationMessages.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Apply pagination
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedMessages = conversationMessages.slice(startIndex, endIndex);
      
      // Update last read time for user
      const participantIndex = conversation.participants.findIndex(p => p.userId === userId);
      if (participantIndex !== -1) {
        conversation.participants[participantIndex].lastReadAt = new Date();
        conversation.unreadCount = 0;
      }
      
      return {
        success: true,
        data: paginatedMessages,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: conversationMessages.length,
          hasNext: endIndex < conversationMessages.length
        }
      };
    } catch (error) {
      console.error('Get system messages error', error);
      throw error;
    }
  }

  static async sendMessage(
    userId: string,
    conversationId: string,
    data: {
      content: string;
      type: 'system' | 'announcement' | 'broadcast';
      attachments?: Attachment[];
      replyTo?: string;
    }
  ) {
    try {
      console.log('Sending system message', { userId, conversationId, data });
      
      // Verify user has access to conversation and is admin
      const conversation = conversations.find(conv => 
        conv.id === conversationId && 
        conv.participants.some(p => p.userId === userId)
      );
      
      if (!conversation) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Conversation not found'
          }
        };
      }
      
      // Check if user is admin
      const participant = conversation.participants.find(p => p.userId === userId);
      if (!participant || participant.role !== 'admin') {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only admins can send system messages'
          }
        };
      }
      
      // Create new message
      const newMessage: Message = {
        id: Date.now().toString(),
        conversationId,
        senderId: userId,
        content: data.content,
        type: data.type,
        attachments: data.attachments,
        replyTo: data.replyTo,
        createdAt: new Date()
      };
      
      messages.push(newMessage);
      
      // Update conversation's last message and unread count
      conversation.lastMessage = newMessage;
      conversation.updatedAt = new Date();
      
      // Update unread count for system participants
      conversation.participants.forEach(participant => {
        if (participant.userId !== userId) {
          participant.lastReadAt = undefined; // Reset last read time
        }
      });
      
      // Increment unread count for system participants
      conversation.unreadCount = conversation.participants.filter(p => p.userId !== userId && p.role === 'system').length;
      
      return {
        success: true,
        data: newMessage
      };
    } catch (error) {
      console.error('Send system message error', error);
      throw error;
    }
  }

  static async updateMessage(userId: string, messageId: string, content: string) {
    try {
      console.log('Updating system message', { userId, messageId, content });
      
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      
      if (messageIndex === -1) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Message not found'
          }
        };
      }
      
      // Check if user is admin
      const message = messages[messageIndex];
      const conversation = conversations.find(conv => conv.id === message.conversationId);
      const participant = conversation?.participants.find(p => p.userId === userId);
      
      if (!participant || participant.role !== 'admin') {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only admins can edit system messages'
          }
        };
      }
      
      // Update message
      messages[messageIndex] = {
        ...messages[messageIndex],
        content,
        editedAt: new Date()
      };
      
      return {
        success: true,
        data: messages[messageIndex]
      };
    } catch (error) {
      console.error('Update system message error', error);
      throw error;
    }
  }

  static async deleteMessage(userId: string, messageId: string) {
    try {
      console.log('Deleting system message', { userId, messageId });
      
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      
      if (messageIndex === -1) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Message not found'
          }
        };
      }
      
      // Check if user is admin
      const message = messages[messageIndex];
      const conversation = conversations.find(conv => conv.id === message.conversationId);
      const participant = conversation?.participants.find(p => p.userId === userId);
      
      if (!participant || participant.role !== 'admin') {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only admins can delete system messages'
          }
        };
      }
      
      // "Delete" message by setting deletedAt (soft delete)
      messages[messageIndex] = {
        ...messages[messageIndex],
        deletedAt: new Date(),
        content: '[Message deleted]'
      };
      
      return {
        success: true,
        message: 'Message deleted successfully'
      };
    } catch (error) {
      console.error('Delete system message error', error);
      throw error;
    }
  }

  static async addReaction(userId: string, messageId: string, emoji: string) {
    try {
      console.log('Adding reaction to system message', { userId, messageId, emoji });
      
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      
      if (messageIndex === -1) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Message not found'
          }
        };
      }
      
      // Check if reaction already exists from this user
      const existingReactionIndex = messages[messageIndex].reactions?.findIndex(
        r => r.userId === userId && r.emoji === emoji
      );
      
      if (existingReactionIndex !== undefined && existingReactionIndex !== -1) {
        // Remove existing reaction (toggle off)
        messages[messageIndex].reactions?.splice(existingReactionIndex, 1);
      } else {
        // Add new reaction
        const newReaction: Reaction = {
          userId,
          emoji,
          createdAt: new Date()
        };
        
        if (!messages[messageIndex].reactions) {
          messages[messageIndex].reactions = [];
        }
        
        messages[messageIndex].reactions?.push(newReaction);
      }
      
      return {
        success: true,
        data: messages[messageIndex].reactions
      };
    } catch (error) {
      console.error('Add reaction error', error);
      throw error;
    }
  }

  // Administrative Messaging
  static async sendBroadcastMessage(
    adminUserId: string,
    data: {
      title: string;
      content: string;
      type: 'announcement' | 'alert' | 'update' | 'maintenance';
      priority: 'normal' | 'high' | 'urgent' | 'critical';
      recipients: {
        type: 'all' | 'specific' | 'role-based';
        userIds?: string[];
        roles?: string[];
      };
      scheduledAt?: Date;
      tags?: string[];
    }
  ) {
    try {
      console.log('Sending broadcast message', { adminUserId, data });
      
      // Create broadcast message
      const broadcastMessage: BroadcastMessage = {
        id: Date.now().toString(),
        title: data.title,
        content: data.content,
        type: data.type,
        priority: data.priority,
        recipients: data.recipients,
        scheduledAt: data.scheduledAt,
        sentAt: new Date(),
        isPublished: true,
        tags: data.tags,
        createdBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      broadcastMessages.push(broadcastMessage);
      
      return {
        success: true,
        data: broadcastMessage
      };
    } catch (error) {
      console.error('Send broadcast message error', error);
      throw error;
    }
  }

  static async createAnnouncement(
    adminUserId: string,
    data: {
      title: string;
      content: string;
      priority: 'normal' | 'high' | 'urgent' | 'critical';
      scheduledAt?: Date;
      tags?: string[];
    }
  ) {
    try {
      console.log('Creating announcement', { adminUserId, data });
      
      // Create broadcast message as announcement
      const announcement: BroadcastMessage = {
        id: Date.now().toString(),
        title: data.title,
        content: data.content,
        type: 'announcement',
        priority: data.priority,
        recipients: {
          type: 'all'
        },
        scheduledAt: data.scheduledAt,
        sentAt: new Date(),
        isPublished: true,
        tags: data.tags,
        createdBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      broadcastMessages.push(announcement);
      
      return {
        success: true,
        data: announcement
      };
    } catch (error) {
      console.error('Create announcement error', error);
      throw error;
    }
  }

  static async getAnnouncements(
    userId: string,
    pagination: {
      page: number;
      limit: number;
    }
  ) {
    try {
      console.log('Fetching announcements', { userId, pagination });
      
      // Filter announcements (all published announcements)
      const allAnnouncements = broadcastMessages.filter(msg => 
        msg.type === 'announcement' && msg.isPublished
      );
      
      // Apply sorting (newest first)
      allAnnouncements.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Apply pagination
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedAnnouncements = allAnnouncements.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: paginatedAnnouncements,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: allAnnouncements.length,
          hasNext: endIndex < allAnnouncements.length
        }
      };
    } catch (error) {
      console.error('Get announcements error', error);
      throw error;
    }
  }

  static async deleteAnnouncement(adminUserId: string, announcementId: string) {
    try {
      console.log('Deleting announcement', { adminUserId, announcementId });
      
      const announcementIndex = broadcastMessages.findIndex(msg => msg.id === announcementId);
      
      if (announcementIndex === -1) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Announcement not found'
          }
        };
      }
      
      // Check if user is creator or admin
      if (broadcastMessages[announcementIndex].createdBy !== adminUserId) {
        // In a real implementation, we would check if user has admin role
        // For now, we'll assume the check is done at the API level
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to delete announcement'
          }
        };
      }
      
      // Remove announcement
      const deletedAnnouncement = broadcastMessages.splice(announcementIndex, 1)[0];
      
      return {
        success: true,
        data: deletedAnnouncement,
        message: 'Announcement deleted successfully'
      };
    } catch (error) {
      console.error('Delete announcement error', error);
      throw error;
    }
  }
  
  // New method to get broadcast messages with filtering
  static async getBroadcastMessages(
    userId: string,
    filters?: {
      type?: 'announcement' | 'alert' | 'update' | 'maintenance';
      priority?: 'normal' | 'high' | 'urgent' | 'critical';
      tags?: string[];
    },
    pagination?: {
      page: number;
      limit: number;
    }
  ) {
    try {
      console.log('Fetching broadcast messages', { userId, filters, pagination });
      
      // Filter broadcast messages
      let filteredMessages = broadcastMessages.filter(msg => msg.isPublished);
      
      // Apply type filter
      if (filters?.type) {
        filteredMessages = filteredMessages.filter(msg => msg.type === filters.type);
      }
      
      // Apply priority filter
      if (filters?.priority) {
        filteredMessages = filteredMessages.filter(msg => msg.priority === filters.priority);
      }
      
      // Apply tags filter
      if (filters?.tags && filters.tags.length > 0) {
        filteredMessages = filteredMessages.filter(msg => 
          msg.tags && msg.tags.some(tag => filters.tags!.includes(tag))
        );
      }
      
      // Apply sorting (newest first)
      filteredMessages.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Apply pagination
      const page = pagination?.page || 1;
      const limit = Math.min(pagination?.limit || 20, 100);
      const total = filteredMessages.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginatedMessages = filteredMessages.slice(startIndex, startIndex + limit);
      
      return {
        success: true,
        data: paginatedMessages,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      console.error('Get broadcast messages error', error);
      throw error;
    }
  }
  
  // New method to get deployment-related broadcast messages
  static async getDeploymentBroadcasts(
    userId: string,
    filters?: {
      tags?: string[];
    },
    pagination?: {
      page: number;
      limit: number;
    }
  ) {
    try {
      console.log('Fetching deployment broadcasts', { userId, filters, pagination });
      
      // Filter broadcast messages for deployment-related tags
      let filteredMessages = broadcastMessages.filter(msg => 
        msg.isPublished && msg.tags && 
        (msg.tags.includes('PR') || msg.tags.includes('DEPLOYMENT') || msg.tags.includes('RELEASE'))
      );
      
      // Apply tags filter
      if (filters?.tags && filters.tags.length > 0) {
        filteredMessages = filteredMessages.filter(msg => 
          msg.tags && msg.tags.some(tag => filters.tags!.includes(tag))
        );
      }
      
      // Apply sorting (newest first)
      filteredMessages.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Apply pagination
      const page = pagination?.page || 1;
      const limit = Math.min(pagination?.limit || 20, 100);
      const total = filteredMessages.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginatedMessages = filteredMessages.slice(startIndex, startIndex + limit);
      
      return {
        success: true,
        data: paginatedMessages,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      console.error('Get deployment broadcasts error', error);
      throw error;
    }
  }

  // Real-time Features
  static async sendTypingIndicator(userId: string, conversationId: string) {
    try {
      console.log('Sending typing indicator', { userId, conversationId });
      
      // Verify user has access to conversation
      const conversation = conversations.find(conv => 
        conv.id === conversationId && 
        conv.participants.some(p => p.userId === userId)
      );
      
      if (!conversation) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Conversation not found'
          }
        };
      }
      
      // In a real implementation, this would broadcast to other participants via WebSocket
      // For now, we'll just log it
      
      return {
        success: true,
        message: 'Typing indicator sent'
      };
    } catch (error) {
      console.error('Send typing indicator error', error);
      throw error;
    }
  }

  static async markMessagesRead(userId: string, conversationId: string) {
    try {
      console.log('Marking messages as read', { userId, conversationId });
      
      // Verify user has access to conversation
      const conversation = conversations.find(conv => 
        conv.id === conversationId && 
        conv.participants.some(p => p.userId === userId)
      );
      
      if (!conversation) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Conversation not found'
          }
        };
      }
      
      // Update last read time for user
      const participantIndex = conversation.participants.findIndex(p => p.userId === userId);
      if (participantIndex !== -1) {
        conversation.participants[participantIndex].lastReadAt = new Date();
        conversation.unreadCount = 0;
      }
      
      return {
        success: true,
        message: 'Messages marked as read'
      };
    } catch (error) {
      console.error('Mark messages read error', error);
      throw error;
    }
  }
}

export default MessagingService;