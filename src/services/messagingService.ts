import AdminService from '@/services/AdminService';
import { databaseService } from '@/lib/databaseService';

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

// Custom error classes
class DatabaseError extends Error {
  constructor(message: string, public code: string = 'DATABASE_ERROR', public statusCode: number = 500) {
    super(message);
    this.name = 'DatabaseError';
  }
}

class ValidationError extends Error {
  constructor(message: string, public field: string, public code: string = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
  }
}

// Validation utilities
const validate = {
  string: (value: any, fieldName: string, options: { required?: boolean; minLength?: number; maxLength?: number } = {}): string => {
    const { required = true, minLength, maxLength } = options;
    
    if (required && (value === undefined || value === null || value === '')) {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }
    
    if (!required && (value === undefined || value === null || value === '')) {
      return value;
    }
    
    const strValue = String(value);
    
    if (minLength !== undefined && strValue.length < minLength) {
      throw new ValidationError(`${fieldName} must be at least ${minLength} characters long`, fieldName);
    }
    
    if (maxLength !== undefined && strValue.length > maxLength) {
      throw new ValidationError(`${fieldName} must be no more than ${maxLength} characters long`, fieldName);
    }
    
    return strValue;
  },
  
  id: (id: any, fieldName: string = 'ID'): string => {
    return validate.string(id, fieldName, { required: true, minLength: 1 });
  },
  
  array: <T>(value: any, fieldName: string, options: { required?: boolean; minLength?: number; maxLength?: number } = {}): T[] => {
    const { required = true, minLength, maxLength } = options;
    
    if (required && (!Array.isArray(value) || value.length === 0)) {
      throw new ValidationError(`${fieldName} is required and must be an array`, fieldName);
    }
    
    if (!required && (!Array.isArray(value) || value.length === 0)) {
      return [];
    }
    
    if (!Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an array`, fieldName);
    }
    
    if (minLength !== undefined && value.length < minLength) {
      throw new ValidationError(`${fieldName} must contain at least ${minLength} items`, fieldName);
    }
    
    if (maxLength !== undefined && value.length > maxLength) {
      throw new ValidationError(`${fieldName} must contain no more than ${maxLength} items`, fieldName);
    }
    
    return value;
  }
};

// Caching service
class CacheService {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  
  get(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }
  
  set(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

const cacheService = new CacheService();

// Role checking utilities
const hasAdminRole = async (userId: string): Promise<boolean> => {
  try {
    // Check if user has admin permissions
    return await AdminService.checkAdminPermission(userId);
  } catch (error) {
    logger.error('Error checking admin role', error);
    return false;
  }
};

// Logging utility
const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${message}`, meta || '');
  },
  error: (message: string, meta?: any) => {
    console.error(`[ERROR] ${message}`, meta || '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${message}`, meta || '');
  },
  debug: (message: string, meta?: any) => {
    console.debug(`[DEBUG] ${message}`, meta || '');
  }
};

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const API_V1_URL = `${API_BASE_URL}/v1`;

// Helper function to make authenticated API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  
  const response = await fetch(`${API_V1_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `API call failed: ${response.status} ${response.statusText}`;
    
    // Map HTTP status codes to specific error types
    switch (response.status) {
      case 400:
        throw new ValidationError(errorMessage, 'request');
      case 401:
        throw new DatabaseError('Unauthorized', 'UNAUTHORIZED', 401);
      case 403:
        throw new DatabaseError('Forbidden', 'FORBIDDEN', 403);
      case 404:
        throw new DatabaseError('Not found', 'NOT_FOUND', 404);
      default:
        throw new DatabaseError(errorMessage, 'API_ERROR', response.status);
    }
  }
  
  return await response.json();
};

export class MessagingService {
  // Add participant to conversation
  static async addParticipant(
    userId: string,
    conversationId: string,
    participantId: string
  ) {
    try {
      logger.info('Adding participant to conversation', { userId, conversationId, participantId });
      
      // Validate inputs
      validate.id(userId, 'User ID');
      validate.id(conversationId, 'Conversation ID');
      validate.id(participantId, 'Participant ID');
      
      // Make API call to add participant
      const response = await apiCall(`/messaging/conversations/${conversationId}/participants`, {
        method: 'POST',
        body: JSON.stringify({ participantId })
      });
      
      // Clear cache
      cacheService.delete(`conversation:${conversationId}`);
      
      logger.info('Participant added successfully', { conversationId, participantId });
      
      return response;
    } catch (error) {
      logger.error('Add participant error', { error });
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to add participant', 'ADD_PARTICIPANT_FAILED', 500);
    }
  }

  // Remove participant from conversation
  static async removeParticipant(
    userId: string,
    conversationId: string,
    participantId: string
  ) {
    try {
      logger.info('Removing participant from conversation', { userId, conversationId, participantId });
      
      // Validate inputs
      validate.id(userId, 'User ID');
      validate.id(conversationId, 'Conversation ID');
      validate.id(participantId, 'Participant ID');
      
      // Check if user has permission to remove participants
      const isAdmin = await hasAdminRole(userId);
      if (!isAdmin) {
        throw new DatabaseError('Only admins can remove participants from conversations', 'FORBIDDEN', 403);
      }
      
      // Make API call to remove participant
      const response = await apiCall(`/messaging/conversations/${conversationId}/participants/${participantId}`, {
        method: 'DELETE'
      });
      
      // Clear cache
      cacheService.delete(`conversation:${conversationId}`);
      
      logger.info('Participant removed successfully', { conversationId, participantId });
      
      return response;
    } catch (error) {
      logger.error('Remove participant error', { error });
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to remove participant', 'REMOVE_PARTICIPANT_FAILED', 500);
    }
  }

  // Update participant role
  static async updateParticipantRole(
    userId: string,
    conversationId: string,
    participantId: string,
    role: 'admin' | 'system'
  ) {
    try {
      logger.info('Updating participant role', { userId, conversationId, participantId, role });
      
      // Validate inputs
      validate.id(userId, 'User ID');
      validate.id(conversationId, 'Conversation ID');
      validate.id(participantId, 'Participant ID');
      
      // Check if user has permission to update participant roles
      const isAdmin = await hasAdminRole(userId);
      if (!isAdmin) {
        throw new DatabaseError('Only admins can update participant roles', 'FORBIDDEN', 403);
      }
      
      // Make API call to update participant role
      const response = await apiCall(`/messaging/conversations/${conversationId}/participants/${participantId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
      });
      
      // Clear cache
      cacheService.delete(`conversation:${conversationId}`);
      
      logger.info('Participant role updated successfully', { conversationId, participantId, role });
      
      return response;
    } catch (error) {
      logger.error('Update participant role error', { error });
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to update participant role', 'UPDATE_PARTICIPANT_ROLE_FAILED', 500);
    }
  }
  
  // Get user conversations
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
      logger.info('Fetching user conversations', { userId, filters, pagination });
      
      // Validate inputs
      validate.id(userId, 'User ID');
      
      // Check cache first
      const cacheKey = `conversations:${userId}:${JSON.stringify(filters)}:${JSON.stringify(pagination)}`;
      const cached = cacheService.get(cacheKey);
      if (cached) {
        logger.info('Returning cached conversations', { userId });
        return cached;
      }
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters?.type) queryParams.append('type', filters.type);
      queryParams.append('page', pagination.page.toString());
      queryParams.append('limit', Math.min(pagination.limit, 100).toString());
      
      // Make API call to fetch conversations
      const response = await apiCall(`/messaging/conversations?${queryParams.toString()}`);
      
      // Cache result
      cacheService.set(cacheKey, response, 300000); // 5 minutes
      
      logger.info('Conversations fetched successfully', { userId, count: response.data?.length });
      
      return response;
    } catch (error) {
      logger.error('Get user conversations error', { error });
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch conversations', 'GET_CONVERSATIONS_FAILED', 500);
    }
  }

  // Create conversation
  static async createConversation(
    userId: string,
    data: {
      name?: string;
      type: 'announcement' | 'broadcast';
      participantIds: string[];
    }
  ) {
    try {
      logger.info('Creating conversation', { userId, data });
      
      // Validate inputs
      validate.id(userId, 'User ID');
      validate.string(data.type, 'Type', { required: true });
      validate.array(data.participantIds, 'Participant IDs', { required: true, minLength: 1 });
      
      // Check if user has permission to create conversations
      const isAdmin = await hasAdminRole(userId);
      if (!isAdmin) {
        throw new DatabaseError('Only admins can create conversations', 'FORBIDDEN', 403);
      }
      
      // Make API call to create conversation
      const response = await apiCall('/messaging/conversations', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      // Clear relevant cache
      cacheService.clear();
      
      logger.info('Conversation created successfully', { conversationId: response.data?.id });
      
      return response;
    } catch (error) {
      logger.error('Create conversation error', { error });
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to create conversation', 'CREATE_CONVERSATION_FAILED', 500);
    }
  }

  // Get conversation details
  static async getConversationDetails(userId: string, conversationId: string) {
    try {
      logger.info('Fetching conversation details', { userId, conversationId });
      
      // Validate inputs
      validate.id(userId, 'User ID');
      validate.id(conversationId, 'Conversation ID');
      
      // Check cache first
      const cacheKey = `conversation:${conversationId}`;
      const cached = cacheService.get(cacheKey);
      if (cached) {
        logger.info('Returning cached conversation details', { conversationId });
        return cached;
      }
      
      // Make API call to fetch conversation details
      const response = await apiCall(`/messaging/conversations/${conversationId}`);
      
      // Cache result
      cacheService.set(cacheKey, response, 300000); // 5 minutes
      
      logger.info('Conversation details fetched successfully', { conversationId });
      
      return response;
    } catch (error) {
      logger.error('Get conversation details error', { error });
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch conversation details', 'GET_CONVERSATION_FAILED', 500);
    }
  }

  // Update conversation
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
      logger.info('Updating conversation', { userId, conversationId, updates });
      
      // Validate inputs
      validate.id(userId, 'User ID');
      validate.id(conversationId, 'Conversation ID');
      
      // Check if user has permission to update conversation
      const isAdmin = await hasAdminRole(userId);
      if (!isAdmin) {
        throw new DatabaseError('Only admins can update conversations', 'FORBIDDEN', 403);
      }
      
      // Make API call to update conversation
      const response = await apiCall(`/messaging/conversations/${conversationId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      // Clear cache
      cacheService.delete(`conversation:${conversationId}`);
      cacheService.clear(); // Clear all conversation-related cache
      
      logger.info('Conversation updated successfully', { conversationId });
      
      return response;
    } catch (error) {
      logger.error('Update conversation error', { error });
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to update conversation', 'UPDATE_CONVERSATION_FAILED', 500);
    }
  }

  // Delete conversation
  static async deleteConversation(userId: string, conversationId: string) {
    try {
      logger.info('Deleting conversation', { userId, conversationId });
      
      // Validate inputs
      validate.id(userId, 'User ID');
      validate.id(conversationId, 'Conversation ID');
      
      // Check if user has permission to delete conversation
      const isAdmin = await hasAdminRole(userId);
      if (!isAdmin) {
        throw new DatabaseError('Only admins can delete conversations', 'FORBIDDEN', 403);
      }
      
      // Make API call to delete conversation
      const response = await apiCall(`/messaging/conversations/${conversationId}`, {
        method: 'DELETE'
      });
      
      // Clear cache
      cacheService.delete(`conversation:${conversationId}`);
      cacheService.clear(); // Clear all conversation-related cache
      
      logger.info('Conversation deleted successfully', { conversationId });
      
      return response;
    } catch (error) {
      logger.error('Delete conversation error', { error });
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete conversation', 'DELETE_CONVERSATION_FAILED', 500);
    }
  }

  // Get messages
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
      logger.info('Fetching messages', { userId, conversationId, pagination });
      
      // Validate inputs
      validate.id(userId, 'User ID');
      validate.id(conversationId, 'Conversation ID');
      
      // Check cache first
      const cacheKey = `messages:${conversationId}:${JSON.stringify(pagination)}`;
      const cached = cacheService.get(cacheKey);
      if (cached) {
        logger.info('Returning cached messages', { conversationId });
        return cached;
      }
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', pagination.page.toString());
      queryParams.append('limit', Math.min(pagination.limit, 100).toString());
      if (pagination.before) queryParams.append('before', pagination.before);
      if (pagination.after) queryParams.append('after', pagination.after);
      
      // Make API call to fetch messages
      const response = await apiCall(`/messaging/conversations/${conversationId}/messages?${queryParams.toString()}`);
      
      // Cache result
      cacheService.set(cacheKey, response, 180000); // 3 minutes
      
      logger.info('Messages fetched successfully', { conversationId, count: response.data?.length });
      
      return response;
    } catch (error) {
      logger.error('Get messages error', { error });
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch messages', 'GET_MESSAGES_FAILED', 500);
    }
  }

  // Send message
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
      logger.info('Sending message', { userId, conversationId, data });
      
      // Validate inputs
      validate.id(userId, 'User ID');
      validate.id(conversationId, 'Conversation ID');
      validate.string(data.content, 'Content', { required: true, minLength: 1 });
      validate.string(data.type, 'Type', { required: true });
      
      // Check if user has permission to send message
      if (data.type === 'system') {
        const isAdmin = await hasAdminRole(userId);
        if (!isAdmin) {
          throw new DatabaseError('Only admins can send system messages', 'FORBIDDEN', 403);
        }
      }
      
      // Make API call to send message
      const response = await apiCall(`/messaging/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      // Clear cache
      cacheService.delete(`messages:${conversationId}`);
      
      logger.info('Message sent successfully', { messageId: response.data?.id });
      
      return response;
    } catch (error) {
      logger.error('Send message error', { error });
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to send message', 'SEND_MESSAGE_FAILED', 500);
    }
  }

  // Update message
  static async updateMessage(userId: string, messageId: string, content: string) {
    try {
      logger.info('Updating message', { userId, messageId, content });
      
      // Validate inputs
      validate.id(userId, 'User ID');
      validate.id(messageId, 'Message ID');
      validate.string(content, 'Content', { required: true, minLength: 1 });
      
      // Make API call to update message
      const response = await apiCall(`/messaging/messages/${messageId}`, {
        method: 'PUT',
        body: JSON.stringify({ content })
      });
      
      // Clear cache
      cacheService.delete(`messages:conv1`);
      
      logger.info('Message updated successfully', { messageId });
      
      return response;
    } catch (error) {
      logger.error('Update message error', { error });
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to update message', 'UPDATE_MESSAGE_FAILED', 500);
    }
  }

  // Delete message
  static async deleteMessage(userId: string, messageId: string) {
    try {
      logger.info('Deleting message', { userId, messageId });
      
      // Validate inputs
      validate.id(userId, 'User ID');
      validate.id(messageId, 'Message ID');
      
      // Check if user has permission to delete message
      const isAdmin = await hasAdminRole(userId);
      if (!isAdmin) {
        throw new DatabaseError('Only admins can delete messages', 'FORBIDDEN', 403);
      }
      
      // Make API call to delete message
      const response = await apiCall(`/messaging/messages/${messageId}`, {
        method: 'DELETE'
      });
      
      // Clear cache
      cacheService.delete(`messages:conv1`);
      
      logger.info('Message deleted successfully', { messageId });
      
      return response;
    } catch (error) {
      logger.error('Delete message error', { error });
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete message', 'DELETE_MESSAGE_FAILED', 500);
    }
  }

  // Add reaction to message
  static async addReaction(userId: string, messageId: string, emoji: string) {
    try {
      logger.info('Adding reaction to message', { userId, messageId, emoji });
      
      // Validate inputs
      validate.id(userId, 'User ID');
      validate.id(messageId, 'Message ID');
      validate.string(emoji, 'Emoji', { required: true, minLength: 1 });
      
      // Make API call to add reaction
      const response = await apiCall(`/messaging/messages/${messageId}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji })
      });
      
      // Clear cache
      cacheService.delete(`messages:conv1`);
      
      logger.info('Reaction added successfully', { messageId, emoji });
      
      return response;
    } catch (error) {
      logger.error('Add reaction error', { error });
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to add reaction', 'ADD_REACTION_FAILED', 500);
    }
  }

  // Create system announcement
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
      logger.info('Creating system announcement', { adminUserId, data });
      
      // Validate inputs
      validate.id(adminUserId, 'Admin User ID');
      validate.string(data.title, 'Title', { required: true, minLength: 1, maxLength: 200 });
      validate.string(data.content, 'Content', { required: true, minLength: 1 });
      validate.string(data.priority, 'Priority', { required: true });
      
      // Check if user has admin permissions
      const isAdmin = await hasAdminRole(adminUserId);
      if (!isAdmin) {
        throw new DatabaseError('Only admins can create announcements', 'FORBIDDEN', 403);
      }
      
      // Make API call to create announcement
      const response = await apiCall('/admin/messages/announcement', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      logger.info('System announcement created successfully', { announcementId: response.data?.id });
      
      return response;
    } catch (error) {
      logger.error('Create announcement error', { error });
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to create announcement', 'CREATE_ANNOUNCEMENT_FAILED', 500);
    }
  }

  // Delete system announcement
  static async deleteAnnouncement(adminUserId: string, announcementId: string) {
    try {
      logger.info('Deleting system announcement', { adminUserId, announcementId });
      
      // Validate inputs
      validate.id(adminUserId, 'Admin User ID');
      validate.id(announcementId, 'Announcement ID');
      
      // Check if user has admin permissions
      const isAdmin = await hasAdminRole(adminUserId);
      if (!isAdmin) {
        throw new DatabaseError('Only admins can delete announcements', 'FORBIDDEN', 403);
      }
      
      // Make API call to delete announcement
      const response = await apiCall(`/admin/messages/announcements/${announcementId}`, {
        method: 'DELETE'
      });
      
      logger.info('System announcement deleted successfully', { announcementId });
      
      return response;
    } catch (error) {
      logger.error('Delete announcement error', { error });
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete announcement', 'DELETE_ANNOUNCEMENT_FAILED', 500);
    }
  }

  // Get system announcements
  static async getAnnouncements(
    userId: string,
    pagination: {
      page: number;
      limit: number;
    }
  ) {
    try {
      logger.info('Fetching system announcements', { userId, pagination });
      
      // Validate inputs
      validate.id(userId, 'User ID');
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', pagination.page.toString());
      queryParams.append('limit', Math.min(pagination.limit, 100).toString());
      
      // Make API call to fetch announcements
      const response = await apiCall(`/admin/messages/announcements?${queryParams.toString()}`);
      
      logger.info('System announcements fetched successfully', { count: response.data?.length });
      
      return response;
    } catch (error) {
      logger.error('Get announcements error', { error });
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch announcements', 'GET_ANNOUNCEMENTS_FAILED', 500);
    }
  }

  // Send broadcast message
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
      logger.info('Sending broadcast message', { adminUserId, data });
      
      // Validate inputs
      validate.id(adminUserId, 'Admin User ID');
      validate.string(data.title, 'Title', { required: true, minLength: 1, maxLength: 200 });
      validate.string(data.content, 'Content', { required: true, minLength: 1 });
      validate.string(data.type, 'Type', { required: true });
      validate.string(data.priority, 'Priority', { required: true });
      
      // Check if user has admin permissions
      const isAdmin = await hasAdminRole(adminUserId);
      if (!isAdmin) {
        throw new DatabaseError('Only admins can send broadcast messages', 'FORBIDDEN', 403);
      }
      
      // Make API call to send broadcast message
      const response = await apiCall('/admin/messages/broadcast', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      logger.info('Broadcast message sent successfully', { broadcastId: response.data?.id });
      
      return response;
    } catch (error) {
      logger.error('Send broadcast message error', { error });
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to send broadcast message', 'SEND_BROADCAST_FAILED', 500);
    }
  }

  // Get broadcast messages
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
      logger.info('Fetching broadcast messages', { userId, filters, pagination });
      
      // Validate inputs
      validate.id(userId, 'User ID');
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters?.type) queryParams.append('type', filters.type);
      if (filters?.priority) queryParams.append('priority', filters.priority);
      if (filters?.tags) queryParams.append('tags', filters.tags.join(','));
      if (pagination?.page) queryParams.append('page', pagination.page.toString());
      if (pagination?.limit) queryParams.append('limit', Math.min(pagination.limit || 20, 100).toString());
      
      // Make API call to fetch broadcast messages
      const response = await apiCall(`/admin/messages/broadcasts?${queryParams.toString()}`);
      
      // Cache result
      const cacheKey = `broadcasts:${userId}:${JSON.stringify(filters)}:${JSON.stringify(pagination)}`;
      cacheService.set(cacheKey, response, 180000); // 3 minutes
      
      logger.info('Broadcast messages fetched successfully', { count: response.data?.length });
      
      return response;
    } catch (error) {
      logger.error('Get broadcast messages error', { error });
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch broadcast messages', 'GET_BROADCASTS_FAILED', 500);
    }
  }
  
  // Get deployment-related broadcast messages
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
      logger.info('Fetching deployment broadcasts', { userId, filters, pagination });
      
      // Validate inputs
      validate.id(userId, 'User ID');
      
      // Set default filters for deployment broadcasts
      const deploymentFilters = {
        tags: ['deployment', 'maintenance', ...(filters?.tags || [])]
      };
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (deploymentFilters.tags) queryParams.append('tags', deploymentFilters.tags.join(','));
      if (pagination?.page) queryParams.append('page', pagination.page.toString());
      if (pagination?.limit) queryParams.append('limit', Math.min(pagination.limit || 20, 100).toString());
      
      // Make API call to fetch deployment broadcasts
      const response = await apiCall(`/admin/messages/deployment-broadcasts?${queryParams.toString()}`);
      
      // Cache result
      const cacheKey = `deployment_broadcasts:${userId}:${JSON.stringify(deploymentFilters)}:${JSON.stringify(pagination)}`;
      cacheService.set(cacheKey, response, 180000); // 3 minutes
      
      logger.info('Deployment broadcasts fetched successfully', { count: response.data?.length });
      
      return response;
    } catch (error) {
      logger.error('Get deployment broadcasts error', { error });
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch deployment broadcasts', 'GET_DEPLOYMENT_BROADCASTS_FAILED', 500);
    }
  }

  // Send typing indicator
  static async sendTypingIndicator(userId: string, conversationId: string) {
    try {
      logger.info('Sending typing indicator', { userId, conversationId });
      
      // Validate inputs
      validate.id(userId, 'User ID');
      validate.id(conversationId, 'Conversation ID');
      
      // Make API call to send typing indicator
      const response = await apiCall('/messages/typing', {
        method: 'POST',
        body: JSON.stringify({ conversationId })
      });
      
      logger.info('Typing indicator sent', { userId, conversationId });
      
      return response;
    } catch (error) {
      logger.error('Send typing indicator error', { error });
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to send typing indicator', 'SEND_TYPING_INDICATOR_FAILED', 500);
    }
  }

  // Mark messages as read
  static async markMessagesRead(userId: string, conversationId: string) {
    try {
      logger.info('Marking messages as read', { userId, conversationId });
      
      // Validate inputs
      validate.id(userId, 'User ID');
      validate.id(conversationId, 'Conversation ID');
      
      // Make API call to mark messages as read
      const response = await apiCall(`/messaging/conversations/${conversationId}/read`, {
        method: 'POST'
      });
      
      // Clear cache
      cacheService.delete(`conversation:${conversationId}`);
      
      logger.info('Messages marked as read', { userId, conversationId });
      
      return response;
    } catch (error) {
      logger.error('Mark messages read error', { error });
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Failed to mark messages as read', 'MARK_MESSAGES_READ_FAILED', 500);
    }
  }
}

export default MessagingService;