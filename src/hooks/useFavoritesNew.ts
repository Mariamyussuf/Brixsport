// useFavoritesNew Hook
// Custom hook for managing user favorites state with the new service

import { useState, useEffect } from 'react';
import { getFavorites, addFavorite, removeFavorite } from '@/lib/favoritesService';
import { FavoritesResponse, AddFavoriteResponse, RemoveFavoriteResponse } from '@/lib/favoritesService';

// Hook return type
interface UseFavoritesNewReturn {
  favorites: FavoritesResponse | null;
  loading: boolean;
  error: string | null;
  refreshFavorites: () => void;
  addFavorite: (favorite_type: string, favorite_id: number) => Promise<AddFavoriteResponse>;
  removeFavorite: (favorite_type: string, favorite_id: number) => Promise<RemoveFavoriteResponse>;
}

/**
 * Custom hook for managing user favorites with the new service
 * @returns Object containing favorites data, loading state, error state, and helper functions
 */
export const useFavoritesNew = (): UseFavoritesNewReturn => {
  const [favorites, setFavorites] = useState<FavoritesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user favorites from API
   */
  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getFavorites();
      setFavorites(data);
    } catch (err: any) {
      console.error('Error fetching favorites:', err);
      
      // Handle different error types
      if (err.message.includes('401')) {
        setError('Unauthorized: Please log in to view your favorites');
      } else if (err.message.includes('500')) {
        setError('Server error: Unable to fetch favorites');
      } else {
        setError(err.message || 'Failed to load favorites. Please try again.');
      }
      
      // Set empty arrays as fallback
      setFavorites({
        teams: [],
        players: [],
        competitions: []
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add a favorite item
   * @param favorite_type - Type of favorite to add (team, player, or competition)
   * @param favorite_id - ID of the favorite item
   * @returns Promise resolving to the response from the server
   */
  const handleAddFavorite = async (favorite_type: string, favorite_id: number): Promise<AddFavoriteResponse> => {
    try {
      const response = await addFavorite(favorite_type, favorite_id);
      // Refresh favorites after adding a new one
      await fetchFavorites();
      return response;
    } catch (err: any) {
      console.error('Error adding favorite:', err);
      return {
        success: false,
        message: err.message || 'Failed to add favorite. Please try again.'
      };
    }
  };

  /**
   * Remove a favorite item
   * @param favorite_type - Type of favorite to remove (team, player, or competition)
   * @param favorite_id - ID of the favorite item
   * @returns Promise resolving to the response from the server
   */
  const handleRemoveFavorite = async (favorite_type: string, favorite_id: number): Promise<RemoveFavoriteResponse> => {
    try {
      const response = await removeFavorite(favorite_type, favorite_id);
      // Refresh favorites after removing one
      await fetchFavorites();
      return response;
    } catch (err: any) {
      console.error('Error removing favorite:', err);
      return {
        success: false,
        message: err.message || 'Failed to remove favorite. Please try again.'
      };
    }
  };

  // Fetch favorites on component mount
  useEffect(() => {
    fetchFavorites();
  }, []);

  return {
    favorites,
    loading,
    error,
    refreshFavorites: fetchFavorites,
    addFavorite: handleAddFavorite,
    removeFavorite: handleRemoveFavorite
  };
};