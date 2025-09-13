// useFavorites Hook
// Custom hook for managing user favorites state

import { useState, useEffect } from 'react';
import { Team, Player, Competition } from '@/lib/userFavoritesService';

// Define the favorites data interface
export interface FavoritesData {
  teams: Team[];
  players: Player[];
  competitions: Competition[];
}

// Hook return type
interface UseFavoritesReturn {
  favorites: FavoritesData | null;
  loading: boolean;
  error: string | null;
  refreshFavorites: () => void;
  removeFavorite: (type: 'team' | 'player' | 'competition', id: string) => void;
}

/**
 * Custom hook for managing user favorites
 * @returns Object containing favorites data, loading state, error state, and helper functions
 */
export const useFavorites = (): UseFavoritesReturn => {
  const [favorites, setFavorites] = useState<FavoritesData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user favorites from API
   */
  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
      
      setFavorites(data.data);
    } catch (err: any) {
      console.error('Error fetching favorites:', err);
      
      // Handle different error types
      if (err.message.includes('401')) {
        setError('Unauthorized: Please log in to view your favorites');
      } else if (err.message.includes('404')) {
        setError('No favorites found');
        setFavorites({ teams: [], players: [], competitions: [] });
      } else if (err.message.includes('500')) {
        setError('Server error: Unable to fetch favorites');
      } else {
        setError(err.message || 'Failed to load favorites. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove a favorite item
   * @param type - Type of favorite to remove
   * @param id - ID of favorite to remove
   */
  const removeFavorite = (type: 'team' | 'player' | 'competition', id: string) => {
    if (!favorites) return;
    
    // In a real implementation, this would make an API call to remove the favorite
    // For now, we'll just update the local state
    
    switch (type) {
      case 'team':
        setFavorites({
          ...favorites,
          teams: favorites.teams.filter(team => team.id !== id)
        });
        break;
      case 'player':
        setFavorites({
          ...favorites,
          players: favorites.players.filter(player => player.id !== id)
        });
        break;
      case 'competition':
        setFavorites({
          ...favorites,
          competitions: favorites.competitions.filter(competition => competition.id !== id)
        });
        break;
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
    removeFavorite
  };
};