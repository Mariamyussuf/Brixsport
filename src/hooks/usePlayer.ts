import { useState, useEffect, useCallback } from 'react';
import playerService from '@/services/playerService';
import { Player, CareerStats } from '@/types/brixsports';

interface UsePlayerResult {
  player: Player | null;
  loading: boolean;
  error: string | null;
  fetchPlayer: (id: string) => Promise<void>;
  updatePlayer: (id: string, data: Partial<Player>) => Promise<Player | null>;
  deletePlayer: (id: string) => Promise<boolean>;
}

interface UsePlayerStatsResult {
  stats: CareerStats | null;
  loading: boolean;
  error: string | null;
  fetchStats: (id: string) => Promise<void>;
  updateStats: (id: string, stats: CareerStats) => Promise<CareerStats | null>;
}

export const usePlayer = (): UsePlayerResult => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayer = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await playerService.getPlayerById(id);
      
      if (response.success) {
        setPlayer(response.data || null);
      } else {
        setError(response.error?.message || 'Failed to fetch player');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePlayer = useCallback(async (id: string, data: Partial<Player>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await playerService.updatePlayer(id, data);
      
      if (response.success) {
        setPlayer(response.data || null);
        return response.data || null;
      } else {
        setError(response.error?.message || 'Failed to update player');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePlayer = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await playerService.deletePlayer(id);
      
      if (response.success) {
        setPlayer(null);
        return true;
      } else {
        setError(response.error?.message || 'Failed to delete player');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    player,
    loading,
    error,
    fetchPlayer,
    updatePlayer,
    deletePlayer
  };
};

export const usePlayerStats = (): UsePlayerStatsResult => {
  const [stats, setStats] = useState<CareerStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await playerService.getPlayerStats(id);
      
      if (response.success) {
        setStats(response.data || null);
      } else {
        setError(response.error?.message || 'Failed to fetch player stats');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStats = useCallback(async (id: string, statsData: CareerStats) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await playerService.updatePlayerStats(id, { stats: statsData });
      
      if (response.success) {
        setStats(response.data || null);
        return response.data || null;
      } else {
        setError(response.error?.message || 'Failed to update player stats');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    stats,
    loading,
    error,
    fetchStats,
    updateStats
  };
};