'use client';

import React from 'react';
import MatchNotificationDemo from '@/components/shared/MatchNotificationDemo';
import { useSportsNotifications } from '@/hooks/useNotifications';

const NotificationsDemoPage: React.FC = () => {
  const {
    sendKickoffNotification,
    sendGoalNotification,
    sendCardNotification,
    sendSubstitutionNotification,
    sendHalfTimeNotification,
    sendFullTimeNotification,
    sendLineupNotification,
    sendPreviewNotification,
    sendResultNotification,
    sendPlayerNotification,
    sendStandingNotification,
    sendQualificationNotification,
    sendFixtureNotification,
    sendNewsNotification
  } = useSportsNotifications();

  // Mock data for testing
  const mockMatch = {
    id: 'match-1',
    name: 'Pirates FC vs Joga FC',
    date: new Date().toISOString(),
    location: 'Main Stadium',
    homeTeam: 'Pirates FC',
    awayTeam: 'Joga FC',
    status: 'scheduled' as const,
    homeScore: 0,
    awayScore: 0
  };

  const mockPlayer = {
    id: 'player-1',
    name: 'Cristiano Ronaldo',
    position: 'Forward',
    number: 7
  };

  const mockTeam = {
    id: 'team-1',
    name: 'Pirates FC',
    logo: ''
  };

  const mockCompetition = {
    id: 'comp-1',
    name: 'Premier League',
    type: 'football',
    category: 'league',
    status: 'active',
    created_at: new Date().toISOString()
  };

  const mockEvent = {
    id: 'event-1',
    matchId: 'match-1',
    type: 'goal',
    time: '45+2',
    teamId: 'Pirates FC',
    playerId: 'player-1',
    description: 'Wonder goal from outside the box'
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Notifications Demo</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test the different types of notifications that can be sent in the BrixSports app
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Demo Component */}
          <div className="lg:col-span-2">
            <MatchNotificationDemo />
          </div>

          {/* Manual Notification Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Match Notifications</h2>
            <div className="space-y-3">
              <button
                onClick={() => sendKickoffNotification(mockMatch)}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Send Kickoff Notification
              </button>
              <button
                onClick={() => sendGoalNotification(mockEvent, mockMatch, mockPlayer)}
                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Send Goal Notification
              </button>
              <button
                onClick={() => sendCardNotification({...mockEvent, type: 'yellow_card'}, mockMatch, mockPlayer)}
                className="w-full py-2 px-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
              >
                Send Card Notification
              </button>
              <button
                onClick={() => sendSubstitutionNotification(mockEvent, mockMatch, mockPlayer, mockPlayer)}
                className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Send Substitution Notification
              </button>
              <button
                onClick={() => sendHalfTimeNotification({...mockMatch, homeScore: 1, awayScore: 0})}
                className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                Send Half-Time Notification
              </button>
              <button
                onClick={() => sendFullTimeNotification({...mockMatch, homeScore: 2, awayScore: 1})}
                className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Send Full-Time Notification
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Other Notifications</h2>
            <div className="space-y-3">
              <button
                onClick={() => sendLineupNotification(mockMatch)}
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Send Lineup Notification
              </button>
              <button
                onClick={() => sendPreviewNotification(mockMatch)}
                className="w-full py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
              >
                Send Preview Notification
              </button>
              <button
                onClick={() => sendResultNotification({...mockMatch, homeScore: 2, awayScore: 1})}
                className="w-full py-2 px-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
              >
                Send Result Notification
              </button>
              <button
                onClick={() => sendPlayerNotification('goal', mockPlayer, mockMatch)}
                className="w-full py-2 px-4 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors"
              >
                Send Player Goal Notification
              </button>
              <button
                onClick={() => sendPlayerNotification('injury', mockPlayer, mockMatch, 'Hamstring strain')}
                className="w-full py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
              >
                Send Injury Notification
              </button>
              <button
                onClick={() => sendNewsNotification('Transfer News', 'Cristiano Ronaldo has signed with a new club')}
                className="w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
              >
                Send News Notification
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Competition Notifications</h2>
            <div className="space-y-3">
              <button
                onClick={() => sendStandingNotification(mockCompetition)}
                className="w-full py-2 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
              >
                Send Standing Notification
              </button>
              <button
                onClick={() => sendQualificationNotification(mockTeam, mockCompetition)}
                className="w-full py-2 px-4 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg transition-colors"
              >
                Send Qualification Notification
              </button>
              <button
                onClick={() => sendFixtureNotification(mockMatch, mockCompetition)}
                className="w-full py-2 px-4 bg-lime-600 hover:bg-lime-700 text-white rounded-lg transition-colors"
              >
                Send Fixture Notification
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsDemoPage;