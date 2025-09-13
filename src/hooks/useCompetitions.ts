// useCompetitions Hook
// Custom hook for fetching and managing competitions data

import { useState, useEffect } from 'react';
import { getCompetitions } from '@/lib/userCompetitionService';
import { Competition } from '@/lib/userCompetitionService';

// Hook return type
interface UseCompetitionsReturn {
  competitions: Competition[];
  loading: boolean;
  error: string | null;
  refreshCompetitions: () => void;
}

/**
 * Custom hook for managing competitions data
 * @returns Object containing competitions data, loading state, error state, and helper functions
 */
export const useCompetitions = (): UseCompetitionsReturn => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch competitions from API
   */
  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getCompetitions();
      setCompetitions(data);
    } catch (err: any) {
      console.error('Error fetching competitions:', err);
      
      // Handle different error types
      if (err.message.includes('401')) {
        setError('Unauthorized: Please log in to view competitions');
      } else if (err.message.includes('500')) {
        setError('Server error: Unable to fetch competitions');
      } else {
        setError('Failed to load competitions. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch competitions on component mount
  useEffect(() => {
    fetchCompetitions();
  }, []);

  return {
    competitions,
    loading,
    error,
    refreshCompetitions: fetchCompetitions
  };
};