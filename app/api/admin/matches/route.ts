import { NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { dbService } from '@/lib/databaseService';

// GET /api/admin/matches - Get all matches
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

    // Check if admin has permission to view matches
    if (!hasAdminPermission(adminUser, 'view_matches')) {
      // All admins should be able to view matches
    }

    // Fetch matches from database
    // Using getMatchesBySport with 'all' to get all matches
    const footballMatches = await dbService.getMatchesBySport('football');
    const basketballMatches = await dbService.getMatchesBySport('basketball');
    const trackMatches = await dbService.getMatchesBySport('track');
    
    // Combine all matches
    const matches = [...footballMatches, ...basketballMatches, ...trackMatches];
    
    return NextResponse.json({ 
      success: true, 
      data: matches 
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch matches' 
    }, { status: 500 });
  }
}

// POST /api/admin/matches - Create a new match
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

    // Check if admin has permission to manage matches
    if (!hasAdminPermission(adminUser, 'manage_matches')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.competitionId || !body.homeTeamId || !body.awayTeamId || !body.startTime || !body.sport) {
      return NextResponse.json({ 
        success: false, 
        error: 'Competition ID, home team ID, away team ID, start time, and sport are required' 
      }, { status: 400 });
    }
    
    // Create new match in storage
    const newMatch = {
      id: Date.now(), // Simple ID generation for mock
      competition_id: body.competitionId,
      home_team_id: body.homeTeamId,
      away_team_id: body.awayTeamId,
      match_date: body.startTime,
      status: body.status || 'scheduled',
      home_score: body.homeScore || null,
      away_score: body.awayScore || null,
      sport: body.sport,
      // Add other required fields with default values
    };
    
    // Add match to storage
    // Note: In a real implementation, this would be properly typed and validated
    (dbService as any).storage.addMatch(newMatch);
    
    return NextResponse.json({ 
      success: true, 
      data: newMatch 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create match' 
    }, { status: 500 });
  }
}

// PUT /api/admin/matches/:id - Update a match
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

    // Check if admin has permission to manage matches
    if (!hasAdminPermission(adminUser, 'manage_matches')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { id } = await params;
    
    // Update match in storage
    // Note: This is a simplified implementation for the mock database
    const success = (dbService as any).storage.updateMatch(parseInt(id), body);
    
    if (!success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Match not found' 
      }, { status: 404 });
    }
    
    // Get updated match
    const matches = (dbService as any).storage.getMatches();
    const updatedMatch = matches.find((m: any) => m.id === parseInt(id));
    
    return NextResponse.json({ 
      success: true, 
      data: updatedMatch 
    });
  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update match' 
    }, { status: 500 });
  }
}

// DELETE /api/admin/matches/:id - Delete a match
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    // Check if admin has permission to manage matches
    if (!hasAdminPermission(adminUser, 'manage_matches')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    const { id } = await params;
    
    // Delete match from storage
    // Note: This is a simplified implementation for the mock database
    const success = (dbService as any).storage.deleteMatch(parseInt(id));
    
    if (!success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Match not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Match deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting match:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete match' 
    }, { status: 500 });
  }
}

