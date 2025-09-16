// Favorites Service
// Provides integration with the Favorites API endpoint

import APIService from '@/services/APIService';
import { APIEndpoint } from '@/types/api';
import { handleApiError } from '@/types/apiError';
import { Team } from '@/types/favorites';
import { Player } from '@/types/favorites';
import { Competition } from '@/lib/competitionService';

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

// Define API endpoint for favorites
const favoritesEndpoints = {
  getFavorites: {
    url: '/favorites',
    method: 'GET'
  } as APIEndpoint<FavoritesResponse>,
  
  addFavorite: {
    url: '/favorites',
    method: 'POST'
  } as APIEndpoint<AddFavoriteResponse>,
  
  removeFavorite: {
    url: '/favorites',
    method: 'DELETE'
  } as APIEndpoint<RemoveFavoriteResponse>
};

/**
 * Gets all favorite items for the current user
 * @returns Promise resolving to user's favorites data with teams, players, and competitions
 */
export async function getFavorites(): Promise<FavoritesResponse> {
  try {
    const response = await APIService.request(favoritesEndpoints.getFavorites);
    
    if (response.success && response.data) {
      return {
        teams: response.data.teams || [],
        players: response.data.players || [],
        competitions: response.data.competitions || []
      };
    }
    
    // If response is not successful or data is missing, return empty arrays
    return {
      teams: [],
      players: [],
      competitions: []
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
    const requestBody = {
      favorite_type,
      favorite_id
    };
    
    const response = await APIService.request(
      favoritesEndpoints.addFavorite,
      requestBody
    );
    
    if (response.success && response.data) {
      return {
        success: response.data.success,
        message: response.data.message
      };
    }
    
    // If response is not successful or data is missing, return failure
    return {
      success: false,
      message: 'Failed to add favorite'
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
    const requestBody = {
      favorite_type,
      favorite_id
    };
    
    const response = await APIService.request(
      favoritesEndpoints.removeFavorite,
      requestBody
    );
    
    if (response.success && response.data) {
      return {
        success: response.data.success,
        message: response.data.message
      };
    }
    
    // If response is not successful or data is missing, return failure
    return {
      success: false,
      message: 'Failed to remove favorite'
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