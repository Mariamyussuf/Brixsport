'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Team, Player, Competition } from '@/types/favorites';
import { NotificationService } from '@/services/notificationService';
import { useAuth } from '@/hooks/useAuth';
import { 
  Notification as APINotification, 
  NotificationPreferences as APINotificationPreferences,
  NotificationType as APINotificationType
} from '@/types/notifications';

type LocalNotificationType = APINotificationType | 'MATCH_STARTING' | 'GOAL' | 'CARD' | 'SUBSTITUTION' | 'HALF_TIME' | 'FULL_TIME' | 'MATCH_EVENT' | 'SYSTEM_ALERT' | 'ANNOUNCEMENT' | 'NEWS_UPDATE' | 'PLAYER_UPDATE' | 'TEAM_UPDATE' | 'COMPETITION_UPDATE';

export interface Notification {
  // Core notification properties
  id: string;
  userId: string;
  title: string;
  message: string;
  type: LocalNotificationType;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
  status: 'UNREAD' | 'READ' | 'ARCHIVED' | 'DELETED';
  source: 'SYSTEM' | 'ADMIN' | 'USER' | 'LOGGER';
  
  // Entity references
  entityId?: string;
  entityType?: 'MATCH' | 'TEAM' | 'COMPETITION' | 'PLAYER' | 'SYSTEM' | 'ADMIN';
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  readAt?: string;
  expiresAt?: string;
  
  // Additional data
  actionUrl?: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
  
  // Local app state
  isRead: boolean;
  timestamp: number;
  
  // Legacy fields (mapped from metadata)
  actionId?: string;
  relatedTeamId?: string;
  relatedPlayerId?: string;
  relatedCompetitionId?: string;
  category?: 'match' | 'player' | 'competition' | 'news';
}

interface NotificationsContextProps {
  notifications: Notification[];
  unreadCount: number;
  preferences: APINotificationPreferences;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  updatePreferences: (prefs: Partial<APINotificationPreferences>) => void;
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
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scheduledNotifications, setScheduledNotifications] = useState<Map<string, NodeJS.Timeout>>(new Map());
  
  // Default preferences
  const defaultPreferences: APINotificationPreferences = {
    id: '',
    userId: user?.id || '',
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
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    followedTeams: [],
    followedPlayers: [],
    followedCompetitions: [],
    digestFrequency: 'DAILY',
    devices: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: undefined
  };
  
  const [preferences, setPreferences] = useState<APINotificationPreferences>(defaultPreferences);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Map API notification to local notification format
  const mapAPIToLocalNotification = (apiNotif: APINotification): Notification => {
    const metadata = apiNotif.metadata || {};
    return {
      ...apiNotif,
      isRead: apiNotif.status === 'READ',
      timestamp: new Date(apiNotif.createdAt).getTime(),
      // Map metadata fields to legacy props for backward compatibility
      actionId: metadata.actionId,
      relatedTeamId: metadata.teamId,
      relatedPlayerId: metadata.playerId,
      relatedCompetitionId: metadata.competitionId,
      category: metadata.category as 'match' | 'player' | 'competition' | 'news' | undefined
    };
  };

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await NotificationService.getUserNotifications(user.id);
      const apiNotifications = response?.data || [];
      const mappedNotifications = apiNotifications.map(mapAPIToLocalNotification);
      setNotifications(mappedNotifications);
      localStorage.setItem('notifications', JSON.stringify(mappedNotifications));
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications. Please try again later.');
      
      // Fallback to local storage if available
      const storedNotifications = localStorage.getItem('notifications');
      if (storedNotifications) {
        try {
          setNotifications(JSON.parse(storedNotifications));
        } catch (e) {
          console.error('Failed to parse stored notifications:', e);
          setNotifications([]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Load notifications and preferences on mount or when user changes
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      
      // Load preferences
      const loadPreferences = async () => {
        try {
          const response = await NotificationService.getUserPreferences(user.id);
          if (response?.data) {
            setPreferences(response.data);
          } else {
            // Initialize with default preferences if none exist
            const newPrefs = {
              ...defaultPreferences,
              userId: user.id
            };
            const createResponse = await NotificationService.updateUserPreferences(user.id, newPrefs);
            if (createResponse?.data) {
              setPreferences(createResponse.data);
            }
          }
        } catch (err) {
          console.error('Failed to load preferences:', err);
          // Use default preferences if loading fails
          setPreferences({
            ...defaultPreferences,
            userId: user.id
          });
        }
      };
      
      loadPreferences();
    }
  }, [user?.id, fetchNotifications]);

  // Add a new notification
  const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead' | 'createdAt' | 'updatedAt' | 'status'>) => {
    try {
      // Prepare the notification data for the API
      const notificationData = {
        ...notification,
        status: 'UNREAD' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Ensure metadata is properly structured
        metadata: {
          ...(notification.metadata || {}),
          ...(notification.actionId && { actionId: notification.actionId }),
          ...(notification.relatedTeamId && { teamId: notification.relatedTeamId }),
          ...(notification.relatedPlayerId && { playerId: notification.relatedPlayerId }),
          ...(notification.relatedCompetitionId && { competitionId: notification.relatedCompetitionId }),
          ...(notification.category && { category: notification.category })
        },
        // Add required fields with default values
        timestamp: 0, // Will be set when creating the notification
        isRead: false // Will be set based on status
      };
      
      // Remove legacy fields from the root level
      const { actionId, relatedTeamId, relatedPlayerId, relatedCompetitionId, category, ...cleanNotification } = notificationData as any;
      
      const response = await NotificationService.createNotification(cleanNotification);
      const apiNotification = response.data;
      
      if (apiNotification) {
        // Map the API notification to the local format
        const newNotification: Notification = {
          ...apiNotification,
          isRead: apiNotification.status === 'READ',
          timestamp: new Date(apiNotification.createdAt).getTime(),
          // Map metadata fields to legacy props for backward compatibility
          actionId: apiNotification.metadata?.actionId,
          relatedTeamId: apiNotification.metadata?.teamId,
          relatedPlayerId: apiNotification.metadata?.playerId,
          relatedCompetitionId: apiNotification.metadata?.competitionId,
          category: apiNotification.metadata?.category as 'match' | 'player' | 'competition' | 'news' | undefined
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        
        // Update unread count
        if (!newNotification.isRead) {
          // You might want to show a toast or badge update here
        }
      }
    } catch (err) {
      console.error('Failed to add notification:', err);
      throw err;
    }
  }, [setNotifications]);

  // Schedule a notification for later
  const scheduleNotification = (
    notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>,
    delayMs: number
  ) => {
    const notificationId = `scheduled-${Date.now()}`;
    
    const timeoutId = setTimeout(() => {
      addNotification(notification)
        .then(() => {
          setScheduledNotifications(prev => {
            const newMap = new Map(prev);
            newMap.delete(notificationId);
            return newMap;
          });
        })
        .catch(err => {
          console.error('Error in scheduled notification:', err);
          // Clean up the scheduled notification even if there was an error
          setScheduledNotifications(prev => {
            const newMap = new Map(prev);
            newMap.delete(notificationId);
            return newMap;
          });
        });
    }, delayMs);
    
    setScheduledNotifications(prev => new Map(prev).set(notificationId, timeoutId));
    return notificationId;
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
  const markAsRead = async (id: string) => {
    try {
      await NotificationService.markAsRead(id);
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === id 
            ? { ...n, isRead: true, status: 'READ', readAt: new Date().toISOString() } 
            : n
        )
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user?.id) return;
    
    try {
      await NotificationService.markAllAsRead(user.id);
      
      setNotifications(prev => 
        prev.map(n => ({
          ...n, 
          isRead: true, 
          status: 'READ' as const, 
          readAt: new Date().toISOString() 
        }))
      );
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  // Clear all notifications
  const clearNotifications = async () => {
    if (!user?.id) return;
    
    try {
      await NotificationService.clearNotifications(user.id);
      setNotifications([]);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  // Update notification preferences
  const updatePreferences = (prefs: Partial<APINotificationPreferences>) => {
    if (!user?.id) return;
    
    setPreferences(prev => ({
      ...prev,
      ...prefs
    }));
    
    // Persist to the server in the background
    NotificationService.updateUserPreferences(user.id, {
      ...preferences,
      ...prefs
    }).catch(err => {
      console.error('Failed to update preferences:', err);
    });
  };

  // Get notifications by category
  const getNotificationsByCategory = (category: Notification['category']): Notification[] => {
    if (!category) return [];
    return notifications.filter(n => n.category === category);
  };

  // Get notifications related to a specific team
  const getNotificationsByTeam = (teamId: string): Notification[] => {
    return notifications.filter(n => n.relatedTeamId === teamId);
  };

  // Get notifications related to a specific player
  const getNotificationsByPlayer = (playerId: string): Notification[] => {
    return notifications.filter(n => n.relatedPlayerId === playerId);
  };

  // Sample notifications for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && notifications.length === 0 && user?.id) {
      const now = new Date().toISOString();
      const sampleNotifications: Notification[] = [
        {
          id: '1',
          userId: user.id,
          title: 'Live Event Starting',
          message: 'Pirates FC vs Joga FC match is about to begin in 15 minutes',
          type: 'MATCH_STARTING',
          priority: 'HIGH',
          status: 'UNREAD',
          source: 'SYSTEM',
          createdAt: now,
          updatedAt: now,
          isRead: false,
          timestamp: Date.now() - 900000, // 15 minutes ago
          metadata: {
            category: 'match',
            teamId: 'team-1',
            competitionId: 'comp-1',
            actionId: 'match-1'
          },
          entityType: 'MATCH',
          entityId: 'match-1'
        },
        {
          id: '2',
          userId: user.id,
          title: 'Goal!',
          message: 'Cristiano Ronaldo scores his 15th goal this season!',
          type: 'GOAL',
          priority: 'HIGH',
          status: 'UNREAD',
          source: 'SYSTEM',
          createdAt: now,
          updatedAt: now,
          timestamp: Date.now() - 3600000, // 1 hour ago
          isRead: false,
          metadata: {
            category: 'match',
            teamId: 'team-1',
            actionId: 'match-1',
            playerId: 'player-1'
          },
          entityType: 'MATCH',
          entityId: 'match-1'
        },
        {
          id: '3',
          userId: user.id,
          title: 'System Maintenance',
          message: 'The app will undergo maintenance tonight from 2AM to 3AM',
          type: 'SYSTEM_ALERT',
          priority: 'NORMAL',
          status: 'READ',
          source: 'SYSTEM',
          createdAt: now,
          updatedAt: now,
          timestamp: Date.now() - 86400000, // 24 hours ago
          isRead: true,
          metadata: {
            category: 'news'
          },
          entityType: 'SYSTEM',
          entityId: 'system-1'
        }
      ];
      
      setNotifications(sampleNotifications);
    }
  }, [notifications.length, user?.id]);

  // Cleanup scheduled notifications on unmount
  useEffect(() => {
    return () => {
      scheduledNotifications.forEach(timeoutId => clearTimeout(timeoutId));
    };
  }, [scheduledNotifications]);

  const contextValue: NotificationsContextProps = {
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
  };

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
};
