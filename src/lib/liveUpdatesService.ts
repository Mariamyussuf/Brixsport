// Live Updates Service
// Provides integration with the LiveUpdates API with offline capabilities

import { LiveUpdatesAPI, LiveMatch, LiveEvent, MatchesAPI } from './api';

/**
 * Gets all currently live matches
 * @returns Promise resolving to array of live matches
 */
export const getLiveMatches = async (): Promise<LiveMatch[]> => {
  try {
    return await LiveUpdatesAPI.getLiveMatches();
  } catch (error) {
    console.error('Failed to fetch live matches:', error);
    // No offline fallback for live data
    return [];
  }
};

/**
 * Updates a match score
 * @param id Match ID
 * @param scoreData Score data to update
 * @returns Promise resolving to updated match
 */
export const updateMatchScore = async (
  id: string, 
  scoreData: { homeScore: number, awayScore: number }
): Promise<LiveMatch> => {
  try {
    return await LiveUpdatesAPI.updateMatchScore(id, scoreData);
  } catch (error) {
    console.error('Failed to update match score:', error);
    throw error;
  }
};

/**
 * Adds a new live event to a match
 * @param eventData Event data to add
 * @returns Promise resolving to created event
 */
export const addLiveEvent = async (
  eventData: Omit<LiveEvent, 'id'>
): Promise<LiveEvent> => {
  try {
    return await LiveUpdatesAPI.addMatchEvent(eventData);
  } catch (error) {
    console.error('Failed to add live event:', error);
    throw error;
  }
};

/**
 * Sets up a WebSocket connection for real-time updates (if supported by API)
 * @param matchId Match ID to subscribe to
 * @param onUpdate Callback function for updates
 * @returns Function to close the connection
 */
export const subscribeToLiveUpdates = (
  matchId: string,
  onUpdate: (data: any) => void
): () => void => {
  // This is a placeholder implementation - replace with actual WebSocket code
  // if the backend supports it
  
  console.log(`Setting up subscription for match ${matchId}`);
  
  // Set up polling as fallback
  const pollingInterval = setInterval(async () => {
    try {
      const match = await MatchesAPI.getById(matchId);
      onUpdate(match);
    } catch (error) {
      console.error('Polling failed:', error);
    }
  }, 10000); // Poll every 10 seconds
  
  // Return cleanup function
  return () => {
    clearInterval(pollingInterval);
    console.log(`Cleaned up subscription for match ${matchId}`);
  };
};