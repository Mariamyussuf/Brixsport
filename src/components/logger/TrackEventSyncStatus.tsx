'use client';

import React, { useState, useEffect } from 'react';
import { getOfflineQueue } from '@/lib/offlineQueue';
import { Wifi, WifiOff, Check, RefreshCw } from 'lucide-react';

/**
 * A component that shows the synchronization status of offline data
 * and allows manual sync triggering
 */
const TrackEventSyncStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);
  
  useEffect(() => {
    // Set initial online status
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }
    
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Subscribe to queue changes
    const queue = getOfflineQueue();
    const unsubscribe = queue.subscribe(() => {
      setPendingCount(queue.getPendingCount());
    });
    
    // Set initial pending count
    setPendingCount(queue.getPendingCount());
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);
  
  const handleManualSync = () => {
    if (!isOnline || syncing) return;
    
    setSyncing(true);
    
    // Trigger queue processing
    const queue = getOfflineQueue();
    queue.processPendingItems()
      .then(() => {
        setSyncing(false);
      })
      .catch(error => {
        console.error('Error processing queue:', error);
        setSyncing(false);
      });
  };
  
  // If no pending items and online, don't render anything
  if (pendingCount === 0 && isOnline && !syncing) {
    return null;
  }
  
  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 ${
      isOnline ? 'bg-blue-600' : 'bg-red-600'
    }`}>
      {isOnline ? (
        syncing ? (
          <RefreshCw className="h-4 w-4 text-white animate-spin" />
        ) : (
          pendingCount > 0 ? (
            <Wifi className="h-4 w-4 text-white" />
          ) : (
            <Check className="h-4 w-4 text-white" />
          )
        )
      ) : (
        <WifiOff className="h-4 w-4 text-white" />
      )}
      
      <span className="text-sm font-medium text-white">
        {!isOnline 
          ? 'Offline' 
          : syncing 
            ? 'Syncing...' 
            : pendingCount > 0 
              ? `${pendingCount} pending` 
              : 'All synced'
        }
      </span>
      
      {isOnline && pendingCount > 0 && !syncing && (
        <button
          onClick={handleManualSync}
          className="ml-2 bg-white/20 hover:bg-white/30 p-1 rounded-full"
        >
          <RefreshCw className="h-3 w-3 text-white" />
        </button>
      )}
    </div>
  );
};

export default TrackEventSyncStatus;