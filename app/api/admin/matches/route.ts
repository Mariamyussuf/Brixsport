import { NextRequest, NextResponse } from 'next/server';
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
    const matches = await dbService.getMatches();
    
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
    if (!body.competitionId || !body.homeTeamId || !body.awayTeamId || !body.startTime) {
      return NextResponse.json({ 
        success: false, 
        error: 'Competition ID, home team ID, away team ID, and start time are required' 
      }, { status: 400 });
    }
    
    // Create new match (mock implementation)
    // TODO: Implement real database creation
    const newMatch = {
      id: Date.now(), // Simple ID generation for mock
      competition_id: body.competitionId,
      home_team_id: body.homeTeamId,
      away_team_id: body.awayTeamId,
      match_date: body.startTime,
      status: body.status || 'scheduled',
      home_score: body.homeScore || 0,
      away_score: body.awayScore || 0,
      current_minute: 0,
      period: null,
      venue: body.venue || null,
      // Add other required fields with default values
      created_at: new Date().toISOString()
    };
    
    console.log('Creating match:', newMatch);
    
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
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { id } = params;
    
    // Update match (mock implementation)
    // TODO: Implement real database update
    console.log('Updating match:', id, body);
    
    // Get existing matches to simulate update
    const matches = await dbService.getMatches();
    const matchIndex = matches.findIndex(m => m.id === parseInt(id));
    
    if (matchIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Match not found' 
      }, { status: 404 });
    }
    
    const updatedMatch = {
      ...matches[matchIndex],
      ...body,
      id: parseInt(id)
    };
    
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
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params;
    
    // Delete match (mock implementation)
    // TODO: Implement real database deletion
    console.log('Deleting match:', id);
    
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