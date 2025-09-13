// useCompetition Hook
// Custom hook for fetching and managing a single competition's data

import { useState, useEffect } from 'react';
import { getCompetitionById } from '@/lib/userCompetitionService';
import { Competition } from '@/lib/userCompetitionService';

// Hook return type
interface UseCompetitionReturn {
  competition: Competition | null;
  loading: boolean;
  error: string | null;
  refreshCompetition: () => void;
}

/**
 * Custom hook for managing a single competition's data
 * @param id - Competition ID
 * @returns Object containing competition data, loading state, error state, and helper functions
 */
export const useCompetition = (id: string): UseCompetitionReturn => {
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch competition from API
   */
  const fetchCompetition = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getCompetitionById(id);
      setCompetition(data);
    } catch (err: any) {
      console.error('Error fetching competition:', err);
      
      // Handle different error types
      if (err.message.includes('401')) {
        setError('Unauthorized: Please log in to view competition');
      } else if (err.message.includes('404')) {
        setError('Competition not found');
      } else if (err.message.includes('500')) {
        setError('Server error: Unable to fetch competition');
      } else {
        setError('Failed to load competition. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch competition on component mount or when ID changes
  useEffect(() => {
    if (id) {
      fetchCompetition();
    }
  }, [id]);

  return {
    competition,
    loading,
    error,
    refreshCompetition: fetchCompetition
  };
};