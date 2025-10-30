import {
  Notification,
  NotificationPreferences,
  NotificationTemplate,
  NotificationHistory,
  Recipients,
  SendNotificationPayload,
  SendTemplatePayload,
  SendLoggingNotificationPayload,
  SendPrMergedPayload,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  EntityType,
  NotificationSource,
  DeliveryMethod,
  DeliveryStatus
} from '@/types/notifications';
import { API_BASE_URL } from '@/lib/apiConfig';

// Simple in-memory cache
const cache: Record<string, { data: any; timestamp: number; ttl: number }> = {};

// Cache TTL in milliseconds (5 minutes default)
const DEFAULT_TTL = 5 * 60 * 1000;

// Generic request function with authentication
const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  try {
    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} - ${response.statusText} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Cache helper functions
const getFromCache = (key: string) => {
  const cached = cache[key];
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  // Remove expired cache entry
  delete cache[key];
  return null;
};

const setInCache = (key: string, data: any, ttl: number = DEFAULT_TTL) => {
  cache[key] = {
    data,
    timestamp: Date.now(),
    ttl
  };
};

const clearCache = (key: string) => {
  delete cache[key];
};

// Notification Service class
export class NotificationService {
  static async createNotification(notificationData: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { 
    status?: NotificationStatus;
    createdAt?: string;
    updatedAt?: string;
  }): Promise<{ data: Notification }> {
    try {
      // Clear relevant cache entries
      clearCache('notifications');
      
      // In a real implementation, this would be an API call to create a notification
      const response = await fetchAPI('/notifications', {
        method: 'POST',
        body: JSON.stringify({
          ...notificationData,
          status: notificationData.status || 'UNREAD'
        })
      });
      
      return response;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
  
  static async markAsRead(id: string, userId: string): Promise<boolean> {
    try {
      // Clear relevant cache entries
      clearCache('notifications');
      
      const response = await fetchAPI(`/notifications/${id}/read`, {
        method: 'PUT',
        body: JSON.stringify({ userId })
      });
      
      return response.success;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }
  
  static async markAllAsRead(userId: string): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      // Clear relevant cache entries
      clearCache('notifications');
      
      const response = await fetchAPI(`/notifications/read-all`, {
        method: 'POST',
        body: JSON.stringify({ userId })
      });
      
      return response;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to mark notifications as read' 
      };
    }
  }
  
  static async clearNotifications(userId: string): Promise<{ success: boolean; count: number }> {
    try {
      // Clear relevant cache entries
      clearCache('notifications');
      
      const response = await fetchAPI(`/notifications/clear`, {
        method: 'POST',
        body: JSON.stringify({ userId })
      });
      
      return response;
    } catch (error) {
      console.error('Error clearing notifications:', error);
      return { 
        success: false, 
        count: 0 
      };
    }
  }
  
  // Get user notifications with filtering and pagination
  static async getUserNotifications(
    userId: string,
    filters?: {
      status?: NotificationStatus;
      type?: NotificationType;
      priority?: NotificationPriority;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
    pagination?: {
      page?: number;
      limit?: number;
    }
  ): Promise<{
    data: Notification[]; 
    notifications: Notification[]; 
    total: number; 
    totalPages: number;
  }> {
    try {
      // Build cache key
      const cacheKey = `notifications_${userId}_${JSON.stringify(filters)}_${JSON.stringify(pagination)}`;
      
      // Check cache first
      const cached = getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('userId', userId);
      
      if (filters?.status) params.append('status', filters.status);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (pagination?.page) params.append('page', pagination.page.toString());
      if (pagination?.limit) params.append('limit', Math.min(pagination.limit, 100).toString());
      
      const response = await fetchAPI(`/notifications?${params.toString()}`);
      
      // Cache the result
      setInCache(cacheKey, response);
      
      return response;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }
  
  // Update notification status
  static async updateNotificationStatus(
    userId: string,
    notificationId: string,
    status: NotificationStatus
  ): Promise<Notification | null> {
    try {
      // Clear relevant cache entries
      clearCache('notifications');
      
      const response = await fetchAPI(`/notifications/${notificationId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ userId, status })
      });
      
      return response.data || null;
    } catch (error) {
      console.error('Error updating notification status:', error);
      return null;
    }
  }
  
  // Delete notification
  static async deleteNotification(userId: string, notificationId: string): Promise<boolean> {
    try {
      // Clear relevant cache entries
      clearCache('notifications');
      
      const response = await fetchAPI(`/notifications/${notificationId}`, {
        method: 'DELETE',
        body: JSON.stringify({ userId })
      });
      
      return response.success;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }
  
  // Batch update notifications
  static async batchUpdateNotifications(
    userId: string,
    notificationIds: string[],
    status: NotificationStatus
  ): Promise<number> {
    try {
      // Clear relevant cache entries
      clearCache('notifications');
      
      const response = await fetchAPI(`/notifications/batch-update`, {
        method: 'POST',
        body: JSON.stringify({ userId, notificationIds, status })
      });
      
      return response.updatedCount || 0;
    } catch (error) {
      console.error('Error batch updating notifications:', error);
      return 0;
    }
  }
  
  // Get user notification preferences
  static async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // Check cache first
      const cacheKey = `preferences_${userId}`;
      const cached = getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
      
      const response = await fetchAPI(`/notification-preferences`);
      
      // Cache the result
      setInCache(cacheKey, response.data, 10 * 60 * 1000); // 10 minutes cache for preferences
      
      return response.data;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      // Return default preferences if none exist
      const defaultPreferences: NotificationPreferences = {
        id: `pref-${userId}`,
        userId,
        deliveryMethods: {
          push: true,
          email: true,
          sms: false,
          inApp: true
        },
        categories: {
          matchUpdates: true,
          scoreAlerts: true,
          favoriteTeamNews: true,
          competitionNews: true,
          systemAlerts: true,
          reminders: true,
          achievements: true,
          adminNotices: true,
          logAlerts: true
        },
        followedTeams: [],
        followedPlayers: [],
        followedCompetitions: [],
        digestFrequency: 'INSTANT',
        devices: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        data: undefined
      };
      
      return defaultPreferences;
    }
  }
  
  // Update user notification preferences
  static async updateUserPreferences(
    userId: string,
    updatedPreferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      // Clear relevant cache entries
      clearCache(`preferences_${userId}`);
      
      const response = await fetchAPI(`/notification-preferences`, {
        method: 'PUT',
        body: JSON.stringify(updatedPreferences)
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }
  
  // Admin: Get all notification templates
  static async getAllTemplates(
    filters?: {
      activeOnly?: boolean;
    },
    pagination?: {
      page?: number;
      limit?: number;
    }
  ): Promise<{ templates: NotificationTemplate[]; total: number; totalPages: number }> {
    try {
      // Build cache key
      const cacheKey = `templates_${JSON.stringify(filters)}_${JSON.stringify(pagination)}`;
      
      // Check cache first
      const cached = getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters?.activeOnly) params.append('activeOnly', filters.activeOnly.toString());
      if (pagination?.page) params.append('page', pagination.page.toString());
      if (pagination?.limit) params.append('limit', Math.min(pagination.limit, 100).toString());
      
      const response = await fetchAPI(`/notification-templates?${params.toString()}`);
      
      // Cache the result
      setInCache(cacheKey, response);
      
      return response;
    } catch (error) {
      console.error('Error fetching notification templates:', error);
      throw error;
    }
  }
  
  // Admin: Get specific notification template
  static async getTemplate(templateId: string): Promise<NotificationTemplate | null> {
    try {
      // Check cache first
      const cacheKey = `template_${templateId}`;
      const cached = getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
      
      const response = await fetchAPI(`/notification-templates/${templateId}`);
      
      // Cache the result
      setInCache(cacheKey, response.data);
      
      return response.data || null;
    } catch (error) {
      console.error('Error fetching notification template:', error);
      return null;
    }
  }
  
  // Admin: Create notification template
  static async createTemplate(templateData: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplate> {
    try {
      // Clear relevant cache entries
      clearCache('templates');
      
      const response = await fetchAPI(`/notification-templates`, {
        method: 'POST',
        body: JSON.stringify(templateData)
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating notification template:', error);
      throw error;
    }
  }
  
  // Admin: Update notification template
  static async updateTemplate(templateId: string, updatedData: Partial<NotificationTemplate>): Promise<NotificationTemplate | null> {
    try {
      // Clear relevant cache entries
      clearCache('templates');
      clearCache(`template_${templateId}`);
      
      const response = await fetchAPI(`/notification-templates/${templateId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedData)
      });
      
      return response.data || null;
    } catch (error) {
      console.error('Error updating notification template:', error);
      return null;
    }
  }
  
  // Admin: Delete notification template
  static async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      // Clear relevant cache entries
      clearCache('templates');
      clearCache(`template_${templateId}`);
      
      const response = await fetchAPI(`/notification-templates/${templateId}`, {
        method: 'DELETE'
      });
      
      return response.success;
    } catch (error) {
      console.error('Error deleting notification template:', error);
      return false;
    }
  }
  
  // Admin: Send notification to users
  static async sendNotification(
    senderRole: string,
    recipients: Recipients,
    notificationData: Omit<Notification, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<{ notification: Notification; sentTo: number }> {
    try {
      const payload: SendNotificationPayload = {
        recipients,
        notification: notificationData
      };
      
      const response = await fetchAPI(`/admin/notifications/send`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      return response;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }
  
  // Admin: Send notification using template
  static async sendTemplateNotification(
    senderRole: string,
    templateId: string,
    recipients: Omit<Recipients, 'userIds' | 'teamId' | 'competitionId'> & Partial<Pick<Recipients, 'userIds' | 'teamId' | 'competitionId'>>,
    variables: Record<string, any>,
    scheduledAt?: string,
    expiresAt?: string
  ): Promise<{ notifications: Notification[]; sentTo: number }> {
    try {
      const payload: SendTemplatePayload = {
        templateId,
        recipients,
        variables,
        scheduledAt,
        expiresAt
      };
      
      const response = await fetchAPI(`/admin/notifications/send-template`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      return response;
    } catch (error) {
      console.error('Error sending template notification:', error);
      throw error;
    }
  }
  
  // Admin: Get notification history
  static async getNotificationHistory(
    filters?: {
      status?: DeliveryStatus;
      deliveryMethod?: DeliveryMethod;
      startDate?: string;
      endDate?: string;
    },
    pagination?: {
      page?: number;
      limit?: number;
    }
  ): Promise<{ history: NotificationHistory[]; total: number; totalPages: number }> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters?.status) params.append('status', filters.status);
      if (filters?.deliveryMethod) params.append('deliveryMethod', filters.deliveryMethod);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (pagination?.page) params.append('page', pagination.page.toString());
      if (pagination?.limit) params.append('limit', Math.min(pagination.limit, 100).toString());
      
      const response = await fetchAPI(`/admin/notifications/history?${params.toString()}`);
      
      return response;
    } catch (error) {
      console.error('Error fetching notification history:', error);
      throw error;
    }
  }
  
  // Logger: Send system logging notifications
  static async sendLoggingNotification(
    recipients: {
      type: 'ADMINS' | 'LOGGERS' | 'SPECIFIC';
      userIds?: string[];
    },
    notificationData: Omit<Notification, 'id' | 'userId' | 'status' | 'type' | 'source' | 'createdAt' | 'updatedAt'>
  ): Promise<{ notification: Notification; sentTo: number }> {
    try {
      const payload: SendLoggingNotificationPayload = {
        recipients,
        notification: notificationData
      };
      
      const response = await fetchAPI(`/logger/notifications/send`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      return response;
    } catch (error) {
      console.error('Error sending logging notification:', error);
      throw error;
    }
  }
  
  // Logger: Send PR merged notification
  static async sendPrMergedNotification(
    recipients: {
      type: 'ADMINS' | 'LOGGERS' | 'SPECIFIC';
      userIds?: string[];
    },
    prData: {
      prNumber: string;
      prTitle: string;
      author: string;
      repository: string;
      branch: string;
      mergedBy: string;
      changes: {
        filesChanged: number;
        linesAdded: number;
        linesDeleted: number;
      };
    }
  ): Promise<{ notification: Notification; sentTo: number }> {
    try {
      const payload: SendPrMergedPayload = {
        ...prData,
        recipients
      };
      
      const response = await fetchAPI(`/logger/notifications/send-pr-merged`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      return response;
    } catch (error) {
      console.error('Error sending PR merged notification:', error);
      throw error;
    }
  }
  
  // Get system logging notifications (new method for retrieving LOG_ALERT notifications)
  static async getSystemLoggingNotifications(
    userId: string,
    filters?: {
      priority?: NotificationPriority;
      tags?: string[];
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
    pagination?: {
      page?: number;
      limit?: number;
    }
  ): Promise<{ notifications: Notification[]; total: number; totalPages: number }> {
    try {
      // Build cache key
      const cacheKey = `logging_notifications_${userId}_${JSON.stringify(filters)}_${JSON.stringify(pagination)}`;
      
      // Check cache first
      const cached = getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('userId', userId);
      params.append('type', 'LOG_ALERT');
      
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.tags && filters.tags.length > 0) {
        params.append('tags', filters.tags.join(','));
      }
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (pagination?.page) params.append('page', pagination.page.toString());
      if (pagination?.limit) params.append('limit', Math.min(pagination.limit, 100).toString());
      
      const response = await fetchAPI(`/notifications?${params.toString()}`);
      
      // Cache the result
      setInCache(cacheKey, response);
      
      return response;
    } catch (error) {
      console.error('Error fetching system logging notifications:', error);
      throw error;
    }
  }
  
  // Get deployment tracking notifications (new method for retrieving deployment-related notifications)
  static async getDeploymentTrackingNotifications(
    userId: string,
    filters?: {
      status?: NotificationStatus;
      tags?: string[];
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
    pagination?: {
      page?: number;
      limit?: number;
    }
  ): Promise<{ notifications: Notification[]; total: number; totalPages: number }> {
    try {
      // Build cache key
      const cacheKey = `deployment_notifications_${userId}_${JSON.stringify(filters)}_${JSON.stringify(pagination)}`;
      
      // Check cache first
      const cached = getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('userId', userId);
      params.append('tags', 'PR,DEPLOYMENT,RELEASE');
      
      if (filters?.status) params.append('status', filters.status);
      if (filters?.tags && filters.tags.length > 0) {
        params.append('tags', [...filters.tags, 'PR', 'DEPLOYMENT', 'RELEASE'].join(','));
      }
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (pagination?.page) params.append('page', pagination.page.toString());
      if (pagination?.limit) params.append('limit', Math.min(pagination.limit, 100).toString());
      
      const response = await fetchAPI(`/notifications?${params.toString()}`);
      
      // Cache the result
      setInCache(cacheKey, response);
      
      return response;
    } catch (error) {
      console.error('Error fetching deployment tracking notifications:', error);
      throw error;
    }
  }
  
  // Clear all cache entries
  static clearAllCache(): void {
    Object.keys(cache).forEach(key => delete cache[key]);
  }
}
