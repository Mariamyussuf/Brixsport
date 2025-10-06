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
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}

// POST /api/matches - Create a new match
export async function POST(request: Request) {
  try {
    const { homeTeam, awayTeam, venue, date } = await request.json();
    
    // In a real implementation, this would create a match in the database
    // For now, we'll return a success response with the data
    // TODO: Implement real database creation
    console.log('Creating match:', { homeTeam, awayTeam, venue, date });
    
    return NextResponse.json({
      success: true,
      data: {
        id: Date.now(),
        homeTeam,
        awayTeam,
        venue,
        date,
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
        created_at: new Date().toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create match:', error);
    return NextResponse.json({ error: 'Failed to create match' }, { status: 500 });
  }
}