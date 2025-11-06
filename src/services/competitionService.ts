import { databaseService } from '@/lib/databaseService';
import { Competition } from '@/types/favorites';

class CompetitionService {
  async createCompetition(data: Partial<Omit<Competition, 'id'>>): Promise<any> {
    try {
      // Use databaseService to create competition
      const newCompetition = await databaseService.createCompetition({
        name: data.name || '',
        type: data.type || '',
        category: data.category || '',
        status: data.status || 'active',
        start_date: data.start_date || null,
        end_date: data.end_date || null
      });
      
      return {
        success: true,
        data: newCompetition
      };
    } catch (error) {
      console.error('Error creating competition:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create competition');
    }
  }

  async getAll(): Promise<Competition[]> {
    try {
      // Fetch competitions from database service
      const dbCompetitions = await databaseService.getCompetitions();
      
      // Transform to Competition type
      return dbCompetitions.map(competition => ({
        id: competition.id,
        name: competition.name,
        type: competition.type,
        category: competition.category,
        status: competition.status,
        start_date: competition.start_date || new Date().toISOString(),
        end_date: competition.end_date || new Date(Date.now() + 86400000 * 30).toISOString(), // 30 days from now
        created_at: competition.created_at
      }));
    } catch (error) {
      console.error('Failed to fetch competitions:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch competitions');
    }
  }
}

export default new CompetitionService();