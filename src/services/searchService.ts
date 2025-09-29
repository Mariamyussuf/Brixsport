import APIService from './APIService';
import { searchEndpoints } from '@/lib/apiEndpoints';
import { APIResponse } from '@/types/api';
import { GlobalSearchParams, GlobalSearchResult } from '@/types/brixsports';

class SearchService {
  /**
   * Search players, competitions, and teams (Authenticated users only)
   */
  async globalSearch(
    params: GlobalSearchParams,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<GlobalSearchResult>> {
    try {
      const endpoint = searchEndpoints.globalSearch(params);
      return await APIService.request(endpoint, undefined, undefined, options);
    } catch (error) {
      console.error('Failed to perform search:', error);
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to perform search' 
        } 
      };
    }
  }
}

export default new SearchService();