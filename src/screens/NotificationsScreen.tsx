'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Bell, 
  Check, 
  Circle, 
  Trophy, 
  User, 
  Calendar, 
  Video, 
  Users, 
  AlertCircle, 
  Star, 
  Loader2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useI18n } from '@/components/shared/I18nProvider';
import { useNotifications, Notification } from '@/components/shared/NotificationsContext';

const NotificationsScreen: React.FC = () => {
  const { t } = useI18n();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'matches' | 'players' | 'competitions'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { 
    notifications = [], 
    markAsRead, 
    markAllAsRead, 
    unreadCount = 0, 
    preferences, 
    updatePreferences
  } = useNotifications();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);
  
  const handleActionClick = useCallback(async (notification: Notification) => {
    try {
      // Mark as read when clicked
      await markAsRead(notification.id);

      // Navigate based on notification type and available IDs
      if (notification.actionId) {
        // If there's a direct action URL, use that
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
          return;
        }
        
        // Otherwise, try to determine the best route based on available IDs
        if (notification.relatedTeamId) {
          router.push(`/team/${notification.relatedTeamId}`);
        } else if (notification.relatedPlayerId) {
          router.push(`/player/${notification.relatedPlayerId}`);
        } else if (notification.relatedCompetitionId) {
          router.push(`/competition/${notification.relatedCompetitionId}`);
        }
      }
    } catch (err) {
      console.error('Error handling notification action:', err);
      setError('Failed to process notification. Please try again.');
    }
  }, [markAsRead, router]);
  
  // Refresh functionality has been removed as per requirements
  
  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [markAllAsRead]);

  // Filter notifications based on active tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    if (activeTab === 'unread') return notifications.filter(n => !n.isRead);
    
    // Map tab names to notification types
    const typeMap = {
      'matches': 'MATCH_UPDATE',
      'players': 'FAVORITE_TEAM',
      'competitions': 'COMPETITION_NEWS'
    } as const;
    
    const type = typeMap[activeTab as keyof typeof typeMap];
    return type ? notifications.filter(n => n.type === type) : [];
  }, [activeTab, notifications]);

  const getRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    const iconClasses = "w-10 h-10 rounded-full flex items-center justify-center text-white";
    
    switch (type) {
      case 'MATCH_UPDATE':
      case 'MATCH_START':
      case 'MATCH_END':
        return <div className={`${iconClasses} bg-green-500`}>
          <Circle className="w-5 h-5" />
        </div>;
      case 'SCORE_ALERT':
      case 'GOAL':
        return <div className={`${iconClasses} bg-blue-500`}>
          <Trophy className="w-5 h-5" />
        </div>;
      case 'FAVORITE_TEAM':
      case 'TEAM_UPDATE':
        return <div className={`${iconClasses} bg-indigo-500`}>
          <Users className="w-5 h-5" />
        </div>;
      case 'COMPETITION_NEWS':
      case 'COMPETITION_UPDATE':
        return <div className={`${iconClasses} bg-purple-500`}>
          <Trophy className="w-5 h-5" />
        </div>;
      case 'SYSTEM_ALERT':
      case 'LOG_ALERT':
        return <div className={`${iconClasses} bg-red-500`}>
          <AlertCircle className="w-5 h-5" />
        </div>;
      case 'REMINDER':
        return <div className={`${iconClasses} bg-yellow-500`}>
          <Calendar className="w-5 h-5" />
        </div>;
      case 'ACHIEVEMENT':
        return <div className={`${iconClasses} bg-teal-500`}>
          <Star className="w-5 h-5" />
        </div>;
      case 'ADMIN_NOTICE':
        return <div className={`${iconClasses} bg-orange-500`}>
          <AlertCircle className="w-5 h-5" />
        </div>;
      default:
        return <div className={`${iconClasses} bg-gray-500`}>
          <Bell className="w-5 h-5" />
        </div>;
    }
  };

  const getCategoryName = (type: string) => {
    switch (type) {
      case 'MATCH_UPDATE':
      case 'SCORE_ALERT':
        return 'Match Updates';
      case 'FAVORITE_TEAM':
      case 'TEAM_UPDATE':
        return 'Team News';
      case 'COMPETITION_NEWS':
      case 'COMPETITION_UPDATE':
        return 'Competition News';
      case 'SYSTEM_ALERT':
      case 'LOG_ALERT':
        return 'System Alerts';
      case 'ADMIN_NOTICE':
        return 'Admin Notices';
      case 'REMINDER':
        return 'Reminders';
      case 'ACHIEVEMENT':
        return 'Achievements';
      default:
        return 'General';
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading notifications...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && notifications.length === 0) {
    return (
      <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Failed to load notifications
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Please check your connection and try again later.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-800 dark:text-gray-200" />
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('notifications')}</h1>
              {unreadCount > 0 && (
                <span className="bg-blue-600 text-white text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {/* Refresh button removed as per requirements */}
          </div>
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || isRefreshing}
            className={`text-sm font-medium transition-colors ${
              unreadCount > 0 
                ? 'text-blue-600 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-400' 
                : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
          >
            {t('mark_all_read')}
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-shrink-0 px-4 py-3 text-center font-medium text-sm transition-colors ${
              activeTab === 'all'
                ? 'text-blue-600 dark:text-blue-500 border-b-2 border-blue-600 dark:border-blue-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {t('all')}
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex-shrink-0 px-4 py-3 text-center font-medium text-sm transition-colors ${
              activeTab === 'unread'
                ? 'text-blue-600 dark:text-blue-500 border-b-2 border-blue-600 dark:border-blue-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {t('unread')}
            {unreadCount > 0 && (
              <span className="ml-2 bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex-shrink-0 px-4 py-3 text-center font-medium text-sm transition-colors ${
              activeTab === 'matches'
                ? 'text-blue-600 dark:text-blue-500 border-b-2 border-blue-600 dark:border-blue-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Matches
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`flex-shrink-0 px-4 py-3 text-center font-medium text-sm transition-colors ${
              activeTab === 'players'
                ? 'text-blue-600 dark:text-blue-500 border-b-2 border-blue-600 dark:border-blue-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Players
          </button>
          <button
            onClick={() => setActiveTab('competitions')}
            className={`flex-shrink-0 px-4 py-3 text-center font-medium text-sm transition-colors ${
              activeTab === 'competitions'
                ? 'text-blue-600 dark:text-blue-500 border-b-2 border-blue-600 dark:border-blue-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Competitions
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="pb-16">
        {filteredNotifications.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-900'} hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer`}
                onClick={() => handleActionClick(notification)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between">
                      <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {getRelativeTime(notification.timestamp)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {notification.message}
                    </p>
                    
                    {/* Show metadata if available */}
                    {notification.metadata && (
                      <div className="mt-2 space-y-1">
                        {notification.metadata.teamName && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Team: {notification.metadata.teamName}
                          </div>
                        )}
                        {notification.metadata.competitionName && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <Trophy className="w-3 h-3 mr-1" />
                            {notification.metadata.competitionName}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-100">
                        {getCategoryName(notification.type)}
                      </span>
                    </div>
                  </div>
                  {!notification.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      aria-label="Mark as read"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {isLoading && (
              <div className="w-full flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                  Loading notifications...
                </p>
              </div>
            )}
            {error && (
              <div className="w-full flex items-center justify-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                  Failed to load notifications
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {error}
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                Please check your connection and try again later.
              </div>
              </div>
            )}
            {!isLoading && !error && filteredNotifications.length === 0 && (
              <div className="w-full flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                  {activeTab === 'unread' 
                    ? t('no_unread_notifications') 
                    : activeTab !== 'all'
                      ? `No ${activeTab} notifications`
                      : t('no_notifications')
                  }
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {activeTab === 'unread' 
                    ? t('all_caught_up') 
                    : activeTab !== 'all'
                      ? `You don't have any ${activeTab} notifications yet.`
                      : t('notifications_appear_here')
                  }
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Notifications will update automatically.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsScreen;