import { databaseService } from '@/lib/databaseService';
import { Competition } from '@/types/favorites';

class CompetitionService {
  async createCompetition(data: Partial<Omit<Competition, 'id'>>): Promise<any> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/v1/competitions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to create competition: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data
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