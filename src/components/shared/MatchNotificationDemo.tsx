'use client';

import React, { useEffect } from 'react';
import { useSportsNotifications } from '@/hooks/useNotifications';
import { Match, Player } from '@/lib/api';

const MatchNotificationDemo: React.FC = () => {
  const {
    sendKickoffNotification,
    sendGoalNotification,
    sendCardNotification,
    sendSubstitutionNotification,
    sendHalfTimeNotification,
    sendFullTimeNotification
  } = useSportsNotifications();

  // Mock match data
  const mockMatch: Match = {
    id: 'match-1',
    name: 'Pirates FC vs Joga FC',
    date: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
    location: 'Main Stadium',
    homeTeam: 'Pirates FC',
    awayTeam: 'Joga FC',
    status: 'scheduled',
    homeScore: 0,
    awayScore: 0
  };

  // Mock player data
  const mockPlayer: Player = {
    id: 'player-1',
    name: 'Cristiano Ronaldo',
    position: 'Forward',
    number: 7
  };

  // Mock event data
  const mockEvent = {
    id: 'event-1',
    matchId: 'match-1',
    type: 'goal',
    time: '45+2',
    teamId: 'Pirates FC',
    playerId: 'player-1',
    description: 'Wonder goal from outside the box'
  };

  // Send notifications when component mounts
  useEffect(() => {
    // Send kickoff notification
    sendKickoffNotification(mockMatch, 15);
    
    // Simulate sending other notifications after delays
    const goalTimer = setTimeout(() => {
      sendGoalNotification(mockEvent, mockMatch, mockPlayer);
    }, 5000);
    
    const cardTimer = setTimeout(() => {
      sendCardNotification({...mockEvent, type: 'yellow_card'}, mockMatch, mockPlayer);
    }, 10000);
    
    const halfTimeTimer = setTimeout(() => {
      sendHalfTimeNotification({...mockMatch, homeScore: 1, awayScore: 0});
    }, 15000);
    
    const fullTimeTimer = setTimeout(() => {
      sendFullTimeNotification({...mockMatch, homeScore: 2, awayScore: 1});
    }, 20000);
    
    // Cleanup timers
    return () => {
      clearTimeout(goalTimer);
      clearTimeout(cardTimer);
      clearTimeout(halfTimeTimer);
      clearTimeout(fullTimeTimer);
    };
  }, [
    sendKickoffNotification,
    sendGoalNotification,
    sendCardNotification,
    sendHalfTimeNotification,
    sendFullTimeNotification,
    mockMatch,
    mockEvent,
    mockPlayer
  ]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Match Notification Demo</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        This demo shows how notifications are sent during a match. Notifications will be sent automatically:
      </p>
      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
        <li>• Kickoff notification (15 minutes before match)</li>
        <li>• Goal notification (after 5 seconds)</li>
        <li>• Card notification (after 10 seconds)</li>
        <li>• Half-time notification (after 15 seconds)</li>
        <li>• Full-time notification (after 20 seconds)</li>
      </ul>
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Current Match:</strong> {mockMatch.homeTeam} vs {mockMatch.awayTeam}
        </p>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Kickoff:</strong> {new Date(mockMatch.date).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default MatchNotificationDemo;