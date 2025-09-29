// Notification Types

export type NotificationType = 
  | 'MATCH_UPDATE' 
  | 'SCORE_ALERT' 
  | 'FAVORITE_TEAM' 
  | 'COMPETITION_NEWS' 
  | 'SYSTEM_ALERT' 
  | 'REMINDER' 
  | 'ACHIEVEMENT' 
  | 'ADMIN_NOTICE' 
  | 'LOG_ALERT';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';

export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED' | 'DELETED';

export type EntityType = 'MATCH' | 'TEAM' | 'COMPETITION' | 'PLAYER' | 'SYSTEM' | 'ADMIN';

export type NotificationSource = 'SYSTEM' | 'ADMIN' | 'USER' | 'LOGGER';

export type DeliveryMethod = 'PUSH' | 'EMAIL' | 'SMS' | 'IN_APP';

export type DeliveryStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'CLICKED';

export type DigestFrequency = 'INSTANT' | 'HOURLY' | 'DAILY' | 'WEEKLY';

export type DevicePlatform = 'IOS' | 'ANDROID' | 'WEB';

export type RecipientType = 'ALL' | 'SPECIFIC' | 'FAVORITES' | 'TEAM' | 'COMPETITION' | 'ADMINS' | 'LOGGERS';

// Main Notification Interface
export interface Notification {
  id: string; // UUID
  userId: string; // Recipient user ID
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  entityId?: string; // Related entity ID (match, team, competition, etc.)
  entityType?: EntityType;
  actionUrl?: string; // URL to navigate when notification is clicked
  imageUrl?: string; // Optional image for rich notifications
  scheduledAt?: string; // For scheduled notifications (ISO Date)
  deliveredAt?: string; // When notification was delivered (ISO Date)
  readAt?: string; // When notification was read (ISO Date)
  expiresAt?: string; // When notification should expire (ISO Date)
  metadata?: Record<string, any>; // Additional data for custom handling
  source: NotificationSource; // Source of the notification
  tags?: string[]; // Tags for categorization (e.g., 'PR', 'DEPLOYMENT', 'SECURITY')
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
}

// Notification Preferences Interface
export interface NotificationPreferences {
  data: any;
  id: string; // UUID
  userId: string;
  
  // Delivery methods
  deliveryMethods: {
    push: boolean;
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  
  // Quiet hours
  quietHours?: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
  
  // Notification categories
  categories: {
    matchUpdates: boolean;
    scoreAlerts: boolean;
    favoriteTeamNews: boolean;
    competitionNews: boolean;
    systemAlerts: boolean;
    reminders: boolean;
    achievements: boolean;
    adminNotices: boolean; // New category for admin notifications
    logAlerts: boolean; // New category for system logging notifications
  };
  
  // Favorite teams/players tracking
  followedTeams: string[]; // Array of team IDs
  followedPlayers: string[]; // Array of player IDs
  followedCompetitions: string[]; // Array of competition IDs
  
  // Frequency settings
  digestFrequency: DigestFrequency;
  
  // Device-specific settings
  devices: {
    deviceId: string;
    platform: DevicePlatform;
    token?: string; // Push notification token
    enabled: boolean;
  }[];
  
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
}

// Notification Template Interface
export interface NotificationTemplate {
  id: string; // UUID
  name: string;
  type: string;
  titleTemplate: string;
  messageTemplate: string;
  defaultPriority: NotificationPriority;
  defaultCategory: string;
  variables: string[]; // List of template variables
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
}

// Notification History Interface
export interface NotificationHistory {
  id: string; // UUID
  notificationId: string;
  userId: string;
  deliveryMethod: DeliveryMethod;
  status: DeliveryStatus;
  provider?: string; // Notification service provider
  providerId?: string; // Provider-specific ID
  errorMessage?: string; // If failed
  sentAt?: string; // ISO Date
  deliveredAt?: string; // ISO Date
  clickedAt?: string; // ISO Date
  metadata?: Record<string, any>;
  createdAt: string; // ISO Date
}

// Recipients Interface
export interface Recipients {
  type: RecipientType;
  userIds?: string[]; // Required if type is SPECIFIC
  teamId?: string; // Required if type is TEAM
  competitionId?: string; // Required if type is COMPETITION
}

// Notification Sending Payload
export interface SendNotificationPayload {
  recipients: Recipients;
  notification: Omit<Notification, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>;
}

// Template Sending Payload
export interface SendTemplatePayload {
  templateId: string;
  recipients: Omit<Recipients, 'userIds' | 'teamId' | 'competitionId'> & Partial<Pick<Recipients, 'userIds' | 'teamId' | 'competitionId'>>;
  variables: Record<string, any>;
  scheduledAt?: string; // ISO Date
  expiresAt?: string; // ISO Date
}

// Logging Notification Payload
export interface SendLoggingNotificationPayload {
  recipients: {
    type: 'ADMINS' | 'LOGGERS' | 'SPECIFIC';
    userIds?: string[]; // Required if type is SPECIFIC
  };
  notification: Omit<Notification, 'id' | 'userId' | 'status' | 'type' | 'source' | 'createdAt' | 'updatedAt'>;
}

// PR Merged Notification Payload
export interface SendPrMergedPayload {
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
  recipients: {
    type: 'ADMINS' | 'LOGGERS' | 'SPECIFIC';
    userIds?: string[]; // Required if type is SPECIFIC
  };
}
