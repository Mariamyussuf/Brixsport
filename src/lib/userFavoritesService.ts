// User Favorites Service
// Provides integration with the Favorites API endpoints for regular users

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
    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    if (!token) {
      throw new Error('Unauthorized: No authentication token found');
    }
    
    const response = await fetch('/api/user/favorites', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch favorites');
    }
    
    return data.data;
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
    return null;
  }
};

export default {
  getFavorites
};