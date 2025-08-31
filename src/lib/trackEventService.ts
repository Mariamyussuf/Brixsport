// Track Event Service
// Provides integration between the TrackEvents API and offline queue functionality

import { TrackEventsAPI, TrackEvent } from './api';
import { getOfflineQueue } from './offlineQueue';

/**
 * Creates a track event, attempting to send to the API first.
 * If offline, queues the event for later synchronization.
 * 
 * @param eventData Event data without id and status
 * @returns Promise resolving to the created event (from API or locally generated)
 */
export const trackEvent = async (eventData: Omit<TrackEvent, 'id' | 'status'>) => {
  try {
    // First try to send directly to API
    const response = await TrackEventsAPI.create(eventData);
    return response;
  } catch (error) {
    console.log('Failed to create track event, queueing for later', error);
    
    // If offline, queue the event
    const offlineQueue = getOfflineQueue();
    offlineQueue.add({
      type: 'track_event',
      data: eventData,
      timestamp: new Date().toISOString()
    });
    
    // Return a locally generated response
    return {
      id: `local-${Date.now()}`,
      status: 'pending',
      ...eventData
    };
  }
};

/**
 * Updates the status of a track event, attempting to send to the API first.
 * If offline, queues the update for later synchronization.
 * 
 * @param id Event ID to update
 * @param statusData Status update data
 * @returns Promise resolving to the updated event
 */
export const updateEventStatus = async (id: string, statusData: { status: 'pending' | 'processed' | 'synced' }) => {
  try {
    // First try to send directly to API
    const response = await TrackEventsAPI.updateStatus(id, statusData);
    return response;
  } catch (error) {
    console.log('Failed to update track event status, queueing for later', error);
    
    // If offline, queue the status update
    const offlineQueue = getOfflineQueue();
    offlineQueue.add({
      type: 'track_event_status_update',
      data: { id, ...statusData },
      timestamp: new Date().toISOString()
    });
    
    // Return a simulated response
    return {
      id,
      status: statusData.status
    };
  }
};

/**
 * Gets track event fixtures, with offline fallback if available
 * 
 * @returns Promise resolving to track event fixtures
 */
export const getTrackFixtures = async () => {
  try {
    // Try to get from API
    return await TrackEventsAPI.getFixtures();
  } catch (error) {
    console.log('Failed to get track fixtures, checking offline storage', error);
    
    // In a real implementation, you would check for cached fixtures in IndexedDB or localStorage
    // This is a placeholder implementation
    return []; // Return empty array or cached data
  }
};