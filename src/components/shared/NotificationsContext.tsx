'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Team, Player, Competition } from '@/lib/api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  type: 'match' | 'event' | 'system' | 'update' | 'goal' | 'player' | 'kickoff' | 'half-time' | 'full-time' | 'substitution' | 'card' | 'lineup' | 'preview' | 'result' | 'highlight' | 'standing' | 'qualification' | 'fixture' | 'news' | 'transfer' | 'injury';
  actionId?: string;
  sound?: 'default' | 'success' | 'error' | 'silent';
  priority?: 'high' | 'normal' | 'low';
  relatedTeamId?: string;
  relatedPlayerId?: string;
  relatedCompetitionId?: string;
  // New fields for enhanced notifications
  imageUrl?: string;
  category?: 'match' | 'player' | 'competition' | 'news';
  scheduledTime?: number; // For scheduled notifications
  isPushNotification?: boolean; // Whether this was sent as a push notification
}

// User preferences for notifications
export interface NotificationPreferences {
  enabled: boolean;
  importantOnly: boolean;
  quietHours?: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  followedTeams: string[];
  followedPlayers: string[];
  followedCompetitions: string[];
  emailDigest?: boolean;
  deliveryMethods: {
    push: boolean;
    inApp: boolean;
    email?: boolean;
  };
}

interface NotificationsContextProps {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  // New methods for enhanced functionality
  scheduleNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>, delayMs: number) => void;
  cancelScheduledNotification: (id: string) => void;
  getNotificationsByCategory: (category: Notification['category']) => Notification[];
  getNotificationsByTeam: (teamId: string) => Notification[];
  getNotificationsByPlayer: (playerId: string) => Notification[];
}

const NotificationsContext = createContext<NotificationsContextProps | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationsProvider = ({ children }: NotificationsProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    importantOnly: false,
    followedTeams: [],
    followedPlayers: [],
    followedCompetitions: [],
    deliveryMethods: {
      push: true,
      inApp: true,
      email: false
    }
  });
  const [scheduledNotifications, setScheduledNotifications] = useState<Map<string, NodeJS.Timeout>>(new Map());

  // Load notifications and preferences from localStorage on mount
  useEffect(() => {
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      try {
        setNotifications(JSON.parse(storedNotifications));
      } catch (error) {
        console.error('Failed to parse stored notifications:', error);
        // If parsing fails, reset notifications
        setNotifications([]);
      }
    }

    const storedPreferences = localStorage.getItem('notification-preferences');
    if (storedPreferences) {
      try {
        setPreferences(JSON.parse(storedPreferences));
      } catch (error) {
        console.error('Failed to parse stored notification preferences:', error);
      }
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notification-preferences', JSON.stringify(preferences));
  }, [preferences]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Add a new notification
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    // Check if user has enabled notifications
    if (!preferences.enabled) return;

    // Check if user wants only important notifications
    if (preferences.importantOnly && notification.priority !== 'high') return;

    // Check quiet hours
    if (preferences.quietHours) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const { start, end } = preferences.quietHours;
      
      // Simple time comparison (assumes same day)
      if (currentTime >= start && currentTime <= end) return;
    }

    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
      isRead: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Show browser notification if enabled
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(newNotification.title, {
        body: newNotification.message,
        icon: newNotification.imageUrl
      });
    }
  };

  // Schedule a notification for later
  const scheduleNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>, delayMs: number) => {
    const id = `scheduled-${Date.now()}-${Math.random()}`;
    const timeoutId = setTimeout(() => {
      addNotification(notification);
      // Remove from scheduled notifications after firing
      setScheduledNotifications(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
    }, delayMs);
    
    // Store the timeout ID so we can cancel it later
    setScheduledNotifications(prev => new Map(prev).set(id, timeoutId));
  };

  // Cancel a scheduled notification
  const cancelScheduledNotification = (id: string) => {
    const timeoutId = scheduledNotifications.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setScheduledNotifications(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
    }
  };

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Update notification preferences
  const updatePreferences = (prefs: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...prefs
    }));
  };

  // Get notifications by category
  const getNotificationsByCategory = (category: Notification['category']) => {
    return notifications.filter(n => n.category === category);
  };

  // Get notifications related to a specific team
  const getNotificationsByTeam = (teamId: string) => {
    return notifications.filter(n => n.relatedTeamId === teamId);
  };

  // Get notifications related to a specific player
  const getNotificationsByPlayer = (playerId: string) => {
    return notifications.filter(n => n.relatedPlayerId === playerId);
  };

  // Sample notifications for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && notifications.length === 0) {
      setNotifications([
        {
          id: '1',
          title: 'Live Event Starting',
          message: 'Pirates FC vs Joga FC match is about to begin in 15 minutes',
          timestamp: Date.now() - 900000, // 15 minutes ago
          isRead: false,
          type: 'kickoff',
          actionId: 'match-1',
          category: 'match',
          priority: 'high'
        },
        {
          id: '2',
          title: 'Goal!',
          message: 'Cristiano Ronaldo scores his 15th goal this season!',
          timestamp: Date.now() - 3600000, // 1 hour ago
          isRead: false,
          type: 'goal',
          actionId: 'event-3',
          category: 'player',
          relatedPlayerId: 'player-1',
          priority: 'high'
        },
        {
          id: '3',
          title: 'System Maintenance',
          message: 'The app will undergo maintenance tonight from 2AM to 3AM',
          timestamp: Date.now() - 86400000, // 1 day ago
          isRead: true,
          type: 'system',
          priority: 'normal'
        }
      ]);
    }
  }, [notifications.length]);

  // Cleanup scheduled notifications on unmount
  useEffect(() => {
    return () => {
      scheduledNotifications.forEach(timeoutId => clearTimeout(timeoutId));
    };
  }, [scheduledNotifications]);

  return (
    <NotificationsContext.Provider 
      value={{
        notifications,
        unreadCount,
        preferences,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        updatePreferences,
        scheduleNotification,
        cancelScheduledNotification,
        getNotificationsByCategory,
        getNotificationsByTeam,
        getNotificationsByPlayer
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};