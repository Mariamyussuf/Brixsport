// Offline Queue Utility
// Provides a simplified interface to the OfflineQueue component functionality

// Queue item types
export interface QueueItem {
  id?: string;
  type: 'track_event' | 'track_event_status_update' | 'favorite_add' | 'favorite_remove';
  data: any;
  timestamp: string;
  retries?: number;
  status?: 'pending' | 'syncing' | 'error' | 'completed';
}

// Singleton instance of the queue
let queueInstance: OfflineQueue | null = null;

/**
 * Simple in-memory queue implementation
 * In a production app, this would use IndexedDB or localStorage for persistence
 */
class OfflineQueue {
  private items: QueueItem[] = [];
  private listeners: Function[] = [];
  
  constructor() {
    // Load any existing items from persistent storage
    this.loadFromStorage();
    
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.processPendingItems.bind(this));
    }
  }
  
  /**
   * Add an item to the queue
   */
  add(item: Omit<QueueItem, 'id' | 'status' | 'retries'>) {
    const queueItem: QueueItem = {
      ...item,
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      retries: 0,
      status: 'pending'
    };
    
    this.items.push(queueItem);
    this.saveToStorage();
    this.notifyListeners();
    
    // If we're online, try to process immediately
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.processPendingItems();
    }
    
    return queueItem;
  }
  
  /**
   * Get all items in the queue
   */
  getAll() {
    return [...this.items];
  }
  
  /**
   * Get pending items count
   */
  getPendingCount() {
    return this.items.filter(item => item.status === 'pending' || item.status === 'error').length;
  }
  
  /**
   * Process all pending items in the queue
   */
  async processPendingItems() {
    // Skip if offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }
    
    const pendingItems = this.items.filter(
      item => item.status === 'pending' || item.status === 'error'
    );
    
    if (pendingItems.length === 0) {
      return;
    }
    
    console.log(`Processing ${pendingItems.length} pending items in offline queue`);
    
    // Process each item
    for (const item of pendingItems) {
      try {
        // Mark as syncing
        item.status = 'syncing';
        this.saveToStorage();
        this.notifyListeners();
        
        // In a real implementation, you would send the item to the API based on its type
        // For now, just simulate success
        console.log(`Syncing item: ${item.id} (${item.type})`);
        
        item.status = 'completed';
      } catch (error) {
        console.error(`Error syncing item ${item.id}:`, error);
        
        // Increment retry count
        item.retries = (item.retries || 0) + 1;
        item.status = 'error';
      }
      
      this.saveToStorage();
      this.notifyListeners();
    }
    
    // Clean up completed items
    this.cleanup();
  }
  
  /**
   * Remove completed items that are older than a day
   */
  cleanup() {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    this.items = this.items.filter(item => {
      if (item.status !== 'completed') return true;
      
      const timestamp = new Date(item.timestamp);
      return timestamp >= oneDayAgo;
    });
    
    this.saveToStorage();
    this.notifyListeners();
  }
  
  /**
   * Subscribe to queue changes
   */
  subscribe(listener: Function) {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Notify listeners of changes
   */
  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.getAll());
      } catch (error) {
        console.error('Error in queue listener:', error);
      }
    });
  }
  
  /**
   * Save queue to persistent storage
   */
  private saveToStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('offlineQueue', JSON.stringify(this.items));
      } catch (error) {
        console.error('Error saving queue to storage:', error);
      }
    }
  }
  
  /**
   * Load queue from persistent storage
   */
  private loadFromStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        const storedItems = localStorage.getItem('offlineQueue');
        if (storedItems) {
          this.items = JSON.parse(storedItems);
        }
      } catch (error) {
        console.error('Error loading queue from storage:', error);
      }
    }
  }
}

/**
 * Get the singleton instance of the offline queue
 */
export const getOfflineQueue = (): OfflineQueue => {
  if (!queueInstance) {
    queueInstance = new OfflineQueue();
  }
  return queueInstance;
};

/**
 * Flush all pending items in the queue immediately
 */
export const flushNow = async () => {
  const queue = getOfflineQueue();
  await queue.processPendingItems();
};
