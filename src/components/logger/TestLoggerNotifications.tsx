// Test Logger Notifications Component
// Used to test the logger notification system

import React from 'react';
import { useLoggerNotifications } from '@/hooks/useLoggerNotifications';
import { Button } from '@/components/ui/button';

const TestLoggerNotifications: React.FC = () => {
  // Only render on client side
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Don't render on server
  if (!isClient) {
    return <div>Loading...</div>;
  }
  
  // Try to get logger notifications hook, but handle case where context is not available
  let loggerNotifications;
  try {
    loggerNotifications = useLoggerNotifications();
  } catch (error) {
    // If we can't access the logger context (e.g., during prerendering), provide mock functions
    loggerNotifications = {
      sendMatchStartNotification: () => {},
      sendMatchFinishNotification: () => {},
      sendEventAddedNotification: () => {},
      sendSyncSuccessNotification: () => {},
      sendSyncErrorNotification: () => {},
      sendOfflineStatusNotification: () => {},
      sendOnlineStatusNotification: () => {},
      sendCompetitionAssignedNotification: () => {}
    };
  }

  const {
    sendMatchStartNotification,
    sendMatchFinishNotification,
    sendEventAddedNotification,
    sendSyncSuccessNotification,
    sendSyncErrorNotification,
    sendOfflineStatusNotification,
    sendOnlineStatusNotification,
    sendCompetitionAssignedNotification
  } = loggerNotifications;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Test Logger Notifications</h2>
      <p className="mb-4">Click the buttons below to test different notification types</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Button onClick={() => sendMatchStartNotification({} as any)}>
          Match Start
        </Button>
        
        <Button onClick={() => sendMatchFinishNotification({} as any)}>
          Match Finish
        </Button>
        
        <Button onClick={() => sendEventAddedNotification({} as any, {} as any)}>
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