import { databaseService } from '@/lib/databaseService';
import { Team } from '@/types/favorites';
import { TokenManager } from '@/hooks/useAuth';

class TeamService {
  async getAll(): Promise<Team[]> {
    try {
      // Get auth token from TokenManager
      const authToken = TokenManager.getToken();
      
      // Fetch teams from database service
      const dbTeams = await databaseService.getTeams();
      
      // Transform to Team type
      return dbTeams.map(team => ({
        id: team.id.toString(),
        name: team.name,
        logo_url: team.logo || '',
        founded_year: 0, // Default value since not in database type
        stadium: '', // Default value since not in database type
        city: '' // Default value since not in database type
      }));
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch teams');
    }
  }
}

export default new TeamService();