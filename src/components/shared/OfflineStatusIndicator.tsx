"use client";

import React, { useState, useEffect } from 'react';
import { flushNow } from '@/lib/offlineQueue';
import { useSettings } from './SettingsContext';

export default function OfflineStatusIndicator() {
  const { dataSaver } = useSettings();
  const [isOnline, setIsOnline] = useState(true);
  const [pendingEvents, setPendingEvents] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Check online status and listen for changes
  useEffect(() => {
    // Initial status
    setIsOnline(navigator.onLine);

    // Update status when it changes
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check IndexedDB for pending events
  useEffect(() => {
    const checkPendingEvents = async () => {
      try {
        const db = await openDB();
        const count = await getEventCount(db);
        setPendingEvents(count);
      } catch (err) {
        console.error('Failed to check pending events:', err);
      }
    };

    // Check on mount
    checkPendingEvents();

    // Set up interval (throttled in data saver mode)
    const intervalMs = dataSaver ? 30000 : 10000;
    const interval = setInterval(checkPendingEvents, intervalMs);
    return () => clearInterval(interval);
  }, [dataSaver]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingEvents > 0) {
      handleSync();
    }
  }, [isOnline, pendingEvents]);

  const handleSync = async () => {
    if (!isOnline || isSyncing) return;
    
    try {
      setIsSyncing(true);
      await flushNow();
      // Update pending events count
      const db = await openDB();
      const count = await getEventCount(db);
      setPendingEvents(count);
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Helper functions for IndexedDB
  async function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('brixsports-db', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('events')) {
          db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function getEventCount(db: IDBDatabase): Promise<number> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('events', 'readonly');
      const store = tx.objectStore('events');
      const countReq = store.count();
      countReq.onsuccess = () => resolve(countReq.result as number);
      countReq.onerror = () => reject(countReq.error);
    });
  }

  // Don't show anything if everything is good
  if (isOnline && pendingEvents === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-xl shadow-xl overflow-hidden">
      <div 
        className={`px-4 py-3 cursor-pointer transition-all duration-300 ${
          isOnline ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-500 hover:bg-red-600'
        } text-white`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-white bg-opacity-80 animate-pulse" />
            <span className="font-medium text-sm">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="flex items-center">
            {pendingEvents > 0 && (
              <span className="bg-white bg-opacity-20 rounded-full px-2 py-0.5 text-xs mr-2">
                {pendingEvents}
              </span>
            )}
            <svg 
              className={`w-4 h-4 transform transition-transform duration-300 ${showDetails ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      
      {showDetails && (
        <div className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm mb-3">
            {isOnline ? (
              <p className="text-gray-700 dark:text-gray-300">
                You're connected to the internet. {pendingEvents > 0 ? `${pendingEvents} event${pendingEvents !== 1 ? 's' : ''} waiting to sync.` : 'All data is up to date.'}
              </p>
            ) : (
              <p className="text-gray-700 dark:text-gray-300">
                You're currently offline. Changes will be saved locally and synced when you're back online.
              </p>
            )}
          </div>
          
          {pendingEvents > 0 && isOnline && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                isSyncing
                  ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isSyncing ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Syncing...
                </div>
              ) : (
                `Sync ${pendingEvents} Event${pendingEvents !== 1 ? 's' : ''} Now`
              )}
            </button>
          )}
          
          {!isOnline && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  You can continue using the app normally. All actions will be saved and synced automatically when you're back online.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}