import { NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { dbService } from '@/lib/databaseService';

// POST /api/admin/matches/:id/events - Add an event to a match
export async function POST(request: Request, { params }: { params: Promise<{}> }) {
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
    const { id } = await params as { id: string };
    
    // Get the match to verify it exists
    const matches = await dbService.getMatches();
    const match = matches.find(m => m.id.toString() === id);
    
    if (!match) {
      return NextResponse.json({ 
        success: false, 
        error: 'Match not found' 
      }, { status: 404 });
    }
    
    // Add event to match using the database service
    // We'll create a proper event object with the required fields
    const eventToAdd = {
      matchId: id,
      type: body.type,
      teamId: body.teamId,
      playerId: body.playerId,
      description: body.description,
      timestamp: new Date().toISOString(),
      ...body // Include any additional fields
    };
    
    // Save the event using the database service
    // Since dbService doesn't have a direct method for adding events to a match,
    // we'll use the saveMatchEvents method which is designed for logger submissions
    await dbService.saveMatchEvents([eventToAdd], adminUser.id);
    
    // Get updated match data
    const updatedMatches = await dbService.getMatches();
    const updatedMatch = updatedMatches.find(m => m.id.toString() === id) || match;
    
    return NextResponse.json({ 
      success: true, 
      data: updatedMatch,
      message: 'Event added successfully'
    });
  } catch (error: any) {
    console.error('Error adding event to match:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to add event to match' 
    }, { status: 500 });
  }
}
