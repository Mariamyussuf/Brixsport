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

// In-memory storage for notifications (in a real app, this would be a database)
let notifications: Notification[] = [];
let preferences: NotificationPreferences[] = [];
let templates: NotificationTemplate[] = [];
let notificationHistory: NotificationHistory[] = [];

// Notification Service class
export class NotificationService {
  static async createNotification(notificationData: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { 
    status?: NotificationStatus;
    createdAt?: string;
    updatedAt?: string;
  }): Promise<{ data: Notification }> {
    const now = new Date().toISOString();
    const status = notificationData.status || 'UNREAD';
    
    // Extract metadata from the root level if needed
    const metadata = {
      ...(notificationData.metadata || {}),
      ...(notificationData as any).metadata // Handle any additional metadata
    };

    // Create the notification with proper typing
    const newNotification: Notification = {
      ...notificationData,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: status,
      createdAt: notificationData.createdAt || now,
      updatedAt: notificationData.updatedAt || now,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    };

    // In a real implementation, this would be an API call
    // For now, we'll just add it to our in-memory array
    notifications.push(newNotification);

    return { data: newNotification };
  }
  static async markAsRead(id: string, userId: string): Promise<boolean> {
    try {
      const notificationIndex = notifications.findIndex(n => n.id === id && n.userId === userId);
      
      if (notificationIndex === -1) {
        return false;
      }
      
      notifications[notificationIndex] = {
        ...notifications[notificationIndex],
        status: 'READ',
        readAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }
  static async markAllAsRead(userId: string): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      // In a real implementation, this would be an API call to the backend
      const unreadNotifications = notifications.filter(n => n.userId === userId && n.status === 'UNREAD');
      
      // Update all unread notifications to READ
      notifications = notifications.map(n => 
        n.userId === userId && n.status === 'UNREAD'
          ? { ...n, status: 'READ', updatedAt: new Date().toISOString() }
          : n
      );
      
      return { 
        success: true, 
        count: unreadNotifications.length 
      };
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
      const initialCount = notifications.length;
      const userNotificationIds = notifications
        .filter(n => n.userId === userId)
        .map(n => n.id);
      
      // Remove all notifications for the user
      notifications = notifications.filter(n => n.userId !== userId);
      
      return { 
        success: true, 
        count: initialCount - notifications.length 
      };
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
    // Filter notifications for the user
    let userNotifications = notifications.filter(n => n.userId === userId);
    
    // Apply filters
    if (filters?.status) {
      userNotifications = userNotifications.filter(n => n.status === filters.status);
    }
    
    if (filters?.type) {
      userNotifications = userNotifications.filter(n => n.type === filters.type);
    }
    
    if (filters?.priority) {
      userNotifications = userNotifications.filter(n => n.priority === filters.priority);
    }
    
    // Apply sorting
    if (filters?.sortBy) {
      const sortBy = filters.sortBy as keyof Notification;
      const sortOrder = filters.sortOrder || 'DESC';
      
      userNotifications.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        // Handle undefined values
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return 1;
        if (bValue === undefined) return -1;
        
        // Compare values
        if (sortOrder === 'ASC') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }
    
    // Apply pagination
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 20, 100);
    const total = userNotifications.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedNotifications = userNotifications.slice(startIndex, startIndex + limit);
    
    return {
      data: paginatedNotifications,
      notifications: paginatedNotifications,
      total,
      totalPages
    };
  }
  // Update notification status
  static async updateNotificationStatus(
    userId: string,
    notificationId: string,
    status: NotificationStatus
  ): Promise<Notification | null> {
    const notificationIndex = notifications.findIndex(n => n.id === notificationId && n.userId === userId);
    
    if (notificationIndex === -1) {
      return null;
    }
    
    const readAt = status === 'READ' ? new Date().toISOString() : notifications[notificationIndex].readAt;
    
    notifications[notificationIndex] = {
      ...notifications[notificationIndex],
      status,
      readAt,
      updatedAt: new Date().toISOString()
    };
    
    return notifications[notificationIndex];
  }
  
  // Delete notification
  static async deleteNotification(userId: string, notificationId: string): Promise<boolean> {
    const notificationIndex = notifications.findIndex(n => n.id === notificationId && n.userId === userId);
    
    if (notificationIndex === -1) {
      return false;
    }
    
    notifications.splice(notificationIndex, 1);
    return true;
  }
  
  // Batch update notifications
  static async batchUpdateNotifications(
    userId: string,
    notificationIds: string[],
    status: NotificationStatus
  ): Promise<number> {
    let updatedCount = 0;
    
    for (const notificationId of notificationIds) {
      const notificationIndex = notifications.findIndex(n => n.id === notificationId && n.userId === userId);
      
      if (notificationIndex !== -1) {
        const readAt = status === 'READ' ? new Date().toISOString() : notifications[notificationIndex].readAt;
        
        notifications[notificationIndex] = {
          ...notifications[notificationIndex],
          status,
          readAt,
          updatedAt: new Date().toISOString()
        };
        
        updatedCount++;
      }
    }
    
    return updatedCount;
  }
  
  // Get user notification preferences
  static async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const userPreferences = preferences.find(p => p.userId === userId);
    
    if (!userPreferences) {
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
    
    return userPreferences;
  }
  
  // Update user notification preferences
  static async updateUserPreferences(
    userId: string,
    updatedPreferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const existingIndex = preferences.findIndex(p => p.userId === userId);
    
    if (existingIndex !== -1) {
      // Update existing preferences
      preferences[existingIndex] = {
        ...preferences[existingIndex],
        ...updatedPreferences,
        userId,
        updatedAt: new Date().toISOString()
      };
      
      return preferences[existingIndex];
    } else {
      // Create new preferences
      const newPreferences: NotificationPreferences = {
        id: `pref-${userId}`,
        userId,
        ...updatedPreferences,
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
        updatedAt: new Date().toISOString()
      } as NotificationPreferences;
      
      preferences.push(newPreferences);
      
      return newPreferences;
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
    // Filter templates
    let filteredTemplates = templates;
    if (filters?.activeOnly) {
      filteredTemplates = templates.filter(t => t.isActive);
    }
    
    // Apply pagination
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 20, 100);
    const total = filteredTemplates.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedTemplates = filteredTemplates.slice(startIndex, startIndex + limit);
    
    return {
      templates: paginatedTemplates,
      total,
      totalPages
    };
  }
  
  // Admin: Get specific notification template
  static async getTemplate(templateId: string): Promise<NotificationTemplate | null> {
    const template = templates.find(t => t.id === templateId);
    return template || null;
  }
  
  // Admin: Create notification template
  static async createTemplate(templateData: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplate> {
    const newTemplate: NotificationTemplate = {
      id: `template-${Date.now()}`,
      ...templateData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    templates.push(newTemplate);
    return newTemplate;
  }
  
  // Admin: Update notification template
  static async updateTemplate(templateId: string, updatedData: Partial<NotificationTemplate>): Promise<NotificationTemplate | null> {
    const templateIndex = templates.findIndex(t => t.id === templateId);
    
    if (templateIndex === -1) {
      return null;
    }
    
    templates[templateIndex] = {
      ...templates[templateIndex],
      ...updatedData,
      updatedAt: new Date().toISOString()
    };
    
    return templates[templateIndex];
  }
  
  // Admin: Delete notification template
  static async deleteTemplate(templateId: string): Promise<boolean> {
    const templateIndex = templates.findIndex(t => t.id === templateId);
    
    if (templateIndex === -1) {
      return false;
    }
    
    templates.splice(templateIndex, 1);
    return true;
  }
  
  // Admin: Send notification to users
  static async sendNotification(
    senderRole: string,
    recipients: Recipients,
    notificationData: Omit<Notification, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<{ notification: Notification; sentTo: number }> {
    // Determine recipient users based on recipient type
    let recipientUserIds: string[] = [];
    
    switch (recipients.type) {
      case 'ALL':
        // In a real implementation, this would fetch all users
        recipientUserIds = ['user1', 'user2', 'user3'];
        break;
      case 'SPECIFIC':
        recipientUserIds = recipients.userIds || [];
        break;
      case 'FAVORITES':
        // In a real implementation, this would fetch users who favorited specific teams/players
        recipientUserIds = ['user1'];
        break;
      case 'TEAM':
        // In a real implementation, this would fetch users who follow the specified team
        recipientUserIds = ['user1', 'user2'];
        break;
      case 'COMPETITION':
        // In a real implementation, this would fetch users who follow the specified competition
        recipientUserIds = ['user1', 'user2', 'user3'];
        break;
      case 'ADMINS':
        // In a real implementation, this would fetch all admin users
        recipientUserIds = ['admin1'];
        break;
      case 'LOGGERS':
        // In a real implementation, this would fetch all logger users
        recipientUserIds = ['logger1', 'logger2'];
        break;
    }
    
    // Create notifications for each recipient
    const createdNotifications: Notification[] = [];
    
    for (const userId of recipientUserIds) {
      const newNotification: Notification = {
        id: `notification-${Date.now()}-${userId}`,
        userId,
        ...notificationData,
        status: 'UNREAD',
        source: senderRole as NotificationSource,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      notifications.push(newNotification);
      createdNotifications.push(newNotification);
    }
    
    return {
      notification: createdNotifications[0], // Return first notification as example
      sentTo: recipientUserIds.length
    };
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
    // Find the template
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      throw new Error('Template not found');
    }
    
    // Determine recipient users based on recipient type
    let recipientUserIds: string[] = [];
    
    switch (recipients.type) {
      case 'ALL':
        // In a real implementation, this would fetch all users
        recipientUserIds = ['user1', 'user2', 'user3'];
        break;
      case 'SPECIFIC':
        recipientUserIds = recipients.userIds || [];
        break;
      case 'FAVORITES':
        // In a real implementation, this would fetch users who favorited specific teams/players
        recipientUserIds = ['user1'];
        break;
      case 'TEAM':
        // In a real implementation, this would fetch users who follow the specified team
        recipientUserIds = ['user1', 'user2'];
        break;
      case 'COMPETITION':
        // In a real implementation, this would fetch users who follow the specified competition
        recipientUserIds = ['user1', 'user2', 'user3'];
        break;
    }
    
    // Create notifications for each recipient by replacing template variables
    const createdNotifications: Notification[] = [];
    
    for (const userId of recipientUserIds) {
      // Replace template variables in title and message
      let title = template.titleTemplate;
      let message = template.messageTemplate;
      
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        title = title.replace(regex, String(value));
        message = message.replace(regex, String(value));
      }
      
      const newNotification: Notification = {
        id: `notification-${Date.now()}-${userId}`,
        userId,
        title,
        message,
        type: template.type as NotificationType,
        priority: template.defaultPriority,
        status: 'UNREAD',
        entityId: variables.entityId,
        entityType: variables.entityType,
        actionUrl: variables.actionUrl,
        imageUrl: variables.imageUrl,
        scheduledAt,
        expiresAt,
        source: senderRole as NotificationSource,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      notifications.push(newNotification);
      createdNotifications.push(newNotification);
    }
    
    return {
      notifications: createdNotifications,
      sentTo: recipientUserIds.length
    };
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
    // Filter notification history
    let filteredHistory = notificationHistory;
    
    if (filters?.status) {
      filteredHistory = filteredHistory.filter(h => h.status === filters.status);
    }
    
    if (filters?.deliveryMethod) {
      filteredHistory = filteredHistory.filter(h => h.deliveryMethod === filters.deliveryMethod);
    }
    
    if (filters?.startDate) {
      const start = new Date(filters.startDate);
      filteredHistory = filteredHistory.filter(h => new Date(h.createdAt) >= start);
    }
    
    if (filters?.endDate) {
      const end = new Date(filters.endDate);
      filteredHistory = filteredHistory.filter(h => new Date(h.createdAt) <= end);
    }
    
    // Apply pagination
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 20, 100);
    const total = filteredHistory.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedHistory = filteredHistory.slice(startIndex, startIndex + limit);
    
    return {
      history: paginatedHistory,
      total,
      totalPages
    };
  }
  
  // Logger: Send system logging notifications
  static async sendLoggingNotification(
    recipients: {
      type: 'ADMINS' | 'LOGGERS' | 'SPECIFIC';
      userIds?: string[];
    },
    notificationData: Omit<Notification, 'id' | 'userId' | 'status' | 'type' | 'source' | 'createdAt' | 'updatedAt'>
  ): Promise<{ notification: Notification; sentTo: number }> {
    // Determine recipient users based on recipient type
    let recipientUserIds: string[] = [];
    
    switch (recipients.type) {
      case 'ADMINS':
        // In a real implementation, this would fetch all admin users
        recipientUserIds = ['admin1', 'admin2'];
        break;
      case 'LOGGERS':
        // In a real implementation, this would fetch all logger users
        recipientUserIds = ['logger1', 'logger2', 'logger3'];
        break;
      case 'SPECIFIC':
        recipientUserIds = recipients.userIds || [];
        break;
    }
    
    // Create notifications for each recipient
    const createdNotifications: Notification[] = [];
    
    for (const userId of recipientUserIds) {
      const newNotification: Notification = {
        id: `notification-${Date.now()}-${userId}`,
        userId,
        ...notificationData,
        type: 'LOG_ALERT',
        priority: notificationData.priority || 'NORMAL',
        source: 'LOGGER',
        status: 'UNREAD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      notifications.push(newNotification);
      createdNotifications.push(newNotification);
    }
    
    return {
      notification: createdNotifications[0], // Return first notification as example
      sentTo: recipientUserIds.length
    };
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
    // Determine recipient users based on recipient type
    let recipientUserIds: string[] = [];
    
    switch (recipients.type) {
      case 'ADMINS':
        // In a real implementation, this would fetch all admin users
        recipientUserIds = ['admin1', 'admin2'];
        break;
      case 'LOGGERS':
        // In a real implementation, this would fetch all logger users
        recipientUserIds = ['logger1', 'logger2', 'logger3'];
        break;
      case 'SPECIFIC':
        recipientUserIds = recipients.userIds || [];
        break;
    }
    
    // Create notifications for each recipient
    const createdNotifications: Notification[] = [];
    
    for (const userId of recipientUserIds) {
      const title = `PR #${prData.prNumber} Merged: ${prData.prTitle}`;
      const message = `Pull Request by ${prData.author} in ${prData.repository}/${prData.branch} has been merged by ${prData.mergedBy}. ` +
                     `Changes: ${prData.changes.filesChanged} files changed, ${prData.changes.linesAdded} lines added, ${prData.changes.linesDeleted} lines deleted.`;
      
      const newNotification: Notification = {
        id: `notification-${Date.now()}-${userId}`,
        userId,
        title,
        message,
        type: 'LOG_ALERT',
        priority: 'NORMAL',
        source: 'LOGGER',
        status: 'UNREAD',
        metadata: {
          logLevel: 'INFO',
          component: 'PR_MERGER',
          service: 'VERSION_CONTROL',
          environment: process.env.NODE_ENV || 'development',
          correlationId: `pr-${prData.prNumber}`,
          ...prData
        },
        tags: ['PR', 'DEPLOYMENT'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      notifications.push(newNotification);
      createdNotifications.push(newNotification);
    }
    
    return {
      notification: createdNotifications[0], // Return first notification as example
      sentTo: recipientUserIds.length
    };
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
    // Filter notifications for the user and type LOG_ALERT
    let userNotifications = notifications.filter(n => 
      n.userId === userId && n.type === 'LOG_ALERT'
    );
    
    // Apply filters
    if (filters?.priority) {
      userNotifications = userNotifications.filter(n => n.priority === filters.priority);
    }
    
    if (filters?.tags && filters.tags.length > 0) {
      userNotifications = userNotifications.filter(n => 
        n.tags && n.tags.some(tag => filters.tags!.includes(tag))
      );
    }
    
    // Apply sorting
    if (filters?.sortBy) {
      const sortBy = filters.sortBy as keyof Notification;
      const sortOrder = filters.sortOrder || 'DESC';
      
      userNotifications.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        // Handle undefined values
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return 1;
        if (bValue === undefined) return -1;
        
        // Compare values
        if (sortOrder === 'ASC') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }
    
    // Apply pagination
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 20, 100);
    const total = userNotifications.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedNotifications = userNotifications.slice(startIndex, startIndex + limit);
    
    return {
      notifications: paginatedNotifications,
      total,
      totalPages
    };
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
    // Filter notifications for the user and deployment-related tags
    let userNotifications = notifications.filter(n => 
      n.userId === userId && n.tags && 
      (n.tags.includes('PR') || n.tags.includes('DEPLOYMENT') || n.tags.includes('RELEASE'))
    );
    
    // Apply filters
    if (filters?.status) {
      userNotifications = userNotifications.filter(n => n.status === filters.status);
    }
    
    if (filters?.tags && filters.tags.length > 0) {
      userNotifications = userNotifications.filter(n => 
        n.tags && n.tags.some(tag => filters.tags!.includes(tag))
      );
    }
    
    // Apply sorting
    if (filters?.sortBy) {
      const sortBy = filters.sortBy as keyof Notification;
      const sortOrder = filters.sortOrder || 'DESC';
      
      userNotifications.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        // Handle undefined values
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return 1;
        if (bValue === undefined) return -1;
        
        // Compare values
        if (sortOrder === 'ASC') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }
    
    // Apply pagination
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 20, 100);
    const total = userNotifications.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedNotifications = userNotifications.slice(startIndex, startIndex + limit);
    
    return {
      notifications: paginatedNotifications,
      total,
      totalPages
    };
  }
}
