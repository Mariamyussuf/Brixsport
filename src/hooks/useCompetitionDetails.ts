// useCompetitionDetails Hook
// Custom hook for fetching and managing a single competition's details with matches

import { useState, useEffect } from 'react';
import { getCompetitionById } from '@/lib/competitionService';
import { CompetitionDetailsResponse } from '@/lib/competitionService';

// Hook return type
interface UseCompetitionDetailsReturn {
  competitionData: CompetitionDetailsResponse | null;
  loading: boolean;
  error: string | null;
  refreshCompetition: () => void;
}

/**
 * Custom hook for managing a single competition's details with matches
 * @param id - Competition ID
 * @returns Object containing competition data with matches, loading state, error state, and helper functions
 */
export const useCompetitionDetails = (id: number): UseCompetitionDetailsReturn => {
  const [competitionData, setCompetitionData] = useState<CompetitionDetailsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch competition details from API
   */
  const fetchCompetitionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getCompetitionById(id);
      setCompetitionData(data);
    } catch (err: any) {
      console.error('Error fetching competition details:', err);
      
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
      fetchCompetitionDetails();
    }
  }, [id]);

  return {
    competitionData,
    loading,
    error,
    refreshCompetition: fetchCompetitionDetails
  };
};