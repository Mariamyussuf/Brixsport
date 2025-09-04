// Offline Queue Display Component
// Shows the status of offline events that need to be synced

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getOfflineQueue, QueueItem } from '@/lib/offlineQueue';
import { campusDesign } from '@/styles/campusDesign';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, RefreshCw, Eye, EyeOff, Trash2, Play, Pause } from 'lucide-react';
import { useLoggerNotifications } from '@/hooks/useLoggerNotifications';

interface OfflineQueueProps {
  expanded?: boolean;
  onToggle?: () => void;
  dataSaver?: boolean;
}

const OfflineQueue: React.FC<OfflineQueueProps> = ({ expanded = false, onToggle, dataSaver = false }) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});
  const [showRaw, setShowRaw] = useState(false);
  const [autoRetryInterval, setAutoRetryInterval] = useState(30000); // 30 seconds
  const [isAutoRetryEnabled, setIsAutoRetryEnabled] = useState(true);
  const [ariaLive, setAriaLive] = useState('');
  const autoRetryRef = useRef<NodeJS.Timeout | null>(null);
  const { sendSyncSuccessNotification, sendSyncErrorNotification } = useLoggerNotifications();

  // Get failed item IDs
  const failedIds = useMemo(() => 
    queue.filter(item => item.status === 'error').map(item => item.id!), 
    [queue]
  );

  // Update queue from offline queue service
  const updateQueue = useCallback(() => {
    const offlineQueue = getOfflineQueue();
    setQueue(offlineQueue.getAll());
  }, []);

  // Initialize and subscribe to queue changes
  useEffect(() => {
    updateQueue();
    const offlineQueue = getOfflineQueue();
    const unsubscribe = offlineQueue.subscribe(updateQueue);
    return () => unsubscribe();
  }, [updateQueue]);

  // Handle auto-retry
  useEffect(() => {
    if (!isAutoRetryEnabled || dataSaver || failedIds.length === 0) {
      if (autoRetryRef.current) {
        clearInterval(autoRetryRef.current);
        autoRetryRef.current = null;
      }
      return;
    }

    autoRetryRef.current = setInterval(() => {
      const offlineQueue = getOfflineQueue();
      offlineQueue.processPendingItems();
      setAriaLive(`Auto-retrying ${failedIds.length} failed events`);
    }, autoRetryInterval);

    return () => {
      if (autoRetryRef.current) {
        clearInterval(autoRetryRef.current);
        autoRetryRef.current = null;
      }
    };
  }, [failedIds, autoRetryInterval, isAutoRetryEnabled, dataSaver]);

  // Handle retry for a single event
  const onRetry = useCallback(async (event: QueueItem) => {
    try {
      const offlineQueue = getOfflineQueue();
      // Reset status to pending and increment retries
      event.status = 'pending';
      event.retries = (event.retries || 0) + 1;
      offlineQueue.processPendingItems();
      setAriaLive(`Retrying event ${event.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrorMap(prev => ({ ...prev, [event.id!]: errorMessage }));
      setAriaLive(`Failed to retry event ${event.id}: ${errorMessage}`);
    }
  }, []);

  // Handle clear for a single event
  const onClear = useCallback((event: QueueItem) => {
    // In a real implementation, you would remove the event from the queue
    setAriaLive(`Cleared event ${event.id}`);
  }, []);

  // Handle retry all failed events
  const handleRetryAll = useCallback(() => {
    const offlineQueue = getOfflineQueue();
    offlineQueue.processPendingItems();
    setAriaLive(`Retrying all ${failedIds.length} failed events`);
  }, [failedIds]);

  // Handle clear all events
  const handleClearAll = useCallback(() => {
    // In a real implementation, you would clear all events from the queue
    setAriaLive('Cleared all events');
  }, []);

  // Toggle auto-retry
  const toggleAutoRetry = useCallback(() => {
    setIsAutoRetryEnabled(prev => !prev);
    setAriaLive(`Auto-retry ${!isAutoRetryEnabled ? 'enabled' : 'disabled'}`);
  }, [isAutoRetryEnabled]);

  // Get status icon and color
  const getStatusInfo = (status: QueueItem['status']) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'text-yellow-500', bgColor: 'bg-yellow-100', label: 'Pending' };
      case 'syncing':
        return { icon: RefreshCw, color: 'text-blue-500', bgColor: 'bg-blue-100', label: 'Syncing' };
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-100', label: 'Completed' };
      case 'error':
        return { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100', label: 'Error' };
      default:
        return { icon: Clock, color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Unknown' };
    }
  };

  // Get sport type from event data
  const getSportType = (data: any) => {
    if (data.sport) return data.sport;
    if (data.eventType) {
      if (['goal', 'yellow_card', 'red_card', 'foul', 'substitution'].includes(data.eventType)) return 'football';
      if (['field_goal', 'three_pointer', 'free_throw', 'rebound'].includes(data.eventType)) return 'basketball';
      if (['race_start', 'lap_time', 'race_finish'].includes(data.eventType)) return 'track_events';
    }
    return 'unknown';
  };

  // Send sync notifications
  useEffect(() => {
    const completedCount = queue.filter(item => item.status === 'completed').length;
    if (completedCount > 0) {
      sendSyncSuccessNotification(completedCount);
    }
    
    const errorCount = queue.filter(item => item.status === 'error').length;
    if (errorCount > 0) {
      sendSyncErrorNotification(`${errorCount} events failed to sync`);
    }
  }, [queue, sendSyncSuccessNotification, sendSyncErrorNotification]);

  if (queue.length === 0) return null;

  return (
    <>
      <div 
        className={`fixed bottom-4 right-4 z-40 ${expanded ? 'w-80' : 'w-12 h-12'} transition-all duration-300`}
        role="region" 
        aria-label="Offline event queue"
      >
        <motion.div
          className={`${campusDesign.layout} ${campusDesign.animations} shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden`}
          initial={false}
          animate={expanded ? { height: 'auto' } : { height: 48 }}
        >
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <RefreshCw className={`w-5 h-5 ${failedIds.length > 0 ? 'text-red-500' : 'text-green-500'}`} />
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                Offline Queue ({queue.length})
              </span>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                aria-label={showRaw ? "Hide raw data" : "Show raw data"}
              >
                {showRaw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={onToggle}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                aria-label={expanded ? "Collapse queue" : "Expand queue"}
              >
                {expanded ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {failedIds.length} failed, {queue.length - failedIds.length} synced
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={toggleAutoRetry}
                        className={`p-1 rounded text-xs ${isAutoRetryEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                        aria-label={isAutoRetryEnabled ? "Disable auto-retry" : "Enable auto-retry"}
                      >
                        Auto
                      </button>
                      <button
                        onClick={handleRetryAll}
                        disabled={failedIds.length === 0}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                        aria-label="Retry all failed events"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleClearAll}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                        aria-label="Clear all events"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {failedIds.length > 0 && (
                    <div className="text-xs text-red-600 dark:text-red-400">
                      {failedIds.length} events failed to sync. Check connection and retry.
                    </div>
                  )}
                </div>

                <ul className="max-h-60 overflow-y-auto">
                  {queue.map((event) => {
                    const { icon: StatusIcon, color: statusColor, bgColor, label: status } = getStatusInfo(event.status);
                    const sportType = getSportType(event.data);
                    const isFailed = event.status === 'error';
                    
                    return (
                      <li 
                        key={event.id} 
                        className="p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex justify-between items-start">
                          <div className={`flex items-center ${statusColor}`}>
                            <StatusIcon className="w-4 h-4" />
                            <span className="ml-2 text-sm font-medium">{status}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="mt-2 text-sm">
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                              {sportType}
                            </span>
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                              {event.type}
                            </span>
                            {event.data.team && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                                {event.data.team}
                              </span>
                            )}
                            {event.data.player && (
                              <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                                {event.data.player}
                              </span>
                            )}
                            {event.data.value && (
                              <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">
                                {event.data.value}
                              </span>
                            )}
                          </div>
                          
                          {isFailed && errorMap[event.id!] && (
                            <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                              Error: {errorMap[event.id!]}
                            </div>
                          )}
                          
                          {showRaw && (
                            <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                              {JSON.stringify(event, null, 2)}
                            </pre>
                          )}
                        </div>
                        
                        <div className="flex justify-end space-x-2 mt-2">
                          {isFailed && (
                            <button
                              onClick={() => onRetry(event)}
                              className="text-xs px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
                              aria-label="Retry event"
                            >
                              Retry
                            </button>
                          )}
                          <button
                            onClick={() => onClear(event)}
                            className="text-xs px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded"
                            aria-label="Clear event"
                          >
                            Clear
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      
      {/* Aria live region for accessibility */}
      <div aria-live="polite" className="sr-only">
        {ariaLive}
      </div>
    </>
  );
};

export default OfflineQueue;