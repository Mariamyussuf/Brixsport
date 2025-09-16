import APIService from './APIService';
import { APIEndpoint } from '@/types/api';
import { Team } from '@/types/favorites';
import { TokenManager } from '@/hooks/useAuth';

const teamEndpoints = {
  getAll: {
    url: '/teams',
    method: 'GET',
  } as APIEndpoint<Team[]>,
};

class TeamService {
  async getAll(): Promise<Team[]> {
    // Get auth token from TokenManager
    const authToken = TokenManager.getToken();
    const response = await APIService.request(
      teamEndpoints.getAll,
      undefined,
      undefined,
      { authToken: authToken || undefined }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to fetch teams');
  }
}

export default new TeamService();
