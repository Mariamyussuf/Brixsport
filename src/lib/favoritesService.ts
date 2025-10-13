import { APIEndpoint } from '@/types/api';
import { handleApiError } from '@/types/apiError';
import { Team } from '@/types/favorites';
import { Player } from '@/types/favorites';
import { Competition } from '@/lib/competitionService';
import { TokenManager } from '@/hooks/useAuth'; 
import { databaseService } from '@/lib/databaseService';

// Favorites response interface
export interface FavoritesResponse {
  teams: Team[];
  players: Player[];
  competitions: Competition[];
}

// Add favorite response interface
export interface AddFavoriteResponse {
  success: boolean;
  message: string;
}

// Remove favorite response interface
export interface RemoveFavoriteResponse {
  success: boolean;
  message: string;
}

/**
 * Gets all favorite items for the current user
 * @returns Promise resolving to user's favorites data with teams, players, and competitions
 */
export async function getFavorites(): Promise<FavoritesResponse> {
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
    handleApiError(error);
    // Return empty arrays as fallback
    return {
      teams: [],
      players: [],
      competitions: []
    };
  }
}

/**
 * Adds a favorite item for the current user
 * @param favorite_type - Type of favorite to add (team, player, or competition)
 * @param favorite_id - ID of the favorite item
 * @returns Promise resolving to the response from the server
 */
export async function addFavorite(favorite_type: string, favorite_id: number): Promise<AddFavoriteResponse> {
  try {
    // Make actual API call to add favorite
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
    
    const response = await fetch(`${API_BASE_URL}/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        favorite_type,
        favorite_id
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API call failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: data.success,
      message: data.message || 'Favorite added successfully'
    };
  } catch (error) {
    handleApiError(error);
    // Return failure as fallback
    return {
      success: false,
      message: 'Failed to add favorite due to network error'
    };
  }
}

/**
 * Removes a favorite item for the current user
 * @param favorite_type - Type of favorite to remove (team, player, or competition)
 * @param favorite_id - ID of the favorite item
 * @returns Promise resolving to the response from the server
 */
export async function removeFavorite(favorite_type: string, favorite_id: number): Promise<RemoveFavoriteResponse> {
  try {
    // Make actual API call to remove favorite
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
    
    const response = await fetch(`${API_BASE_URL}/favorites`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        favorite_type,
        favorite_id
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API call failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: data.success,
      message: data.message || 'Favorite removed successfully'
    };
  } catch (error) {
    handleApiError(error);
    // Return failure as fallback
    return {
      success: false,
      message: 'Failed to remove favorite due to network error'
    };
  }
}

export default {
  getFavorites,
  addFavorite,
  removeFavorite
};