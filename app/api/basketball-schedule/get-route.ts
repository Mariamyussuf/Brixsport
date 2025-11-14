import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const dateParam = url.searchParams.get('date');
    const dateFromParam = url.searchParams.get('dateFrom');
    const dateToParam = url.searchParams.get('dateTo');
    // Get basketball competition
    const { data: competition, error: competitionError } = await supabase
      .from('Competition')
      .select('id')
      .eq('name', 'BUSA LEAGUE COMPETITION')
      .eq('description', 'BUSA League Competition - Basketball Division')
      .single();

    if (competitionError) {
      return NextResponse.json(
        { error: 'Failed to fetch basketball competition' },
        { status: 500 }
      );
    }

    if (!competition) {
      return NextResponse.json(
        { error: 'Basketball competition not found' },
        { status: 404 }
      );
    }

    // Get all matches for this competition
    let query = supabase
      .from('Match')
      .select(`
        id,
        homeTeamId,
        awayTeamId,
        startTime,
        venue,
        status,
        homeTeam:Team!Match_homeTeamId_fkey(name, logo),
        awayTeam:Team!Match_awayTeamId_fkey(name, logo)
      `)
      .eq('competitionId', competition.id)
      .order('startTime', { ascending: true });

    if (dateParam) {
      const dayStart = new Date(dateParam);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dateParam);
      dayEnd.setHours(23, 59, 59, 999);
      query = query.gte('startTime', dayStart.toISOString()).lte('startTime', dayEnd.toISOString());
    } else {
      if (dateFromParam) {
        query = query.gte('startTime', new Date(dateFromParam).toISOString());
      }
      if (dateToParam) {
        query = query.lte('startTime', new Date(dateToParam).toISOString());
      }
    }

    const { data: matches, error: matchesError } = await query;

    if (matchesError) {
      return NextResponse.json(
        { error: 'Failed to fetch matches' },
        { status: 500 }
      );
    }

    // Transform the data into rounds
    const rounds = transformMatchesToRounds(matches);

    return NextResponse.json({
      rounds
    });
  } catch (error: any) {
    console.error('Error fetching basketball schedule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

const transformMatchesToRounds = (matches: any[]) => {
  // Group matches by date
  const matchesByDate: Record<string, any[]> = {};
  
  matches.forEach(match => {
    const date = match.startTime.split('T')[0];
    if (!matchesByDate[date]) {
      matchesByDate[date] = [];
    }
    matchesByDate[date].push({
      id: match.id,
      home_team_name: match.homeTeam?.name || 'TBD',
      away_team_name: match.awayTeam?.name || 'TBD',
      scheduled_at: match.startTime,
      venue: match.venue,
      status: match.status,
      home_team_logo: match.homeTeam?.logo || null,
      away_team_logo: match.awayTeam?.logo || null
    });
  });

  // Convert to rounds format
  const rounds = Object.entries(matchesByDate).map(([date, matches], index) => ({
    round: index + 1,
    date,
    matches
  }));

  return rounds;
};