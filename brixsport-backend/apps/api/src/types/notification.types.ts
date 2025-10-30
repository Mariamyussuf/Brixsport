export interface NotificationDeliveryMethods {
  push: boolean;
  email: boolean;
  sms: boolean;
  inApp: boolean;
}

export interface NotificationCategories {
  matchUpdates: boolean;
  teamNews: boolean;
  competitionNews: boolean;
  marketing: boolean;
  systemAlerts: boolean;
}

export interface NotificationPreferences {
  id?: number;
  userId: string;
  deliveryMethods: NotificationDeliveryMethods;
  categories: NotificationCategories;
  emailFrequency: 'INSTANT' | 'DAILY' | 'WEEKLY' | 'NEVER';
  quietHours?: {
    enabled: boolean;
    startTime: string; // Format: "HH:MM"
    endTime: string;   // Format: "HH:MM"
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateNotificationPreferencesDto {
  deliveryMethods?: Partial<NotificationDeliveryMethods>;
  categories?: Partial<NotificationCategories>;
  emailFrequency?: 'INSTANT' | 'DAILY' | 'WEEKLY' | 'NEVER';
  quietHours?: {
    enabled?: boolean;
    startTime?: string;
    endTime?: string;
  };
}

// Notification Template Interface
export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  titleTemplate: string;
  messageTemplate: string;
  defaultPriority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
  defaultCategory: string;
  variables: string[];
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Notification Interface
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: string;
  read: boolean;
  read_at?: string;
  status: string;
  metadata?: Record<string, any>;
  template_id?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
  source: string;
  tags?: string[];
  entity_id?: string;
  entity_type?: string;
  action_url?: string;
  image_url?: string;
  scheduled_at?: string;
  expires_at?: string;
  sent_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// Recipients Interface
export interface Recipients {
  type: 'ALL' | 'SPECIFIC' | 'FAVORITES' | 'TEAM' | 'COMPETITION' | 'ADMINS' | 'LOGGERS';
  userIds?: string[]; // Required if type is SPECIFIC
  teamId?: string; // Required if type is TEAM
  competitionId?: string; // Required if type is COMPETITION
}

// Notification Sending Payloads
export interface SendNotificationPayload {
  recipients: Recipients;
  notification: Omit<Notification, 'id' | 'user_id' | 'read' | 'read_at' | 'status' | 'created_at' | 'updated_at'>;
}

export interface SendTemplatePayload {
  templateId: string;
  recipients: Omit<Recipients, 'userIds' | 'teamId' | 'competitionId'> & Partial<Pick<Recipients, 'userIds' | 'teamId' | 'competitionId'>>;
  variables: Record<string, any>;
  scheduledAt?: string;
  expiresAt?: string;
}

export interface SendLoggingNotificationPayload {
  recipients: {
    type: 'ADMINS' | 'LOGGERS' | 'SPECIFIC';
    userIds?: string[];
  };
  notification: Omit<Notification, 'id' | 'user_id' | 'read' | 'read_at' | 'status' | 'type' | 'source' | 'created_at' | 'updated_at'>;
}

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
    userIds?: string[];
  };
}
