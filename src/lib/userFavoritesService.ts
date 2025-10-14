// User Favorites Service
// Provides integration with the Favorites API endpoints for regular users

import { databaseService } from '@/lib/databaseService';

// Team interface
export interface Team {
  id: string;
  name: string;
  logo_url: string;
  founded_year: number;
  stadium: string;
  city: string;
  color?: string;
}

// Player interface
export interface Player {
  id: string;
  name: string;
  position: string;
  team_id: string;
  nationality: string;
  age: number;
  teamColor?: string;
  number?: string;
}

// Competition interface
export interface Competition {
  id: string;
  name: string;
  type: string;
  country: string;
  season: string;
  color?: string;
  description?: string;
  sportType?: string;
}

// Favorites data interface
export interface FavoritesData {
  teams: Team[];
  players: Player[];
  competitions: Competition[];
}

/**
 * Gets all favorite items for the current user
 * @returns Promise resolving to user's favorites data
 */
export const getFavorites = async (): Promise<FavoritesData | null> => {
  try {
    // Make actual API call to fetch favorites
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
    
    const response = await fetch(`${API_BASE_URL}/favorites`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API call failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch favorites');
    }
    
    return {
      teams: data.data?.teams || [],
      players: data.data?.players || [],
      competitions: data.data?.competitions || []
    };
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
    // Return empty arrays as fallback
    return {
      teams: [],
      players: [],
      competitions: []
    };
  }
};

export default {
  getFavorites
};