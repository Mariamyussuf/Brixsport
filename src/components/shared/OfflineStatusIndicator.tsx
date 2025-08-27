"use client";

import React, { useState, useEffect } from 'react';
import { flushNow } from '@/lib/offlineQueue';

export default function OfflineStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingEvents, setPendingEvents] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

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

    // Set up interval to check every 10 seconds
    const interval = setInterval(checkPendingEvents, 10000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="fixed bottom-4 left-4 z-50 flex flex-col rounded-xl shadow-lg overflow-hidden">
      <div className={`px-4 py-2 ${isOnline ? 'bg-amber-100' : 'bg-red-100'}`}>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-opacity-80 animate-pulse" 
                style={{ backgroundColor: isOnline ? '#f59e0b' : '#ef4444' }} />
                
          <span className="font-medium text-sm">
            {isOnline ? 'Connected' : 'Offline'}
          </span>
        </div>
        
        {pendingEvents > 0 && (
          <div className="mt-1 text-xs">
            {pendingEvents} event{pendingEvents !== 1 ? 's' : ''} pending sync
            
            {isOnline && (
              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className={`ml-2 px-2 py-0.5 rounded ${
                  isSyncing 
                    ? 'bg-gray-200 text-gray-500' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isSyncing ? 'Syncing...' : 'Sync now'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
