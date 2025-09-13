import APIService from './APIService';
import { APIEndpoint } from '@/types/api';
import { Team } from '@/types/favorites';

const teamEndpoints = {
  getAll: {
    url: '/teams',
    method: 'GET',
  } as APIEndpoint<Team[]>,
};

class TeamService {
  async getAll(): Promise<Team[]> {
    const response = await APIService.request(teamEndpoints.getAll);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to fetch teams');
  }
}

export default new TeamService();
