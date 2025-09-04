'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, X, Check, Circle, Trophy, User, Calendar, Video, Users, AlertCircle, Star } from 'lucide-react';
import { useI18n } from '@/components/shared/I18nProvider';
import { useNotifications, Notification } from '@/components/shared/NotificationsContext';

const NotificationsScreen: React.FC = () => {
  const { t } = useI18n();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'matches' | 'players' | 'competitions'>('all');
  const { notifications, markAsRead, markAllAsRead, unreadCount, preferences, updatePreferences } = useNotifications();

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : activeTab === 'unread'
    ? notifications.filter(n => !n.isRead)
    : activeTab === 'matches'
    ? notifications.filter(n => n.category === 'match')
    : activeTab === 'players'
    ? notifications.filter(n => n.category === 'player')
    : notifications.filter(n => n.category === 'competition');

  const handleBack = () => {
    router.back();
  };

  const handleActionClick = (notification: Notification) => {
    // Mark as read when clicked
    markAsRead(notification.id);

    // Navigate based on notification type
    if (notification.type === 'match' && notification.actionId) {
      router.push(`/match/${notification.actionId}`);
    } else if (notification.type === 'event' && notification.actionId) {
      router.push(`/event/${notification.actionId}`);
    } else if (notification.type === 'player' && notification.actionId) {
      router.push(`/player/${notification.actionId}`);
    } else if (notification.category === 'competition' && notification.actionId) {
      router.push(`/competition/${notification.actionId}`);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const getRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const iconClasses = "w-10 h-10 rounded-full flex items-center justify-center text-white";
    
    switch (type) {
      case 'kickoff':
      case 'match':
        return <div className={`${iconClasses} bg-green-500`}>
          <Circle className="w-5 h-5" />
        </div>;
      case 'goal':
      case 'full-time':
        return <div className={`${iconClasses} bg-blue-500`}>
          <Trophy className="w-5 h-5" />
        </div>;
      case 'player':
      case 'substitution':
      case 'card':
        return <div className={`${iconClasses} bg-purple-500`}>
          <User className="w-5 h-5" />
        </div>;
      case 'lineup':
      case 'preview':
        return <div className={`${iconClasses} bg-yellow-500`}>
          <Users className="w-5 h-5" />
        </div>;
      case 'result':
      case 'highlight':
        return <div className={`${iconClasses} bg-red-500`}>
          <Video className="w-5 h-5" />
        </div>;
      case 'standing':
      case 'qualification':
      case 'fixture':
        return <div className={`${iconClasses} bg-indigo-500`}>
          <Calendar className="w-5 h-5" />
        </div>;
      case 'news':
      case 'transfer':
      case 'injury':
        return <div className={`${iconClasses} bg-pink-500`}>
          <AlertCircle className="w-5 h-5" />
        </div>;
      case 'system':
        return <div className={`${iconClasses} bg-gray-500`}>
          <Bell className="w-5 h-5" />
        </div>;
      case 'update':
        return <div className={`${iconClasses} bg-teal-500`}>
          <Star className="w-5 h-5" />
        </div>;
      default:
        return <div className={`${iconClasses} bg-gray-500`}>
          <Bell className="w-5 h-5" />
        </div>;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'match': return 'Matches';
      case 'player': return 'Players';
      case 'competition': return 'Competitions';
      default: return 'All';
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
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
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-blue-600 dark:text-blue-500 text-sm font-medium hover:text-blue-800 dark:hover:text-blue-400 transition-colors"
            >
              {t('mark_all_read')}
            </button>
          )}
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
                    {notification.category && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                          {getCategoryName(notification.category)}
                        </span>
                      </div>
                    )}
                  </div>
                  {!notification.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="ml-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      aria-label="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              {activeTab === 'unread' ? t('no_unread_notifications') : t('no_notifications')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {activeTab === 'unread' ? t('all_caught_up') : t('notifications_appear_here')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsScreen;