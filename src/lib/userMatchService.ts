// User Match Service
// Provides integration with the Match API endpoints for regular users

import { API_BASE_URL } from './apiConfig';

// Match interface
export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  date: string;
  status: string;
  competitionId?: string;
  homeScore?: number;
  awayScore?: number;
  events?: MatchEvent[];
}

// Match Event interface
export interface MatchEvent {
  id: string;
  type: string;
  time: string;
  description: string;
  playerId?: string;
  teamId?: string;
}

// Generic request function with authentication
const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  try {
    // Get auth session
    // Note: This is a simplified version. In a real implementation, you would pass the request object
    // from the API route to getAuth() to properly extract headers/cookies
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Gets all matches
 * @returns Promise resolving to array of matches
 */
export const getMatches = async (): Promise<Match[]> => {
  try {
    const response = await fetchAPI('/matches');
    return response.matches || [];
  } catch (error) {
    console.error('Failed to fetch matches:', error);
    return [];
  }
};

/**
 * Gets matches by competition ID
 * @param competitionId Competition ID
 * @returns Promise resolving to array of matches in the competition
 */
export const getMatchesByCompetition = async (competitionId: string): Promise<Match[]> => {
  try {
    const response = await fetchAPI(`/matches?competitionId=${competitionId}`);
    return response.matches || [];
  } catch (error) {
    console.error(`Failed to fetch matches for competition ${competitionId}:`, error);
    return [];
  }
};

/**
 * Gets populated matches with competition and logger data
 * @returns Promise resolving to array of populated matches
 */
export const getPopulatedMatches = async (): Promise<any[]> => {
  try {
    const response = await fetchAPI('/matches/populated');
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch populated matches:', error);
    return [];
  }
};

/**
 * Gets a match by ID
 * @param id Match ID
 * @returns Promise resolving to match or null if not found
 */
export const getMatchById = async (id: string): Promise<Match | null> => {
  try {
    // Fetch a specific match by ID from the API
    const response = await fetch(`${API_BASE_URL}/matches/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch match with ID ${id}`);
    }
    const match = await response.json();
    return match;
  } catch (error) {
    console.error(`Failed to fetch match with ID ${id}:`, error);
    return null;
  }
};

/**
 * Gets live matches
 * @returns Promise resolving to array of live matches
 */
export const getLiveMatches = async (): Promise<Match[]> => {
  try {
    const response = await fetchAPI('/live/matches');
    // Ensure we always return an array, even if the API response structure is different
    if (response && Array.isArray(response.data)) {
      return response.data;
    }
    if (response && Array.isArray(response)) {
      return response;
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch live matches:', error);
    // Always return an empty array in case of error
    return [];
  }
};
