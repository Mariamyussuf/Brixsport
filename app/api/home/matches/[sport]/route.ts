import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { dbService } from '@/lib/databaseService';

// Helper function to convert database Match to API Match
const convertMatchToAPIMatch = (match: any) => {
  return {
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
    created_at: match.created_at,
    home_team_name: match.home_team_name || `Home Team ${match.home_team_id}`,
    home_team_logo: match.home_team_logo || '',
    away_team_name: match.away_team_name || `Away Team ${match.away_team_id}`,
    away_team_logo: match.away_team_logo || '',
    competition_name: match.competition_name || 'Competition'
  };
};

// Helper function to convert database Track Event to API Track Event
const convertTrackEventToAPITrackEvent = (event: any) => {
  return {
    id: event.id,
    competition_id: event.competition_id || 0,
    event_name: event.event_name || `Track Event ${event.id}`,
    event_type: event.event_type || 'Race',
    gender: event.gender || 'Men',
    scheduled_time: event.scheduled_time || event.match_date,
    status: event.status
  };
};

// GET /api/home/matches/[sport]?status=[status]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sport: string }> }
) {
  console.log('Matches API route called with sport:', params);
  
  try {
    const { sport } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    
    console.log('Sport:', sport, 'Status:', status);

    // Validate sport parameter
    if (!['football', 'basketball', 'track'].includes(sport)) {
      console.log('Invalid sport parameter:', sport);
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid sport parameter. Must be football, basketball, or track.'
        },
        { status: 400 }
      );
    }

    // Get the authenticated user (optional for public access)
    const session = await getAuth(request);
    console.log('Authentication session:', session ? 'Authenticated' : 'Not authenticated');
    
    console.log('Fetching matches from database service');
    
    let matches: any[] = [];
    
    // Fetch matches based on sport and status
    switch (sport) {
      case 'football':
        console.log('Fetching football matches');
        matches = await Promise.race([
          dbService.getMatchesBySport('football'),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Database timeout')), 15000)
          )
        ]);
        break;
      case 'basketball':
        console.log('Fetching basketball matches');
        matches = await Promise.race([
          dbService.getMatchesBySport('basketball'),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Database timeout')), 15000)
          )
        ]);
        break;
      case 'track':
        console.log('Fetching track matches');
        matches = await Promise.race([
          dbService.getMatchesBySport('track'),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Database timeout')), 15000)
          )
        ]);
        break;
      default:
        console.log('Unknown sport, returning empty array');
        matches = [];
    }
    
    console.log('Matches fetched:', matches.length);

    // Filter by status if not 'all'
    if (status !== 'all') {
      console.log('Filtering matches by status:', status);
      matches = matches.filter(match => match.status === status);
      console.log('Matches after filtering:', matches.length);
    }

    // Convert matches to API format
    console.log('Converting matches to API format');
    let responseData: any[];
    if (sport === 'track') {
      responseData = matches.map(convertTrackEventToAPITrackEvent);
    } else {
      responseData = matches.map(convertMatchToAPIMatch);
    }
    
    console.log('Sending response with', responseData.length, 'items');

    return NextResponse.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Failed to fetch matches by sport:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch matches'
      },
      { status: 500 }
    );
  }
}