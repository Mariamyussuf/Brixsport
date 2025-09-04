# Notification System Documentation

## Overview

The BrixSports notification system provides real-time updates on matches, teams, and players that users follow. The system is designed to keep fans engaged before, during, and after games with personalized alerts so users don't miss key sporting moments.

## Core Components

### 1. Notification Context
The notification system is built around the `NotificationsContext` which manages:
- Notification storage and persistence
- User preferences and settings
- Notification delivery methods
- Scheduled notifications

### 2. Notification Service
The `notificationService` provides functions to create different types of notifications:
- Match-related notifications (kickoff, goals, cards, substitutions, etc.)
- Player-specific notifications (goals, assists, injuries, transfers)
- Competition notifications (standings, qualifications, fixtures)
- News notifications (breaking news, announcements)

### 3. Notification Hook
The `useSportsNotifications` hook provides a clean interface for sending notifications throughout the app.

## Types of Notifications

### Match-Related Notifications
- **Kick-off alerts**: "Chelsea vs Arsenal is about to begin!"
- **Live events**: Goals, red cards, substitutions, penalties
- **Half-time & full-time updates**: With scores
- **Extra time / penalty shootout alerts**

### Pre-Match & Post-Match Notifications
- **Line-ups announced**: Push 30–45 mins before kickoff
- **Match previews**: Form, head-to-head stats
- **Result summaries**: Final score + key stats
- **Highlight availability**: "Watch highlights of Man Utd 3–2 Liverpool"

### Tournament / Competition Notifications
- **Standings updates**: "Nigeria moves to 2nd place in Group A"
- **Qualification alerts**: "Real Madrid qualify for UCL knockouts"
- **Upcoming fixtures reminders**: For followed teams

### Personalized Player Alerts
- **Player scores, assists, cards, injuries, transfers**
- **Example**: "Cristiano Ronaldo scores his 15th goal this season!"

### News & Updates
- **Breaking news**: Transfers, injuries, suspensions
- **Team announcements**: Coach changes, press conferences

## Notification Delivery System

### Real-time Push Notifications
- Instant updates for goals and big events
- Requires user permission and service worker support

### Scheduled Notifications
- Pre-match reminders
- Daily/weekly summaries

### In-App Notifications
- Live banners during browsing
- Notification center in the app

### Email Digests (Optional)
- Weekly summaries for users who prefer email

## Personalization & User Control

Users can customize their notification experience through the Notification Settings:

### Follow Preferences
- Specific teams
- Specific players
- Specific tournaments

### Notification Preferences
- "All events" vs. "Important events only"
- Mute certain teams/competitions
- Time-based quiet hours (e.g., don't disturb between 10 PM - 8 AM)

### Delivery Methods
- Push notifications
- In-app notifications
- Email digests

## Implementation Guide

### Sending Notifications

To send a notification, use the `useSportsNotifications` hook:

```typescript
import { useSportsNotifications } from '@/hooks/useNotifications';

const MyComponent = () => {
  const { sendGoalNotification } = useSportsNotifications();
  
  const handleGoal = (event, match, player) => {
    sendGoalNotification(event, match, player);
  };
  
  return (
    <button onClick={handleGoal}>Send Goal Notification</button>
  );
};
```

### Creating Custom Notifications

To create a custom notification type, add a new function to the `notificationService`:

```typescript
// In src/lib/notificationService.ts
export const createCustomNotification = (title: string, message: string) => {
  return {
    title,
    message,
    type: 'custom',
    category: 'news',
    priority: 'normal'
  };
};
```

### Adding Notification UI

To display notifications in a component, use the `NotificationsContext`:

```typescript
import { useNotifications } from '@/components/shared/NotificationsContext';

const MyComponent = () => {
  const { notifications, markAsRead } = useNotifications();
  
  return (
    <div>
      {notifications.map(notification => (
        <div key={notification.id} onClick={() => markAsRead(notification.id)}>
          <h3>{notification.title}</h3>
          <p>{notification.message}</p>
        </div>
      ))}
    </div>
  );
};
```

## Testing Notifications

The app includes a notification demo page at `/notifications-demo` where you can test all notification types.

## Service Worker Integration

The service worker handles push notifications and background sync for offline events. Make sure to update the service worker when adding new notification types.

## Best Practices

1. **Respect User Preferences**: Always check if notifications are enabled before sending
2. **Prioritize Important Events**: Use priority levels appropriately
3. **Provide Value**: Only send notifications that provide real value to users
4. **Respect Quiet Hours**: Don't send non-critical notifications during quiet hours
5. **Clear Actions**: Make sure notifications have clear actions or destinations
6. **Test Thoroughly**: Test all notification types on different devices and browsers

## Future Enhancements

1. **Interactive Notifications**: Allow users to vote or take actions directly from notifications
2. **Smart Recommendations**: Suggest upcoming matches based on past interest
3. **Rich Media**: Include images and videos in notifications
4. **Localization**: Support multiple languages in notifications
5. **Analytics**: Track notification engagement and effectiveness