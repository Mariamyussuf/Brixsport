// CompetitionService implementation (lowercase filename)
import APIService from './APIService';
import { APIEndpoint } from '@/types/api';
import { Competition } from '@/types/favorites';

const competitionEndpoints = {
  createCompetition: {
    url: '/competitions',
    method: 'POST',
  } as APIEndpoint<Competition>,
  getAll: {
    url: '/competitions',
    method: 'GET',
  } as APIEndpoint<Competition[]>,
};

class CompetitionService {
  async createCompetition(data: Partial<Omit<Competition, 'id'>>): Promise<any> {
    // Accept partial form-like data from the UI and forward to APIService
    return APIService.request(competitionEndpoints.createCompetition, data);
  }

  async getAll(): Promise<Competition[]> {
    const response = await APIService.request(competitionEndpoints.getAll);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to fetch competitions');
  }
}

export default new CompetitionService();