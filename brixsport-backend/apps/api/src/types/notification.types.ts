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
