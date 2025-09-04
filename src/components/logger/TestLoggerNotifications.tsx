// Test Logger Notifications Component
// Used to test the logger notification system

import React from 'react';
import { useLoggerNotifications } from '@/hooks/useLoggerNotifications';
import { Button } from '@/components/ui/button';

const TestLoggerNotifications: React.FC = () => {
  const {
    sendMatchStartNotification,
    sendMatchFinishNotification,
    sendEventAddedNotification,
    sendSyncSuccessNotification,
    sendSyncErrorNotification,
    sendOfflineStatusNotification,
    sendOnlineStatusNotification,
    sendCompetitionAssignedNotification
  } = useLoggerNotifications();

  // Mock data for testing
  const mockMatch = {
    id: 'match-1',
    homeTeamId: 'Home Team',
    awayTeamId: 'Away Team',
    homeScore: 2,
    awayScore: 1,
    status: 'in-progress'
  } as any;

  const mockEvent = {
    type: 'goal',
    minute: 45
  } as any;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Test Logger Notifications</h2>
      <p className="mb-4">Click the buttons below to test different notification types</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Button onClick={() => sendMatchStartNotification(mockMatch)}>
          Match Start
        </Button>
        
        <Button onClick={() => sendMatchFinishNotification(mockMatch)}>
          Match Finish
        </Button>
        
        <Button onClick={() => sendEventAddedNotification(mockEvent, mockMatch)}>
          Event Added
        </Button>
        
        <Button onClick={() => sendSyncSuccessNotification(5)}>
          Sync Success
        </Button>
        
        <Button onClick={() => sendSyncErrorNotification('Network error')}>
          Sync Error
        </Button>
        
        <Button onClick={() => sendOfflineStatusNotification()}>
          Offline Status
        </Button>
        
        <Button onClick={() => sendOnlineStatusNotification()}>
          Online Status
        </Button>
        
        <Button onClick={() => sendCompetitionAssignedNotification('Premier League 2023')}>
          Competition Assigned
        </Button>
      </div>
    </div>
  );
};

export default TestLoggerNotifications;