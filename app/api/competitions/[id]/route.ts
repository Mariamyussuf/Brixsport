import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/databaseService';

// GET /api/competitions/[id] - Get a specific competition by ID with matches
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // `params` is a Promise in the generated Next types — await it
    const { id } = await params;
    
    // Convert id to number
    const competitionId = parseInt(id, 10);
    if (isNaN(competitionId)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid competition ID'
        },
        { status: 400 }
      );
    }
    
    // Fetch competition from database
    const competitions = await databaseService.getCompetitions();
    const competition = competitions.find(c => c.id === competitionId);
    
    if (!competition) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Competition not found'
        },
        { status: 404 }
      );
    }
    
    // Fetch matches for this competition
    const competitionMatches = await databaseService.getMatchesByCompetition(competitionId);
    const formattedMatches = competitionMatches.map(match => ({
      id: match.id,
      competition_id: match.competition_id,
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
      match_date: match.match_date,
      venue: match.venue,
      status: match.status,
      home_score: match.home_score || 0,
      away_score: match.away_score || 0,
      current_minute: match.current_minute || 0,
      period: match.period,
      created_at: match.match_date,
      home_team_name: match.home_team_name || `Home Team ${match.home_team_id}`,
      home_team_logo: match.home_team_logo || '',
      away_team_name: match.away_team_name || `Away Team ${match.away_team_id}`,
      away_team_logo: match.away_team_logo || '',
      competition_name: match.competition_name || 'Competition'
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        competition: {
          id: competition.id,
          name: competition.name,
          type: competition.type,
          category: competition.category,
          status: competition.status,
          start_date: competition.start_date,
          end_date: competition.end_date,
          created_at: competition.created_at
        },
        matches: formattedMatches
      }
    });
  } catch (error) {
    console.error('Error fetching competition:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch competition'
      },
      { status: 500 }
    );
  }
}