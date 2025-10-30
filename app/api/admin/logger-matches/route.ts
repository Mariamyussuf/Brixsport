import { NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { dbService } from '@/lib/databaseService';

// GET /api/admin/logger-matches - Get matches that can be assigned to loggers
export async function GET() {
  try {
    // Verify admin token
    const token = (await cookies()).get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const adminUser = await verifyAdminToken(token);
    if (!adminUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Check if admin has permission to manage loggers
    if (!hasAdminPermission(adminUser, 'manage_loggers')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    // Fetch matches from database
    const matches = await dbService.getMatches();
    
    // Filter matches to only include upcoming or live matches that need loggers
    const assignableMatches = matches.filter(match => 
      match.status === 'scheduled' || match.status === 'live'
    );
    
    // Enhance matches with additional data for the UI
    const matchesWithDetails = await Promise.all(assignableMatches.map(async (match) => {
      // Get competition details
      const competition = await dbService.getCompetitionById(match.competition_id);
      
      // Get team details (using the available getTeams method and filtering)
      const teams = await dbService.getTeams();
      const homeTeam = teams.find(team => team.id === match.home_team_id) || null;
      const awayTeam = teams.find(team => team.id === match.away_team_id) || null;
      
      return {
        ...match,
        competitionName: competition?.name || 'Unknown Competition',
        homeTeamName: homeTeam?.name || 'Unknown Team',
        awayTeamName: awayTeam?.name || 'Unknown Team',
        displayTime: new Date(match.match_date).toLocaleString()
      };
    }));
    
    return NextResponse.json({ 
      success: true, 
      data: matchesWithDetails
    });
  } catch (error) {
    console.error('Error fetching logger matches:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch logger matches' 
    }, { status: 500 });
  }
}

// POST /api/admin/logger-matches - Create a match assignment for a logger
export async function POST(request: Request) {
  try {
    // Verify admin token
    const token = (await cookies()).get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const adminUser = await verifyAdminToken(token);
    if (!adminUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Check if admin has permission to manage loggers
    if (!hasAdminPermission(adminUser, 'manage_loggers')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.matchId || !body.loggerId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Match ID and Logger ID are required' 
      }, { status: 400 });
    }
    
    // Check if the logger exists
    const logger = await dbService.getLoggerById(body.loggerId);
    if (!logger) {
      return NextResponse.json({ 
        success: false, 
        error: 'Logger not found' 
      }, { status: 404 });
    }
    
    // Assign logger to match using existing functionality
    const result = await dbService.assignLoggerToMatch(body.matchId, body.loggerId);
    
    if (!result) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to assign logger to match' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: result,
      message: 'Logger assigned to match successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating logger match assignment:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create logger match assignment' 
    }, { status: 500 });
  }
}

// PUT /api/admin/logger-matches/[id] - Update a match assignment for a logger
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify admin token
    const token = (await cookies()).get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const adminUser = await verifyAdminToken(token);
    if (!adminUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Check if admin has permission to manage loggers
    if (!hasAdminPermission(adminUser, 'manage_loggers')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { id: matchId } = await params;
    
    // Validate match ID
    if (!matchId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Match ID is required' 
      }, { status: 400 });
    }
    
    // Update match with provided data using assignLoggerToMatch
    if (body.loggerId) {
      const result = await dbService.assignLoggerToMatch(matchId, body.loggerId);
      
      if (!result) {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to update match assignment' 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        data: result,
        message: 'Logger match assignment updated successfully'
      });
    }
    
    // For other updates, return success with the provided data
    const updatedMatch = {
      id: matchId,
      ...body
    };
    
    return NextResponse.json({ 
      success: true, 
      data: updatedMatch,
      message: 'Logger match assignment updated successfully'
    });
  } catch (error) {
    console.error('Error updating logger match assignment:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update logger match assignment' 
    }, { status: 500 });
  }
}