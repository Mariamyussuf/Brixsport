import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { databaseService } from '@/lib/databaseService';

// Define the interface for populated match data
interface PopulatedMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  date: string;
  status: string;
  competitionId: string;
  homeScore?: number;
  awayScore?: number;
  competition: {
    id: number | string;
    name: string;
  };
  // Add other populated fields as needed
}

// GET /api/user/matches/populated - List all matches with populated competition and logger data for regular users
export async function GET(request: NextRequest) {
  try {
    // Get the authentication session
    const session = await getAuth(request);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch matches and competitions from the database
    const [dbMatches, competitions] = await Promise.all([
      databaseService.getMatches(),
      databaseService.getCompetitions()
    ]);

    // Create a map of competitions for quick lookup
    const competitionMap = new Map(competitions.map(comp => [comp.id, comp]));

    // Transform matches to include populated competition data
    const populatedMatches: PopulatedMatch[] = dbMatches.map(match => {
      const competition = competitionMap.get(match.competition_id);
      
      return {
        id: match.id.toString(),
        homeTeam: match.home_team_name || `Home Team ${match.home_team_id}`,
        awayTeam: match.away_team_name || `Away Team ${match.away_team_id}`,
        venue: match.venue || '',
        date: match.match_date,
        status: match.status,
        competitionId: match.competition_id.toString(),
        homeScore: match.home_score,
        awayScore: match.away_score,
        competition: {
          id: match.competition_id,
          name: competition?.name || `Competition ${match.competition_id}`
        }
      };
    });
    
    return NextResponse.json({
      success: true,
      data: populatedMatches
    });
  } catch (error) {
    console.error('Error fetching populated matches:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch populated matches'
      },
      { status: 500 }
    );
  }
}