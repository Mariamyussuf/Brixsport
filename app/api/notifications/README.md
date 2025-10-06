# Notifications API

This directory contains the implementation of the Notifications API for the Brixsport platform. The API provides comprehensive functionality for handling user notifications, alerts, and messaging in a multi-sport competition platform.

## API Endpoints

### User Notifications

- `GET /api/notifications` - Retrieve user's notifications with pagination and filtering
- `GET /api/notifications/:id` - Retrieve a specific notification by ID
- `PATCH /api/notifications/:id` - Update notification status (mark as read, archive, etc.)
- `DELETE /api/notifications/:id` - Delete a notification
- `PATCH /api/notifications/batch` - Batch update notifications (mark multiple as read, archive, etc.)

### Notification Preferences

- `GET /api/notifications/preferences` - Retrieve user's notification preferences
- `PUT /api/notifications/preferences` - Update user's notification preferences

### Admin Notification Templates

- `GET /api/admin/notifications/templates` - Retrieve all notification templates
- `GET /api/admin/notifications/templates/:id` - Retrieve a specific notification template
- `POST /api/admin/notifications/templates` - Create a new notification template
- `PUT /api/admin/notifications/templates/:id` - Update a notification template
- `DELETE /api/admin/notifications/templates/:id` - Delete a notification template

### Sending Notifications

- `POST /api/admin/notifications/send` - Send a notification to one or more users
- `POST /api/admin/notifications/send-template` - Send a notification using a template

### Notification History

- `GET /api/admin/notifications/history` - Retrieve notification delivery history

### Logger Notifications

- `POST /api/logger/notifications/send` - Send system logging notifications (e.g., PR notifications, deployment alerts)
- `POST /api/logger/notifications/pr-merged` - Specialized endpoint for PR merge notifications

## Data Models

### Notification

```typescript
interface Notification {
  id: string; // UUID
  userId: string; // Recipient user ID
  title: string;
  message: string;
  type: 'MATCH_UPDATE' | 'SCORE_ALERT' | 'FAVORITE_TEAM' | 'COMPETITION_NEWS' | 'SYSTEM_ALERT' | 'REMINDER' | 'ACHIEVEMENT' | 'ADMIN_NOTICE' | 'LOG_ALERT';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
  status: 'UNREAD' | 'READ' | 'ARCHIVED' | 'DELETED';
  entityId?: string; // Related entity ID (match, team, competition, etc.)
  entityType?: 'MATCH' | 'TEAM' | 'COMPETITION' | 'PLAYER' | 'SYSTEM' | 'ADMIN';
  actionUrl?: string; // URL to navigate when notification is clicked
  imageUrl?: string; // Optional image for rich notifications
  scheduledAt?: Date; // For scheduled notifications
  deliveredAt?: Date; // When notification was delivered
  readAt?: Date; // When notification was read
  expiresAt?: Date; // When notification should expire
  metadata?: Record<string, any>; // Additional data for custom handling
  source: 'SYSTEM' | 'ADMIN' | 'USER' | 'LOGGER'; // Source of the notification
  tags?: string[]; // Tags for categorization (e.g., 'PR', 'DEPLOYMENT', 'SECURITY')
  createdAt: Date;
  updatedAt: Date;
}
```

### Notification Preferences

```typescript
interface NotificationPreferences {
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
    adminNotices: boolean;
    logAlerts: boolean;
  };
  
  // Favorite teams/players tracking
  followedTeams: string[]; // Array of team IDs
  followedPlayers: string[]; // Array of player IDs
  followedCompetitions: string[]; // Array of competition IDs
  
  // Frequency settings
  digestFrequency: 'INSTANT' | 'HOURLY' | 'DAILY' | 'WEEKLY';
  
  // Device-specific settings
  devices: {
    deviceId: string;
    platform: 'IOS' | 'ANDROID' | 'WEB';
    token?: string; // Push notification token
    enabled: boolean;
  }[];
  
  createdAt: Date;
  updatedAt: Date;
}
```

### Notification Template

```typescript
interface NotificationTemplate {
  id: string; // UUID
  name: string;
  type: string;
  titleTemplate: string;
  messageTemplate: string;
  defaultPriority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
  defaultCategory: string;
  variables: string[]; // List of template variables
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

### Notification History

```typescript
interface NotificationHistory {
  id: string; // UUID
  notificationId: string;
  userId: string;
  deliveryMethod: 'PUSH' | 'EMAIL' | 'SMS' | 'IN_APP';
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'CLICKED';
  provider?: string; // Notification service provider
  providerId?: string; // Provider-specific ID
  errorMessage?: string; // If failed
  sentAt?: Date;
  deliveredAt?: Date;
  clickedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

## Authentication & Authorization

All endpoints require authentication via JWT. Role-based access control is implemented as follows:

- **ADMIN**: Full access to all notification operations, templates, and system-wide notifications
- **ORGANIZER**: Can send notifications for assigned competitions
- **LOGGER**: Can send match-related notifications and system logging notifications
- **USER**: Can manage their own notifications and preferences
- **PUBLIC**: No access to notification APIs

## Validation Requirements

- All string fields have appropriate length limits
- Date fields must be valid ISO dates
- Priority and type fields must be from allowed enum values
- User IDs must exist in the database
- Entity IDs must exist and match entity types
- Device tokens must be valid for their platforms
- Quiet hours must be in valid HH:MM format
- Email addresses must be valid if email delivery is enabled

## Error Handling

Standard HTTP status codes are implemented:
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

Error response format:
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object (optional)"
  }
}
```