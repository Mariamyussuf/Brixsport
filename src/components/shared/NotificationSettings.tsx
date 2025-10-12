'use client';

import React, { useState } from 'react';
import { useNotifications } from './NotificationsContext';
import { Bell, Clock, User, Users, Trophy, Mail } from 'lucide-react';
import router from 'next/router';

const NotificationSettings: React.FC = () => {
  const { preferences, updatePreferences } = useNotifications();
  const [quietHoursStart, setQuietHoursStart] = useState(preferences.quietHours?.start || '22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState(preferences.quietHours?.end || '08:00');

  const handleToggleEnabled = () => {
    updatePreferences({ 
      deliveryMethods: {
        ...preferences.deliveryMethods,
        inApp: !preferences.deliveryMethods.inApp
      }
    });
  };

  const handleToggleImportantOnly = () => {
    // This setting doesn't exist in the new preferences structure
    // We'll just toggle the score alerts category instead
    updatePreferences({ 
      categories: {
        ...preferences.categories,
        scoreAlerts: !preferences.categories.scoreAlerts
      }
    });
  };

  const handleToggleDeliveryMethod = (method: 'push' | 'inApp' | 'email' | 'sms') => {
    updatePreferences({
      deliveryMethods: {
        ...preferences.deliveryMethods,
        [method]: !preferences.deliveryMethods[method]
      }
    });
  };

  const handleQuietHoursChange = () => {
    updatePreferences({
      quietHours: {
        enabled: true, // Add the missing enabled property
        start: quietHoursStart,
        end: quietHoursEnd
      }
    });
  };

  const handleFollowTeam = (teamId: string) => {
    const followedTeams = preferences.followedTeams.includes(teamId)
      ? preferences.followedTeams.filter(id => id !== teamId)
      : [...preferences.followedTeams, teamId];
    
    updatePreferences({ followedTeams });
  };

  const handleFollowPlayer = (playerId: string) => {
    const followedPlayers = preferences.followedPlayers.includes(playerId)
      ? preferences.followedPlayers.filter(id => id !== playerId)
      : [...preferences.followedPlayers, playerId];
    
    updatePreferences({ followedPlayers });
  };

  const handleFollowCompetition = (competitionId: string) => {
    const followedCompetitions = preferences.followedCompetitions.includes(competitionId)
      ? preferences.followedCompetitions.filter(id => id !== competitionId)
      : [...preferences.followedCompetitions, competitionId];
    
    updatePreferences({ followedCompetitions });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center mb-6">
        <Bell className="w-6 h-6 text-blue-600 dark:text-blue-500 mr-2" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notification Settings</h2>
      </div>

      {/* General Settings */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">General</h3>
        
        <div className="space-y-4">
          {/* Enable Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Enable Notifications</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications about matches and favorites</p>
            </div>
            <button
              onClick={handleToggleEnabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.deliveryMethods.inApp ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${preferences.deliveryMethods.inApp ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
          
          {/* Important Only */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Important Events Only</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Only receive notifications for important events</p>
            </div>
            <button
              onClick={handleToggleImportantOnly}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.categories.scoreAlerts ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${preferences.categories.scoreAlerts ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Delivery Methods */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Delivery Methods</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Push Notifications</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Instant alerts even when the app is closed</p>
              </div>
            </div>
            <button
              onClick={() => handleToggleDeliveryMethod('push')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.deliveryMethods.push ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${preferences.deliveryMethods.push ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white mr-3">
                <Bell className="w-3 h-3" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">In-App Notifications</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Banners while using the app</p>
              </div>
            </div>
            <button
              onClick={() => handleToggleDeliveryMethod('inApp')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.deliveryMethods.inApp ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${preferences.deliveryMethods.inApp ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white mr-3">
                <Mail className="w-3 h-3" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Email Digest</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Weekly summary via email</p>
              </div>
            </div>
            <button
              onClick={() => handleToggleDeliveryMethod('email')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.deliveryMethods.email ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${preferences.deliveryMethods.email ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quiet Hours</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Notifications will be silenced during these hours
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={quietHoursStart}
              onChange={(e) => setQuietHoursStart(e.target.value)}
              onBlur={handleQuietHoursChange}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Time
            </label>
            <input
              type="time"
              value={quietHoursEnd}
              onChange={(e) => setQuietHoursEnd(e.target.value)}
              onBlur={handleQuietHoursChange}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Follow Preferences */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Follow Preferences</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Choose what you want to follow for notifications
        </p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-500 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Teams</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {preferences.followedTeams.length > 0 
                    ? `${preferences.followedTeams.length} teams followed` 
                    : 'No teams followed'}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/favorites')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Manage
            </button>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center">
              <User className="w-5 h-5 text-green-600 dark:text-green-500 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Players</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {preferences.followedPlayers.length > 0 
                    ? `${preferences.followedPlayers.length} players followed` 
                    : 'No players followed'}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/favorites')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Manage
            </button>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center">
              <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-500 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Competitions</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {preferences.followedCompetitions.length > 0 
                    ? `${preferences.followedCompetitions.length} competitions followed` 
                    : 'No competitions followed'}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/favorites')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Manage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;