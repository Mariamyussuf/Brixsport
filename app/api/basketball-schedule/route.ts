import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Function to load schedule data dynamically
async function loadScheduleData() {
  try {
    const filePath = path.join(process.cwd(), 'brixsport-backend', 'packages', 'database', 'basketball_schedule.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Error loading schedule data:', error);
    throw new Error('Failed to load schedule data');
  }
}

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Handle POST request - import schedule
export async function POST() {
  try {
    // Load schedule data dynamically
    const scheduleData = await loadScheduleData();
    
    // Get basketball competition
    const { data: competition, error: competitionError } = await supabase
      .from('Competition')
      .select('*')
      .eq('name', 'BUSA LEAGUE COMPETITION')
      .eq('description', 'BUSA League Competition - Basketball Division')
      .single();

    if (competitionError) {
      return NextResponse.json(
        { error: 'Failed to fetch basketball competition', details: competitionError },
        { status: 500 }
      );
    }

    if (!competition) {
      return NextResponse.json(
        { error: 'Basketball competition not found' },
        { status: 404 }
      );
    }

    // Get all basketball teams
    const { data: teams, error: teamsError } = await supabase
      .from('Team')
      .select('*')
      .eq('sport', 'BASKETBALL');

    if (teamsError) {
      return NextResponse.json(
        { error: 'Failed to fetch basketball teams', details: teamsError },
        { status: 500 }
      );
    }

    // Create a map for easy lookup by team name
    const teamMap: Record<string, any> = {};
    teams.forEach(team => {
      teamMap[team.name] = team;
    });

    // Create matches for each round
    let totalMatches = 0;
    const allMatches = [];

    for (const round of scheduleData.rounds) {
      // Parse the date
      const matchDate = new Date(round.date);
      
      for (const matchData of round.matches) {
        // Validate teams exist
        if (!teamMap[matchData.home_team] || !teamMap[matchData.away_team]) {
          console.warn(`Skipping match: Team not found - ${matchData.home_team} vs ${matchData.away_team}`);
          continue;
        }
        
        // Combine date and time
        const [hours, minutes] = matchData.time.split(':').map(Number);
        const scheduledDateTime = new Date(matchDate);
        scheduledDateTime.setHours(hours, minutes, 0, 0);
        
        // Create a match record
        const match = {
          competition_id: competition.id,
          home_team_id: teamMap[matchData.home_team].id,
          away_team_id: teamMap[matchData.away_team].id,
          scheduled_at: scheduledDateTime.toISOString(),
          venue: matchData.venue || teamMap[matchData.home_team].stadium || 'Bells University Sports Complex',
          status: 'scheduled'
        };
        
        allMatches.push(match);
        totalMatches++;
      }
    }

    // Insert all matches
    if (allMatches.length > 0) {
      const { data: insertedMatches, error: insertError } = await supabase
        .from('Match')
        .insert(allMatches)
        .select();

      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to create matches', details: insertError },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: `Successfully created ${insertedMatches.length} matches`,
        matches: insertedMatches
      });
    }

    return NextResponse.json({
      message: 'No matches to create',
      totalMatches: 0
    });
  } catch (error: any) {
    console.error('Error importing basketball schedule:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Handle PUT request - update match details
export async function PUT(request: Request) {
  try {
    const { matchId, updates } = await request.json();

    // Validate input
    if (!matchId) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Updates are required' },
        { status: 400 }
      );
    }

    // Update the match
    const { data, error } = await supabase
      .from('Match')
      .update(updates)
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update match', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Match updated successfully',
      match: data
    });
  } catch (error: any) {
    console.error('Error updating basketball match:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Handle PATCH request - update match status
export async function PATCH(request: Request) {
  try {
    const { matchId, status } = await request.json();

    // Validate input
    if (!matchId) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Update only the status
    const { data, error } = await supabase
      .from('Match')
      .update({ status })
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update match status', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Match status updated to ${status}`,
      match: data
    });
  } catch (error: any) {
    console.error('Error updating basketball match status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}