import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/databaseService';

// GET /api/matches - List all matches with populated competition and logger data
export async function GET() {
  try {
    // Fetch matches from the database service
    const matches = await databaseService.getMatches();
    
    return NextResponse.json({ matches }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch matches:', error);
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch matches';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json({ 
      error: errorMessage,
      stack: errorStack
    }, { status: 500 });
  }
}

// POST /api/matches - Create a new match
export async function POST(request: Request) {
  try {
    const { homeTeam, awayTeam, venue, date, competitionId, homeTeamId, awayTeamId } = await request.json();
    
    // Create match using the database service
    const matchData = {
      competition_id: competitionId || 1, // Default to 1 if not provided
      home_team_id: homeTeamId || 1, // Default to 1 if not provided
      away_team_id: awayTeamId || 2, // Default to 2 if not provided
      home_team_name: homeTeam,
      away_team_name: awayTeam,
      venue,
      match_date: date,
      status: 'scheduled',
      home_score: 0,
      away_score: 0,
      current_minute: 0,
      period: '1st half'
    };
    
    const match = await databaseService.createMatch(matchData);
    
    return NextResponse.json({
      success: true,
      data: match
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create match:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create match' 
    }, { status: 500 });
  }
}