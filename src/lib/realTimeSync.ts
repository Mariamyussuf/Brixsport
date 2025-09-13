import { loggerService } from './loggerService';
import { MatchEvent } from '@/types/matchEvents';
import { ErrorHandler } from './errorHandler';

// Enhanced queue item with retry information
interface QueuedEvent {
  event: MatchEvent;
  retries: number;
  firstAttempt: number;
  lastAttempt: number;
}

// Queue for offline events
class OfflineEventQueue {
  private queue: QueuedEvent[] = [];
  private storageKey = 'logger_offline_events';
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds

  constructor() {
    this.storageKey = 'offline-match-events';
    this.queue = [];
    // Only load from storage on the client side
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  // Add event to queue
  addEvent(event: MatchEvent) {
    const queuedEvent: QueuedEvent = {
      event,
      retries: 0,
      firstAttempt: Date.now(),
      lastAttempt: Date.now()
    };
    
    this.queue.push(queuedEvent);
    this.saveToStorage();
  }

  // Get all events from queue
  getEvents(): QueuedEvent[] {
    return [...this.queue];
  }

  // Remove events from queue
  removeEvents(eventIds: string[]) {
    this.queue = this.queue.filter(item => !eventIds.includes(item.event.id));
    this.saveToStorage();
  }

  // Increment retry count for an event
  incrementRetry(eventId: string) {
    const item = this.queue.find(item => item.event.id === eventId);
    if (item) {
      item.retries++;
      item.lastAttempt = Date.now();
      this.saveToStorage();
    }
  }

  // Get events that are ready for retry (delay has passed)
  getReadyForRetry(): QueuedEvent[] {
    const now = Date.now();
    return this.queue.filter(item => 
      item.retries < this.maxRetries && 
      now - item.lastAttempt >= this.retryDelay
    );
  }

  // Clear queue
  clear() {
    this.queue = [];
    this.saveToStorage();
  }

  // Get queue statistics
  getStats() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(item => item.retries === 0).length,
      retrying: this.queue.filter(item => item.retries > 0 && item.retries < this.maxRetries).length,
      failed: this.queue.filter(item => item.retries >= this.maxRetries).length
    };
  }

  // Save queue to localStorage
  private saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline events to storage:', error);
    }
  }

  // Load queue from localStorage
  private loadFromStorage() {
    // Only access localStorage on the client side
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline events from storage:', error);
    }
  }
}

// Real-time synchronization service
class RealTimeSyncService {
  private eventQueue: OfflineEventQueue;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private syncInterval: NodeJS.Timeout | null = null;
  private matchId: string | null = null;
  private isSyncing: boolean = false;
  private syncCallbacks: Array<(pendingCount: number) => void> = [];

  constructor() {
    this.eventQueue = new OfflineEventQueue();
    
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.syncPendingEvents();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  // Set current match ID
  setMatchId(matchId: string) {
    this.matchId = matchId;
  }

  // Register a callback for sync updates
  onSyncUpdate(callback: (pendingCount: number) => void) {
    this.syncCallbacks.push(callback);
  }

  // Remove a callback
  offSyncUpdate(callback: (pendingCount: number) => void) {
    const index = this.syncCallbacks.indexOf(callback);
    if (index > -1) {
      this.syncCallbacks.splice(index, 1);
    }
  }

  // Notify all callbacks of sync updates
  private notifySyncUpdate() {
    const pendingCount = this.getPendingEventsCount();
    this.syncCallbacks.forEach(callback => callback(pendingCount));
  }

  // Add event to queue and attempt to send
  async addEvent(event: MatchEvent): Promise<boolean> {
    if (!this.matchId) {
      console.error('No match ID set');
      return false;
    }

    if (this.isOnline) {
      try {
        // Try to send event immediately
        const response = await loggerService.addEvent(this.matchId, event);
        if (response.success) {
          this.notifySyncUpdate();
          return true;
        } else {
          // If failed, add to queue for later
          this.eventQueue.addEvent(event);
          this.notifySyncUpdate();
          return false;
        }
      } catch (error) {
        // Use enhanced error handling
        const handledError = ErrorHandler.handle(error);
        console.warn('Failed to send event, adding to queue:', handledError.message);
        this.eventQueue.addEvent(event);
        this.notifySyncUpdate();
        return false;
      }
    } else {
      // If offline, add to queue
      this.eventQueue.addEvent(event);
      this.notifySyncUpdate();
      return false;
    }
  }

  // Sync pending events
  async syncPendingEvents() {
    if (!this.matchId || !this.isOnline || this.isSyncing) {
      return;
    }

    this.isSyncing = true;
    
    try {
      const pendingEvents = this.eventQueue.getEvents();
      if (pendingEvents.length === 0) {
        this.isSyncing = false;
        return;
      }

      console.log(`Syncing ${pendingEvents.length} pending events`);

      const syncedEventIds: string[] = [];
      
      for (const item of pendingEvents) {
        try {
          const response = await loggerService.addEvent(this.matchId, item.event);
          if (response.success) {
            syncedEventIds.push(item.event.id);
          } else {
            console.error('Failed to sync event:', response.error);
            // Increment retry count
            this.eventQueue.incrementRetry(item.event.id);
          }
        } catch (error) {
          // Use enhanced error handling
          const handledError = ErrorHandler.handle(error);
          console.error('Failed to sync event:', handledError.message);
          // Increment retry count
          this.eventQueue.incrementRetry(item.event.id);
          // Stop syncing if we encounter a network error
          break;
        }
      }

      // Remove successfully synced events from queue
      if (syncedEventIds.length > 0) {
        this.eventQueue.removeEvents(syncedEventIds);
        console.log(`Successfully synced ${syncedEventIds.length} events`);
      }
      
      this.notifySyncUpdate();
    } finally {
      this.isSyncing = false;
    }
  }

  // Start automatic sync interval
  startAutoSync(intervalMs: number = 30000) { // 30 seconds default
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncPendingEvents();
      }
    }, intervalMs);
  }

  // Stop automatic sync
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Get pending events count
  getPendingEventsCount(): number {
    return this.eventQueue.getEvents().length;
  }

  // Get queue statistics
  getQueueStats() {
    return this.eventQueue.getStats();
  }

  // Clear all pending events
  clearPendingEvents() {
    this.eventQueue.clear();
    this.notifySyncUpdate();
  }

  // Check if currently syncing
  isCurrentlySyncing(): boolean {
    return this.isSyncing;
  }
}

// Create singleton instance
export const realTimeSyncService = new RealTimeSyncService();

// Export types
export type { OfflineEventQueue };