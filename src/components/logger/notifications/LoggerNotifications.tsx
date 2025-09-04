// Logger Notifications Component
// Displays logger-specific notifications in the logger interface

import React, { useState, useCallback } from 'react';
import { useNotifications } from '@/components/shared/NotificationsContext';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, X } from 'lucide-react';

const LoggerNotifications: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications,
    preferences,
    updatePreferences
  } = useNotifications();
  
  const [expanded, setExpanded] = useState(false);
  
  // Filter to show only logger-related notifications
  const loggerNotifications = notifications.filter(notification => 
    notification.category === 'match' || 
    notification.type === 'system'
  );
  
  const toggleNotifications = useCallback(() => {
    setExpanded(!expanded);
    // Mark all as read when opening
    if (!expanded && unreadCount > 0) {
      markAllAsRead();
    }
  }, [expanded, unreadCount, markAllAsRead]);
  
  const handleMarkAsRead = useCallback((id: string) => {
    markAsRead(id);
  }, [markAsRead]);
  
  const handleClearAll = useCallback(() => {
    clearNotifications();
  }, [clearNotifications]);
  
  const toggleNotificationsEnabled = useCallback(() => {
    updatePreferences({ enabled: !preferences.enabled });
  }, [preferences.enabled, updatePreferences]);
  
  // Render notification item
  const renderNotificationItem = (notification: any) => (
    <div 
      key={notification.id} 
      className={`p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
        !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {notification.title}
            </h4>
            {!notification.isRead && (
              <span className="ml-2 inline-flex items-center justify-center w-2 h-2 rounded-full bg-blue-500"></span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={() => handleMarkAsRead(notification.id)}
          className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Mark as read"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
  
  return (
    <div className="relative">
      <button
        onClick={toggleNotifications}
        className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Logger notifications"
      >
        {preferences.enabled ? (
          <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        ) : (
          <BellOff className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        )}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>
      
      {expanded && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-900 dark:text-white">Logger Notifications</h3>
              <div className="flex space-x-2">
                <button
                  onClick={toggleNotificationsEnabled}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  aria-label={preferences.enabled ? "Disable notifications" : "Enable notifications"}
                >
                  {preferences.enabled ? (
                    <Bell className="w-4 h-4" />
                  ) : (
                    <BellOff className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={toggleNotifications}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  aria-label="Close notifications"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loggerNotifications.length > 0 ? (
              loggerNotifications.map(renderNotificationItem)
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600" />
                <p className="mt-2">No notifications</p>
                <p className="text-sm mt-1">Logger events will appear here</p>
              </div>
            )}
          </div>
          
          {loggerNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearAll}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Clear All
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Mark All Read
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoggerNotifications;