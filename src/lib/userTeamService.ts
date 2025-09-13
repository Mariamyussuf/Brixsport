// User Team Service
// Provides integration with the Team API endpoints for regular users

import { API_BASE_URL } from './apiConfig';
import { Team as UserTeam } from '@/lib/api';

// Team interface (matching the one from matchEvents for consistency)
export interface Team {
  id: string;
  name: string;
  logoUrl: string;
  coachName: string;
  players: Player[];
}

// Player interface (matching the one from matchEvents for consistency)
export interface Player {
  id: string;
  teamId: string;
  name: string;
  jerseyNumber: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  status: 'on-field' | 'substituted' | 'injured';
}

// Generic request function with authentication
const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  try {
    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    if (!token) {
      throw new Error('Unauthorized: No authentication token found');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
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
 * Gets all teams
 * @returns Promise resolving to array of teams
 */
export const getTeams = async (): Promise<UserTeam[]> => {
  try {
    const response = await fetchAPI('/teams');
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch teams:', error);
    return [];
  }
};

/**
 * Gets teams by competition ID
 * @param competitionId Competition ID
 * @returns Promise resolving to array of teams in the competition
 */
export const getTeamsByCompetition = async (competitionId: string): Promise<Team[]> => {
  try {
    const response = await fetchAPI(`/teams?competitionId=${competitionId}`);
    if (response.success) {
      return response.data || [];
    }
    return [];
  } catch (error) {
    console.error(`Failed to fetch teams for competition ${competitionId}:`, error);
    return [];
  }
};

/**
 * Gets a team by ID
 * @param id Team ID
 * @returns Promise resolving to team or null if not found
 */
export const getTeamById = async (id: string): Promise<Team | null> => {
  try {
    const response = await fetchAPI(`/teams/${id}`);
    if (response.success) {
      return response.data || null;
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch team with ID ${id}:`, error);
    return null;
  }
};

export default {
  getTeams,
  getTeamsByCompetition,
  getTeamById
};