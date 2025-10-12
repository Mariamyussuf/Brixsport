import { useState, useCallback } from 'react';
import searchService from '@/services/searchService';
import { GlobalSearchParams, GlobalSearchResult } from '@/types/brixsports';

interface UseSearchResult {
  results: GlobalSearchResult | null;
  loading: boolean;
  error: string | null;
  search: (params: GlobalSearchParams) => Promise<void>;
}

export const useSearch = (): UseSearchResult => {
  const [results, setResults] = useState<GlobalSearchResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (params: GlobalSearchParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await searchService.globalSearch(params);
      
      if (response.success) {
        setResults(response.data || null);
      } else {
        setError(response.error?.message || 'Failed to perform search');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    results,
    loading,
    error,
    search
  };
};